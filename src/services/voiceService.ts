
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

  async startRecording(onSilence?: () => void): Promise<void> {
    try {
      this.onSilenceCallback = onSilence;
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      // Setup silence detection
      this.setupSilenceDetection();
      
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording = true;
      
      console.log('🎤 Recording started');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      throw new Error('Failed to start recording. Please check microphone permissions.');
    }
  }

  private setupSilenceDetection(): void {
    if (!this.stream) return;

    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(this.stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    source.connect(this.analyser);

    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const checkAudioLevel = () => {
      if (!this.isRecording || !this.analyser) return;

      this.analyser.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      
      // Silence threshold (adjust as needed)
      const silenceThreshold = 10;
      
      if (average < silenceThreshold) {
        if (!this.silenceTimer) {
          this.silenceTimer = setTimeout(() => {
            if (this.isRecording && this.onSilenceCallback) {
              console.log('🔇 Silence detected, stopping recording');
              this.onSilenceCallback();
            }
          }, 3000); // 3 seconds of silence
        }
      } else {
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }
      }

      if (this.isRecording) {
        requestAnimationFrame(checkAudioLevel);
      }
    };

    checkAudioLevel();
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      console.log('⏹️ Stopping recording');

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { 
          type: this.mediaRecorder?.mimeType || 'audio/webm' 
        });
        console.log('📼 Audio blob created, size:', audioBlob.size);
        this.cleanup();
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
      this.isRecording = false;
    });
  }

  private cleanup(): void {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyser = null;
    this.isRecording = false;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    console.log('🎯 Transcribing audio, size:', audioBlob.size);
    
    // Convert blob to File for the API
    const audioFile = new File([audioBlob], 'audio.webm', { 
      type: audioBlob.type 
    });

    const response = await a4fClient.audio.transcriptions.create({
      file: audioFile,
      model: 'provider-2/whisper-1',
    });

    const transcribedText = response.text || '';
    console.log('✅ Transcription result:', transcribedText);
    return transcribedText;
  } catch (error) {
    console.error('❌ Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio. Please try again.');
  }
}

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  try {
    console.log('🗣️ Synthesizing speech for text:', text.substring(0, 100) + '...');
    
    const response = await a4fClient.audio.speech.create({
      model: 'provider-3/tts-1',
      voice: 'alloy', // Available voices: alloy, echo, fable, onyx, nova, shimmer
      input: text,
      speed: 1.0,
    });

    const audioBuffer = await response.arrayBuffer();
    console.log('🔊 Speech synthesized, buffer size:', audioBuffer.byteLength);
    return audioBuffer;
  } catch (error) {
    console.error('❌ Error synthesizing speech:', error);
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
      console.log('▶️ Starting audio playback');
      
      // Stop any currently playing audio
      this.stopAudio();

      this.audioContext = new (AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);

      const buffer = await this.audioContext.decodeAudioData(audioBuffer);
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = buffer;
      this.currentSource.connect(this.gainNode);

      // Smooth fade in
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.1);

      this.currentSource.onended = () => {
        console.log('🏁 Audio playback ended');
        this.isPlaying = false;
        if (onEnd) onEnd();
      };

      this.currentSource.start();
      this.isPlaying = true;
      
      console.log('🎵 Audio playback started successfully');
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      throw new Error('Failed to play audio.');
    }
  }

  stopAudio(): void {
    if (this.currentSource && this.isPlaying) {
      console.log('⏹️ Stopping audio playback');
      
      // Smooth fade out before stopping
      if (this.gainNode && this.audioContext) {
        this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
        setTimeout(() => {
          if (this.currentSource) {
            try {
              this.currentSource.stop();
            } catch (e) {
              // Ignore errors when stopping already stopped audio
            }
            this.currentSource = null;
          }
        }, 100);
      } else {
        try {
          this.currentSource.stop();
        } catch (e) {
          // Ignore errors when stopping already stopped audio
        }
        this.currentSource = null;
      }
      this.isPlaying = false;
    }

    if (this.audioContext) {
      this.audioContext.close();
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

Please provide a concise, conversational response suitable for voice. Keep it natural and engaging, as this will be spoken aloud. Avoid overly long explanations unless specifically requested.` 
    }];
    
    const stream = generateAIResponseStream(messages, "cognix-2o-web", true, false);
    
    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
    }
    
    console.log('✅ AI response generated:', fullResponse.substring(0, 100) + '...');
    return fullResponse;
  } catch (error) {
    console.error('❌ Error processing voice message:', error);
    throw new Error('Failed to process voice message. Please try again.');
  }
}
