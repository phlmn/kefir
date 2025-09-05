import React, {
  ComponentRef,
  forwardRef,
  ForwardRefRenderFunction,
} from 'react';
import * as headless from '@headlessui/react';
import { PropsOf } from '@headlessui/react/dist/types';

const fr = <T extends React.ElementType>(
  fn: ForwardRefRenderFunction<ComponentRef<T>, PropsOf<T>>,
) => {
  return forwardRef<ComponentRef<T>, PropsOf<T>>(fn);
};

export const Tab = fr<typeof headless.Tab>((props, ref) => (
  <headless.Tab
    {...props}
    className={'data-selected:bg-white data-hover:bg-white/35 py-1 px-3 grow rounded-xl'}
    ref={ref}
  >
    {props.children}
  </headless.Tab>
));

export const TabList = fr<typeof headless.TabList>((props, ref) => (
  <headless.TabList
    {...props}
    className={'bg-gray-200 p-1 gap-1 rounded-xl flex'}
    ref={ref}
  >
    {props.children}
  </headless.TabList>
));

export const TabGroup = headless.TabGroup;
export const TabPanels = headless.TabPanels;
export const TabPanel = headless.TabPanel;
