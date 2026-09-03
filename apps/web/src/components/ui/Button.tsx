import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'primary' | 'secondary' | 'outline' | 'link';
type Size = 'default' | 'large' | 'small';

interface SharedProps {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
  className?: string;
}

function classesFor({ variant = 'primary', size = 'default', block, className }: SharedProps): string {
  const parts = ['btn', `btn-${variant}`];
  if (size === 'large') parts.push('btn-large');
  if (size === 'small') parts.push('btn-small');
  if (block) parts.push('btn-block');
  if (className) parts.push(className);
  return parts.join(' ');
}

/** Strips the style-only props (variant/size/block/className) so what's left is safe to spread onto a DOM node. */
function omitSharedProps<T extends SharedProps>(props: T): Omit<T, keyof SharedProps> {
  const rest = { ...props };
  delete (rest as Partial<SharedProps>).variant;
  delete (rest as Partial<SharedProps>).size;
  delete (rest as Partial<SharedProps>).block;
  delete (rest as Partial<SharedProps>).className;
  delete (rest as Partial<SharedProps>).children;
  return rest;
}

type ButtonAsButton = SharedProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    to?: undefined;
    href?: undefined;
  };

type ButtonAsRouterLink = SharedProps &
  Omit<LinkProps, 'className' | 'children'> & {
    href?: undefined;
  };

type ButtonAsAnchor = SharedProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    to?: undefined;
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsRouterLink | ButtonAsAnchor;

/**
 * A single button component for every call-to-action on the site — renders
 * as a native <button>, an internal <Link> (when `to` is given), or an
 * external <a> (when `href` is given), always sharing the same design-token
 * driven variants/sizes so no page hand-rolls its own CTA styling.
 */
export function Button(props: ButtonProps) {
  const className = classesFor(props);

  if ('to' in props && props.to !== undefined) {
    const { to, ...rest } = omitSharedProps(props);
    return (
      <Link to={to} className={className} {...rest}>
        {props.children}
      </Link>
    );
  }

  if ('href' in props && props.href !== undefined) {
    const { href, ...rest } = omitSharedProps(props);
    return (
      <a href={href} className={className} {...rest}>
        {props.children}
      </a>
    );
  }

  const { type, ...rest } = omitSharedProps(props as ButtonAsButton);
  return (
    <button type={type ?? 'button'} className={className} {...rest}>
      {props.children}
    </button>
  );
}
