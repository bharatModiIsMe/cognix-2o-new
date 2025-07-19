
import { useState } from "react";
import { ChevronDown, Sparkles, Brain, Zap, Globe, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { AI_MODELS } from "@/services/aiService";

const modelIcons = {
  "gemini-2.5-pro": Sparkles,
  "cognix-2o-web": Globe,
  "deepseek-v3": Brain,
  "claude-sonnet-4": Zap,
  "claude-opus-4": Bot,
};

interface FloatingModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
}

export function FloatingModelSelector({ selectedModel, onModelChange }: FloatingModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentModel = AI_MODELS.find(m => m.id === selectedModel) || AI_MODELS[0];
  const CurrentIcon = modelIcons[currentModel.id as keyof typeof modelIcons] || Bot;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-30">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 bg-background/95 backdrop-blur-sm border border-border rounded-full shadow-floating transition-all duration-200 hover:shadow-elevated hover:border-primary/30",
            isOpen && "border-primary/50 shadow-elevated"
          )}
        >
          <div className="w-6 h-6 bg-gradient-ai rounded-full flex items-center justify-center">
            <CurrentIcon className="w-3 h-3 text-white" />
          </div>
          <span className="font-medium text-sm">{currentModel.name}</span>
          {currentModel.badge && (
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
              {currentModel.badge}
            </span>
          )}
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 bg-popover/95 backdrop-blur-sm border border-border rounded-xl shadow-elevated z-20 p-2 min-w-[280px]">
              <div className="space-y-1">
                {AI_MODELS.map((model) => {
                  const ModelIcon = modelIcons[model.id as keyof typeof modelIcons] || Bot;
                  return (
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
                        <ModelIcon className={cn(
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
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
