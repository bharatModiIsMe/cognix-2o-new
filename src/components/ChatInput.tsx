
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IconButton } from "@/components/ui/icon-button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Mic, Send, Square, ImagePlus, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useChatContext } from "@/context/ChatContext";
import { VoiceModeDialog } from "@/components/VoiceModeDialog";

interface ChatInputProps {
  onSendMessage: (content: string, images?: File[], tools?: string[]) => void;
  onNewChat: () => void;
  disabled?: boolean;
  webMode?: boolean;
  onWebModeToggle?: (enabled: boolean) => void;
  isGenerating?: boolean;
  onStopGeneration?: () => void;
  onImageEdit?: (file: File) => void;
}

export function ChatInput({ 
  onSendMessage, 
  onNewChat, 
  disabled, 
  webMode, 
  onWebModeToggle,
  isGenerating,
  onStopGeneration,
  onImageEdit
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { isPro } = useChatContext();

  useEffect(() => {
    const handleSetChatInput = (event: any) => {
      setInput(event.detail.text);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    };

    window.addEventListener('setChatInput', handleSetChatInput);

    return () => {
      window.removeEventListener('setChatInput', handleSetChatInput);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessageClick();
    }
  };

  const handleSendMessageClick = () => {
    if (input.trim() !== "") {
      onSendMessage(input, selectedFiles, selectedTools);
      setInput("");
      setSelectedFiles([]);
      setSelectedTools([]);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      if (!isPro && files.length > 1) {
        toast({
          title: "Upgrade to Pro",
          description: "Pro users can upload multiple images.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFiles(files);
      setIsPopoverOpen(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleToolSelect = (tool: string) => {
    setSelectedTools(prevTools => {
      if (prevTools.includes(tool)) {
        return prevTools.filter(t => t !== tool);
      } else {
        return [...prevTools, tool];
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Web Mode:</span>
          <Switch id="web-mode" checked={webMode} onCheckedChange={onWebModeToggle} />
        </div>

        <div>
          {selectedFiles.length > 0 && (
            <div className="flex items-center gap-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-1 text-xs">
                  <span className="truncate">{file.name}</span>
                  <IconButton onClick={() => handleRemoveFile(index)} size="sm" icon={<X className="h-3 w-3" />} />
                </div>
              ))}
            </div>
          )}

          {/* Image Editing Trigger */}
          {selectedFiles.length === 1 && (
            <Button variant="secondary" size="sm" onClick={() => onImageEdit?.(selectedFiles[0])}>
              Edit Image
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Write your message here..."
            className="resize-none pr-10"
            disabled={disabled}
          />
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <IconButton
                size="icon"
                variant="ghost"
                className="absolute right-2 bottom-2 text-muted-foreground"
                title="Add attachment"
              >
                <ImagePlus className="w-4 h-4" />
              </IconButton>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="grid gap-4">
                <p className="text-sm font-medium leading-none">Attachments</p>
                <Separator />
                <div className="grid gap-2">
                  <label
                    htmlFor="image-upload"
                    className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm text-secondary-foreground cursor-pointer"
                  >
                    Select Image
                  </label>
                  <Input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {isPro && (
                    <>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={selectedTools.includes('Generate Image')}
                          onChange={() => handleToolSelect('Generate Image')}
                        />
                        <span className="text-sm">Generate Image</span>
                      </label>
                    </>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Voice Mode Button - separate from regular chat */}
          <VoiceModeDialog 
            isOpen={isVoiceModeOpen} 
            onOpenChange={setIsVoiceModeOpen}
          />
          
          <Button
            size="icon"
            variant="outline"
            onClick={() => setIsVoiceModeOpen(true)}
            className="shrink-0 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0"
            title="Voice Assistant Mode"
          >
            <Mic className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            type="submit"
            onClick={isGenerating ? onStopGeneration : handleSendMessageClick}
            disabled={disabled}
            className="shrink-0"
          >
            {isGenerating ? (
              <Square className="w-4 h-4 animate-pulse" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
