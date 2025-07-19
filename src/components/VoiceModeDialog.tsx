
import { useEffect } from "react";
import { Mic, MicOff, Square, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVoiceMode } from "@/hooks/useVoiceMode";

interface VoiceModeDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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

export function VoiceModeDialog({ isOpen, onOpenChange }: VoiceModeDialogProps) {
  const { state, toggleRecording, stopAudio, clearError, isActive } = useVoiceMode();

  // Clear error when dialog opens
  useEffect(() => {
    if (isOpen && state.error) {
      clearError();
    }
  }, [isOpen, state.error, clearError]);

  // Auto-close dialog when not active and not in error state
  useEffect(() => {
    if (isOpen && !isActive && !state.error && state.currentStatus === 'Ready') {
      const timer = setTimeout(() => {
        onOpenChange(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isActive, state.error, state.currentStatus, onOpenChange]);

  const handleMicToggle = () => {
    if (state.error) {
      clearError();
    }
    toggleRecording();
  };

  const handleStopAI = () => {
    stopAudio();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Voice Mode</DialogTitle>
        </DialogHeader>
        
        {/* Status display */}
        <div className="text-center text-sm text-muted-foreground mb-2">
          {state.currentStatus}
        </div>
        
        {/* Animated dots - show when active */}
        {isActive && <AnimatedDots />}
        
        {/* Error display */}
        {state.error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{state.error}</span>
          </div>
        )}
        
        <div className="flex flex-col gap-4 py-4">
          <button
            onClick={handleMicToggle}
            disabled={state.isProcessing || state.isPlaying}
            className={`flex items-center gap-3 p-4 rounded-lg border transition-colors ${
              state.isRecording
                ? "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" 
                : "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
            } ${(state.isProcessing || state.isPlaying) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {state.isRecording ? (
              <>
                <Mic className="w-5 h-5" />
                <div>
                  <div className="font-medium">Recording...</div>
                  <div className="text-sm opacity-75">Click to stop or wait for silence</div>
                </div>
              </>
            ) : (
              <>
                <MicOff className="w-5 h-5" />
                <div>
                  <div className="font-medium">Start Recording</div>
                  <div className="text-sm opacity-75">Click to begin voice conversation</div>
                </div>
              </>
            )}
          </button>
          
          <button
            onClick={handleStopAI}
            disabled={!state.isPlaying}
            className={`flex items-center gap-3 p-4 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors ${
              !state.isPlaying ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Square className="w-5 h-5" />
            <div>
              <div className="font-medium">Stop AI Response</div>
              <div className="text-sm opacity-75">Stop current audio playback</div>
            </div>
          </button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground text-center border-t pt-4">
          <p>Speak clearly into your microphone. Recording will stop automatically after 3-5 seconds of silence.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
