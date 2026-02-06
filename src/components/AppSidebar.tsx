import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  ChartSplineIcon,
  ChevronRight,
  GroupIcon,
  PlusIcon,
  Speaker,
  SpeakerIcon,
} from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';
import { cn } from '@/lib/utils';
import { useGlobalState } from '@/state';
import { useNavigate } from 'react-router';

export function AppSidebar({ isConnected }: { isConnected: boolean }) {
  const { channelSettings } = useGlobalState();
  const navigate = useNavigate();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center mx-2 my-1 justify-between">
          <div className="font-bold text-xl">keFIR</div>
          <div className="bg-gray-800 text-white rounded text-xs px-2 py-0.5 inline-flex items-center">
            <div
              className={cn(
                'ml-0.5 mr-1.5 w-2 h-2 rounded-full',
                isConnected ? 'bg-green-500' : 'bg-red-500',
              )}
            ></div>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Mixing</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <ChartSplineIcon />
                  <span>Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>DSP</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <ChartSplineIcon />
                  <span>Overview</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <ChartSplineIcon />
                  <span>House Curve</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <CollapsibleMenuItem
                item={{
                  label: 'Outputs',
                  icon: SpeakerIcon,
                }}
                subItems={channelSettings.map((channel, index) => ({
                  label: `${index + 1} – ${channel.name}`,
                  disabled: channel.sources.length === 0,
                  onClick: () => {
                    navigate(`/outputs/${index + 1}`);
                  }
                }))}
              />
              <CollapsibleMenuItem
                item={{
                  label: 'Groups',
                  icon: GroupIcon,
                }}
                subItems={[
                  {
                    label: 'Tops',
                  },
                  {
                    label: 'Subs',
                  },
                ]}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Presets</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <CollapsibleMenuItem
                item={{
                  label: 'Loudspeakers',
                  icon: Speaker,
                }}
              />
              <CollapsibleMenuItem
                item={{
                  label: 'System',
                  icon: GroupIcon,
                }}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
}

type Item = {
  label: string;
  icon?: React.ElementType;
};

type SubItem = {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
};

function CollapsibleMenuItem({
  item,
  subItems,
}: {
  item: Item;
  subItems?: SubItem[];
}) {
  return (
    <Collapsible asChild className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton>
            {item.icon && <item.icon />}
            <span>{item.label}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {subItems?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.label}>
                <SidebarMenuSubButton
                  className={
                    subItem.disabled ? 'text-sidebar-foreground/60' : ''
                  }
                  onClick={subItem.onClick}
                >
                  {subItem.label}
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
            <SidebarMenuSubItem>
              <SidebarMenuSubButton
                size="sm"
                className="bg-gray-200/60 hover:bg-gray-200 gap-1 [&>svg]:w-3.5 h-6 mt-1"
              >
                <PlusIcon />
                <span className="block grow text-center -ml-5">
                  Add Speaker
                </span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
