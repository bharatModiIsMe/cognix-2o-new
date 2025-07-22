
import OpenAI from 'openai';
import { googleSearch, formatSearchResults, SearchResult } from './googleSearchService';

const a4fApiKey = "ddc-a4f-2708604e0a7f47ecb013784c4aaeaf40";
const a4fBaseUrl = 'https://api.a4f.co/v1';

const a4fClient = new OpenAI({
  apiKey: a4fApiKey,
  baseURL: a4fBaseUrl,
  dangerouslyAllowBrowser: true
});

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
    apiModel: "provider-3/deepseek-v3-0324",
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
    id: "sana-1.5-flash",
    name: "Sana-1.5-flash",
    apiModel: "provider-6/sana-1.5-flash",
    description: "Fast image generation",
    badge: "Fast"
  },
  {
    id: "sana-1.5",
    name: "Sana-1.5",
    apiModel: "provider-6/sana-1.5",
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
    id: "flux-kontext-dev",
    name: "FLUX Kontext Dev",
    apiModel: "provider-3/flux-kontext-dev",
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
    
    const response = await a4fClient.chat.completions.create({
      model: imageModel.apiModel,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false,
    });

    // For image generation, the response content should contain the image URL or data
    const content = response.choices[0]?.message?.content;
    if (content) {
      // If the content contains a URL, return it
      if (content.includes('http')) {
        const urlMatch = content.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          console.log('Found image URL:', urlMatch[0]);
          return urlMatch[0];
        }
      }
      // If it's base64 data, return it
      if (content.startsWith('data:image')) {
        console.log('Found base64 image');
        return content;
      }
    }

    console.log('Unexpected response structure:', JSON.stringify(response, null, 2));
    throw new Error('No image data found in response');
    
  } catch (error) {
    console.error('Image generation error:', error);
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function editImage(imageFile: File, prompt: string): Promise<string> {
  try {
    console.log('Editing image with flux-kontext-dev model, prompt:', prompt);
    
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Use A4F flux-kontext-dev model directly for image editing
    const response = await a4fClient.chat.completions.create({
      model: "provider-3/flux-kontext-dev",
      messages: [
        {
          role: 'user',
          content: [
            { type: "text" as const, text: prompt },
            {
              type: "image_url" as const,
              image_url: { url: base64Image }
            }
          ]
        }
      ],
      stream: false,
    });

    // For image editing, the response content should contain the edited image URL or data
    const content = response.choices[0]?.message?.content;
    if (content) {
      // If the content contains a URL, return it
      if (content.includes('http')) {
        const urlMatch = content.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          console.log('Found edited image URL:', urlMatch[0]);
          return urlMatch[0];
        }
      }
      // If it's base64 data, return it
      if (content.startsWith('data:image')) {
        console.log('Found edited base64 image');
        return content;
      }
    }

    console.log('Unexpected edit response structure:', JSON.stringify(response, null, 2));
    throw new Error('No edited image data found in response');
    
  } catch (error) {
    console.error('Image editing error:', error);
    throw new Error(`Failed to edit image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function* generateAIResponseStream(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  modelId: string,
  webMode: boolean = false,
  isImageGeneration: boolean = false,
  images?: File[]
): AsyncGenerator<string, void, unknown> {
  const model = AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0];

  try {
    // Check if we need to perform web search (automatically or via web mode)
    let searchResults: SearchResult[] = [];
    let enhancedMessages = [...messages];
    let isWebSearchTriggered = false;
    
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role === 'user') {
      // Automatic detection or manual web mode
      const shouldSearch = webMode || needsWebSearch(lastUserMessage.content);
      
      if (shouldSearch) {
        try {
          yield "🔍 Searching the web for real-time information...\n\n";
          searchResults = await googleSearch(lastUserMessage.content);
          if (searchResults.length > 0) {
            isWebSearchTriggered = true;
            const searchContext = formatSearchResults(searchResults);
            enhancedMessages[enhancedMessages.length - 1] = {
              ...lastUserMessage,
              content: `${lastUserMessage.content}\n\n**Web Search Results:**\n${searchContext}\n\nPlease answer the user's question using the above search results. Present the information as if you knew it directly, highlighting key details with proper formatting. Use markdown to emphasize important data like prices, dates, and sources. If specific data isn't found, mention "No exact data found" and provide the most relevant available information. Never say you don't have real-time access - you do have access through these search results.`
            };
          } else {
            yield "No relevant search results found. Providing general information...\n\n";
          }
        } catch (error) {
          console.error('Web search failed:', error);
          yield "Web search temporarily unavailable. Providing general information...\n\n";
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

    // Enhanced system prompt
    const systemPrompt = `You are Cognix, an intelligent AI assistant with real-time web search capabilities and image understanding.

IMPORTANT: You have access to real-time information through web search results when provided. NEVER say "I don't have real-time access" or "I can't provide current information" - you can and do have access through search results.

You can also see and analyze images that users upload. When users share images, describe what you see and help them with any questions about the images.

${isWebSearchTriggered ? '🌐 **Web search was performed** - Use the provided search results to give accurate, current information. Present it naturally as if you knew it directly.' : ''}

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
          yield content;
        }
      }
    } else {
      // Non-streaming response
      const content = response.choices[0]?.message?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error('AI API Stream Error:', error);
    yield "I'm experiencing some technical difficulties right now. Please try again in a moment.";
  }
}
