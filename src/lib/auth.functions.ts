import { createServerFn } from "@tanstack/react-start";

/**
 * Cadastro com verificação por código de 6 dígitos via Server Functions.
 * Envio de e-mails integrado via API do Brevo.
 */

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutos

type Result = { ok: boolean; error?: string };

function generate6DigitCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < 6; i++) code += ((bytes[i] ?? 0) % 10).toString();
  return code;
}

function verificationEmailHtml(code: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>TaskFlow - Código de Verificação</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#0a0a0a;margin:0;padding:40px 0;">
  <div style="max-width:480px;margin:0 auto;background:#111;border-radius:16px;overflow:hidden;border:1px solid #222;">
    <div style="background:#059669;padding:24px 32px;text-align:center;">
      <span style="color:#fff;font-size:20px;font-weight:bold;">TaskFlow</span>
    </div>
    <div style="padding:32px;">
      <h1 style="color:#fff;font-size:22px;margin:0 0 16px 0;">Seu código de verificação</h1>
      <p style="color:#a1a1aa;font-size:15px;line-height:1.5;margin:0 0 24px 0;">
        Use o código abaixo para concluir seu cadastro no TaskFlow. Este código expira em 10 minutos.
      </p>
      <div style="background:#1a1a1a;border:1px solid #27272a;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px 0;">
        <span style="color:#34d399;font-size:42px;font-weight:bold;letter-spacing:12px;">${code}</span>
      </div>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.5;margin:0;">
        Se você não criou uma conta no TaskFlow, pode ignorar este e-mail.
      </p>
    </div>
  </div>
</body>
</html>`;
}

async function sendVerificationEmail(email: string, code: string): Promise<string | null> {
  const brevoKey = process.env["BREVO_API_KEY"];
  if (!brevoKey) {
    return "O envio de e-mails ainda não está configurado (BREVO_API_KEY ausente).";
  }

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": brevoKey,
    },
    body: JSON.stringify({
      sender: { name: "TaskFlow", email: "taskflowcod@gmail.com" },
      to: [{ email }],
      subject: "Seu código de verificação do TaskFlow",
      htmlContent: verificationEmailHtml(code),
      textContent: `TaskFlow\n\nSeu código de verificação é: ${code}\n\nEste código expira em 10 minutos.`,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`Brevo error [${res.status}]: ${body}`);
    return `Não foi possível enviar o e-mail com o código [${res.status}].`;
  }
  return null;
}

async function issueCode(
  admin: { from: (t: string) => any },
  email: string,
  userId: string | null,
): Promise<{ code?: string; error?: string }> {
  await admin.from("otp_codes").update({ used: true }).eq("email", email).eq("used", false);

  const code = generate6DigitCode();
  const { error } = await admin.from("otp_codes").insert({
    email,
    code,
    user_id: userId,
    expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
  });
  if (error) {
    console.error("Falha ao gravar OTP:", error.message);
    return { error: `Não foi possível gerar o código de verificação: ${error.message}` };
  }
  return { code };
}

export const registerUser = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string; name: string }) => input)
  .handler(async ({ data }): Promise<Result> => {
    const email = (data.email ?? "").trim().toLowerCase();
    const password = data.password ?? "";
    const name = (data.name ?? "").trim();

    if (!email || !password || !name || password.length < 6 || name.length > 120) {
      return { ok: false, error: "Dados de cadastro inválidos." };
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
      user_metadata: { name },
    });

    if (createError) {
      const msg = createError.message ?? "";
      if (msg.toLowerCase().includes("already")) {
        return { ok: false, error: "Este e-mail já está cadastrado." };
      }
      console.error("createUser error:", msg);
      return { ok: false, error: `Não foi possível criar a conta: ${msg}` };
    }

    const userId = created?.user?.id ?? null;
    const { code, error: otpError } = await issueCode(supabaseAdmin as never, email, userId);
    if (!code) return { ok: false, error: otpError ?? "Erro ao gerar o código." };

    const sendError = await sendVerificationEmail(email, code);
    if (sendError) {
      if (userId) await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from("otp_codes").delete().eq("email", email);
      return { ok: false, error: sendError };
    }

    return { ok: true };
  });

export const resendCode = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ data }): Promise<Result> => {
    const email = (data.email ?? "").trim().toLowerCase();
    if (!email) return { ok: false, error: "Informe um e-mail válido." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: previous } = await supabaseAdmin
      .from("otp_codes")
      .select("user_id")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { code, error: otpError } = await issueCode(
      supabaseAdmin as never,
      email,
      (previous?.user_id as string | null) ?? null,
    );
    if (!code) return { ok: false, error: otpError ?? "Erro ao gerar o código." };

    const sendError = await sendVerificationEmail(email, code);
    if (sendError) return { ok: false, error: sendError };

    return { ok: true };
  });

export const verifyCode = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; code: string }) => input)
  .handler(async ({ data }): Promise<Result> => {
    const email = (data.email ?? "").trim().toLowerCase();
    const code = (data.code ?? "").trim();

    if (!email || !code) return { ok: false, error: "E-mail e código são obrigatórios." };
    if (!/^\d{6}$/.test(code)) return { ok: false, error: "Código inválido. Digite os 6 dígitos." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: row, error } = await supabaseAdmin
      .from("otp_codes")
      .select("*")
      .eq("email", email)
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao ler otp_codes:", error.message);
      return { ok: false, error: "Não foi possível verificar o código." };
    }
    if (!row) {
      return { ok: false, error: "Nenhum código ativo encontrado. Solicite um novo código." };
    }

    if (new Date(row.expires_at as string) < new Date()) {
      await supabaseAdmin.from("otp_codes").update({ used: true }).eq("id", row.id);
      return { ok: false, error: "Código expirado. Solicite um novo código." };
    }

    const attempts = (row.attempts as number) ?? 0;
    const maxAttempts = (row.max_attempts as number) ?? 5;

    if (attempts >= maxAttempts) {
      await supabaseAdmin.from("otp_codes").update({ used: true }).eq("id", row.id);
      return { ok: false, error: "Muitas tentativas. Solicite um novo código." };
    }

    if (row.code !== code) {
      const newAttempts = attempts + 1;
      const remaining = maxAttempts - newAttempts;
      await supabaseAdmin
        .from("otp_codes")
        .update({ attempts: newAttempts, used: remaining <= 0 })
        .eq("id", row.id);
      if (remaining <= 0) return { ok: false, error: "Muitas tentativas. Solicite um novo código." };
      return { ok: false, error: `Código incorreto. ${remaining} tentativa(s) restante(s).` };
    }

    await supabaseAdmin.from("otp_codes").update({ used: true }).eq("id", row.id);

    let userId = (row.user_id as string | null) ?? null;
    if (!userId) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      userId = list?.users?.find((u) => u.email === email)?.id ?? null;
    }
    if (userId) {
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email_confirm: true,
      });
      if (confirmError) {
        console.error("Falha ao confirmar e-mail:", confirmError.message);
        return { ok: false, error: "Não foi possível confirmar a conta." };
      }
    }

    return { ok: true };
  });