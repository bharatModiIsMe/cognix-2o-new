const a4fApiKey = import.meta.env.VITE_A4F_API_KEY;
const a4fBaseUrl = import.meta.env.VITE_A4F_BASE_URL;

export async function generateVideo(prompt: string): Promise<string> {
  try {
    console.log("Generating video with prompt:", prompt);

    const response = await fetch(`${a4fBaseUrl}/video/generation`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${a4fApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "wan-2.1",
        messages: [
          {
            role: "user",
            content: `Generate a video: ${prompt}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Video generation response:", data);

    // Check for video URL in the response data
    if (data.choices && data.choices[0] && data.choices[0].message) {
      const content = data.choices[0].message.content;

      if (content) {
        // Check for video URL in response
        const urlMatch = content.match(
          /https?:\/\/[^\s]+\.(mp4|mov|avi|webm|mkv)/i
        );
        if (urlMatch) {
          console.log("Found video URL:", urlMatch[0]);
          return urlMatch[0];
        }

        // If the content contains any URL, return it
        const anyUrlMatch = content.match(/https?:\/\/[^\s]+/);
        if (anyUrlMatch) {
          console.log("Found URL:", anyUrlMatch[0]);
          return anyUrlMatch[0];
        }
      }
    }

    // Check if there's a direct URL in the response
    if (data.url) {
      console.log("Found direct video URL:", data.url);
      return data.url;
    }

    console.log("Video generation response:", data);
    throw new Error("No video URL found in response");
  } catch (error) {
    console.error("Video generation error:", error);
    throw new Error(
      `Failed to generate video: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export const shouldGenerateVideo = (message: string): boolean => {
  const videoKeywords = [
    "generate video",
    "create video",
    "make video",
    "video of",
    "animate",
    "video generation",
    "produce video",
    "render video",
    "video clip",
  ];

  const lowerMessage = message.toLowerCase();
  return videoKeywords.some((keyword) => lowerMessage.includes(keyword));
};
