
import OpenAI from 'openai';
import { googleSearch, formatSearchResults, SearchResult } from './googleSearchService';
import { searchYouTubeVideos, shouldShowVideos } from './youtubeService';

const a4fApiKey = "ddc-a4f-2708604e0a7f47ecb013784c4aaeaf40";
const a4fBaseUrl = 'https://api.a4f.co/v1';

const a4fClient = new OpenAI({
  apiKey: a4fApiKey,
  baseURL: a4fBaseUrl,
  dangerouslyAllowBrowser: true
});

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
    apiModel: "provider-6/gemini-2.5-flash-thinking",
    description: "Google's most advanced model with thinking capabilities",
    badge: "Pro"
  },
  {
    id: "cognix-2o-web",
    name: "Cognix-2o Web",
    apiModel: "provider-6/gpt-4o-mini-search-preview",
    description: "Web-enabled AI with real-time search capabilities",
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
    badge: "Pro-Model"
  },
  {
    id: "FLUX.1-kontext-max",
    name: "FLUX.1-kontext-max",
    apiModel: "provider-6/FLUX.1-kontext-max",
    description: "Fast image generation",
    badge: "Fast"
  },
  {
    id: "FLUX.1-pro",
    name: "FLUX.1-pro",
    apiModel: "provider-6/FLUX.1-pro",
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
    name: "flux-1-kontext-max",
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

export async function generateAIResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  modelId: string,
  images?: File[]
): Promise<string> {
  const model = AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0];

  try {
    // Convert images to base64 if provided
    const imageUrls: string[] = [];
    if (images && images.length > 0) {
      for (const image of images) {
        const base64 = await fileToBase64(image);
        imageUrls.push(base64);
      }
    }

    // Prepare messages with images for all models
    const enhancedMessages = messages.map((msg, index) => {
      if (msg.role === 'user' && index === messages.length - 1 && imageUrls.length > 0) {
        // Add images to the last user message for all models
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

    const response = await a4fClient.chat.completions.create({
      model: model.apiModel,
      messages: enhancedMessages,
      stream: false,
    });

    return response.choices[0]?.message?.content || "I apologize, but I couldn't generate a response at this time.";
  } catch (error) {
    console.error('AI API Error:', error);
    return "I'm experiencing some technical difficulties right now. Please try again in a moment.";
  }
}

export async function generateImage(prompt: string, modelId: string): Promise<string> {
  const imageModel = IMAGE_MODELS.find(m => m.id === modelId) || IMAGE_MODELS[0];
  
  try {
    console.log('Generating image with model:', imageModel.apiModel, 'prompt:', prompt);
    
    // Use the proper images/generations endpoint like the working image editing
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('model', imageModel.apiModel);
    formData.append('width', '1024');
    formData.append('height', '1024');
    formData.append('num_inference_steps', '20');
    formData.append('guidance_scale', '7.5');
    
    const response = await fetch(`${a4fBaseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${a4fApiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image generation API error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Image generation result:', result);
    
    // Check for image URL in the response (same format as image editing)
    if (result.data && result.data[0] && result.data[0].url) {
      console.log('Found generated image URL:', result.data[0].url);
      return result.data[0].url;
    }
    
    // Check for direct URL in result
    if (result.url) {
      console.log('Found direct image URL:', result.url);
      return result.url;
    }

    console.log('Unexpected response structure:', JSON.stringify(result, null, 2));
    throw new Error('No image data found in response');
    
  } catch (error) {
    console.error('Image generation error:', error);
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function editImage(imageFile: File, prompt: string): Promise<string> {
  try {
    console.log('Editing image with flux-kontext-dev model, prompt:', prompt);
    
    // Get original image dimensions for aspect ratio preservation
    const originalDimensions = await getImageDimensions(imageFile);
    
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Create form data for image editing with enhanced parameters
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('prompt', prompt);
    formData.append('model', 'provider-3/flux-kontext-dev');
    formData.append('width', originalDimensions.width.toString());
    formData.append('height', originalDimensions.height.toString());
    formData.append('strength', '0.8'); // Higher strength for better quality
    formData.append('guidance_scale', '7.5'); // Better guidance for quality
    
    // Use direct API call for image editing
    const response = await fetch(`${a4fBaseUrl}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${a4fApiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Check for image URL in the response
    if (result.data && result.data[0] && result.data[0].url) {
      console.log('Found edited image URL:', result.data[0].url);
      return result.data[0].url;
    }
    
    // If no URL found, try using the flux-kontext-dev model with chat API
    const chatResponse = await a4fClient.chat.completions.create({
      model: "provider-3/flux-kontext-dev",
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: "text" as const, 
              text: `${prompt}. Please maintain the original aspect ratio and dimensions (${originalDimensions.width}x${originalDimensions.height}). Ensure high quality output.` 
            },
            {
              type: "image_url" as const,
              image_url: { url: base64Image }
            }
          ]
        }
      ],
      stream: false,
    });

    const content = chatResponse.choices[0]?.message?.content;
    if (content) {
      // Check for image URL in response
      const urlMatch = content.match(/https?:\/\/[^\s)]+/);
      if (urlMatch) {
        console.log('Found edited image URL from chat API:', urlMatch[0]);
        return urlMatch[0];
      }
      
      // Check for base64 image
      if (content.startsWith('data:image')) {
        console.log('Found edited base64 image');
        return content;
      }
    }

    console.log('No image data found in response, returning original image');
    return URL.createObjectURL(imageFile);
    
  } catch (error) {
    console.error('Image editing error:', error);
    throw new Error(`Failed to edit image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to get image dimensions
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

export async function* generateAIResponseStream(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  modelId: string,
  webMode: boolean = false,
  isImageGeneration: boolean = false,
  images?: File[]
): AsyncGenerator<{ content: string; videos?: any[] }, void, unknown> {
  const model = AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0];

  try {
    // Check if we need to perform web search (automatically or via web mode)
    let searchResults: SearchResult[] = [];
    let enhancedMessages = [...messages];
    let isWebSearchTriggered = false;
    let youtubeVideos: any[] = [];
    
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role === 'user') {
      // Check if query should show YouTube videos and get relevant videos
      if (shouldShowVideos(lastUserMessage.content)) {
        try {
          // Extract more specific keywords for better video search
          const searchQuery = extractVideoSearchKeywords(lastUserMessage.content);
          youtubeVideos = await searchYouTubeVideos(searchQuery, 3);
          console.log('Found YouTube videos:', youtubeVideos.length);
        } catch (error) {
          console.error('YouTube search failed:', error);
        }
      }

      // Automatic detection or manual web mode
      const shouldSearch = webMode || needsWebSearch(lastUserMessage.content);
      
      if (shouldSearch) {
        try {
          yield { content: "🔍 Searching the web for real-time information...\n\n", videos: youtubeVideos };
          searchResults = await googleSearch(lastUserMessage.content);
          if (searchResults.length > 0) {
            isWebSearchTriggered = true;
            const searchContext = formatSearchResults(searchResults);
            enhancedMessages[enhancedMessages.length - 1] = {
              ...lastUserMessage,
              content: `${lastUserMessage.content}\n\n**Web Search Results:**\n${searchContext}\n\nPlease answer the user's question using the above search results. Present the information as if you knew it directly, highlighting key details with proper formatting. Use markdown to emphasize important data like prices, dates, and sources. If specific data isn't found, mention "No exact data found" and provide the most relevant available information. Never say you don't have real-time access - you do have access through these search results.`
            };
          } else {
            yield { content: "No relevant search results found. Providing general information...\n\n", videos: youtubeVideos };
          }
        } catch (error) {
          console.error('Web search failed:', error);
          yield { content: "Web search temporarily unavailable. Providing general information...\n\n", videos: youtubeVideos };
        }
      }
    }

    // Convert images to base64 if provided
    const imageUrls: string[] = [];
    if (images && images.length > 0) {
      for (const image of images) {
        const base64 = await fileToBase64(image);
        imageUrls.push(base64);
      }
    }

    // Add images to the last user message if provided - works for all models
    if (imageUrls.length > 0 && enhancedMessages.length > 0) {
      const lastMessageIndex = enhancedMessages.length - 1;
      const lastMessage = enhancedMessages[lastMessageIndex];
      if (lastMessage.role === 'user') {
        enhancedMessages[lastMessageIndex] = {
          role: 'user',
          content: [
            { type: "text" as const, text: lastMessage.content },
            ...imageUrls.map(url => ({
              type: "image_url" as const,
              image_url: { url }
            }))
          ] as any
        };
      }
    }

    // Extract user name from conversation for memory
    const userName = userContext.name;
    const nameFromMessages = enhancedMessages.find(msg => 
      msg.role === 'user' && 
      /my name is ([a-zA-Z]+)/i.test(msg.content)
    )?.content.match(/my name is ([a-zA-Z]+)/i)?.[1];
    
    if (nameFromMessages && !userName) {
      updateUserContext({ name: nameFromMessages });
    }

    // Enhanced system prompt with user context
    const systemPrompt = `You are Cognix, an intelligent AI assistant with real-time web search capabilities, image understanding, and YouTube video recommendations.

IMPORTANT: You have access to real-time information through web search results when provided. NEVER say "I don't have real-time access" or "I can't provide current information" - you can and do have access through search results.

You can also see and analyze images that users upload. When users share images, describe what you see and help them with any questions about the images.

${userName ? `USER CONTEXT: The user's name is ${userName}. Remember this information throughout the conversation.` : ''}

${isWebSearchTriggered ? '🌐 **Web search was performed** - Use the provided search results to give accurate, current information. Present it naturally as if you knew it directly.' : ''}

${youtubeVideos.length > 0 ? `📹 **YouTube videos found** - Relevant educational videos have been provided above your response. Reference these videos when appropriate in your answer.` : ''}

Format your responses using markdown:
- Use **bold** for important terms and emphasis
- Use *italics* for subtle emphasis or definitions  
- Use bullet points for lists
- Use ### for headings
- Include relevant emojis to make responses engaging
- For prices, dates, and specific data, use formatting like **₹1,499** or **Released: March 2024**

Always provide well-structured, formatted responses that are easy to read and understand.`;

    const requestBody: any = {
      model: model.apiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        ...enhancedMessages
      ],
      stream: true,
    };

    const response = await a4fClient.chat.completions.create(requestBody) as any;

    if (response[Symbol.asyncIterator]) {
      // Streaming response
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield { content, videos: youtubeVideos };
        }
      }
    } else {
      // Non-streaming response
      const content = response.choices[0]?.message?.content;
      if (content) {
        yield { content, videos: youtubeVideos };
      }
    }
  } catch (error) {
    console.error('AI API Stream Error:', error);
    yield { content: "I'm experiencing some technical difficulties right now. Please try again in a moment.", videos: [] };
  }
}
