import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://api.a4f.co/v1",
  apiKey: "ddc-a4f-2708604e0a7f47ecb013784c4aaeaf40",
  dangerouslyAllowBrowser: true
});

export async function generateVideo(prompt: string): Promise<string> {
  try {
    console.log('Generating video with prompt:', prompt);
    
    const response = await fetch(`${a4fBaseUrl}/video/generation`, {
      model: "provider-6/wan-2.1",
      messages: [
        {
          role: "user",
          content: `Generate a video: ${prompt}`,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = video/generation`.choices[0]?.message?.content;
    if (content) {
      // Check for video URL in response
      const urlMatch = content.match(/https?:\/\/[^\s]+\.(mp4|mov|avi|webm|mkv)/i);
      if (urlMatch) {
        console.log('Found video URL:', urlMatch[0]);
        return urlMatch[0];
      }
      
      // If the content contains any URL, return it
      const anyUrlMatch = content.match(/https?:\/\/[^\s]+/);
      if (anyUrlMatch) {
        console.log('Found URL:', anyUrlMatch[0]);
        return anyUrlMatch[0];
      }
    }

    console.log('Video generation response:', content);
    throw new Error('No video URL found in response');
    
  } catch (error) {
    console.error('Video generation error:', error);
    throw new Error(`Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const shouldGenerateVideo = (message: string): boolean => {
  const videoKeywords = [
    'generate video', 'create video', 'make video', 'video of', 'animate',
    'video generation', 'produce video', 'render video', 'video clip'
  ];
  
  const lowerMessage = message.toLowerCase();
  return videoKeywords.some(keyword => lowerMessage.includes(keyword));
};