import * as headless from '@headlessui/react';
import { fr } from '@/lib/utils';

export const Tab = fr<typeof headless.Tab>((props, ref) => (
  <headless.Tab
    {...props}
    className={
      'data-selected:bg-white data-hover:bg-white/50 py-1 px-3 grow rounded-xl'
    }
    ref={ref}
  >
    {props.children}
  </headless.Tab>
));

export const TabList = fr<typeof headless.TabList>((props, ref) => (
  <headless.TabList
    {...props}
    className={'bg-gray-200/70 p-1 gap-1 rounded-xl flex mb-6'}
    ref={ref}
  >
    {props.children}
  </headless.TabList>
));

export const TabGroup = headless.TabGroup;
export const TabPanels = headless.TabPanels;
export const TabPanel = headless.TabPanel;
