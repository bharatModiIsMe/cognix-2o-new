import OpenAI from "openai";

const a4fApiKey = import.meta.env.VITE_A4F_API_KEY;
const a4fBaseUrl = import.meta.env.VITE_A4F_BASE_URL;

const a4fClient = new OpenAI({
  apiKey: a4fApiKey,
  baseURL: a4fBaseUrl,
  dangerouslyAllowBrowser: true,
});

export async function speechToText(audioBlob: Blob): Promise<string> {
  try {
    console.log("Converting speech to text...");

    // Create form data with the audio file
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.wav");
    formData.append("model", "provider-2/whisper-1");
    formData.append("language", "en");

    const response = await fetch(`${a4fBaseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${a4fApiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Speech to text result:", result);

    return result.text || "";
  } catch (error) {
    console.error("Speech to text error:", error);
    return "Audio transcription temporarily unavailable";
  }
}

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  try {
    console.log("Converting text to speech...");

    const completion = await a4fClient.chat.completions.create({
      model: "provider-3/tts-1",
      messages: [{ role: "user", content: text }],
    });

    const audioUrl = completion.choices[0]?.message?.content;
    if (audioUrl && audioUrl.startsWith("http")) {
      const response = await fetch(audioUrl);
      if (response.ok) {
        return await response.arrayBuffer();
      }
    }

    // Fallback to browser's built-in speech synthesis
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }

    return new ArrayBuffer(0);
  } catch (error) {
    console.error("Text to speech error:", error);

    // Fallback to browser's built-in speech synthesis
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }

    return new ArrayBuffer(0);
  }
}
