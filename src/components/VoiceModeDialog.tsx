
import { useEffect } from "react";
import { Mic, MicOff, Square, AlertCircle, Volume2 } from "lucide-react";
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

// Enhanced animated visualization for voice mode
function VoiceVisualization({ isActive, isListening, isPlaying }: { 
  isActive: boolean; 
  isListening: boolean; 
  isPlaying: boolean; 
}) {
  if (!isActive) {
    return (
      <div className="flex items-center justify-center my-8">
        <div className="w-24 h-24 rounded-full border-4 border-muted flex items-center justify-center">
          <Mic className="w-8 h-8 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center space-x-1 my-8">
      <div className="relative w-32 h-32">
        {/* Outer pulsing ring */}
        <div className={`absolute inset-0 rounded-full border-4 ${
          isListening ? 'border-green-400 animate-pulse' : 
          isPlaying ? 'border-blue-400 animate-pulse' : 'border-orange-400 animate-pulse'
        }`}></div>
        
        {/* Middle ring */}
        <div className={`absolute inset-4 rounded-full border-2 ${
          isListening ? 'border-green-300 animate-spin' : 
          isPlaying ? 'border-blue-300 animate-spin' : 'border-orange-300 animate-spin'
        }`} style={{ animationDuration: '2s' }}></div>
        
        {/* Animated dots around the circle */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div 
            key={i}
            className="absolute inset-0 animate-spin" 
            style={{ 
              animationDuration: '3s', 
              animationDelay: `${i * 0.5}s`,
              transform: `rotate(${i * 60}deg)`
            }}
          >
            <div className={`absolute top-0 left-1/2 w-3 h-3 rounded-full -translate-x-1/2 animate-bounce ${
              isListening ? 'bg-green-500' : 
              isPlaying ? 'bg-blue-500' : 'bg-orange-500'
            }`} style={{ animationDelay: `${i * 0.2}s` }}></div>
          </div>
        ))}
        
        {/* Center icon */}
        <div className={`absolute top-1/2 left-1/2 w-12 h-12 rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center ${
          isListening ? 'bg-green-500' : 
          isPlaying ? 'bg-blue-500' : 'bg-orange-500'
        } animate-pulse`}>
          {isListening ? <Mic className="w-6 h-6 text-white" /> : 
           isPlaying ? <Volume2 className="w-6 h-6 text-white" /> :
           <Square className="w-6 h-6 text-white" />}
        </div>
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

  // Don't auto-close - let user control when to exit voice mode
  useEffect(() => {
    if (!isOpen && isActive) {
      // If dialog is closed but voice mode is active, stop everything
      if (state.isRecording) {
        toggleRecording();
      }
      if (state.isPlaying) {
        stopAudio();
      }
    }
  }, [isOpen, isActive, state.isRecording, state.isPlaying, toggleRecording, stopAudio]);

  const handleMicToggle = () => {
    if (state.error) {
      clearError();
    }
    toggleRecording();
  };

  const handleStopAI = () => {
    stopAudio();
  };

  const getStatusText = () => {
    if (state.error) return state.error;
    if (state.isRecording) return "🎤 Listening to you...";
    if (state.isProcessing) return "🤔 Thinking...";
    if (state.isPlaying) return "🗣️ AI is speaking...";
    return "👋 Ready to chat! Tap the microphone to start.";
  };

  const getInstructions = () => {
    if (state.isRecording) return "Speak now. I'll stop listening after a few seconds of silence.";
    if (state.isProcessing) return "Processing your message and generating response...";
    if (state.isPlaying) return "Listening to AI response. Tap stop to interrupt.";
    return "This is voice-only mode. No text will appear in your chat history.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">🎤 Voice Assistant</DialogTitle>
        </DialogHeader>
        
        {/* Status display */}
        <div className="text-center text-lg font-medium mb-2">
          {getStatusText()}
        </div>
        
        {/* Voice visualization */}
        <VoiceVisualization 
          isActive={isActive} 
          isListening={state.isRecording}
          isPlaying={state.isPlaying}
        />
        
        {/* Error display */}
        {state.error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{state.error}</span>
          </div>
        )}
        
        <div className="flex flex-col gap-3">
          <button
            onClick={handleMicToggle}
            disabled={state.isProcessing || state.isPlaying}
            className={`flex items-center gap-3 p-4 rounded-lg border transition-all duration-200 ${
              state.isRecording
                ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 shadow-lg scale-105" 
                : "bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            } ${(state.isProcessing || state.isPlaying) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
          >
            {state.isRecording ? (
              <>
                <div className="relative">
                  <MicOff className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <div className="font-medium">Stop Recording</div>
                  <div className="text-sm opacity-75">Click to stop or wait for silence</div>
                </div>
              </>
            ) : (
              <>
                <Mic className="w-5 h-5" />
                <div>
                  <div className="font-medium">Start Talking</div>
                  <div className="text-sm opacity-75">Click to begin voice conversation</div>
                </div>
              </>
            )}
          </button>
          
          <button
            onClick={handleStopAI}
            disabled={!state.isPlaying}
            className={`flex items-center gap-3 p-4 rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition-all duration-200 ${
              !state.isPlaying ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
            }`}
          >
            <Square className="w-5 h-5" />
            <div>
              <div className="font-medium">Stop AI</div>
              <div className="text-sm opacity-75">Interrupt AI response</div>
            </div>
          </button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground text-center border-t pt-4 space-y-2">
          <p className="font-medium">{getInstructions()}</p>
          <p>💡 <strong>Pro tip:</strong> Speak clearly and wait for the AI to finish before speaking again.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
