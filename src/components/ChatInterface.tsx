import { useState, useRef, useEffect } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import { ExportDialog } from "@/components/ExportDialog";
import { AskCognixPopover } from "@/components/AskCognixPopover";
import { generateAIResponseStream, generateImage, editImage, AI_MODELS, IMAGE_MODELS } from "@/services/aiService";
import { ImageService, ImageUpload } from "@/services/imageService";
import { saveChatHistory } from "@/services/databaseService";
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
      model: message.model,
      images: message.images
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

    console.log('handleSendMessage called with:', { content, imagesCount: images?.length || 0, tools });

    let processedImages: ImageUpload[] = [];
    
    // Process images if provided
    if (images && images.length > 0) {
      console.log('Processing images...');
      try {
        processedImages = await ImageService.processImageFiles(images, user.uid);
        console.log('All images processed successfully:', processedImages.length);
      } catch (error) {
        console.error('Failed to process images:', error);
        toast({
          title: "Upload Failed",
          description: "Failed to upload images. Please try again.",
          variant: "destructive"
        });
        return;
      }
    }

    // Create user message with uploaded image URLs
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      images: processedImages.length > 0 ? processedImages.map(img => img.url) : undefined,
      tools
    };
    
    console.log('Adding user message to chat:', userMessage);
    setMessages(prev => [...prev, userMessage]);

    const isImageGeneration = tools?.includes('Generate Image') || detectImageGeneration(content);
    const isImageEditing = detectImageEditing(content, processedImages.length > 0);
    
    setIsGenerating(true);
    const controller = new AbortController();
    setAbortController(controller);

    if (isImageGeneration) {
      await handleImageGeneration(content, controller);
    } else if (isImageEditing && processedImages.length > 0) {
      await handleImageEditingRequest(content, processedImages[0].url, controller);
    } else {
      // Create assistant message for regular chat
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '',
        timestamp: new Date(),
        model: selectedModel,
        isTyping: true
      };
      
      console.log('Adding assistant message for regular chat');
      setMessages(prev => [...prev, assistantMessage]);

      // Generate AI response with image URLs
      await generateAIResponse(
        assistantMessage.id, 
        content, 
        selectedModel, 
        controller, 
        processedImages.map(img => img.url)
      );
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
      console.log('Generating image with prompt:', prompt);
      const imageUrl = await generateImage(prompt, 'flux-1.1-pro');
      if (controller.signal.aborted) return;

      let finalImageUrl = imageUrl;
      if (user && imageUrl) {
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const file = new File([blob], `generated-${Date.now()}.png`, { type: 'image/png' });
          const processedImages = await ImageService.processImageFiles([file], user.uid);
          finalImageUrl = processedImages[0].url;
          console.log('Generated image uploaded:', finalImageUrl);
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

  const handleImageEditingRequest = async (prompt: string, imageUrl: string, controller: AbortController) => {
    if (!user || !imageUrl) return;

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
      const editedImageUrl = await editImage(imageUrl, prompt);
      if (controller.signal.aborted) return;

      let finalImageUrl = editedImageUrl;
      try {
        const response = await fetch(editedImageUrl);
        const blob = await response.blob();
        const file = new File([blob], `edited-${Date.now()}.png`, { type: 'image/png' });
        const processedImages = await ImageService.processImageFiles([file], user.uid);
        finalImageUrl = processedImages[0].url;
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

  const generateAIResponse = async (
    messageId: string, 
    userInput: string, 
    modelId: string, 
    controller: AbortController, 
    imageUrls: string[] = []
  ) => {
    try {
      console.log('generateAIResponse called with images:', imageUrls.length);
      
      // Build conversation history for context
      const conversationHistory = messages
        .filter(msg => !msg.isTyping)
        .map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
      
      // Add current user message
      conversationHistory.push({ role: 'user' as const, content: userInput });
      
      console.log('Starting AI response stream with images:', imageUrls.length);
      const stream = generateAIResponseStream(conversationHistory, modelId, webMode, imageUrls);
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

      console.log('AI response completed');
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
      await generateAIResponse(messageId, userMessage.content, modelToUse, controller, userMessage.images || []);
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
