export async function speechToText(audioBlob: Blob): Promise<string> {
  try {
    // Convert audioBlob to base64
    const arrayBuffer = await audioBlob.arrayBuffer();
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const response = await fetch('/api/a4f/speech-to-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64 }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.text || '';
  } catch (error) {
    console.error('Speech to text error:', error);
    return 'Audio transcription temporarily unavailable';
  }
}

// For textToSpeech, you may need to implement a backend proxy if required. For now, fallback to browser synthesis only.
export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  try {
    // Fallback to browser's built-in speech synthesis
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
    return new ArrayBuffer(0);
  } catch (error) {
    console.error('Text to speech error:', error);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
    return new ArrayBuffer(0);
  }
}