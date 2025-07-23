export async function generateVideo(prompt: string): Promise<string> {
  try {
    const response = await fetch('/api/a4f/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'wan-2.1',
        messages: [
          { role: 'user', content: `Generate a video: ${prompt}` },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (content) {
      const urlMatch = content.match(/https?:\/\/[^\s]+\.(mp4|mov|avi|webm|mkv)/i);
      if (urlMatch) return urlMatch[0];
      const anyUrlMatch = content.match(/https?:\/\/[^\s]+/);
      if (anyUrlMatch) return anyUrlMatch[0];
    }
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