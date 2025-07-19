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

interface AppSidebarProps {
  onNewChat: () => void;
  onClearHistory: () => void;
  onClose?: () => void;
}

export function AppSidebar({ onNewChat, onClearHistory, onClose }: AppSidebarProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [recentChats] = useState([
    { id: 1, title: "Web Development Tips", timestamp: "2 hours ago" },
    { id: 2, title: "AI Model Comparison", timestamp: "1 day ago" },
    { id: 3, title: "React Best Practices", timestamp: "3 days ago" },
    { id: 4, title: "UI/UX Design Trends", timestamp: "1 week ago" },
  ]);

    const menuItems = [
    { icon: Plus, label: "New Chat", action: () => { onNewChat(); onClose?.(); }, primary: true },
    { icon: History, label: "History", action: () => console.log("History clicked") },
    { icon: Bookmark, label: "Saved", action: () => console.log("Saved clicked") },
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
    <>
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={cn(
          "h-full bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
          isMobile 
            ? "w-64" // Always full width on mobile 
            : (isOpen ? "w-64" : "w-16") // Collapsible on desktop
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
        <div className="h-full flex flex-col">
          {/* Sidebar header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
            {(isOpen || isMobile) && (
              <div className="flex items-center gap-3">
                <img 
                  src="/lovable-uploads/a460ef73-e8ad-48b7-a3a3-78634c280e71.png" 
                  alt="Cognix Logo"
                  className="w-8 h-8"
                />
                <span className="font-semibold text-sidebar-foreground">Cognix</span>
              </div>
            )}
            
            {!isOpen && !isMobile && (
              <img 
                src="/lovable-uploads/a460ef73-e8ad-48b7-a3a3-78634c280e71.png" 
                alt="Cognix Logo"
                className="w-8 h-8"
              />
            )}
          </div>

          {/* Menu items */}
          <div className="flex-1 p-4 space-y-2">
            {menuItems.map((item, index) => (
              <button
                key={index}
                onClick={item.action}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left",
                  item.primary 
                    ? "bg-gradient-ai text-white hover:shadow-glow" 
                    : item.destructive
                    ? "text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                title={!isOpen && !isMobile ? item.label : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {(isOpen || isMobile) && <span className="font-medium">{item.label}</span>}
                </button>
            ))}

            {/* Recent chats */}
            {(isOpen || isMobile) && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-sidebar-foreground/70 mb-3 px-3">
                  Recent Chats
                </h3>
                <div className="space-y-1">
                  {recentChats.map((chat) => (
                    <div
                      key={chat.id}
                      className="group flex items-center gap-3 p-3 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-sidebar-foreground/50 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">
                          {chat.title}
                        </p>
                        <p className="text-xs text-sidebar-foreground/50">
                          {chat.timestamp}
                        </p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-sidebar-border rounded transition-all">
                        <Trash2 className="w-3 h-3 text-sidebar-foreground/50" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}