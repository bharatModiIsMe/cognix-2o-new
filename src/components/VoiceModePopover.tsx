import { useState } from 'react';
import { Mic, MicOff, Square, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface VoiceModePopoverProps {
  isRecording: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onStopSpeaking: () => void;
  onToggleMute: () => void;
}

export function VoiceModePopover({
  isRecording,
  isProcessing,
  isSpeaking,
  isMuted,
  onStartRecording,
  onStopRecording,
  onStopSpeaking,
  onToggleMute,
}: VoiceModePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getButtonState = () => {
    if (isRecording) return 'recording';
    if (isProcessing) return 'processing';
    if (isSpeaking) return 'speaking';
    return 'idle';
  };

  const buttonState = getButtonState();

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative transition-all duration-300 ${
            buttonState === 'recording'
              ? 'text-red-500 hover:text-red-600'
              : buttonState === 'processing'
              ? 'text-orange-500 hover:text-orange-600'
              : buttonState === 'speaking'
              ? 'text-blue-500 hover:text-blue-600'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Mic className="h-5 w-5" />
          {buttonState !== 'idle' && (
            <div className="absolute inset-0 rounded-full animate-pulse bg-current opacity-20" />
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-6" align="end">
        <div className="flex flex-col items-center space-y-6">
          {/* Circular dotted wavy animation */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Outer ring */}
            <div
              className={`absolute inset-0 border-2 border-dotted rounded-full transition-all duration-500 ${
                buttonState === 'recording'
                  ? 'border-red-500 animate-spin'
                  : buttonState === 'processing'
                  ? 'border-orange-500 animate-pulse'
                  : buttonState === 'speaking'
                  ? 'border-blue-500 animate-ping'
                  : 'border-muted-foreground/30'
              }`}
              style={{
                animationDuration: buttonState === 'speaking' ? '2s' : '3s',
              }}
            />
            
            {/* Middle ring */}
            <div
              className={`absolute inset-2 border border-dotted rounded-full transition-all duration-700 ${
                buttonState === 'recording'
                  ? 'border-red-400 animate-spin'
                  : buttonState === 'processing'
                  ? 'border-orange-400 animate-pulse'
                  : buttonState === 'speaking'
                  ? 'border-blue-400 animate-ping'
                  : 'border-muted-foreground/20'
              }`}
              style={{
                animationDuration: buttonState === 'speaking' ? '1.5s' : '2s',
                animationDirection: 'reverse',
              }}
            />
            
            {/* Inner ring */}
            <div
              className={`absolute inset-4 border border-dotted rounded-full transition-all duration-1000 ${
                buttonState === 'recording'
                  ? 'border-red-300 animate-spin'
                  : buttonState === 'processing'
                  ? 'border-orange-300 animate-pulse'
                  : buttonState === 'speaking'
                  ? 'border-blue-300 animate-ping'
                  : 'border-muted-foreground/10'
              }`}
              style={{
                animationDuration: buttonState === 'speaking' ? '1s' : '1.5s',
              }}
            />

            {/* Center button */}
            <Button
              variant={buttonState === 'idle' ? 'default' : 'secondary'}
              size="icon"
              className={`relative z-10 w-16 h-16 rounded-full transition-all duration-300 ${
                buttonState === 'recording'
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : buttonState === 'processing'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : buttonState === 'speaking'
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : ''
              }`}
              onClick={isRecording ? onStopRecording : onStartRecording}
              disabled={isProcessing || isSpeaking}
            >
              {isRecording ? (
                <Square className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>
          </div>

          {/* Status text */}
          <div className="text-center">
            <p className="text-sm font-medium">
              {buttonState === 'recording' && 'Recording...'}
              {buttonState === 'processing' && 'Processing...'}
              {buttonState === 'speaking' && 'AI Speaking...'}
              {buttonState === 'idle' && 'Tap to start voice chat'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {buttonState === 'recording' && 'Tap to stop recording'}
              {buttonState === 'processing' && 'Converting speech to text'}
              {buttonState === 'speaking' && 'AI is responding'}
              {buttonState === 'idle' && 'Voice mode ready'}
            </p>
          </div>

          {/* Control buttons */}
          <div className="flex space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleMute}
              className="flex items-center space-x-2"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </Button>

            {isSpeaking && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onStopSpeaking}
                className="flex items-center space-x-2"
              >
                <Square className="h-4 w-4" />
                <span>Stop AI</span>
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}