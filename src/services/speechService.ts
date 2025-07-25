import OpenAI from 'openai';
at about others 
// Remove these lines as the API key will now be handled server-side
// const a4fApiKey = "ddc-a4f-2708604e0a7f47ecb013784c4aaeaf40";
// const a4fBaseUrl = 'https://api.a4f.co/v1';

// Remove or comment out the direct OpenAI client initialization
// const a4fClient = new OpenAI({
//   apiKey: a4fApiKey,
//   baseURL: a4fBaseUrl,
//   dangerouslyAllowBrowser: true
// });

export async function speechToText(audioBlob: Blob): Promise<string> {
  try {
    console.log('Converting speech to text...');
    
    // Create form data with the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'provider-2/whisper-1');
    formData.append('language', 'en');

    // Update this fetch call to use your API route if you want to proxy it as well
    // For now, keeping it direct as it uses formData which might be complex to proxy directly
    // If you want to proxy this, you'd need a separate API route for audio transcriptions.
    const response = await fetch(`https://api.a4f.co/v1/audio/transcriptions`, {
      method: 'POST',
      headers: {
        // 'Authorization': `Bearer ${a4fApiKey}`, // This will be handled by the server if proxied
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
    return 'Audio transcription temporarily unavailable';
  }
}

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  try {
    console.log('Converting text to speech...');
    
    // Replace the direct a4fClient call with a fetch request to your API route
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "provider-3/tts-1", // Or the appropriate model for TTS
        messages: [
          { role: "user", content: text },
        ],
        // You might need to add a flag or endpoint to indicate this is a TTS request
        // For example, a 'type: "tts"' field in the body, and handle it in api/ai.ts
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get TTS completion');
    }

    const data = await response.json();
    const audioUrl = data.choices[0]?.message?.content; // Assuming the API returns the audio URL

    if (audioUrl && audioUrl.startsWith('http')) {
      const audioResponse = await fetch(audioUrl);
      if (audioResponse.ok) {
        return await audioResponse.arrayBuffer();
      }
    }

    // Fallback to browser's built-in speech synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
    
    return new ArrayBuffer(0);
  } catch (error) {
    console.error('Text to speech error:', error);
    
    // Fallback to browser's built-in speech synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
    
    return new ArrayBuffer(0);
  }
}