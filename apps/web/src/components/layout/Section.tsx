import type { HTMLAttributes, ReactNode } from 'react';
import { PageContainer } from './PageContainer.js';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  id?: string;
  muted?: boolean;
  tight?: boolean;
  children: ReactNode;
}

/** Consistent vertical rhythm + horizontal padding for every homepage/page section. */
export function Section({ id, muted, tight, className, children, ...rest }: SectionProps) {
  const classes = ['section'];
  if (tight) classes.push('section-tight');
  if (muted) classes.push('section-muted');
  if (className) classes.push(className);
  return (
    <section id={id} className={classes.join(' ')} {...rest}>
      <PageContainer>{children}</PageContainer>
    </section>
  );
}

interface SectionHeaderProps {
  center?: boolean;
  action?: ReactNode;
  children: ReactNode;
}

/** Wraps SectionEyebrow/SectionTitle/SectionDescription with the shared spacing + optional trailing action. */
export function SectionHeader({ center, action, children }: SectionHeaderProps) {
  if (action) {
    return (
      <div className="section-header-row" data-reveal>
        <div>{children}</div>
        {action}
      </div>
    );
  }
  return <div className={center ? 'section-header section-header-center' : 'section-header'} data-reveal>{children}</div>;
}

export function SectionEyebrow({ children }: { children?: ReactNode }) {
  return null;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="section-title">{children}</h2>;
}

export function SectionDescription({ children }: { children: ReactNode }) {
  return <p className="section-description">{children}</p>;
}
