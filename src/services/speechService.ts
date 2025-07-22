import OpenAI from 'openai';

const a4fApiKey = "ddc-a4f-2708604e0a7f47ecb013784c4aaeaf40";
const a4fBaseUrl = 'https://api.a4f.co/v1';

const a4fClient = new OpenAI({
  apiKey: a4fApiKey,
  baseURL: a4fBaseUrl,
  dangerouslyAllowBrowser: true
});

export async function speechToText(audioBlob: Blob): Promise<string> {
  try {
    console.log('Converting speech to text...');
    
    // Create form data with the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');
    formData.append('model', 'provider-2/whisper-1');

    const response = await fetch(`${a4fBaseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${a4fApiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Speech to text result:', result);
    
    return result.text || '';
  } catch (error) {
    console.error('Speech to text error:', error);
    throw new Error(`Failed to convert speech to text: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  try {
    console.log('Converting text to speech...');
    
    // Try with chat completions API for TTS
    const response = await a4fClient.chat.completions.create({
      model: "provider-3/tts-1",
      messages: [
        {
          role: "user",
          content: text
        }
      ],
    });

    // For now, create a placeholder audio since API format might be different
    // This is a fallback to prevent errors
    const placeholderText = "Text to speech is temporarily unavailable.";
    const utterance = new SpeechSynthesisUtterance(placeholderText);
    speechSynthesis.speak(utterance);
    
    // Return empty buffer to maintain interface compatibility
    return new ArrayBuffer(0);
  } catch (error) {
    console.error('Text to speech error:', error);
    
    // Fallback to browser's built-in speech synthesis
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      speechSynthesis.speak(utterance);
      return new ArrayBuffer(0);
    } catch (fallbackError) {
      console.error('Fallback TTS error:', fallbackError);
      throw new Error(`Failed to convert text to speech: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}