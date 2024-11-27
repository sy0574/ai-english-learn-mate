import { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <div className="min-h-screen bg-background">
        <Sidebar isOpen={isSidebarOpen} />
        <div
          className={cn(
            "min-h-screen flex flex-col transition-all duration-300",
            isSidebarOpen ? "pl-64" : "pl-16"
          )}
        >
          <Header isSidebarOpen={isSidebarOpen} onToggleSidebar={toggleSidebar} />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}