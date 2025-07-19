import OpenAI from 'openai';
import { googleSearch, formatSearchResults, SearchResult } from './googleSearchService';
import { ImageService } from './imageService';

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
  supportsVision?: boolean;
}

export const AI_MODELS: AIModel[] = [
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    apiModel: "provider-6/gemini-2.5-flash-thinking",
    description: "Google's most advanced model with thinking capabilities",
    badge: "Pro",
    supportsVision: true
  },
  {
    id: "cognix-2o-web",
    name: "Cognix-2o Web",
    apiModel: "provider-6/gpt-4o-mini-search-preview",
    description: "Web-enabled AI with real-time search capabilities",
    badge: "Web",
    supportsVision: true
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    apiModel: "provider-3/deepseek-v3-0324",
    description: "Advanced reasoning and coding capabilities",
    badge: "Reasoning",
    supportsVision: false
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    apiModel: "provider-6/gpt-4o",
    description: "OpenAI's powerful multimodal model",
    badge: "Vision",
    supportsVision: true
  },
  {
    id: "cognix-2o-reasoning",
    name: "Cognix-2o Reasoning",
    apiModel: "provider-1/sonar-reasoning",
    description: "Advanced reasoning capabilities",
    badge: "Reasoning",
    supportsVision: false
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    apiModel: "provider-6/gpt-4.1-mini",
    description: "Fast and efficient AI model",
    badge: "Fast",
    supportsVision: true
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

export async function generateImage(prompt: string, modelId: string): Promise<string> {
  const imageModel = IMAGE_MODELS.find(m => m.id === modelId) || IMAGE_MODELS[0];
  
  try {
    console.log('AIService: Generating image with model:', imageModel.apiModel, 'prompt:', prompt);
    
    const response = await a4fClient.images.generate({
      model: imageModel.apiModel,
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    });

    if (response.data && response.data[0] && response.data[0].url) {
      console.log('AIService: Image generated successfully:', response.data[0].url);
      return response.data[0].url;
    }

    // Fallback to chat completions if images endpoint doesn't work
    console.log('AIService: Falling back to chat completions for image generation');
    const chatResponse = await a4fClient.chat.completions.create({
      model: imageModel.apiModel,
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    });

    const content = chatResponse.choices[0]?.message?.content;
    if (content) {
      if (content.includes('http')) {
        const urlMatch = content.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          console.log('AIService: Found image URL in chat response:', urlMatch[0]);
          return urlMatch[0];
        }
      }
      if (content.startsWith('data:image')) {
        console.log('AIService: Found base64 image in chat response');
        return content;
      }
    }

    throw new Error('No image data found in response');
    
  } catch (error) {
    console.error('AIService: Image generation error:', error);
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function editImage(imageUrl: string, prompt: string): Promise<string> {
  const editModel = IMAGE_EDIT_MODELS[0];
  
  try {
    console.log('AIService: Editing image with model:', editModel.apiModel, 'prompt:', prompt);
    
    // Convert image URL to base64
    const base64Image = await ImageService.urlToBase64(imageUrl);
    console.log('AIService: Image converted to base64 for editing');
    
    const response = await a4fClient.chat.completions.create({
      model: editModel.apiModel,
      messages: [
        {
          role: 'user',
          content: [
            { type: "text" as const, text: `Edit this image: ${prompt}` },
            {
              type: "image_url" as const,
              image_url: { url: base64Image }
            }
          ]
        }
      ],
      stream: false,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      if (content.includes('http')) {
        const urlMatch = content.match(/https?:\/\/[^\s]+/);
        if (urlMatch) {
          console.log('AIService: Found edited image URL:', urlMatch[0]);
          return urlMatch[0];
        }
      }
      if (content.startsWith('data:image')) {
        console.log('AIService: Found edited base64 image');
        return content;
      }
    }

    console.log('AIService: Unexpected edit response structure:', JSON.stringify(response, null, 2));
    throw new Error('No edited image data found in response');
    
  } catch (error) {
    console.error('AIService: Image editing error:', error);
    throw new Error(`Failed to edit image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function* generateAIResponseStream(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  modelId: string,
  webMode: boolean = false,
  imageUrls: string[] = []
): AsyncGenerator<string, void, unknown> {
  const model = AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0];

  try {
    console.log('AIService: generateAIResponseStream called with:', {
      modelId,
      webMode,
      imagesCount: imageUrls.length,
      messagesCount: messages.length,
      modelSupportsVision: model.supportsVision,
      imageUrls: imageUrls.slice(0, 2) // Log first 2 URLs for debugging
    });

    // Check if we need to perform web search
    let searchResults: SearchResult[] = [];
    let enhancedMessages = [...messages];
    let isWebSearchTriggered = false;
    
    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage?.role === 'user') {
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
          console.error('AIService: Web search failed:', error);
          yield "Web search temporarily unavailable. Providing general information...\n\n";
        }
      }
    }

    // Prepare messages with images for vision-capable models
    let finalMessages;
    
    if (imageUrls.length > 0 && model.supportsVision) {
      console.log('AIService: Adding images to vision-capable model:', model.name);
      
      // Convert image URLs to base64
      const base64Images: string[] = [];
      for (const url of imageUrls) {
        try {
          console.log('AIService: Converting image URL to base64:', url.substring(0, 50) + '...');
          const base64 = await ImageService.urlToBase64(url);
          base64Images.push(base64);
          console.log('AIService: Successfully converted image URL to base64');
        } catch (error) {
          console.error('AIService: Error converting image URL to base64:', error);
        }
      }

      if (base64Images.length > 0 && enhancedMessages.length > 0) {
        const lastMessageIndex = enhancedMessages.length - 1;
        const lastMessage = enhancedMessages[lastMessageIndex];
        if (lastMessage.role === 'user') {
          finalMessages = [
            ...enhancedMessages.slice(0, -1),
            {
              role: 'user' as const,
              content: [
                { type: "text" as const, text: lastMessage.content },
                ...base64Images.map(url => ({
                  type: "image_url" as const,
                  image_url: { url }
                }))
              ]
            }
          ];
          console.log('AIService: Images added to user message successfully, count:', base64Images.length);
        } else {
          finalMessages = enhancedMessages;
        }
      } else {
        finalMessages = enhancedMessages;
        console.log('AIService: No base64 images to add or no messages');
      }
    } else {
      if (imageUrls.length > 0 && !model.supportsVision) {
        console.log('AIService: Model does not support vision, showing warning');
        yield "⚠️ **Note:** The selected model doesn't support image analysis. Please choose a vision-capable model like GPT-4o or Gemini for image analysis.\n\n";
      }
      finalMessages = enhancedMessages;
    }

    // Enhanced system prompt
    const systemPrompt = `You are Cognix, an intelligent AI assistant with real-time web search capabilities and image understanding.

IMPORTANT: You have access to real-time information through web search results when provided. NEVER say "I don't have real-time access" or "I can't provide current information" - you can and do have access through search results.

${model.supportsVision ? 'You can also see and analyze images that users upload. When users share images, describe what you see and help them with any questions about the images. Be detailed and helpful in your image analysis.' : ''}

${isWebSearchTriggered ? '🌐 **Web search was performed** - Use the provided search results to give accurate, current information. Present it naturally as if you knew it directly.' : ''}

${imageUrls.length > 0 && model.supportsVision ? `🖼️ **Images provided (${imageUrls.length})** - Analyze the uploaded images carefully and provide detailed, helpful responses about what you see.` : ''}

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
        ...finalMessages
      ],
      stream: true,
    };

    console.log('AIService: Making API request to:', model.apiModel, 'with', requestBody.messages.length, 'messages');

    const response = await a4fClient.chat.completions.create(requestBody) as any;

    if (response[Symbol.asyncIterator]) {
      console.log('AIService: Processing streaming response...');
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
      console.log('AIService: Streaming response completed');
    } else {
      console.log('AIService: Processing non-streaming response...');
      const content = response.choices[0]?.message?.content;
      if (content) {
        yield content;
      }
    }
  } catch (error) {
    console.error('AIService: AI API Stream Error:', error);
    yield "I'm experiencing some technical difficulties right now. Please try again in a moment.";
  }
}
