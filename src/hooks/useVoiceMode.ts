
import { useState, useRef, useCallback, useEffect } from 'react';
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
  const isProcessingRef = useRef(false);
  const isMountedRef = useRef(true);

  // Track component mount state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, []);

  const updateState = useCallback((updates: Partial<VoiceModeState>) => {
    if (isMountedRef.current) {
      setState(prev => ({ ...prev, ...updates }));
    }
  }, []);

  const cleanup = useCallback(() => {
    console.log('🧹 Cleaning up voice mode...');
    
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

    isProcessingRef.current = false;
  }, []);

  const startRecording = useCallback(async () => {
    if (isProcessingRef.current || !isMountedRef.current) {
      console.log('⚠️ Cannot start recording - processing or unmounted');
      return;
    }

    try {
      console.log('🎤 Starting recording process...');
      cleanup();
      
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
        if (!isProcessingRef.current && isMountedRef.current) {
          stopRecording();
        }
      });

      if (!isMountedRef.current) return;

      updateState({ 
        isRecording: true, 
        currentStatus: 'Listening... Speak now!' 
      });

      // Safety timeout
      timeoutRef.current = setTimeout(() => {
        console.log('⏰ Recording timeout reached');
        if (!isProcessingRef.current && isMountedRef.current) {
          stopRecording();
        }
      }, 30000);

    } catch (error) {
      console.error('Failed to start recording:', error);
      cleanup();
      if (isMountedRef.current) {
        updateState({ 
          error: error instanceof Error ? error.message : 'Failed to start recording',
          currentStatus: 'Error',
          isRecording: false
        });
      }
    }
  }, [cleanup, updateState]);

  const stopRecording = useCallback(async () => {
    if (!recorderRef.current || isProcessingRef.current || !isMountedRef.current) {
      console.warn('No recorder to stop or already processing');
      return;
    }

    try {
      console.log('⏹️ Stopping recording...');
      isProcessingRef.current = true;
      
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
      
      if (!isMountedRef.current) return;
      
      if (audioBlob.size < 500) {
        updateState({ 
          isProcessing: false,
          error: 'Recording too short. Please speak for at least 1 second.',
          currentStatus: 'Ready'
        });
        isProcessingRef.current = false;
        return;
      }

      // Transcribe audio
      updateState({ currentStatus: 'Converting speech to text...' });
      const transcribedText = await transcribeAudio(audioBlob);
      
      if (!isMountedRef.current) return;
      
      if (!transcribedText.trim()) {
        updateState({ 
          isProcessing: false,
          error: 'No speech detected. Please try speaking more clearly.',
          currentStatus: 'Ready'
        });
        isProcessingRef.current = false;
        return;
      }

      console.log('👤 User said:', transcribedText);

      // Process with AI
      updateState({ currentStatus: 'Getting AI response...' });
      const aiResponse = await processVoiceMessage(transcribedText);

      if (!isMountedRef.current) return;

      if (!aiResponse.trim()) {
        updateState({ 
          isProcessing: false,
          error: 'AI response was empty. Please try again.',
          currentStatus: 'Ready'
        });
        isProcessingRef.current = false;
        return;
      }

      console.log('🤖 AI responded:', aiResponse);

      // Synthesize speech
      updateState({ currentStatus: 'Converting AI response to speech...' });
      const audioBuffer = await synthesizeSpeech(aiResponse);

      if (!isMountedRef.current) return;

      // Play response
      updateState({ 
        isProcessing: false, 
        isPlaying: true,
        currentStatus: 'AI is speaking...' 
      });

      playerRef.current = new AudioPlayer();
      await playerRef.current.playAudio(audioBuffer, () => {
        if (isMountedRef.current) {
          updateState({ 
            isPlaying: false,
            currentStatus: 'Ready - Tap to speak again!' 
          });
        }
        playerRef.current = null;
        isProcessingRef.current = false;
      });

    } catch (error) {
      console.error('Error in voice processing pipeline:', error);
      cleanup();
      if (isMountedRef.current) {
        updateState({ 
          isProcessing: false,
          isPlaying: false,
          error: error instanceof Error ? error.message : 'Voice processing failed',
          currentStatus: 'Error - Tap to try again'
        });
      }
      isProcessingRef.current = false;
    }
  }, [cleanup, updateState]);

  const stopAudio = useCallback(() => {
    console.log('🛑 Stopping audio playback');
    if (playerRef.current) {
      playerRef.current.stopAudio();
      playerRef.current = null;
      if (isMountedRef.current) {
        updateState({ 
          isPlaying: false,
          currentStatus: 'Ready' 
        });
      }
    }
    isProcessingRef.current = false;
  }, [updateState]);

  const toggleRecording = useCallback(() => {
    if (!isMountedRef.current) return;
    
    if (state.isRecording) {
      stopRecording();
    } else if (!state.isProcessing && !state.isPlaying && !isProcessingRef.current) {
      startRecording();
    }
  }, [state.isRecording, state.isProcessing, state.isPlaying, startRecording, stopRecording]);

  const clearError = useCallback(() => {
    if (isMountedRef.current) {
      updateState({ 
        error: null, 
        currentStatus: 'Ready' 
      });
    }
  }, [updateState]);

  const reset = useCallback(() => {
    console.log('🔄 Resetting voice mode');
    cleanup();
    if (isMountedRef.current) {
      setState({
        isRecording: false,
        isProcessing: false,
        isPlaying: false,
        error: null,
        currentStatus: 'Ready'
      });
    }
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
