import './index.css';

import { saveConfig } from './config';

import { Radio, RulerDimensionLine, Save } from 'lucide-react';
import { Switch } from './components/Switch';
import Layout from './Layout';
import { SidebarTrigger } from './components/ui/sidebar';
import { Button } from './components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './components/ui/popover';
import { cn } from './lib/utils';
import { Outlet } from 'react-router';
import { useGlobalState } from './state';

export function Root() {
  const { isConnected, calculate, bypassHouseCurve, setBypassHouseCurve } =
    useGlobalState();

  return (
    <Layout isConnected={isConnected}>
      <main className="min-h-screen">
        <div className="border-b border-white/10 h-15 mb-5 flex items-center px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger />
            <div className="text-lg font-semibold">Overview</div>
          </div>
          <div className="ml-auto space-x-2">
            <Popover>
              <PopoverTrigger>
                <Button
                  size="sm"
                  variant="secondary"
                  title="Meassurement Utils"
                  className={cn(
                    'mr-4',
                    bypassHouseCurve
                      ? 'bg-red-700 text-white hover:bg-red-700/80'
                      : '',
                  )}
                >
                  <RulerDimensionLine className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <label className="flex items-center py-2 gap-3">
                  <Switch
                    checked={bypassHouseCurve}
                    onCheckedChange={setBypassHouseCurve}
                  />{' '}
                  Bypass House Curve
                </label>
              </PopoverContent>
            </Popover>
            <Button variant="secondary" size="sm" onClick={saveConfig}>
              <Save className="h-4 w-4" />
              Store Config
            </Button>
            <Button size="sm" onClick={calculate}>
              <Radio className="h-4 w-4" />
              Apply
            </Button>
          </div>
        </div>
        <section className="px-4">
          <Outlet />
        </section>
      </main>
    </Layout>
  );
}
