import OpenAI from 'openai';
at about others 


export async function speechToText(audioBlob: Blob): Promise<string> {
  try {
    console.log('Converting speech to text...');
    
    // Create form data with the audio file
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.wav');
    formData.append('model', 'provider-2/whisper-1');
    formData.append('language', 'en');
    formData.append('type', 'audioTranscription'); // Add type for server-side routing

    // Update this fetch call to use your API route
    const response = await fetch('/api/ai', {
      method: 'POST',
      body: formData // FormData will be sent as multipart/form-data automatically
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
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
        type: 'textToSpeech', // Indicate this is a TTS request
        model: "provider-3/tts-1", // Or the appropriate model for TTS
        input: text, // Send the text as 'input'
        voice: "alloy", // Specify a voice, e.g., 'alloy', 'nova', 'shimmer', 'echo', 'fable', 'onyx'
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get TTS completion');
    }

    // The server will now return the audio stream directly, not a URL
    const audioBlob = await response.blob();
    const arrayBuffer = await audioBlob.arrayBuffer();

    return arrayBuffer;
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