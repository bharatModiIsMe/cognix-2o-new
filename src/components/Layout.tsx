
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { ProfilePopup } from "@/components/ProfilePopup";
import { SavedMessages } from "@/components/SavedMessages";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

export function Layout() {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    return localStorage.getItem('defaultModel') || "gemini-2.5-pro";
  });
  const { user } = useAuth();

  const handleNewChat = () => {
    window.location.reload();
  };
  
  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear all chat history?')) {
      window.location.reload();
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-surface">
        {isMobile && (
          <div className={`fixed left-0 top-0 h-full z-40 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <AppSidebar 
              onNewChat={handleNewChat} 
              onClearHistory={handleClearHistory} 
              onClose={() => setSidebarOpen(false)}
              onOpenProfile={() => setProfileOpen(true)}
              onShowSaved={() => setSavedOpen(true)}
            />
          </div>
        )}
        
        {!isMobile && (
          <div className="fixed left-0 top-0 h-full z-40">
            <AppSidebar 
              onNewChat={handleNewChat} 
              onClearHistory={handleClearHistory}
              onOpenProfile={() => setProfileOpen(true)}
              onShowSaved={() => setSavedOpen(true)}
            />
          </div>
        )}
        
        {isMobile && sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
        )}
        
        <main className={`flex-1 flex flex-col ${isMobile ? 'ml-0' : 'ml-64'}`}>
          <div className="flex-1 flex flex-col overflow-hidden">
            <ChatInterface selectedModel={selectedModel} onModelChange={setSelectedModel} />
          </div>
        </main>

        <ProfilePopup 
          isOpen={profileOpen} 
          onClose={() => setProfileOpen(false)}
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />

        <SavedMessages 
          isOpen={savedOpen} 
          onClose={() => setSavedOpen(false)} 
        />
      </div>
    </SidebarProvider>
  );
}
