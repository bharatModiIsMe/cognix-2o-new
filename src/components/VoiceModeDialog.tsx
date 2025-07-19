
import { useState } from "react";
import { Mic, MicOff, Square } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface VoiceModeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  isMicOn: boolean;
  onMicToggle: () => void;
  onStopAI: () => void;
}

// Animated dots component
function AnimatedDots() {
  return (
    <div className="flex items-center justify-center space-x-1 my-4">
      <div className="relative w-20 h-20">
        {/* Wavy outline circle */}
        <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-pulse"></div>
        <div className="absolute inset-1 rounded-full border-2 border-primary/20 animate-spin"></div>
        
        {/* Moving dots in circular pattern */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
          <div className="absolute top-0 left-1/2 w-2 h-2 bg-primary rounded-full -translate-x-1/2 animate-bounce"></div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '0.5s' }}>
          <div className="absolute top-1/4 right-0 w-2 h-2 bg-primary/80 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1s' }}>
          <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-primary/60 rounded-full -translate-x-1/2 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s', animationDelay: '1.5s' }}>
          <div className="absolute top-1/4 left-0 w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }}></div>
        </div>
        
        {/* Center pulsing dot */}
        <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
      </div>
    </div>
  );
}

export function VoiceModeDialog({ 
  isOpen, 
  onOpenChange, 
  isMicOn, 
  onMicToggle, 
  onStopAI 
}: VoiceModeDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Voice Mode</DialogTitle>
        </DialogHeader>
        
        {/* Animated dots */}
        <AnimatedDots />
        
        <div className="flex flex-col gap-4 py-4">
          <button
            onClick={onMicToggle}
            className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
              isMicOn 
                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" 
                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            }`}
          >
            {isMicOn ? (
              <>
                <Mic className="w-5 h-5" />
                <div>
                  <div className="font-medium">Microphone On</div>
                  <div className="text-sm opacity-75">Click to turn off</div>
                </div>
              </>
            ) : (
              <>
                <MicOff className="w-5 h-5" />
                <div>
                  <div className="font-medium">Microphone Off</div>
                  <div className="text-sm opacity-75">Click to turn on</div>
                </div>
              </>
            )}
          </button>
          
          <button
            onClick={onStopAI}
            className="flex items-center gap-3 p-4 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors"
          >
            <Square className="w-5 h-5" />
            <div>
              <div className="font-medium">Stop AI Response</div>
              <div className="text-sm opacity-75">Stop current AI generation</div>
            </div>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
