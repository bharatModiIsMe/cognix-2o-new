import OpenAI from 'openai';

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

    const response = await fetch('/api/ai', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Error converting speech to text:', error);
    throw error;
  }
}

export async function textToSpeech(text: string): Promise<string> {
  try {
    console.log('Converting text to speech...');
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'textToSpeech',
        text: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  } catch (error) {
    console.error('Error converting text to speech:', error);
    throw error;
  }
}