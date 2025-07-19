import { useState, useRef, useEffect } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { ExportDialog } from "@/components/ExportDialog";
import { AskCognixPopover } from "@/components/AskCognixPopover";
import { generateAIResponseStream, generateImage, editImage, AI_MODELS, IMAGE_MODELS } from "@/services/aiService";
import { saveChatHistory, uploadFile } from "@/services/databaseService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

export interface Message {
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

interface ChatInterfaceProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ChatInterface({ selectedModel, onModelChange }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [webMode, setWebMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0 && user) {
      const saveHistory = async () => {
        try {
          const title = messages[0]?.content.slice(0, 50) + (messages[0]?.content.length > 50 ? '...' : '');
          await saveChatHistory(user.uid, messages, title);
        } catch (error) {
          console.error('Failed to save chat history:', error);
        }
      };
      
      const timeoutId = setTimeout(saveHistory, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, user]);

  const saveMessage = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    if (!message || !user) return;

    const savedMessages = JSON.parse(localStorage.getItem(`savedMessages_${user.uid}`) || '[]');
    const newSavedMessage = {
      id: Date.now().toString(),
      content: message.content,
      timestamp: new Date(),
      model: message.model
    };

    savedMessages.push(newSavedMessage);
    localStorage.setItem(`savedMessages_${user.uid}`, JSON.stringify(savedMessages));
    
    toast({
      title: "Message Saved",
      description: "Response has been saved to your collection.",
    });
  };

  const detectImageGeneration = (content: string): boolean => {
    const imageKeywords = ['generate image', 'create image', 'draw', 'paint', 'show me a picture', 'create artwork', 'make art', 'generate art', 'design image', 'create graphic', 'picture of', 'image of', 'artwork of', 'illustration of', 'generate a'];
    const contentLower = content.toLowerCase();
    return imageKeywords.some(keyword => contentLower.includes(keyword));
  };

  const detectImageEditing = (content: string, hasImages: boolean): boolean => {
    if (!hasImages) return false;
    const editKeywords = ['edit this image', 'modify this image', 'change the', 'remove from image', 'add to image', 'convert this image', 'transform this image', 'alter this image', 'edit the image', 'modify the image'];
    const contentLower = content.toLowerCase();
    return editKeywords.some(keyword => contentLower.includes(keyword));
  };

  const handleSendMessage = async (content: string, images?: File[], tools?: string[]) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to use Cognix.",
        variant: "destructive"
      });
      return;
    }

    let uploadedImageUrls: string[] = [];
    if (images && images.length > 0) {
      try {
        const uploadPromises = images.map(image => uploadFile(image, user.uid, 'chat-images'));
        uploadedImageUrls = await Promise.all(uploadPromises);
      } catch (error) {
        console.error('Failed to upload images:', error);
        toast({
          title: "Upload Failed",
          description: "Failed to upload images. Please try again.",
          variant: "destructive"
        });
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      images: uploadedImageUrls.length > 0 ? uploadedImageUrls : undefined,
      tools
    };
    setMessages(prev => [...prev, userMessage]);

    const isImageGeneration = tools?.includes('Generate Image') || detectImageGeneration(content);
    const isImageEditing = detectImageEditing(content, uploadedImageUrls.length > 0);
    
    setIsGenerating(true);
    const controller = new AbortController();
    setAbortController(controller);

    if (isImageGeneration) {
      await handleImageGeneration(content, controller);
    } else if (isImageEditing) {
      await handleImageEditingRequest(content, images?.[0], controller);
    } else {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        model: selectedModel,
        isTyping: true
      };
      setMessages(prev => [...prev, assistantMessage]);

      await generateRealAIResponse(assistantMessage.id, content, selectedModel, controller, images);
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsGenerating(false);

    setMessages(prev => prev.map(msg => msg.isTyping ? {
      ...msg,
      isTyping: false,
      content: msg.content || "Response stopped."
    } : msg));
  };

  const handleImageGeneration = async (prompt: string, controller: AbortController) => {
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: 'Generating image...',
      timestamp: new Date(),
      model: 'flux-1.1-pro',
      isTyping: true
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const imageUrl = await generateImage(prompt, 'flux-1.1-pro');
      if (controller.signal.aborted) return;

      let finalImageUrl = imageUrl;
      if (user && imageUrl) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], `generated-${Date.now()}.png`, { type: 'image/png' });
          finalImageUrl = await uploadFile(file, user.uid, 'generated-images');
        } catch (uploadError) {
          console.error('Failed to upload generated image:', uploadError);
        }
      }

      setMessages(prev => prev.map(msg => msg.id === assistantMessage.id ? {
        ...msg,
        content: `Here's your generated image:`,
        images: [finalImageUrl],
        tools: ['generate-image'],
        isTyping: false
      } : msg));
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('Error generating image:', error);
      setMessages(prev => prev.map(msg => msg.id === assistantMessage.id ? {
        ...msg,
        content: "I'm sorry, I couldn't generate the image. Please try again with a different prompt.",
        isTyping: false
      } : msg));
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleImageEditingRequest = async (prompt: string, imageFile: File | undefined, controller: AbortController) => {
    if (!user || !imageFile) return;

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      type: 'assistant',
      content: 'Editing image...',
      timestamp: new Date(),
      model: 'flux-kontext-dev',
      isTyping: true
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const editedImageUrl = await editImage(imageFile, prompt);
      if (controller.signal.aborted) return;

      let finalImageUrl = editedImageUrl;
      try {
        const response = await fetch(editedImageUrl);
        const blob = await response.blob();
        const file = new File([blob], `edited-${Date.now()}.png`, { type: 'image/png' });
        finalImageUrl = await uploadFile(file, user.uid, 'edited-images');
      } catch (uploadError) {
        console.error('Failed to upload edited image:', uploadError);
      }

      setMessages(prev => prev.map(msg => msg.id === assistantMessage.id ? {
        ...msg,
        content: `Here's your edited image:`,
        images: [finalImageUrl],
        tools: ['edit-image'],
        isTyping: false
      } : msg));
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('Error editing image:', error);
      setMessages(prev => prev.map(msg => msg.id === assistantMessage.id ? {
        ...msg,
        content: "I'm sorry, I couldn't edit the image. Please try again with a different prompt.",
        isTyping: false
      } : msg));
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const generateRealAIResponse = async (messageId: string, userInput: string, modelId: string, controller: AbortController, images?: File[]) => {
    try {
      const messages = [{ role: 'user' as const, content: userInput }];
      const stream = generateAIResponseStream(messages, modelId, webMode, false, images);
      let fullResponse = '';

      for await (const chunk of stream) {
        if (controller.signal.aborted) return;
        fullResponse += chunk;
        setMessages(prev => prev.map(msg => msg.id === messageId ? {
          ...msg,
          content: fullResponse,
          isTyping: false
        } : msg));
        await new Promise(resolve => setTimeout(resolve, 30));
      }

      setMessages(prev => prev.map(msg => msg.id === messageId ? {
        ...msg,
        isTyping: false
      } : msg));
      
    } catch (error) {
      if (controller.signal.aborted) return;
      console.error('Error generating AI response:', error);
      setMessages(prev => prev.map(msg => msg.id === messageId ? {
        ...msg,
        content: "I'm sorry, I'm experiencing technical difficulties. Please try again.",
        isTyping: false
      } : msg));
    } finally {
      setIsGenerating(false);
      setAbortController(null);
    }
  };

  const handleLikeMessage = (messageId: string, isLiked: boolean) => {
    setMessages(prev => prev.map(msg => msg.id === messageId ? {
      ...msg,
      liked: isLiked,
      disliked: isLiked ? false : msg.disliked
    } : msg));
  };

  const handleDislikeMessage = (messageId: string, isDisliked: boolean) => {
    setMessages(prev => prev.map(msg => msg.id === messageId ? {
      ...msg,
      disliked: isDisliked,
      liked: isDisliked ? false : msg.liked
    } : msg));
  };

  const handleRegenerateMessage = async (messageId: string, newModelId?: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    const userMessage = messages[messageIndex - 1];
    const currentMessage = messages[messageIndex];
    if (!userMessage) return;

    const isImageMessage = currentMessage.tools?.includes('generate-image');
    const modelToUse = newModelId || selectedModel;

    setMessages(prev => prev.map(msg => msg.id === messageId ? {
      ...msg,
      content: isImageMessage ? 'Generating image...' : '',
      isTyping: true,
      model: modelToUse,
      images: undefined
    } : msg));

    const controller = new AbortController();
    setAbortController(controller);
    setIsGenerating(true);

    if (isImageMessage) {
      try {
        const imageUrl = await generateImage(userMessage.content, modelToUse);
        if (controller.signal.aborted) return;

        setMessages(prev => prev.map(msg => msg.id === messageId ? {
          ...msg,
          content: `Here's your generated image:`,
          images: [imageUrl],
          tools: ['generate-image'],
          model: modelToUse,
          isTyping: false
        } : msg));
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Error regenerating image:', error);
        setMessages(prev => prev.map(msg => msg.id === messageId ? {
          ...msg,
          content: "I'm sorry, I couldn't regenerate the image. Please try again with a different model.",
          model: modelToUse,
          isTyping: false
        } : msg));
      }
    } else {
      await generateRealAIResponse(messageId, userMessage.content, modelToUse, controller);
    }
  };

  const startNewChat = () => {
    setMessages([]);
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(selection.toString().trim());
      setPopoverPosition({
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY
      });
    }
  };

  const handleAskCognix = (text: string) => {
    setSelectedText("");
    window.dispatchEvent(new CustomEvent('setChatInput', {
      detail: { text: `"${text}"` }
    }));
  };

  const closePopover = () => {
    setSelectedText("");
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pt-6 pb-24" onMouseUp={handleTextSelection}>
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="text-2xl font-bold mb-2">Welcome to Cognix</h2>
              <p className="text-muted-foreground mb-6">
                Your intelligent AI assistant powered by multiple advanced models. Ask anything, upload images, or generate them with AI.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button 
                  onClick={() => handleSendMessage("What are the latest web development trends?")} 
                  className="px-4 py-2 bg-surface hover:bg-accent rounded-lg text-sm transition-colors"
                >
                  Web Development Trends
                </button>
                <button 
                  onClick={() => handleSendMessage("Explain quantum computing")} 
                  className="px-4 py-2 bg-surface hover:bg-accent rounded-lg text-sm transition-colors"
                >
                  Quantum Computing
                </button>
                <button 
                  onClick={() => handleSendMessage("Help me write a story")} 
                  className="px-4 py-2 bg-surface hover:bg-accent rounded-lg text-sm transition-colors"
                >
                  Creative Writing
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map(message => (
              <div key={message.id}>
                <ChatMessage 
                  message={message} 
                  onLike={isLiked => handleLikeMessage(message.id, isLiked)} 
                  onDislike={isDisliked => handleDislikeMessage(message.id, isDisliked)} 
                  onRegenerate={modelId => handleRegenerateMessage(message.id, modelId)} 
                  onExport={() => setIsExportOpen(true)}
                  onSave={() => saveMessage(message.id)}
                />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 md:left-64 right-0 p-4 border-t border-border bg-background/95 backdrop-blur-sm z-20">
        <div className="max-w-6xl mx-auto">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            onNewChat={startNewChat} 
            disabled={messages.some(m => m.isTyping)} 
            webMode={webMode} 
            onWebModeToggle={setWebMode} 
            isGenerating={isGenerating} 
            onStopGeneration={handleStopGeneration}
          />
        </div>
      </div>

      <AskCognixPopover 
        selectedText={selectedText} 
        position={popoverPosition} 
        onAsk={handleAskCognix} 
        onClose={closePopover} 
      />

      <ExportDialog 
        isOpen={isExportOpen} 
        onOpenChange={setIsExportOpen} 
        messages={messages} 
        selectedModel={selectedModel} 
      />
    </div>
  );
}
