
import { useState, useEffect } from "react";
import { X, Bookmark, Trash2, Copy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface SavedMessage {
  id: string;
  content: string;
  timestamp: Date;
  model?: string;
}

interface SavedMessagesProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SavedMessages({ isOpen, onClose }: SavedMessagesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [savedMessages, setSavedMessages] = useState<SavedMessage[]>([]);

  useEffect(() => {
    if (user && isOpen) {
      // Load saved messages from localStorage for now
      const saved = localStorage.getItem(`savedMessages_${user.uid}`);
      if (saved) {
        setSavedMessages(JSON.parse(saved));
      }
    }
  }, [user, isOpen]);

  const handleDelete = (messageId: string) => {
    const updated = savedMessages.filter(msg => msg.id !== messageId);
    setSavedMessages(updated);
    if (user) {
      localStorage.setItem(`savedMessages_${user.uid}`, JSON.stringify(updated));
    }
    toast({
      title: "Message Deleted",
      description: "Saved message has been removed.",
    });
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Message content copied to clipboard.",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-xl shadow-elevated max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bookmark className="w-5 h-5" />
            Saved Messages
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {savedMessages.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No saved messages yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Save AI responses to access them later
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedMessages.map((message) => (
                <div key={message.id} className="bg-surface border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="prose prose-sm max-w-none">
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                        <span>{new Date(message.timestamp).toLocaleString()}</span>
                        {message.model && (
                          <>
                            <span>•</span>
                            <span>{message.model}</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(message.content)}
                        className="p-2 hover:bg-accent rounded-lg transition-colors"
                        title="Copy message"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                        title="Delete message"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
