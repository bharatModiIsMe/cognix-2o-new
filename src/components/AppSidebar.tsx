
import { useState, useRef, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  MessageSquare,
  History, 
  Bookmark, 
  User, 
  HelpCircle,
  Plus,
  ChevronRight,
  Trash2,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SavedChat {
  id: string;
  title: string;
  timestamp: string;
  messages: any[];
}

interface AppSidebarProps {
  onNewChat: () => void;
  onClearHistory: () => void;
  onClose?: () => void;
  onSaveChat?: (chat: SavedChat) => void;
  savedChats?: SavedChat[];
  chatHistory?: SavedChat[];
}

export function AppSidebar({ onNewChat, onClearHistory, onClose, savedChats = [], chatHistory = [] }: AppSidebarProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const [showSaved, setShowSaved] = useState(false);

  const menuItems = [
    { icon: Plus, label: "New Chat", action: () => { onNewChat(); onClose?.(); }, primary: true },
    { icon: History, label: "History", action: () => console.log("History clicked") },
    { icon: Bookmark, label: "Saved", action: () => setShowSaved(!showSaved) },
    { icon: User, label: "Profile", action: () => console.log("Profile clicked") },
    { icon: HelpCircle, label: "Help", action: () => console.log("Help clicked") },
    { icon: Trash2, label: "Clear History", action: () => { onClearHistory(); onClose?.(); }, destructive: true },
  ];

  // Auto-expand/collapse on hover (desktop only)
  useEffect(() => {
    if (isMobile) return; // Don't use hover behavior on mobile
    
    const handleMouseEnter = () => setIsOpen(true);
    const handleMouseLeave = () => setIsOpen(false);

    const sidebar = sidebarRef.current;
    if (sidebar) {
      sidebar.addEventListener('mouseenter', handleMouseEnter);
      sidebar.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      if (sidebar) {
        sidebar.removeEventListener('mouseenter', handleMouseEnter);
        sidebar.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [isMobile]);

  // On mobile, always show full sidebar when open
  useEffect(() => {
    if (isMobile) {
      setIsOpen(true);
    }
  }, [isMobile]);

  return (
    <div 
      ref={sidebarRef}
      className={cn(
        "h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out flex flex-col",
        isMobile 
          ? "w-64" 
          : (isOpen ? "w-64" : "w-16")
      )}
    >
      {/* Close button for mobile */}
      {isMobile && onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-sidebar-accent rounded-lg transition-colors z-50"
        >
          <div className="w-4 h-4 relative">
            <div className="absolute w-4 h-0.5 bg-sidebar-foreground transform rotate-45 top-1.5"></div>
            <div className="absolute w-4 h-0.5 bg-sidebar-foreground transform -rotate-45 top-1.5"></div>
          </div>
        </button>
      )}

      {/* Sidebar header */}
      <div className="h-16 flex items-center justify-center px-4 border-b border-sidebar-border shrink-0">
        {(isOpen || isMobile) ? (
          <div className="flex items-center gap-3 w-full justify-center">
            <img 
              src="/cognix-logo/favicon.png" 
              alt="Cognix Logo"
              className="w-8 h-8 shrink-0"
            />
            <span className="font-semibold text-sidebar-foreground">Cognix</span>
          </div>
        ) : (
          <div className="flex items-center justify-center w-full">
            <img 
              src="/cognix-logo/favicon.png" 
              alt="Cognix Logo"
              className="w-8 h-8"
            />
          </div>
        )}
      </div>

      {/* Menu items */}
      <div className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className={cn(
              "w-full flex items-center p-3 rounded-lg transition-all duration-200 text-left",
              (isOpen || isMobile) ? "gap-3" : "justify-center",
              item.primary 
                ? "bg-gradient-ai text-white hover:shadow-glow" 
                : item.destructive
                ? "text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            title={!isOpen && !isMobile ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {(isOpen || isMobile) && <span className="font-medium">{item.label}</span>}
          </button>
        ))}

        {/* Recent chats - only show when expanded */}
        {(isOpen || isMobile) && !showSaved && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-sidebar-foreground/70 mb-3 px-3">
              Recent Chats
            </h3>
            <div className="space-y-1">
              {chatHistory.length === 0 ? (
                <div className="px-3 py-2 text-sm text-sidebar-foreground/50">
                  No recent chats
                </div>
              ) : (
                chatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className="group flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-sidebar-foreground/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-sidebar-foreground/50">
                        {chat.timestamp}
                      </p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-sidebar-border rounded transition-all shrink-0">
                      <Trash2 className="w-3 h-3 text-sidebar-foreground/50" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Saved chats - only show when expanded and saved is selected */}
        {(isOpen || isMobile) && showSaved && (
          <div className="mt-8">
            <h3 className="text-sm font-medium text-sidebar-foreground/70 mb-3 px-3">
              Saved Chats
            </h3>
            <div className="space-y-1">
              {savedChats.length === 0 ? (
                <div className="px-3 py-2 text-sm text-sidebar-foreground/50">
                  No saved chats yet
                </div>
              ) : (
                savedChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="group flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4 text-sidebar-foreground/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-sidebar-foreground truncate">
                        {chat.title}
                      </p>
                      <p className="text-xs text-sidebar-foreground/50">
                        {chat.timestamp}
                      </p>
                    </div>
                    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-sidebar-border rounded transition-all shrink-0">
                      <Trash2 className="w-3 h-3 text-sidebar-foreground/50" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
