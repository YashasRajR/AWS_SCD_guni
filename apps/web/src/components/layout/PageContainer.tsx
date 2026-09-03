import type { HTMLAttributes, ReactNode } from 'react';

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  narrow?: boolean;
  children: ReactNode;
}

/** Responsive max-width wrapper — every page/section content area goes through this. */
export function PageContainer({ narrow, className, children, ...rest }: PageContainerProps) {
  const base = narrow ? 'container-narrow' : 'container';
  return (
    <div className={className ? `${base} ${className}` : base} {...rest}>
      {children}
    </div>
  );
}
