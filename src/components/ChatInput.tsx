import { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Image as ImageIcon, 
  X, 
  Settings,
  Wand2,
  PenTool,
  FileText,
  Globe,
  Square
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Tool {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
}

const tools: Tool[] = [
  { id: "Generate Image", name: "Generate Image", icon: Wand2, color: "text-purple-500" },
  { id: "write-story", name: "Write Story", icon: PenTool, color: "text-blue-500" },
  { id: "summarize-text", name: "Summarize Text", icon: FileText, color: "text-green-500" },
  { id: "build-webpage", name: "Build Web Page", icon: Globe, color: "text-orange-500" }
];

interface ChatInputProps {
  onSendMessage: (content: string, images?: File[], tools?: string[]) => void;
  onNewChat: () => void;
  disabled?: boolean;
  webMode?: boolean;
  onWebModeToggle?: (enabled: boolean) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
}

export function ChatInput({ 
  onSendMessage, 
  onNewChat, 
  disabled, 
  webMode = false, 
  onWebModeToggle, 
  isGenerating = false, 
  onStopGeneration
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleSetChatInput = (event: CustomEvent) => {
      setInput(event.detail.text);
      textareaRef.current?.focus();
    };

    window.addEventListener('setChatInput', handleSetChatInput as EventListener);
    
    return () => {
      window.removeEventListener('setChatInput', handleSetChatInput as EventListener);
    };
  }, []);

  const handleSendMessage = async (messageContent?: string) => {
    const content = messageContent || input;
    if (!content.trim() && images.length === 0) return;
    
    try {
      console.log('Sending message with images:', images.length);
      onSendMessage(content, images.length > 0 ? images : undefined, selectedTools);
      
      setInput("");
      setImages([]);
      setImageUrls([]);
      setSelectedTools([]);
      setIsToolMenuOpen(false);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSubmit = () => {
    handleSendMessage();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    console.log('Selected image files:', imageFiles.length);
    
    const newUrls = imageFiles.map(file => URL.createObjectURL(file));
    
    setImages(prev => [...prev, ...imageFiles]);
    setImageUrls(prev => [...prev, ...newUrls]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imageUrls[index]);
    
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTool = (toolId: string) => {
    setSelectedTools(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  useEffect(() => {
    return () => {
      imageUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {webMode && (
        <div className="mb-2 flex items-center gap-2 text-xs">
          <div className="flex items-center gap-2 text-blue-500">
            <Globe className="h-3 w-3" />
            <span className="font-medium">🌐 Web Mode Enabled</span>
          </div>
        </div>
      )}
      
      {(selectedTools.length > 0 || images.length > 0) && (
        <div className="mb-3 space-y-3">
          {selectedTools.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTools.map(toolId => {
                const tool = tools.find(t => t.id === toolId);
                if (!tool) return null;
                
                return (
                  <div
                    key={toolId}
                    className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-full text-sm"
                  >
                    <tool.icon className={cn("w-4 h-4", tool.color)} />
                    <span>{tool.name}</span>
                    <button
                      onClick={() => toggleTool(toolId)}
                      className="p-0.5 hover:bg-accent rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {images.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {images.map((image, index) => (
                <div
                  key={index}
                  className="relative group bg-surface border border-border rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={imageUrls[index]}
                        alt={`Upload ${index + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-border"
                        onError={(e) => {
                          console.error('Image load error:', e);
                        }}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <ImageIcon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-sm font-medium truncate">{image.name}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(image.size / 1024 / 1024).toFixed(1)} MB
                      </div>
                    </div>
                    
                    <button
                      onClick={() => removeImage(index)}
                      className="p-1.5 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={cn(
        "relative flex items-end gap-3 p-4 bg-surface border border-border rounded-2xl",
        "focus-within:border-primary/50 focus-within:shadow-surface transition-all duration-200"
      )}>
        <div className="relative">
          <button
            onClick={() => setIsToolMenuOpen(!isToolMenuOpen)}
            className={cn(
              "p-2 hover:bg-accent rounded-lg transition-colors",
              isToolMenuOpen && "bg-accent"
            )}
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>

          {isToolMenuOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsToolMenuOpen(false)}
              />
              <div className="absolute bottom-full left-0 mb-2 bg-popover border border-border rounded-xl shadow-elevated z-20 p-2 min-w-48">
                <div className="space-y-1">
                  {tools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => toggleTool(tool.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left",
                        selectedTools.includes(tool.id) 
                          ? "bg-primary/10 text-primary" 
                          : "hover:bg-accent"
                      )}
                    >
                      <tool.icon className={cn("w-4 h-4", tool.color)} />
                      <span className="text-sm">{tool.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask anything... (Shift+Enter for new line)"
            className="w-full resize-none bg-transparent border-0 outline-none placeholder:text-muted-foreground text-sm leading-6 max-h-32"
            disabled={disabled}
            rows={1}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onWebModeToggle?.(!webMode)}
            className={cn(
              "p-2 rounded-lg transition-colors",
              webMode 
                ? "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20" 
                : "text-muted-foreground hover:bg-accent"
            )}
            title={webMode ? "Disable Web Mode" : "Enable Web Mode"}
            disabled={disabled}
          >
            <Globe className="w-5 h-5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            disabled={disabled}
          >
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </button>

          <button
            onClick={isGenerating ? onStopGeneration : handleSubmit}
            disabled={!isGenerating && (disabled || (!input.trim() && images.length === 0))}
            className={cn(
              "p-2 rounded-lg transition-all duration-200",
              isGenerating
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                : (!input.trim() && images.length === 0) || disabled
                ? "text-muted-foreground cursor-not-allowed"
                : "bg-gradient-ai text-white hover:shadow-glow"
            )}
          >
            {isGenerating ? (
              <Square className="w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );
}
