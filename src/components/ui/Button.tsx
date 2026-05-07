import Link from 'next/link';
import type { ReactNode, AnchorHTMLAttributes, ButtonHTMLAttributes } from 'react';

/**
 * Single source of truth for buttons across the app.
 *
 * Variants:
 *   primary     — main action (Save, Submit, Confirm). Navy fill, gold focus
 *                 ring. Use ONE per action group; multiple competing primary
 *                 buttons dilute their meaning.
 *   secondary   — supporting action (Cancel, Back). White with border.
 *   destructive — irreversible action (Delete, Reset). Rose fill.
 *   ghost       — tertiary, low-emphasis (links inside cards).
 *
 * Sizes: sm (32 px tall), md (40 px), lg (48 px). md is the default.
 *
 * Two flavors:
 *   <Button>     — renders as <button>. Use for actions that mutate.
 *   <ButtonLink> — renders as Next.js <Link>. Use for navigation.
 *
 * Both share the same className builder, so visuals stay identical between
 * the two. Don't fork the styles — if you find yourself wanting a slightly
 * different button somewhere, add a variant here instead.
 */

type Variant = 'primary' | 'secondary' | 'destructive' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const baseClasses =
  'inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[#0f1f3a] text-white hover:bg-[#1a2f5a] focus-visible:outline-[#c8a85c] disabled:hover:bg-[#0f1f3a]',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-[#c8a85c]',
  destructive:
    'bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-700',
  ghost:
    'text-[#0f1f3a] hover:bg-slate-100 focus-visible:outline-[#c8a85c]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
};

function classNamesFor({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
}: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
}): string {
  const width = fullWidth ? 'w-full' : '';
  return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${width} ${className}`;
}

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
}

interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>,
    CommonProps {}

export function Button({
  variant,
  size,
  fullWidth,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={classNamesFor({ variant, size, fullWidth, className })}
      {...rest}
    >
      {children}
    </button>
  );
}

interface ButtonLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'children' | 'href'>,
    CommonProps {
  href: string;
  /** If the link points to an external URL, sets target=_blank with safe rel */
  external?: boolean;
}

export function ButtonLink({
  variant,
  size,
  fullWidth,
  className,
  children,
  href,
  external = false,
  ...rest
}: ButtonLinkProps) {
  const computedClass = classNamesFor({ variant, size, fullWidth, className });

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={computedClass}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={computedClass} {...rest}>
      {children}
    </Link>
  );
}
