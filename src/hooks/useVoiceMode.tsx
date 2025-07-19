import { useState, useCallback, useRef, useEffect } from 'react';
import { voiceService } from '@/services/voiceService';
import { useToast } from '@/hooks/use-toast';

export interface VoiceModeState {
  isEnabled: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isListening: boolean;
  transcript: string;
  error: string | null;
}

export function useVoiceMode() {
  const { toast } = useToast();
  const [state, setState] = useState<VoiceModeState>({
    isEnabled: false,
    isRecording: false,
    isTranscribing: false,
    isSpeaking: false,
    isMuted: false,
    isListening: false,
    transcript: '',
    error: null
  });

  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Toggle voice mode on/off
  const toggleVoiceMode = useCallback(() => {
    setState(prev => {
      const newEnabled = !prev.isEnabled;
      
      if (!newEnabled) {
        // Clean up when disabling voice mode
        voiceService.cleanup();
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
      }

      return {
        ...prev,
        isEnabled: newEnabled,
        isRecording: false,
        isTranscribing: false,
        isSpeaking: false,
        isListening: newEnabled,
        transcript: '',
        error: null
      };
    });

    if (!state.isEnabled) {
      toast({
        title: "🎙️ Voice Mode Enabled",
        description: "Click the mic to start a voice conversation!"
      });
    } else {
      toast({
        title: "Voice Mode Disabled",
        description: "Voice features are now turned off."
      });
    }
  }, [state.isEnabled, toast]);

  // Complete voice conversation: Record → Transcribe → Get AI Response → Speak
  const startVoiceConversation = useCallback(async () => {
    if (!state.isEnabled || state.isRecording) return;

    try {
      setState(prev => ({ 
        ...prev, 
        isRecording: true, 
        error: null,
        transcript: ''
      }));

      // Step 1: Start recording
      await voiceService.startRecording();

      // Auto-stop recording after 30 seconds for safety
      recordingTimeoutRef.current = setTimeout(() => {
        completeVoiceConversation();
      }, 30000);

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isRecording: false,
        error: error instanceof Error ? error.message : 'Failed to start recording'
      }));
      
      toast({
        title: "❌ Recording Error",
        description: "Unable to access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  }, [state.isEnabled, state.isRecording, toast]);

  // Complete the voice conversation flow
  const completeVoiceConversation = useCallback(async (): Promise<string | null> => {
    if (!state.isRecording) return null;

    try {
      setState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isTranscribing: true 
      }));

      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }

      // Step 1: Stop recording and get audio
      const audioBlob = await voiceService.stopRecording();
      
      // Step 2: Transcribe to text  
      const transcript = await voiceService.transcribeAudio(audioBlob);

      if (!transcript || transcript.trim().length === 0) {
        setState(prev => ({ ...prev, isTranscribing: false }));
        toast({
          title: "🤔 No Speech Detected",
          description: "Please try speaking more clearly."
        });
        return null;
      }

      setState(prev => ({ 
        ...prev, 
        isTranscribing: false,
        transcript
      }));

      // Note: AI response handling is now done in the parent component
      
      toast({
        title: "✅ Voice Conversation Complete",
        description: `You: "${transcript.length > 50 ? transcript.substring(0, 50) + '...' : transcript}"`,
      });
      
      return transcript;

    } catch (error) {
      console.error('Error in voice conversation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Voice processing failed';
      
      setState(prev => ({ 
        ...prev, 
        isRecording: false,
        isTranscribing: false,
        isSpeaking: false,
        error: errorMessage
      }));
      
      toast({
        title: "❌ Voice Processing Error",
        description: errorMessage,
        variant: "destructive"
      });
      
      return null;
    }
  }, [state.isRecording, state.isMuted, toast]);

  // Toggle recording (simplified for manual flow)
  const toggleRecording = useCallback(async (): Promise<string | null> => {
    if (state.isRecording) {
      // Stop recording and process
      setState(prev => ({ ...prev, isRecording: false, isTranscribing: true }));

      try {
        // Stop recording and get audio blob
        const audioBlob = await voiceService.stopRecording();
        console.log('🎵 Recording stopped, processing...');

        // Transcribe audio to text
        const transcript = await voiceService.transcribeAudio(audioBlob);
        console.log('📝 Transcription received:', transcript);
        
        setState(prev => ({ ...prev, transcript, isTranscribing: false }));

        if (!transcript || transcript.trim().length === 0) {
          throw new Error('No speech detected');
        }

        return transcript;

      } catch (error) {
        console.error('❌ Voice recording error:', error);
        setState(prev => ({ 
          ...prev, 
          isRecording: false, 
          isTranscribing: false, 
          error: error instanceof Error ? error.message : 'Voice recording failed'
        }));
        return null;
      }
    } else {
      // Start recording
      setState(prev => ({ ...prev, isRecording: true, error: null }));
      
      try {
        await voiceService.startRecording();
        console.log('🎤 Voice recording started');
        return null;
      } catch (error) {
        console.error('❌ Failed to start recording:', error);
        setState(prev => ({ 
          ...prev, 
          isRecording: false, 
          error: error instanceof Error ? error.message : 'Failed to start recording'
        }));
        return null;
      }
    }
  }, [state.isRecording]);

  // Stop any ongoing speech
  const stopSpeaking = useCallback(() => {
    voiceService.stopAudio();
    setState(prev => ({ ...prev, isSpeaking: false }));
  }, []);

  // Speak text using TTS (for manual TTS calls)
  const speakText = useCallback(async (text: string) => {
    if (!state.isEnabled || state.isMuted || !text.trim()) return;

    try {
      setState(prev => ({ ...prev, isSpeaking: true, error: null }));

      const audioBuffer = await voiceService.synthesizeSpeech(text);
      await voiceService.playAudio(audioBuffer);

      setState(prev => ({ ...prev, isSpeaking: false }));

    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        isSpeaking: false,
        error: error instanceof Error ? error.message : 'Failed to speak text'
      }));
      
      console.error('TTS Error:', error);
    }
  }, [state.isEnabled, state.isMuted]);

  // Toggle mute for TTS
  const toggleMute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    
    if (!state.isMuted) {
      voiceService.stopAudio();
      toast({
        title: "🔇 Voice Output Muted",
        description: "AI responses will no longer be read aloud."
      });
    } else {
      toast({
        title: "🔊 Voice Output Unmuted",
        description: "AI responses will be read aloud again."
      });
    }
  }, [state.isMuted, toast]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      voiceService.cleanup();
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
    };
  }, []);

  return {
    state,
    toggleVoiceMode,
    toggleMute,
    toggleRecording,
    speakText,
    stopSpeaking
  };
}