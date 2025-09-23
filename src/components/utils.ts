import { PropsOf } from '@headlessui/react/dist/types';
import { clsx, type ClassValue } from 'clsx';
import {
  ComponentRef,
  forwardRef,
  ForwardRefRenderFunction,
  PropsWithChildren,
} from 'react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fr = <T extends React.ElementType>(
  fn: ForwardRefRenderFunction<ComponentRef<T>, PropsOf<T>>,
) => {
  return forwardRef<ComponentRef<T>, PropsOf<T>>(fn);
};
