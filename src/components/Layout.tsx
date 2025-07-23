import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
export function Layout() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleNewChat = () => {
    window.location.reload();
  };
  const handleClearHistory = () => {
    // For now, just reload the page to clear history
    // In a real app, this would clear stored chat data
    if (confirm('Are you sure you want to clear all chat history?')) {
      window.location.reload();
    }
  };
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-surface">
        {/* Mobile Sidebar - Hidden by default, shown when open */}
        {isMobile && <div className={`fixed left-0 top-0 h-full z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <AppSidebar onNewChat={handleNewChat} onClearHistory={handleClearHistory} onClose={() => setSidebarOpen(false)} />
          </div>}
        
        {/* Desktop Sidebar - Always visible */}
        {!isMobile && <div className="fixed left-0 top-0 h-full z-40">
            <AppSidebar onNewChat={handleNewChat} onClearHistory={handleClearHistory} />
          </div>}
        
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />}
        
        <main className={`flex-1 flex flex-col ${isMobile ? 'ml-0' : 'ml-64'}`}>
          {/* Header */}
          

          {/* Chat Interface - with fixed input */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatInterface />
          </div>
        </main>
      </div>
    </SidebarProvider>;
}