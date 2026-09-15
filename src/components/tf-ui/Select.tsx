import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export function Select({ label, children, className = '', ...props }: SelectProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      <select className={`input cursor-pointer ${className}`} {...props}>
        {children}
      </select>
    </div>
  );
}
