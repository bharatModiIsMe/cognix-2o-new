export interface SearchResult {
  title: string;
  snippet: string;
  link: string;
  displayLink: string;
}

export interface GoogleSearchResponse {
  items?: Array<{
    title: string;
    snippet: string;
    link: string;
    displayLink: string;
  }>;
}

const GOOGLE_API_KEY = "AIzaSyBSv1EpREIhK5ETdcY_Y2-55zTsWuopazU";
const GOOGLE_CSE_ID = "62765f47bd1a64d7c";

export async function googleSearch(query: string): Promise<SearchResult[]> {
  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(query)}&num=5`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }
    
    const data: GoogleSearchResponse = await response.json();
    
    if (!data.items || data.items.length === 0) {
      return [];
    }
    
    return data.items.slice(0, 5).map(item => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link,
      displayLink: item.displayLink
    }));
  } catch (error) {
    console.error('Google Search Error:', error);
    throw new Error('Failed to perform web search. Please try again.');
  }
}

export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "No search results found.";
  }
  
  return results.map((result, index) => 
    `**${index + 1}. ${result.title}**\n` +
    `${result.snippet}\n` +
    `*Source: ${result.displayLink}*\n` +
    `[Read more](${result.link})\n`
  ).join('\n');
}