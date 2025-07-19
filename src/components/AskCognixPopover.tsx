import { useState, useEffect, useRef } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface AskCognixPopoverProps {
  selectedText: string;
  position: { x: number; y: number };
  onAsk: (text: string) => void;
  onClose: () => void;
}

export function AskCognixPopover({ selectedText, position, onAsk, onClose }: AskCognixPopoverProps) {
  const [isVisible, setIsVisible] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedText) {
      setIsVisible(true);
    }
  }, [selectedText]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleScroll = () => {
      handleClose();
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 150); // Wait for animation to complete
  };

  const handleAsk = () => {
    onAsk(`"${selectedText}"`);
    handleClose();
  };

  if (!selectedText || !isVisible) return null;

  return (
    <div
      ref={popoverRef}
      className={cn(
        "fixed z-50 bg-popover border border-border rounded-lg shadow-elevated px-3 py-2 transition-all duration-150",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
      style={{
        left: `${position.x}px`,
        top: `${position.y - 60}px`, // Position above the selection
        transform: 'translateX(-50%)',
      }}
    >
      {/* Arrow pointing down */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-border" />
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[3px] border-l-transparent border-r-transparent border-t-popover translate-y-[-1px]" />
      
      <button
        onClick={handleAsk}
        className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap"
      >
        <MessageSquare className="w-4 h-4" />
        🗨️ Ask Cognix
      </button>
    </div>
  );
}