import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import App from "@/AppRoot";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TaskFlow — Gestão inteligente de tarefas" },
      {
        name: "description",
        content:
          "Organize tarefas, categorias, calendário e análises de produtividade em um só lugar com o TaskFlow.",
      },
      { property: "og:title", content: "TaskFlow — Gestão inteligente de tarefas" },
      {
        property: "og:description",
        content:
          "Organize tarefas, categorias, calendário e análises de produtividade em um só lugar com o TaskFlow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <ClientOnly
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-black">
          <p className="text-sm text-slate-400">Carregando TaskFlow...</p>
        </div>
      }
    >
      <App />
    </ClientOnly>
  );
}
