
import OpenAI from 'openai';
import { googleSearch, formatSearchResults, SearchResult } from './googleSearchService';
import { searchYouTubeVideos, shouldShowVideos } from './youtubeService';

// Remove these lines as the API key will now be handled server-side
// const a4fApiKey = "ddc-a4f-2708604e0a7f47ecb013784c4aaeaf40";
// const a4fBaseUrl = 'https://api.a4f.co/v1';

// Remove or comment out the direct OpenAI client initialization
// const a4fClient = new OpenAI({
//   apiKey: a4fApiKey,
//   baseURL: a4fBaseUrl,
//   dangerouslyAllowBrowser: true
// });

// Store user context for memory
let userContext: { name?: string; preferences?: Record<string, any> } = {};

export const updateUserContext = (context: Partial<typeof userContext>) => {
  userContext = { ...userContext, ...context };
};

export const getUserContext = () => userContext;

export interface AIModel {
  id: string;
  name: string;
  apiModel: string;
  description: string;
  badge?: string;
}

export const AI_MODELS: AIModel[] = [
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    apiModel: "provider-1/gemini-2.5-pro",
    description: "Google's most advanced model with thinking capabilities",
    badge: "Pro"
  },
  {
    id: "cognix-2o-web",
    name: "Cognix-2o Web",
    apiModel: "provider-6/gpt-4o-mini-search-preview",
    description: "GPT-4.5 enhanced by Cognix",
    badge: "Web"
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    apiModel: "provider-6/deepseek-r1-uncensored",
    description: "Advanced reasoning and coding capabilities",
    badge: "Reasoning"
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    apiModel: "provider-6/gpt-4o",
    description: "OpenAI's powerful multimodal model",
    badge: "Vision"
  },
  {
    id: "cognix-2o-reasoning",
    name: "Cognix-2o Reasoning",
    apiModel: "provider-1/sonar-reasoning",
    description: "Advanced reasoning capabilities",
    badge: "Reasoning"
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    apiModel: "provider-6/gpt-4.1-mini",
    description: "Fast and efficient AI model",
    badge: "Fast"
  }
];

export const IMAGE_MODELS: AIModel[] = [
  {
    id: "flux-1.1-pro",
    name: "FLUX.1.1-pro",
    apiModel: "provider-1/FLUX.1.1-pro",
    description: "High-quality image generation",
    badge: "Premium"
  },
  {
    id: "flux-1-dev",
    name: "FLUX.1-dev",
    apiModel: "provider-2/FLUX.1-dev",
    description: "Fast image generation",
    badge: "Fast"
  },
  {
    id: "flux-1-kontext-max",
    name: "FLUX.1-kontext-max",
    apiModel: "provider-6/FLUX.1-kontext-max",
    description: "Balanced image generation",
    badge: "Balanced"
  },
  {
    id: "flux-1-schnell",
    name: "Flux.1-schnell",
    apiModel: "provider-1/FLUX.1-schnell",
    description: "Quick image generation",
    badge: "Quick"
  },
  {
    id: "flux-1-schnell-v2",
    name: "Flux.1-schnell-v2",
    apiModel: "provider-2/FLUX.1-schnell-v2",
    description: "Latest quick image generation",
    badge: "Quick"
  },
  {
    id: "imagen-4",
    name: "Imagen-4",
    apiModel: "provider-4/imagen-4",
    description: "Google's latest image model",
    badge: "Google"
  },
  {
    id: "imagen-3",
    name: "Imagen-3",
    apiModel: "provider-4/imagen-3",
    description: "Google's image generation",
    badge: "Google"
  },
  {
    id: "flux-1-dev",
    name: "Flux.1-dev",
    apiModel: "provider-3/FLUX.1-dev",
    description: "Development version of Flux",
    badge: "Dev"
  },
  {
    id: "flux-kontext-pro",
    name: "FLUX Kontext Pro",
    apiModel: "provider-1/FLUX.1-kontext-pro",
    description: "Context-aware image generation",
    badge: "Pro"
  },
  {
    id: "imagen-3.0-generate-002",
    name: "Imagen 3.0 Gen 002",
    apiModel: "provider-3/imagen-3.0-generate-002",
    description: "Imagen 3.0 generation model",
    badge: "Gen"
  },
  {
    id: "imagen-4.0-generate-preview",
    name: "Imagen 4.0 Preview",
    apiModel: "provider-3/imagen-4.0-generate-preview-06-06",
    description: "Imagen 4.0 preview model",
    badge: "Preview"
  }
];

export const IMAGE_EDIT_MODELS: AIModel[] = [
  {
    id: "flux-1-kontext-max",
    name: "FLUX.1-kontext-max",
    apiModel: "provider-6/black-forest-labs-flux-1-kontext-max",
    description: "Advanced image editing with context understanding",
    badge: "Edit"
  }
];

// Function to detect if a query needs real-time web search
function needsWebSearch(query: string): boolean {
  const webSearchTriggers = [
    // Real-time data
    /\b(price|cost|rate|stock|market|bitcoin|crypto|exchange)\b/i,
    /\b(news|today|yesterday|latest|recent|current|breaking|happened)\b/i,
    /\b(weather|temperature|forecast|rain|sunny|cloudy)\b/i,
    /\b(score|match|game|sports|team|won|lost|result)\b/i,
    
    // Product queries
    /\b(buy|purchase|available|store|shop|amazon|flipkart|ebay)\b/i,
    /\b(specs|specification|features|review|rating)\b/i,
    
    // Time-sensitive content
    /\b(movie|showtimes|cinema|tickets|book|release)\b/i,
    /\b(flight|train|bus|schedule|timing|booking)\b/i,
    /\b(restaurant|menu|open|closed|hours)\b/i,
    
    // Location-based
    /\b(near me|nearby|location|address|directions)\b/i,
    /\b(in delhi|in mumbai|in bangalore|in chennai|in kolkata)\b/i,
    
    // Current events
    /\b(celebrity|actor|politician|died|birth|marriage)\b/i,
    /\b(election|vote|winner|result|poll)\b/i,
    
    // Questions about recent data
    /^what('s| is) (the )?(latest|current|today's|recent)/i,
    /^when (did|was|is)/i,
    /^who (is|was|won|died|married)/i,
    /^how much (is|does|cost)/i
  ];
  
  return webSearchTriggers.some(trigger => trigger.test(query));
}

// Helper function to extract better search keywords for YouTube videos
function extractVideoSearchKeywords(query: string): string {
  // Remove common conversational words and extract key terms
  const stopWords = ['how', 'can', 'you', 'please', 'show', 'me', 'tell', 'explain', 'what', 'is', 'are', 'the', 'a', 'an', 'and', 'or', 'but'];
  const words = query.toLowerCase().split(/\s+/);
  
  // Keep important terms that indicate what to search for
  const keywords = words.filter(word => 
    word.length > 2 && 
    !stopWords.includes(word) &&
    !['tutorial', 'video', 'guide'].includes(word) // These will be added back
  );
  
  // Add contextual terms for better results
  const contextTerms = [];
  if (query.toLowerCase().includes('how to') || query.toLowerCase().includes('tutorial')) {
    contextTerms.push('tutorial', 'how to');
  }
  if (query.toLowerCase().includes('learn')) {
    contextTerms.push('beginner guide');
  }
  
  return [...keywords.slice(0, 3), ...contextTerms].join(' ');
}

// Helper function to convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function getAICompletion(messages: Message[], model: AIModel, webSearchResults?: SearchResult[], youtubeVideos?: any[]) {
  try {
    const enhancedMessages = messages.map(msg => {
      if (msg.role === 'user' && webSearchResults && webSearchResults.length > 0) {
        return {
          role: msg.role,
          content: msg.content + "\n\n" + formatSearchResults(webSearchResults)
        };
      }
      return {
        role: msg.role,
        content: msg.content
      };
    });

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chatCompletion', // Indicate the type of request
        model: model.apiModel,
        messages: enhancedMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get AI completion');
    }

    const data = await response.json();
    return data.content || "I apologize, but I couldn't generate a response at this time.";
  } catch (error) {
    console.error('AI API Error:', error);
    return "I'm experiencing some technical difficulties right now. Please try again in a moment.";
  }
}

export async function getAIStream(messages: Message[], model: AIModel, webSearchResults?: SearchResult[], youtubeVideos?: any[]) {
  try {
    const enhancedMessages = messages.map(msg => {
      if (msg.role === 'user' && webSearchResults && webSearchResults.length > 0) {
        return {
          role: msg.role,
          content: msg.content + "\n\n" + formatSearchResults(webSearchResults)
        };
      }
      return {
        role: msg.role,
        content: msg.content
      };
    });

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chatCompletion', // Indicate the type of request
        model: model.apiModel,
        messages: enhancedMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get AI stream');
    }

    return response.body;
  } catch (error) {
    console.error('AI API Stream Error:', error);
    throw error;
  }
}

export async function generateAIResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>, // Changed to match Message interface
  modelId: string,
  images?: File[]
): Promise<string> {
  const model = AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0];

  try {
    const imageUrls: string[] = [];
    if (images && images.length > 0) {
      for (const image of images) {
        const base64 = await fileToBase64(image);
        imageUrls.push(base64);
      }
    }

    const enhancedMessages = messages.map((msg, index) => {
      if (msg.role === 'user' && index === messages.length - 1 && imageUrls.length > 0) {
        return {
          role: 'user' as const,
          content: [
            { type: "text" as const, text: msg.content },
            ...imageUrls.map(url => ({
              type: "image_url" as const,
              image_url: { url }
            }))
          ]
        };
      }
      return {
        role: msg.role,
        content: msg.content
      };
    });

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'chatCompletion', // Indicate the type of request
        model: model.apiModel,
        messages: enhancedMessages,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate AI response');
    }

    const data = await response.json();
    return data.content || "I apologize, but I couldn't generate a response at this time.";
  } catch (error) {
    console.error('AI API Error:', error);
    return "I'm experiencing some technical difficulties right now. Please try again in a moment.";
  }
}

export async function generateImage(prompt: string, modelId: string): Promise<string> {
  const imageModel = IMAGE_MODELS.find(m => m.id === modelId) || IMAGE_MODELS[0];
  
  try {
    console.log('Generating image with model:', imageModel.apiModel, 'prompt:', prompt);
    
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'imageGeneration', // Indicate the type of request
        model: imageModel.apiModel,
        prompt: prompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate image');
    }

    const data = await response.json();
    return data.url; // Assuming the API returns an object with a 'url' field
  } catch (error) {
    console.error('Image generation error:', error);
    return "I'm experiencing some technical difficulties generating the image right now. Please try again in a moment.";
  }
}

export async function editImage(prompt: string, modelId: string, imageUrl: string): Promise<string> {
  const imageEditModel = IMAGE_EDIT_MODELS.find(m => m.id === modelId) || IMAGE_EDIT_MODELS[0];

  try {
    console.log('Editing image with model:', imageEditModel.apiModel, 'prompt:', prompt, 'image URL:', imageUrl);

    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'imageEdit', // Indicate the type of request
        model: imageEditModel.apiModel,
        prompt: prompt,
        imageUrl: imageUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to edit image');
    }

    const data = await response.json();
    return data.url; // Assuming the API returns an object with a 'url' field
  } catch (error) {
    console.error('Image editing error:', error);
    return "I'm experiencing some technical difficulties editing the image right now. Please try again in a moment.";
  }
}

export async function getYoutubeVideoSuggestions(query: string): Promise<any[]> {
  if (!shouldShowVideos(query)) {
    return [];
  }
  const keywords = extractVideoSearchKeywords(query);
  if (!keywords) {
    return [];
  }
  return searchYouTubeVideos(keywords);
}
