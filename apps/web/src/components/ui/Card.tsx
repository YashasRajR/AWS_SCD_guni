import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/** Base surface used by every card-shaped component — one border/radius/padding definition. */
export function Card({ children, className, ...rest }: CardProps) {
  return (
    <div className={className ? `card ${className}` : 'card'} data-reveal {...rest}>
      {children}
    </div>
  );
}
