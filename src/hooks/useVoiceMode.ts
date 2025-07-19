
import { useState, useRef, useCallback } from 'react';
import { VoiceRecorder, AudioPlayer, transcribeAudio, synthesizeSpeech, processVoiceMessage } from '@/services/voiceService';

export interface VoiceModeState {
  isRecording: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  error: string | null;
  currentStatus: string;
}

export function useVoiceMode() {
  const [state, setState] = useState<VoiceModeState>({
    isRecording: false,
    isProcessing: false,
    isPlaying: false,
    error: null,
    currentStatus: 'Ready'
  });

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateState = useCallback((updates: Partial<VoiceModeState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (recorderRef.current) {
      try {
        if (recorderRef.current.getIsRecording()) {
          recorderRef.current.stopRecording().catch(console.warn);
        }
      } catch (e) {
        console.warn('Cleanup recorder warning:', e);
      }
      recorderRef.current = null;
    }
    
    if (playerRef.current) {
      try {
        playerRef.current.stopAudio();
      } catch (e) {
        console.warn('Cleanup player warning:', e);
      }
      playerRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting recording process...');
      cleanup(); // Clean up any previous session
      
      updateState({ 
        error: null, 
        currentStatus: 'Starting recording...',
        isRecording: false,
        isProcessing: false,
        isPlaying: false
      });

      recorderRef.current = new VoiceRecorder();
      
      await recorderRef.current.startRecording(() => {
        console.log('🔇 Auto-stop triggered by silence');
        stopRecording();
      });

      updateState({ 
        isRecording: true, 
        currentStatus: 'Listening... Speak now!' 
      });

      // Safety timeout - auto stop after 30 seconds
      timeoutRef.current = setTimeout(() => {
        console.log('⏰ Recording timeout reached');
        stopRecording();
      }, 30000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      cleanup();
      updateState({ 
        error: error instanceof Error ? error.message : 'Failed to start recording',
        currentStatus: 'Error',
        isRecording: false
      });
    }
  }, [cleanup, updateState]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current) {
      console.warn('No recorder to stop');
      return;
    }

    try {
      console.log('⏹️ Stopping recording...');
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      updateState({ 
        isRecording: false, 
        isProcessing: true,
        currentStatus: 'Processing your speech...' 
      });

      const audioBlob = await recorderRef.current.stopRecording();
      recorderRef.current = null;
      
      if (audioBlob.size < 1000) {
        updateState({ 
          isProcessing: false,
          error: 'Recording too short. Please speak for at least 1 second.',
          currentStatus: 'Ready'
        });
        return;
      }

      // Transcribe audio
      updateState({ currentStatus: 'Converting speech to text...' });
      const transcribedText = await transcribeAudio(audioBlob);
      
      if (!transcribedText.trim()) {
        updateState({ 
          isProcessing: false,
          error: 'No speech detected. Please try speaking more clearly.',
          currentStatus: 'Ready'
        });
        return;
      }

      console.log('👤 User said:', transcribedText);

      // Process with AI
      updateState({ currentStatus: 'Getting AI response...' });
      const aiResponse = await processVoiceMessage(transcribedText);

      if (!aiResponse.trim()) {
        updateState({ 
          isProcessing: false,
          error: 'AI response was empty. Please try again.',
          currentStatus: 'Ready'
        });
        return;
      }

      console.log('🤖 AI responded:', aiResponse);

      // Synthesize speech
      updateState({ currentStatus: 'Converting AI response to speech...' });
      const audioBuffer = await synthesizeSpeech(aiResponse);

      // Play response
      updateState({ 
        isProcessing: false, 
        isPlaying: true,
        currentStatus: 'AI is speaking...' 
      });

      playerRef.current = new AudioPlayer();
      await playerRef.current.playAudio(audioBuffer, () => {
        updateState({ 
          isPlaying: false,
          currentStatus: 'Ready - Tap to speak again!' 
        });
        playerRef.current = null;
      });

    } catch (error) {
      console.error('Error in voice processing pipeline:', error);
      cleanup();
      updateState({ 
        isProcessing: false,
        isPlaying: false,
        error: error instanceof Error ? error.message : 'Voice processing failed',
        currentStatus: 'Error - Tap to try again'
      });
    }
  }, [cleanup, updateState]);

  const stopAudio = useCallback(() => {
    console.log('🛑 Stopping audio playback');
    if (playerRef.current) {
      playerRef.current.stopAudio();
      playerRef.current = null;
      updateState({ 
        isPlaying: false,
        currentStatus: 'Ready' 
      });
    }
  }, [updateState]);

  const toggleRecording = useCallback(() => {
    setState(currentState => {
      if (currentState.isRecording) {
        stopRecording();
      } else if (!currentState.isProcessing && !currentState.isPlaying) {
        startRecording();
      }
      return currentState;
    });
  }, [startRecording, stopRecording]);

  const clearError = useCallback(() => {
    updateState({ 
      error: null, 
      currentStatus: 'Ready' 
    });
  }, [updateState]);

  // Cleanup on unmount
  const reset = useCallback(() => {
    console.log('🔄 Resetting voice mode');
    cleanup();
    setState({
      isRecording: false,
      isProcessing: false,
      isPlaying: false,
      error: null,
      currentStatus: 'Ready'
    });
  }, [cleanup]);

  return {
    state,
    toggleRecording,
    stopAudio,
    clearError,
    reset,
    isActive: state.isRecording || state.isProcessing || state.isPlaying
  };
}
