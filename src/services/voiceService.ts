import OpenAI from 'openai';

const a4fApiKey = "ddc-a4f-2708604e0a7f47ecb013784c4aaeaf40";
const a4fBaseUrl = 'https://api.a4f.co/v1';

const a4fClient = new OpenAI({
  apiKey: a4fApiKey,
  baseURL: a4fBaseUrl,
  dangerouslyAllowBrowser: true
});

export class VoiceService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private currentAudio: HTMLAudioElement | null = null;

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start();
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Microphone access denied or unavailable');
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('No recording in progress'));
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        
        // Stop all tracks to release microphone
        this.mediaRecorder?.stream.getTracks().forEach(track => track.stop());
        
        console.log('Recording stopped, blob size:', audioBlob.size);
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  async transcribeAudio(audioBlob: Blob): Promise<string> {
    try {
      console.log('🎤 Starting transcription...');
      
      // Create a File object from the blob for the audio transcription API
      const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });
      
      const response = await a4fClient.audio.transcriptions.create({
        file: audioFile,
        model: 'provider-2/whisper-1',
      });

      console.log('📝 Transcription response:', response);
      const transcription = response.text || '';
      console.log('✅ Transcribed text:', transcription);
      return transcription;
    } catch (error) {
      console.error('❌ Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  private cleanTextForTTS(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
      .replace(/\*(.*?)\*/g, '$1') // Italic
      .replace(/`(.*?)`/g, '$1') // Inline code
      .replace(/```[\s\S]*?```/g, '[code block]') // Code blocks
      .replace(/#{1,6}\s/g, '') // Headers
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Links
      .replace(/>\s/g, '') // Blockquotes
      .replace(/\n+/g, ' ') // Multiple newlines
      .replace(/\s+/g, ' ') // Multiple spaces
      .trim();
  }

  async synthesizeSpeech(text: string): Promise<ArrayBuffer> {
    try {
      const cleanText = this.cleanTextForTTS(text);
      
      if (!cleanText || cleanText.trim().length === 0) {
        throw new Error('No text to synthesize');
      }

      console.log('🗣️ Starting TTS for text:', cleanText.substring(0, 50) + '...');

      const response = await a4fClient.chat.completions.create({
        model: 'provider-3/tts-1',
        messages: [
          { role: "user", content: cleanText },
        ],
      });

      console.log('🔊 TTS Response received:', response);
      
      // The response should be audio data, let's handle it properly
      const audioData = response.choices[0]?.message?.content;
      if (!audioData) {
        throw new Error('No audio data received from TTS API');
      }

      console.log('🎵 Audio data type:', typeof audioData, 'length:', audioData.length);
      
      // Try to handle the audio data - it might be base64 encoded
      let audioBuffer: ArrayBuffer;
      
      try {
        // If it's base64, decode it
        if (audioData.startsWith('data:audio')) {
          const base64Data = audioData.split(',')[1];
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          audioBuffer = bytes.buffer;
        } else {
          // Otherwise try to decode as base64 directly
          const binaryString = atob(audioData);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          audioBuffer = bytes.buffer;
        }
      } catch (decodeError) {
        console.error('❌ Failed to decode audio data:', decodeError);
        // Fallback: just convert to bytes
        const audioBuffer = new TextEncoder().encode(audioData);
        return audioBuffer.buffer;
      }
      
      console.log('✅ TTS audio buffer created, size:', audioBuffer.byteLength);
      return audioBuffer;
      
    } catch (error) {
      console.error('❌ Error synthesizing speech:', error);
      throw new Error('Failed to synthesize speech: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async playAudio(audioBuffer: ArrayBuffer): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.stopAudio();

        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        this.currentAudio = new Audio(audioUrl);
        
        this.currentAudio.onended = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          resolve();
        };

        this.currentAudio.onerror = () => {
          URL.revokeObjectURL(audioUrl);
          this.currentAudio = null;
          reject(new Error('Failed to play audio'));
        };

        this.currentAudio.play();
        console.log('Audio playback started');
      } catch (error) {
        reject(error);
      }
    });
  }

  stopAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
  }

  isPlaying(): boolean {
    return this.currentAudio !== null && !this.currentAudio.paused;
  }

  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }

  cleanup(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.stopAudio();
  }
}

export const voiceService = new VoiceService();