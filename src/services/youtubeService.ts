const YOUTUBE_API_KEY = 'AIzaSyDwF0zdzOFVJ5bZ19S2cCQ95F4PVBu9nFY';
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

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
    const searchResponse = await fetch(
      `${YOUTUBE_API_BASE_URL}/search?key=${YOUTUBE_API_KEY}&q=${encodeURIComponent(query)}&part=snippet&type=video&maxResults=${maxResults}&order=relevance`
    );
    
    if (!searchResponse.ok) {
      throw new Error('Failed to search YouTube videos');
    }
    
    const searchData = await searchResponse.json();
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',');
    
    // Get video details including duration
    const detailsResponse = await fetch(
      `${YOUTUBE_API_BASE_URL}/videos?key=${YOUTUBE_API_KEY}&id=${videoIds}&part=contentDetails,snippet`
    );
    
    if (!detailsResponse.ok) {
      throw new Error('Failed to get video details');
    }
    
    const detailsData = await detailsResponse.json();
    
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