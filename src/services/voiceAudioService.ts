
export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private isRecording = false;
  private onSilenceCallback?: () => void;
  private silenceCheckInterval: NodeJS.Timeout | null = null;
  private recordingStartTime: number = 0;

  async startRecording(onSilence?: () => void): Promise<void> {
    try {
      console.log('🎤 Starting voice recording...');
      this.cleanup();
      
      this.onSilenceCallback = onSilence;
      this.recordingStartTime = Date.now();
      
      // Request high-quality audio
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1
        } 
      });
      
      // Use the best available format
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
        }
      }
        
      this.mediaRecorder = new MediaRecorder(this.stream, { 
        mimeType,
        audioBitsPerSecond: 128000 // Higher quality
      });
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          console.log('📼 Audio chunk received:', event.data.size, 'bytes');
        }
      };

      this.mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        this.cleanup();
      };

      this.mediaRecorder.onstart = () => {
        console.log('✅ Recording started');
        this.isRecording = true;
      };

      this.mediaRecorder.onstop = () => {
        console.log('⏹️ Recording stopped');
        this.isRecording = false;
      };

      // Setup silence detection
      this.setupSilenceDetection();
      
      // Start recording with smaller intervals for better responsiveness
      this.mediaRecorder.start(100);
      
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
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      let silentFrames = 0;
      const maxSilentFrames = 30; // 3 seconds at 100ms intervals
      const minRecordingTime = 1000; // Minimum 1 second recording

      const checkAudioLevel = () => {
        if (!this.isRecording || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        const silenceThreshold = 10;
        const recordingDuration = Date.now() - this.recordingStartTime;
        
        if (average < silenceThreshold) {
          silentFrames++;
          // Only trigger silence detection after minimum recording time
          if (silentFrames >= maxSilentFrames && 
              recordingDuration > minRecordingTime && 
              this.onSilenceCallback && 
              this.isRecording) {
            console.log('🔇 Silence detected after', recordingDuration, 'ms');
            this.onSilenceCallback();
            return;
          }
        } else {
          silentFrames = 0; // Reset on sound detection
        }
      };

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
            chunks: this.audioChunks.length,
            duration: Date.now() - this.recordingStartTime
          });
          
          this.cleanup();
          resolve(audioBlob);
        } catch (error) {
          console.error('❌ Error creating audio blob:', error);
          reject(error);
        }
      };

      this.mediaRecorder.onstop = handleStop;
      
      if (this.mediaRecorder.state === 'recording') {
        this.mediaRecorder.stop();
      } else {
        handleStop();
      }
    });
  }

  private cleanup(): void {
    console.log('🧹 Cleaning up voice recorder...');
    
    if (this.silenceCheckInterval) {
      clearInterval(this.silenceCheckInterval);
      this.silenceCheckInterval = null;
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

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying = false;

  async playAudio(audioBuffer: ArrayBuffer, onEnd?: () => void): Promise<void> {
    try {
      console.log('▶️ Starting audio playback...');
      
      this.stopAudio();

      this.audioContext = new (AudioContext || (window as any).webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);

      const buffer = await this.audioContext.decodeAudioData(audioBuffer.slice(0));
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = buffer;
      this.currentSource.connect(this.gainNode);

      // Smooth audio start
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.1);

      this.currentSource.onended = () => {
        console.log('🏁 Audio playback completed');
        this.isPlaying = false;
        if (onEnd) onEnd();
      };

      this.currentSource.start();
      this.isPlaying = true;
      
      console.log('🎵 Audio playback started');
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
        } else {
          this.currentSource.stop();
          this.currentSource = null;
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
