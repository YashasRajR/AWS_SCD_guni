import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
}

/**
 * Placeholder shared Button so apps/* can prove the @scd/ui import path
 * resolves and builds. Real design-system components land in a later phase.
 */
export function Button({ variant = 'primary', className, ...rest }: ButtonProps) {
  const base = 'scd-button';
  const cls = className ? `${base} ${base}--${variant} ${className}` : `${base} ${base}--${variant}`;
  return <button className={cls} {...rest} />;
}
