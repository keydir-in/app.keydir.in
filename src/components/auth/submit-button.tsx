'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton({ children, className = 'btn-primary auth-btn auth-btn-tight', disabled = false }: { children: React.ReactNode; className?: string; disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled}>
      {pending ? (
        <span className="auth-btn-text">Please wait...</span>
      ) : (
        children
      )}
    </button>
  );
}
