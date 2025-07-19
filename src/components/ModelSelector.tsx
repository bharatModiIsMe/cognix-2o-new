import { useState } from "react";
import { ChevronDown, Sparkles, Brain, Zap, Globe, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface Model {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  badge?: string;
}

const models: Model[] = [
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    icon: Sparkles,
    description: "Google's most capable model",
    badge: "Multimodal"
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: Brain,
    description: "Advanced reasoning capabilities",
    badge: "Reasoning"
  },
  {
    id: "grok-4",
    name: "Grok-4",
    icon: Zap,
    description: "Real-time information access",
    badge: "Real-time"
  },
  {
    id: "qwen-ai",
    name: "Qwen AI",
    icon: Globe,
    description: "Multilingual AI assistant",
    badge: "Multilingual"
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    icon: Bot,
    description: "OpenAI's latest model",
    badge: "Latest"
  }
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentModel = models.find(m => m.id === selectedModel) || models[4];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 bg-surface hover:bg-accent rounded-xl transition-all duration-200",
          "border border-border hover:border-primary/30 hover:shadow-surface",
          isOpen && "border-primary/50 shadow-surface"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-ai rounded-lg flex items-center justify-center">
            <currentModel.icon className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{currentModel.name}</span>
              {currentModel.badge && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {currentModel.badge}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{currentModel.description}</span>
          </div>
        </div>
        
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground transition-transform ml-auto",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-popover border border-border rounded-xl shadow-elevated z-20 p-2">
            <div className="space-y-1">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    onModelChange(model.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left",
                    model.id === selectedModel 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "hover:bg-accent"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    model.id === selectedModel 
                      ? "bg-gradient-ai" 
                      : "bg-muted"
                  )}>
                    <model.icon className={cn(
                      "w-4 h-4",
                      model.id === selectedModel ? "text-white" : "text-muted-foreground"
                    )} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{model.name}</span>
                      {model.badge && (
                        <span className={cn(
                          "px-2 py-0.5 text-xs font-medium rounded-full",
                          model.id === selectedModel 
                            ? "bg-primary/20 text-primary" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {model.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{model.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}