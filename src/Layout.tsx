import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar";

export default function Layout({ children, isConnected }: { children: React.ReactNode, isConnected: boolean }) {
  return (
    <SidebarProvider>
      <AppSidebar isConnected={isConnected} />
      <main className="grow">
        {children}
      </main>
    </SidebarProvider>
  );
}
