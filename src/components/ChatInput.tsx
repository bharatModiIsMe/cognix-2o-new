import { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  X, 
  Settings,
  Wand2,
  PenTool,
  FileText,
  Globe,
  Square,
  Volume2,
  VolumeX,
  Waves,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceMode } from "@/hooks/useVoiceMode";
import { VoiceModePopover } from "@/components/VoiceModePopover";

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
  voiceModeEnabled?: boolean;
}

export function ChatInput({ onSendMessage, onNewChat, disabled, webMode = false, onWebModeToggle, isGenerating = false, onStopGeneration, voiceModeEnabled = false }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isToolMenuOpen, setIsToolMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Voice mode hook
  const { 
    state: voiceState, 
    toggleVoiceMode, 
    toggleRecording,
    stopSpeaking,
    toggleMute
  } = useVoiceMode();

  // Handle voice recording results - no auto-send in unified mode
  useEffect(() => {
    if (voiceState.transcript) {
      setInput(voiceState.transcript);
      // In unified voice mode, we don't auto-send - the conversation is handled internally
    }
  }, [voiceState.transcript]);

  // Listen for custom event to set input value (from Ask Cognix)
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
      onSendMessage(content, images, selectedTools);
      
      // Clear the form
      setInput("");
      setImages([]);
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

  const handleVoiceRecording = async () => {
    try {
      const transcript = await toggleRecording();
      if (transcript) {
        await handleSendMessage(transcript);
      }
    } catch (error) {
      console.error('Voice error:', error);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    setImages(prev => [...prev, ...imageFiles]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
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

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Voice Mode and Web Mode indicators */}
      {(voiceState.isEnabled || webMode) && (
        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs">
          {voiceState.isEnabled && (
            <div className="flex items-center gap-2 text-primary">
              <Volume2 className="h-3 w-3" />
              <span className="font-medium">🎤 Voice Mode Active</span>
              {voiceState.isMuted && <span className="text-muted-foreground">(Muted)</span>}
            </div>
          )}
          {webMode && (
            <div className="flex items-center gap-2 text-blue-500">
              <Globe className="h-3 w-3" />
              <span className="font-medium">🌐 Web Mode Enabled</span>
            </div>
          )}
        </div>
      )}
      
      {/* Selected tools and images display */}
      {(selectedTools.length > 0 || images.length > 0) && (
        <div className="mb-3 flex flex-wrap gap-2">
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
          
          {images.map((image, index) => (
            <div
              key={index}
              className="relative flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-full text-sm"
            >
              <ImageIcon className="w-4 h-4 text-blue-500" />
              <span className="truncate max-w-32">{image.name}</span>
              <button
                onClick={() => removeImage(index)}
                className="p-0.5 hover:bg-accent rounded-full"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input area */}
      <div className={cn(
        "relative flex items-end gap-3 p-4 bg-surface border border-border rounded-2xl",
        "focus-within:border-primary/50 focus-within:shadow-surface transition-all duration-200"
      )}>
        {/* Tool menu */}
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

        {/* Text input */}
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

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Web Mode toggle */}
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

          {/* Image upload */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
            disabled={disabled}
          >
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Voice Mode Popover */}
          {voiceModeEnabled && (
            <VoiceModePopover
              isRecording={voiceState.isRecording}
              isProcessing={voiceState.isTranscribing}
              isSpeaking={voiceState.isSpeaking}
              isMuted={voiceState.isMuted}
              onStartRecording={handleVoiceRecording}
              onStopRecording={handleVoiceRecording}
              onStopSpeaking={stopSpeaking}
              onToggleMute={toggleMute}
            />
          )}

          {/* Send/Stop button */}
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

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Voice status indicators */}
      {voiceState.isEnabled && (
        <div className="mt-2 flex flex-col items-center gap-2">
          {voiceState.isRecording && (
            <div className="flex items-center justify-center gap-2 text-sm text-destructive">
              <div className="flex gap-1">
                <div className="w-1 h-4 bg-destructive rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-3 bg-destructive rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-5 bg-destructive rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                <div className="w-1 h-2 bg-destructive rounded-full animate-pulse" style={{ animationDelay: '450ms' }} />
              </div>
              <span className="font-medium">🎤 Listening... (speak now)</span>
            </div>
          )}
          
          {voiceState.isTranscribing && (
            <div className="flex items-center justify-center gap-2 text-sm text-orange-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-medium">🧠 Processing speech...</span>
            </div>
          )}
          
          {voiceState.isSpeaking && (
            <div className="flex items-center justify-center gap-2 text-sm text-blue-500">
              <Waves className="w-4 h-4" />
              <span className="font-medium">🔊 AI is speaking...</span>
            </div>
          )}
          
          {!voiceState.isRecording && !voiceState.isTranscribing && !voiceState.isSpeaking && (
            <div className="flex items-center justify-center gap-2 text-sm text-primary">
              <Mic className="w-4 h-4" />
              <span className="font-medium">🎙️ Voice mode active - click mic to record</span>
            </div>
          )}
          
          {voiceState.error && (
            <div className="text-xs text-destructive bg-destructive/10 px-3 py-1 rounded-full">
              ❌ {voiceState.error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Clean up any unused interfaces - voice mode now uses OpenAI Whisper
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}