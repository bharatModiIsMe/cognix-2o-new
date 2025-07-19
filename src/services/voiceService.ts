
import OpenAI from 'openai';
import { generateAIResponseStream } from './aiService';

const a4fApiKey = "ddc-a4f-2708604e0a7f47ecb013784c4aaeaf40";
const a4fBaseUrl = 'https://api.a4f.co/v1';

const a4fClient = new OpenAI({
  apiKey: a4fApiKey,
  baseURL: a4fBaseUrl,
  dangerouslyAllowBrowser: true
});

// Re-export the audio classes from the audio service
export { VoiceRecorder, AudioPlayer } from './voiceAudioService';

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    console.log('🎯 Starting transcription...', {
      size: audioBlob.size,
      type: audioBlob.type
    });
    
    if (audioBlob.size < 500) {
      throw new Error('Audio file too small - please speak for at least 1 second');
    }
    
    // Create a proper File object with correct extension based on MIME type
    let fileName = 'audio.webm';
    if (audioBlob.type.includes('mp4')) {
      fileName = 'audio.mp4';
    } else if (audioBlob.type.includes('wav')) {
      fileName = 'audio.wav';
    }
    
    const audioFile = new File([audioBlob], fileName, { 
      type: audioBlob.type 
    });

    console.log('📤 Sending to transcription service:', fileName);

    const response = await a4fClient.audio.transcriptions.create({
      file: audioFile,
      model: 'provider-2/whisper-1',
      language: 'en',
      temperature: 0.1, // Slightly higher for better accuracy
      prompt: "This is a clear voice message. Please transcribe accurately including proper punctuation."
    });

    const transcribedText = response.text?.trim() || '';
    console.log('✅ Transcription successful:', transcribedText);
    
    if (!transcribedText || transcribedText.length < 2) {
      throw new Error('No clear speech detected. Please speak more clearly and try again.');
    }
    
    return transcribedText;
  } catch (error) {
    console.error('❌ Transcription error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('audio file too small')) {
        throw new Error('Recording too short. Please speak for at least 2 seconds.');
      } else if (error.message.includes('network')) {
        throw new Error('Network error during transcription. Please check your connection.');
      }
    }
    
    throw new Error('Failed to transcribe audio. Please speak clearly and try again.');
  }
}

export async function synthesizeSpeech(text: string): Promise<ArrayBuffer> {
  try {
    console.log('🗣️ Synthesizing speech for text length:', text.length);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text provided for speech synthesis');
    }
    
    // Clean and optimize text for speech
    const cleanText = text
      .replace(/[*_~`#]/g, '') // Remove markdown
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\n{2,}/g, '. ') // Replace double newlines with periods
      .replace(/\n/g, ' ') // Replace single newlines with spaces
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single
      .replace(/([.!?])\s*([.!?])/g, '$1 ') // Fix multiple punctuation
      .trim();
    
    // Truncate if too long (TTS services have limits)
    let finalText = cleanText;
    if (cleanText.length > 3000) {
      const truncated = cleanText.substring(0, 3000);
      const lastSentence = truncated.lastIndexOf('.');
      finalText = lastSentence > 0 ? truncated.substring(0, lastSentence + 1) : truncated;
      console.log('📝 Text truncated for TTS, final length:', finalText.length);
    }
    
    console.log('📤 Sending to TTS service...');
    
    const response = await a4fClient.audio.speech.create({
      model: 'provider-3/tts-1',
      voice: 'alloy', // Good balance of clarity and naturalness
      input: finalText,
      speed: 1.0,
      response_format: 'mp3',
    });

    const audioBuffer = await response.arrayBuffer();
    
    console.log('🔊 Speech synthesis successful:', {
      inputLength: finalText.length,
      outputSize: audioBuffer.byteLength,
      duration: 'estimated ~' + Math.round(finalText.length / 15) + 's'
    });
    
    if (audioBuffer.byteLength === 0) {
      throw new Error('Empty audio response from speech synthesis');
    }
    
    return audioBuffer;
  } catch (error) {
    console.error('❌ Speech synthesis error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error during speech synthesis. Please try again.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
    }
    
    throw new Error('Failed to synthesize speech. Please try again.');
  }
}

export async function processVoiceMessage(text: string): Promise<string> {
  try {
    console.log('🤖 Processing voice message:', text);
    
    if (!text || text.trim().length === 0) {
      throw new Error('No text to process');
    }
    
    const messages = [{ 
      role: 'user' as const, 
      content: `${text}

Please provide a clear, natural, conversational response suitable for voice interaction. Keep it engaging but concise (under 200 words) since this will be spoken aloud. Use simple language, avoid complex formatting, lists, or technical jargon. Speak as if you're having a friendly conversation.` 
    }];
    
    console.log('📤 Sending to AI service...');
    
    const stream = generateAIResponseStream(messages, "gemini-2.0-flash-exp", false, false);
    
    let fullResponse = '';
    let chunkCount = 0;
    
    for await (const chunk of stream) {
      fullResponse += chunk;
      chunkCount++;
      
      // Log progress for long responses
      if (chunkCount % 10 === 0) {
        console.log('📝 AI response progress:', fullResponse.length, 'characters');
      }
    }
    
    if (!fullResponse.trim()) {
      throw new Error('AI returned empty response');
    }
    
    // Clean response for voice output
    const cleanResponse = fullResponse
      .replace(/[*_~`#]/g, '') // Remove markdown
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\n{2,}/g, '. ') // Replace double newlines with periods
      .replace(/\n/g, ' ') // Replace single newlines with spaces
      .replace(/\s{2,}/g, ' ') // Replace multiple spaces with single
      .replace(/([.!?])\s*([.!?])/g, '$1 ') // Fix multiple punctuation
      .trim();
    
    console.log('✅ AI response processed for voice:', {
      originalLength: fullResponse.length,
      cleanedLength: cleanResponse.length,
      preview: cleanResponse.substring(0, 100) + '...'
    });
    
    return cleanResponse;
  } catch (error) {
    console.error('❌ Error processing voice message:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error getting AI response. Please try again.');
      } else if (error.message.includes('rate limit')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
    }
    
    throw new Error('Failed to get AI response. Please try again.');
  }
}

// Export the image editing function
export { editImageWithContext as editImage } from './imageEditService';
