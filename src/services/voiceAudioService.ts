
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
      
      // Request high-quality audio with better constraints
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 48000, min: 16000 },
          channelCount: 1
        } 
      });
      
      console.log('🎵 Audio stream obtained');
      
      // Determine best available format
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/wav';
          }
        }
      }
      
      console.log('🎼 Using MIME type:', mimeType);
        
      this.mediaRecorder = new MediaRecorder(this.stream, { 
        mimeType,
        audioBitsPerSecond: 128000
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
        throw new Error('Recording failed');
      };

      this.mediaRecorder.onstart = () => {
        console.log('✅ Recording started successfully');
        this.isRecording = true;
      };

      this.mediaRecorder.onstop = () => {
        console.log('⏹️ Recording stopped');
        this.isRecording = false;
      };

      // Setup improved silence detection
      this.setupSilenceDetection();
      
      // Start recording with frequent data collection
      this.mediaRecorder.start(250); // Collect data every 250ms
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      this.cleanup();
      
      if (error instanceof Error && error.name === 'NotAllowedError') {
        throw new Error('Microphone permission denied. Please allow microphone access and try again.');
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        throw new Error('No microphone found. Please connect a microphone and try again.');
      }
      
      throw new Error('Failed to start recording. Please check your microphone and try again.');
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
      const maxSilentFrames = 25; // 2.5 seconds at 100ms intervals
      const minRecordingTime = 1500; // Minimum 1.5 second recording

      const checkAudioLevel = () => {
        if (!this.isRecording || !this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        // Dynamic silence threshold based on initial audio levels
        const silenceThreshold = Math.max(8, average * 0.1);
        const recordingDuration = Date.now() - this.recordingStartTime;
        
        if (average < silenceThreshold) {
          silentFrames++;
          if (silentFrames >= maxSilentFrames && 
              recordingDuration > minRecordingTime && 
              this.onSilenceCallback && 
              this.isRecording) {
            console.log('🔇 Silence detected after', recordingDuration, 'ms, average level:', average);
            this.onSilenceCallback();
            return;
          }
        } else {
          silentFrames = 0; // Reset on sound detection
        }
      };

      this.silenceCheckInterval = setInterval(checkAudioLevel, 100);
      console.log('🔍 Silence detection setup complete');
      
    } catch (error) {
      console.error('❌ Error setting up silence detection:', error);
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording to stop'));
        return;
      }

      console.log('⏹️ Stopping recording process...');

      const handleStop = () => {
        try {
          if (this.audioChunks.length === 0) {
            reject(new Error('No audio data was recorded'));
            return;
          }

          const audioBlob = new Blob(this.audioChunks, { 
            type: this.mediaRecorder?.mimeType || 'audio/webm' 
          });
          
          const duration = Date.now() - this.recordingStartTime;
          console.log('📼 Audio blob created:', {
            size: audioBlob.size,
            type: audioBlob.type,
            chunks: this.audioChunks.length,
            duration: duration + 'ms'
          });
          
          this.cleanup();
          resolve(audioBlob);
        } catch (error) {
          console.error('❌ Error creating audio blob:', error);
          reject(error);
        }
      };

      this.mediaRecorder.onstop = handleStop;
      
      try {
        if (this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        } else {
          console.log('📝 MediaRecorder not in recording state:', this.mediaRecorder.state);
          handleStop();
        }
      } catch (error) {
        console.error('❌ Error stopping MediaRecorder:', error);
        reject(error);
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
    this.audioChunks = [];
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
      console.log('▶️ Starting audio playback...', audioBuffer.byteLength, 'bytes');
      
      // Stop any existing playback
      this.stopAudio();

      // Create audio context
      this.audioContext = new (AudioContext || (window as any).webkitAudioContext)();
      
      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('🔊 Audio context resumed');
      }
      
      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);

      // Decode audio data
      console.log('🎵 Decoding audio data...');
      const buffer = await this.audioContext.decodeAudioData(audioBuffer.slice(0));
      console.log('✅ Audio decoded successfully, duration:', buffer.duration, 'seconds');
      
      // Create buffer source
      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = buffer;
      this.currentSource.connect(this.gainNode);

      // Smooth fade-in
      this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      this.gainNode.gain.linearRampToValueAtTime(1, this.audioContext.currentTime + 0.05);

      // Handle playback end
      this.currentSource.onended = () => {
        console.log('🏁 Audio playback completed naturally');
        this.isPlaying = false;
        if (onEnd) {
          setTimeout(onEnd, 100); // Small delay to ensure cleanup
        }
      };

      // Start playback
      this.currentSource.start(0);
      this.isPlaying = true;
      
      console.log('🎵 Audio playback started successfully');
    } catch (error) {
      console.error('❌ Audio playback error:', error);
      this.isPlaying = false;
      this.cleanup();
      throw new Error(`Failed to play audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  stopAudio(): void {
    if (!this.isPlaying && !this.currentSource) return;
    
    console.log('⏹️ Stopping audio playback');
    
    try {
      if (this.currentSource && this.isPlaying) {
        // Smooth fade-out before stopping
        if (this.gainNode && this.audioContext) {
          this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.05);
          setTimeout(() => {
            if (this.currentSource) {
              try {
                this.currentSource.stop();
              } catch (e) {
                console.warn('Warning stopping audio source:', e);
              }
            }
            this.cleanup();
          }, 60);
        } else {
          this.currentSource.stop();
          this.cleanup();
        }
      }
      
      this.isPlaying = false;
    } catch (error) {
      console.warn('Warning during audio stop:', error);
      this.cleanup();
    }
  }

  private cleanup(): void {
    if (this.currentSource) {
      this.currentSource = null;
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(console.warn);
      this.audioContext = null;
    }
    
    this.gainNode = null;
    this.isPlaying = false;
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }
}
