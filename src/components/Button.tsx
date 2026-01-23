import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import * as headlessui from '@headlessui/react';

import { cn } from './utils';

export const buttonVariants = cva(
  [
    'inline-flex',
    'items-center',
    'justify-center',
    'gap-2',
    'whitespace-nowrap',
    'rounded-md',
    'text-sm',
    'font-medium',
    'disabled:pointer-events-none',
    'disabled:opacity-50',
    '[&_svg]:pointer-events-none',
    'shrink-0',
    '[&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        default: 'bg-black text-white hover:bg-black/80',
        secondary: 'bg-gray-200 text-secondary-foreground hover:bg-gray-200/70',
        link: 'text-black underline-offset-4 hover:underline',
        transparent: 'bg-transparent text-black hover:opacity-60',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export function Button({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export function PopoverButton({
  className,
  variant,
  size,
  ...props
}: headlessui.PopoverButtonProps & VariantProps<typeof buttonVariants>) {
  return (
    <headlessui.PopoverButton
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
