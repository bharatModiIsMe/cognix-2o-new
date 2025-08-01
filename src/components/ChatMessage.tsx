
import { useState } from "react";
import { 
  Copy, 
  ThumbsUp, 
  ThumbsDown, 
  Edit, 
  RotateCcw, 
  Share,
  User,
  Bot,
  Sparkles,
  ChevronDown,
  Save,
  Volume2,
  Download,
  Wand2
} from "lucide-react";
import { ImageDownloadButton } from "@/components/ImageDownloadButton";
import { ImageCropper } from "./ImageCropper";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from "@/lib/utils";
import { AI_MODELS, IMAGE_MODELS } from "@/services/aiService";

export interface MessageType {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  images?: string[];
  tools?: string[];
  isTyping?: boolean;
  liked?: boolean;
  disliked?: boolean;
}

interface ChatMessageProps {
  message: MessageType;
  onLike: (isLiked: boolean) => void;
  onDislike: (isDisliked: boolean) => void;
  onRegenerate: (modelId?: string) => void;
  onExport: () => void;
  onSave?: () => void;
}

export function ChatMessage({ 
  message, 
  onLike, 
  onDislike, 
  onRegenerate, 
  onExport,
  onSave 
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState<string>('');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    const element = document.createElement('a');
    const file = new Blob([message.content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `cognix-message-${message.id}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleReadAloud = async () => {
    try {
      const { textToSpeech } = await import('@/services/speechService');
      const audioBuffer = await textToSpeech(message.content);
      
      // Create audio from buffer and play
      const audioBlob = new Blob([audioBuffer], { type: 'audio/mp3' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
      
      // Clean up URL when audio ends
      audio.onended = () => {
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Text to speech error:', error);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      // Could implement "Ask GPT" follow-up here
      console.log("Selected text:", selection.toString());
    }
  };

  const handleEditImage = async (imageUrl: string) => {
    setImageToEdit(imageUrl);
    setShowImageCropper(true);
  };

  const handleCroppedImage = async (croppedFile: File) => {
    try {
      setShowImageCropper(false);
      
      // Convert file to URL for editing
      const croppedUrl = URL.createObjectURL(croppedFile);
      
      // Here you would call your image editing service
      toast.success('Image cropped successfully! Ready for editing.');
      
      // Clean up the blob URL
      URL.revokeObjectURL(croppedUrl);
    } catch (error) {
      console.error('Image cropping error:', error);
      toast.error('Failed to crop image');
    }
  };

  return (
    <div className={cn(
      "group flex gap-4 max-w-4xl mx-auto fade-in",
      message.type === 'user' ? "justify-end" : "justify-start"
    )}>
      {/* Avatar */}
      {message.type === 'assistant' && (
        <div className="w-8 h-8 bg-gradient-ai rounded-lg flex items-center justify-center flex-shrink-0">
          <Bot className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Message content */}
      <div className={cn(
        "flex-1 space-y-2",
        message.type === 'user' ? "max-w-xl" : "max-w-full"
      )}>
        {/* Message header */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {message.type === 'assistant' && (
            <>
              <span className="font-medium">Cognix</span>
              {message.model && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium">
                  {message.model}
                </span>
              )}
            </>
          )}
          {message.type === 'user' && (
            <div className="flex items-center gap-2 ml-auto">
              <span>You</span>
              <User className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Tools display */}
        {message.tools && message.tools.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.tools.map(tool => (
              <div key={tool} className="flex items-center gap-1 px-2 py-1 bg-surface rounded-full text-xs">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="capitalize">{tool.replace('-', ' ')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Images */}
        {message.images && message.images.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {message.images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-auto max-h-96 rounded-lg border shadow-sm hover:shadow-md transition-shadow object-contain"
                  style={{ maxWidth: '100%', height: 'auto' }}
                  onError={(e) => {
                    console.error('Image failed to load:', image);
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                  <ImageDownloadButton 
                    imageUrl={image} 
                    imageName={`cognix-image-${index + 1}`}
                    className="bg-black/50 text-white border-white/20 hover:bg-black/70"
                  />
                  <button
                    className="px-2 py-1 bg-black/50 text-white border border-white/20 hover:bg-black/70 rounded text-sm flex items-center gap-1"
                    onClick={() => handleEditImage(image)}
                  >
                    <Wand2 className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message bubble */}
        <div 
          className={cn(
            "relative px-4 py-3 rounded-2xl",
            message.type === 'user'
              ? "bg-gradient-ai text-white ml-auto"
              : "bg-surface border border-border"
          )}
          data-message-type={message.type}
        >
          <div 
            className={cn(
              "text-sm leading-relaxed",
              message.isTyping && "typing-animation"
            )}
            onMouseUp={handleTextSelection}
          >
            {message.isTyping ? (
              "Thinking..."
            ) : message.type === 'assistant' ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Customize styling for different elements
                    h1: ({ children }) => <h1 className="text-lg font-bold text-foreground mb-2">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold text-foreground mb-1">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold text-foreground mb-1">{children}</h3>,
                    strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                    code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                    pre: ({ children }) => <pre className="bg-muted p-3 rounded-lg overflow-x-auto text-xs font-mono my-2">{children}</pre>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
                    li: ({ children }) => <li className="text-foreground">{children}</li>,
                    blockquote: ({ children }) => <blockquote className="border-l-4 border-primary/20 pl-4 italic my-2">{children}</blockquote>,
                    a: ({ href, children }) => <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                    p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>

          {/* Timestamp */}
          <div className={cn(
            "text-xs mt-2 opacity-70",
            message.type === 'user' ? "text-white/70" : "text-muted-foreground"
          )}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>

        {/* Action toolbar for assistant messages */}
        {message.type === 'assistant' && !message.isTyping && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Copy message"
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={onSave || handleSave}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Save chat"
            >
              <Save className="w-4 h-4" />
            </button>

            <button
              onClick={handleReadAloud}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Read aloud"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => onLike(!message.liked)}
              className={cn(
                "p-2 hover:bg-accent rounded-lg transition-colors",
                message.liked && "text-success bg-success/10"
              )}
              title="Like message"
            >
              <ThumbsUp className="w-4 h-4" />
            </button>

            <button
              onClick={() => onDislike(!message.disliked)}
              className={cn(
                "p-2 hover:bg-accent rounded-lg transition-colors",
                message.disliked && "text-destructive bg-destructive/10"
              )}
              title="Dislike message"
            >
              <ThumbsDown className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowModelSelector(!showModelSelector)}
                className="p-2 hover:bg-accent rounded-lg transition-colors flex items-center gap-1"
                title="Regenerate with different model"
              >
                <RotateCcw className="w-4 h-4" />
                <ChevronDown className="w-3 h-3" />
              </button>

              {showModelSelector && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowModelSelector(false)}
                  />
                  <div className="absolute bottom-full right-0 mb-2 bg-popover border border-border rounded-lg shadow-elevated z-20 p-2 min-w-[200px]">
                    <div className="space-y-1">
                      {/* For image messages, only show regenerate with other models */}
                      {!message.tools?.includes('generate-image') && (
                        <button
                          onClick={() => {
                            onRegenerate();
                            setShowModelSelector(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg text-sm transition-colors"
                        >
                          Same model
                        </button>
                      )}
                      {(message.tools?.includes('generate-image') ? IMAGE_MODELS : AI_MODELS).map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            onRegenerate(model.id);
                            setShowModelSelector(false);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-accent rounded-lg text-sm transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span>{model.name}</span>
                            {model.badge && (
                              <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-xs">
                                {model.badge}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={onExport}
              className="p-2 hover:bg-accent rounded-lg transition-colors"
              title="Export message"
            >
              <Share className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Copy confirmation */}
        {copied && (
          <div className="text-xs text-success">
            ✓ Copied to clipboard
          </div>
        )}

        {imageToEdit && (
          <ImageCropper
            isOpen={showImageCropper}
            onClose={() => setShowImageCropper(false)}
            imageUrl={imageToEdit}
            onCrop={handleCroppedImage}
          />
        )}
      </div>

      {/* User avatar */}
      {message.type === 'user' && (
        <div className="w-8 h-8 bg-surface border border-border rounded-lg flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
