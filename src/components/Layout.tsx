
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

export function Layout() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

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

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Sign Out Failed",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-surface">
        {/* Mobile Sidebar - Hidden by default, shown when open */}
        {isMobile && (
          <div className={`fixed left-0 top-0 h-full z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <AppSidebar onNewChat={handleNewChat} onClearHistory={handleClearHistory} onClose={() => setSidebarOpen(false)} />
          </div>
        )}
        
        {/* Desktop Sidebar - Always visible */}
        {!isMobile && (
          <div className="fixed left-0 top-0 h-full z-40">
            <AppSidebar onNewChat={handleNewChat} onClearHistory={handleClearHistory} />
          </div>
        )}
        
        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
        )}
        
        <main className={`flex-1 flex flex-col ${isMobile ? 'ml-0' : 'ml-64'}`}>
          {/* Header */}
          <header className="fixed top-0 right-0 left-0 md:left-64 z-30 bg-background/95 backdrop-blur-sm border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">Cognix AI</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <ThemeToggle />
                
                {user && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-surface rounded-lg">
                      <User className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {user.displayName || user.email}
                      </span>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      className="gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Chat Interface - with fixed input */}
          <div className="flex-1 flex flex-col overflow-hidden pt-16">
            <ChatInterface />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
