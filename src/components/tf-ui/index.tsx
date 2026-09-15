import { useEffect, useState } from 'react';

export function Checkbox({ checked, onChange, className = '' }: { checked: boolean; onChange: () => void; className?: string }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onChange(); }}
      className={`shrink-0 w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
        checked
          ? 'bg-green-600 border-green-600'
          : 'border-slate-300 dark:border-[#3a3a3a] hover:border-green-500'
      } ${className}`}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: React.ReactNode; title: string; message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-[#1c1c1c] mb-4 text-slate-400 dark:text-slate-500">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ProgressBar({ value, max = 100, className = '' }: { value: number; max?: number; className?: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth((value / max) * 100), 100);
    return () => clearTimeout(t);
  }, [value, max]);
  return (
    <div className={`h-2 bg-slate-200 dark:bg-[#1c1c1c] rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-green-600 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
