
import OpenAI from 'openai';
import { generateAIResponseStream } from './aiService';
import { editImageWithContext } from './imageEditService';

const a4fApiKey = "ddc-a4f-2708604e0a7f47ecb013784c4aaeaf40";
const a4fBaseUrl = 'https://api.a4f.co/v1';

const a4fClient = new OpenAI({
  apiKey: a4fApiKey,
  baseURL: a4fBaseUrl,
  dangerouslyAllowBrowser: true
});

// Re-export the audio classes from the new service
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
    
    // Convert blob to File for the API
    const audioFile = new File([audioBlob], 'audio.webm', { 
      type: audioBlob.type 
    });

    const response = await a4fClient.audio.transcriptions.create({
      file: audioFile,
      model: 'provider-2/whisper-1',
      language: 'en',
      temperature: 0.0,
      prompt: "Transcribe the following audio clearly and accurately."
    });

    const transcribedText = response.text?.trim() || '';
    console.log('✅ Transcription successful:', transcribedText);
    
    if (!transcribedText || transcribedText.length < 2) {
      throw new Error('No clear speech detected. Please speak more clearly and try again.');
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
      .replace(/[*_~`#]/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    
    if (cleanText.length > 4000) {
      // Truncate very long text
      const truncated = cleanText.substring(0, 4000);
      const lastSentence = truncated.lastIndexOf('.');
      const finalText = lastSentence > 0 ? truncated.substring(0, lastSentence + 1) : truncated;
      console.log('Text truncated for speech synthesis');
    }
    
    const response = await a4fClient.audio.speech.create({
      model: 'provider-3/tts-1',
      voice: 'alloy',
      input: cleanText.length > 4000 ? cleanText.substring(0, 4000) : cleanText,
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

export async function processVoiceMessage(text: string): Promise<string> {
  try {
    console.log('🤖 Processing voice message:', text);
    
    const messages = [{ 
      role: 'user' as const, 
      content: `${text}

Please provide a clear, conversational response suitable for voice interaction. Keep it natural, engaging, and concise (under 150 words) since this will be spoken aloud. Use simple language and avoid complex formatting or lists.` 
    }];
    
    const stream = generateAIResponseStream(messages, "gemini-2.5-pro", false, false);
    
    let fullResponse = '';
    for await (const chunk of stream) {
      fullResponse += chunk;
    }
    
    // Clean response for voice
    const cleanResponse = fullResponse
      .replace(/[*_~`#]/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();
    
    console.log('✅ AI response processed for voice:', cleanResponse.substring(0, 100) + '...');
    return cleanResponse;
  } catch (error) {
    console.error('❌ Error processing voice message:', error);
    throw new Error('Failed to process your request. Please try again.');
  }
}

// Export the image editing function
export { editImageWithContext as editImage };
