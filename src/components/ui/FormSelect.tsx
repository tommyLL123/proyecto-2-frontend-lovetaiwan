import type { ReactNode, SelectHTMLAttributes } from 'react';

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormSelect({ label, error, hint, id, children, ...props }: FormSelectProps) {
  const fieldId = id ?? props.name;
  return (
    <label className="field" htmlFor={fieldId}>
      <span>{label}</span>
      <select id={fieldId} aria-invalid={Boolean(error)} aria-describedby={error ? `${fieldId}-error` : undefined} {...props}>
        {children}
      </select>
      {hint && <small>{hint}</small>}
      {error && (
        <small className="field-error" id={`${fieldId}-error`}>
          {error}
        </small>
      )}
    </label>
  );
}
