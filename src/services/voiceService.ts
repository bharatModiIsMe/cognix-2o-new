
import OpenAI from 'openai';
import { generateAIResponseStream } from './aiService';

const a4fApiKey = "ddc-a4f-2708604e0a7f47ecb013784c4aaeaf40";
const a4fBaseUrl = 'https://api.a4f.co/v1';

const a4fClient = new OpenAI({
  apiKey: a4fApiKey,
  baseURL: a4fBaseUrl,
  dangerouslyAllowBrowser: true
});

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private silenceTimer: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isRecording = false;
  private onSilenceCallback?: () => void;
  private silenceCheckInterval: NodeJS.Timeout | null = null;

  async startRecording(onSilence?: () => void): Promise<void> {
    try {
      console.log('🎤 Starting voice recording...');
      this.cleanup(); // Clean up any previous session
      
      this.onSilenceCallback = onSilence;
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/mp4';
        
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        this.cleanup();
      };

      // Setup improved silence detection
      this.setupSilenceDetection();
      
      this.mediaRecorder.start(250); // Collect data every 250ms for better quality
      this.isRecording = true;
      
      console.log('✅ Recording started successfully');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      this.cleanup();
      throw new Error('Failed to start recording. Please check microphone permissions.');
    }
  }

  private setupSilenceDetection(): void {
    if (!this.stream) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.3;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let silentFrames = 0;
      const maxSilentFrames = 20; // About 2 seconds at 100ms intervals

      const checkAudioLevel = () => {
        if (!this.isRecording || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        // Improved silence detection with dynamic threshold
        const silenceThreshold = 15;
        
        if (average < silenceThreshold) {
          silentFrames++;
          if (silentFrames >= maxSilentFrames && this.onSilenceCallback && this.isRecording) {
            console.log('🔇 Silence detected, auto-stopping recording');
            this.onSilenceCallback();
            return;
          }
        } else {
          silentFrames = 0; // Reset counter when sound is detected
        }
      };

      // Check every 100ms for more responsive detection
      this.silenceCheckInterval = setInterval(checkAudioLevel, 100);
      
    } catch (error) {
      console.error('❌ Error setting up silence detection:', error);
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      console.log('⏹️ Stopping recording...');

      const handleStop = () => {
        try {
          if (this.audioChunks.length === 0) {
            reject(new Error('No audio data recorded'));
            return;
          }

          const audioBlob = new Blob(this.audioChunks, { 
            type: this.mediaRecorder?.mimeType || 'audio/webm' 
          });
          
          console.log('📼 Audio blob created:', {
            size: audioBlob.size,
            type: audioBlob.type,
            chunks: this.audioChunks.length
          });
          
          this.cleanup();
          resolve(audioBlob);
        } catch (error) {
          console.error('❌ Error creating audio blob:', error);
          reject(error);
        }
      };

      this.mediaRecorder.onstop = handleStop;
      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  private cleanup(): void {
    console.log('🧹 Cleaning up voice recorder...');
    
    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
    }
    
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch (error) {
        console.warn('Warning stopping media recorder:', error);
      }
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Audio track stopped');
      });
      this.stream = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(console.warn);
      this.audioContext = null;
    }

    this.analyser = null;
    this.isRecording = false;
    this.onSilenceCallback = undefined;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    console.log('🎯 Starting transcription...', {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    if (audioBlob.size < 1000) {
      throw new Error('Audio file too small - please speak longer');
    }
    
    // Convert blob to File for the API
    const audioFile = new File([audioBlob], 'audio.webm', { 
      type: audioBlob.type 
    });

    const response = await a4fClient.audio.transcriptions.create({
      file: audioFile,
      model: 'provider-2/whisper-1',
      language: 'en', // Specify language for better accuracy
    });

    const transcribedText = response.text?.trim() || '';
    console.log('✅ Transcription successful:', transcribedText);
    
    if (!transcribedText) {
      throw new Error('No speech detected. Please speak clearly and try again.');
    }
    
    return transcribedText;
  } catch (error) {
    console.error('❌ Transcription error:', error);
    throw new Error('Failed to transcribe audio. Please speak clearly and try again.');
  }
}

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  try {
    console.log('🗣️ Synthesizing speech...', text.substring(0, 50) + '...');
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text provided for speech synthesis');
    }
    
    // Clean the text for better speech quality
    const cleanText = text
      .replace(/[*_~`]/g, '') // Remove markdown formatting
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\n{2,}/g, '\n') // Reduce multiple newlines
      .trim();
    
    const response = await a4fClient.audio.speech.create({
      model: 'provider-3/tts-1',
      voice: 'alloy',
      input: cleanText,
      speed: 1.0,
      response_format: 'mp3',
    });

    const audioBuffer = await response.arrayBuffer();
    console.log('🔊 Speech synthesis successful:', audioBuffer.byteLength, 'bytes');
    
    if (audioBuffer.byteLength === 0) {
      throw new Error('Empty audio response from speech synthesis');
    }
    
    return audioBuffer;
  } catch (error) {
    console.error('❌ Speech synthesis error:', error);
    throw new Error('Failed to synthesize speech. Please try again.');
  }
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;

  async playAudio(audioBuffer: ArrayBuffer, onEnd?: () => void): Promise<void> {
    try {
      console.log('▶️ Starting audio playback...');
      
      this.stopAudio(); // Stop any currently playing audio

      this.audioContext = new (AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended (required for some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);

      const buffer = await this.audioContext.decodeAudioData(audioBuffer);
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = buffer;
      this.currentSource.connect(this.gainNode);

      // Smooth fade in
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0.8, this.audioContext.currentTime + 0.1);

      this.currentSource.onended = () => {
        console.log('🏁 Audio playback completed');
        this.isPlaying = false;
        if (onEnd) onEnd();
      };

      this.currentSource.start();
      this.isPlaying = true;
      
      console.log('🎵 Audio playback started successfully');
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      this.isPlaying = false;
      throw new Error('Failed to play audio response.');
    }
  }

  stopAudio(): void {
    if (this.currentSource && this.isPlaying) {
      console.log('⏹️ Stopping audio playback');
      
      try {
        // Smooth fade out
        if (this.gainNode && this.audioContext) {
          this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
          setTimeout(() => {
            if (this.currentSource) {
              try {
                this.currentSource.stop();
              } catch (e) {
                console.warn('Warning stopping audio source:', e);
              }
              this.currentSource = null;
            }
          }, 100);
        }
      } catch (e) {
        console.warn('Warning during audio cleanup:', e);
      }
      
      this.isPlaying = false;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(console.warn);
      this.audioContext = null;
    }
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export async function processVoiceMessage(text: string): Promise<string> {
  try {
    console.log('🤖 Processing voice message:', text);
    
    const messages = [{ 
      role: 'user' as const, 
      content: `${text}

Please provide a concise, conversational response suitable for voice interaction. Keep it natural, engaging, and under 200 words since this will be spoken aloud. Use simple language and avoid complex formatting.` 
    }];
    
    const stream = generateAIResponseStream(messages, "gemini-2.5-pro", false, false);
    
    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
    }
    
    // Clean response for voice
    const cleanResponse = fullResponse
      .replace(/[*_~`]/g, '') // Remove markdown
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\n{2,}/g, ' ') // Replace multiple newlines with space
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces
      .trim();
    
    console.log('✅ AI response processed for voice:', cleanResponse.substring(0, 100) + '...');
    return cleanResponse;
  } catch (error) {
    console.error('❌ Error processing voice message:', error);
    throw new Error('Failed to process your request. Please try again.');
  }
}
