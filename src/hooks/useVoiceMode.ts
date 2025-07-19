
import { useState, useRef, useCallback } from 'react';
import { VoiceRecorder, AudioPlayer, transcribeAudio, synthesizeSpeech, processVoiceMessage } from '@/services/voiceService';

export interface VoiceModeState {
  isRecording: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  error: string | null;
  currentStatus: string;
}

interface UseVoiceModeProps {
  onMessage?: (content: string, isUser: boolean) => void;
}

export function useVoiceMode({ onMessage }: UseVoiceModeProps = {}) {
  const [state, setState] = useState<VoiceModeState>({
    isRecording: false,
    isProcessing: false,
    isPlaying: false,
    error: null,
    currentStatus: 'Ready'
  });

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);

  const updateState = useCallback((updates: Partial<VoiceModeState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const startRecording = useCallback(async () => {
    try {
      updateState({ 
        error: null, 
        currentStatus: 'Starting recording...' 
      });

      recorderRef.current = new VoiceRecorder();
      
      await recorderRef.current.startRecording(() => {
        // Auto-stop on silence
        stopRecording();
      });

      updateState({ 
        isRecording: true, 
        currentStatus: 'Listening...' 
      });
    } catch (error) {
      console.error('Failed to start recording:', error);
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to start recording',
        currentStatus: 'Error'
      });
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) return;

    try {
      updateState({ 
        isRecording: false, 
        isProcessing: true,
        currentStatus: 'Processing audio...' 
      });

      const audioBlob = await recorderRef.current.stopRecording();
      
      // Transcribe audio
      updateState({ currentStatus: 'Converting speech to text...' });
      const transcribedText = await transcribeAudio(audioBlob);
      
      if (!transcribedText.trim()) {
        updateState({ 
          isProcessing: false,
          error: 'No speech detected. Please try again.',
          currentStatus: 'Ready'
        });
        return;
      }

      // Add user message to chat
      if (onMessage) {
        onMessage(transcribedText, true);
      }

      // Process with AI
      updateState({ currentStatus: 'Getting AI response...' });
      const aiResponse = await processVoiceMessage(transcribedText);

      // Add AI message to chat
      if (onMessage) {
        onMessage(aiResponse, false);
      }

      // Synthesize speech
      updateState({ currentStatus: 'Converting text to speech...' });
      const audioBuffer = await synthesizeSpeech(aiResponse);

      // Play response
      updateState({ 
        isProcessing: false, 
        isPlaying: true,
        currentStatus: 'Playing response...' 
      });

      playerRef.current = new AudioPlayer();
      await playerRef.current.playAudio(audioBuffer, () => {
        updateState({ 
          isPlaying: false,
          currentStatus: 'Ready' 
        });
      });

    } catch (error) {
      console.error('Error in voice processing:', error);
      updateState({ 
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Voice processing failed',
        currentStatus: 'Error'
      });
    }
  }, [onMessage]);

  const stopAudio = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.stopAudio();
      updateState({ 
        isPlaying: false,
        currentStatus: 'Ready' 
      });
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [state.isRecording, startRecording, stopRecording]);

  const clearError = useCallback(() => {
    updateState({ error: null, currentStatus: 'Ready' });
  }, []);

  return {
    state,
    toggleRecording,
    stopAudio,
    clearError,
    isActive: state.isRecording || state.isProcessing || state.isPlaying
  };
}
