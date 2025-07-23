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

export async function googleSearch(query: string): Promise<SearchResult[]> {
  try {
    const response = await fetch('/api/google/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) throw new Error(`Google Search API error: ${response.status}`);
    const data: GoogleSearchResponse = await response.json();
    if (!data.items || data.items.length === 0) return [];
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