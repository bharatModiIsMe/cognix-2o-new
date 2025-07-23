export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration?: string;
}

export const searchYouTubeVideos = async (query: string, maxResults: number = 3): Promise<YouTubeVideo[]> => {
  try {
    const response = await fetch('/api/youtube/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, maxResults }),
    });
    if (!response.ok) throw new Error('Failed to search YouTube videos');
    const detailsData = await response.json();
    return detailsData.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      duration: item.contentDetails.duration
    }));
  } catch (error) {
    console.error('Error searching YouTube videos:', error);
    return [];
  }
};

export const shouldShowVideos = (message: string): boolean => {
  const videoKeywords = [
    'how to', 'tutorial', 'learn', 'guide', 'watch', 'video', 'show me',
    'demonstration', 'example', 'walkthrough', 'step by step', 'explain',
    'course', 'lesson', 'training', 'instruction'
  ];
  
  const lowerMessage = message.toLowerCase();
  return videoKeywords.some(keyword => lowerMessage.includes(keyword));
};