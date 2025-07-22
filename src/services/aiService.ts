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
    id: "gemini-2.5-flash-thinking",
    name: "Gemini 2.5 Flash Thinking",
    apiModel: "provider-6/gemini-2.5-flash-thinking",
    description: "Google's most capable model with thinking",
    badge: "Multimodal"
  },
  {
    id: "deepseek-v3-0324",
    name: "DeepSeek V3",
    apiModel: "provider-3/deepseek-v3-0324",
    description: "Advanced reasoning capabilities",
    badge: "Reasoning"
  },
  {
    id: "grok-4-0709",
    name: "Grok-4",
    apiModel: "provider-3/grok-4-0709",
    description: "Real-time information access",
    badge: "Real-time"
  },
  {
    id: "qwen-2.5-vl-72b",
    name: "Qwen AI",
    apiModel: "provider-5/Qwen/Qwen2.5-VL-72B-Instruct",
    description: "Multilingual AI assistant",
    badge: "Multilingual"
  },
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    apiModel: "provider-3/gpt-4.1-nano",
    description: "OpenAI's compact model",
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
    description: "Enhanced quick generation",
    badge: "Enhanced"
  },
  {
    id: "imagen-4",
    name: "Imagen-4",
    apiModel: "provider-4/imagen-4",
    description: "Google's latest image model",
    badge: "Latest"
  },
  {
    id: "imagen-3",
    name: "Imagen-3",
    apiModel: "provider-4/imagen-3",
    description: "Google's image model",
    badge: "Reliable"
  },
  {
    id: "flux-1-dev",
    name: "Flux.1-dev",
    apiModel: "provider-3/FLUX.1-dev",
    description: "Development image model",
    badge: "Dev"
  },
  {
    id: "flux-kontext-pro",
    name: "Flux-Kontext-Pro",
    apiModel: "provider-1/FLUX.1-kontext-pro",
    description: "Context-aware generation",
    badge: "Pro"
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

export async function generateAIResponse(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  modelId: string
): Promise<string> {
  const model = AI_MODELS.find(m => m.id === modelId) || AI_MODELS[0];

  try {
    const response = await a4fClient.chat.completions.create({
      model: model.apiModel,
      messages,
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
    
    // Use the A4F images endpoint instead of chat completions
    const response = await fetch(`${a4fBaseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${a4fApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: imageModel.apiModel,
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url"
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Image generation response:', data);

    // Check for image URL in response
    if (data.data && data.data[0] && data.data[0].url) {
      console.log('Found image URL:', data.data[0].url);
      return data.data[0].url;
    }

    // Check for b64_json format
    if (data.data && data.data[0] && data.data[0].b64_json) {
      console.log('Found base64 image');
      return `data:image/png;base64,${data.data[0].b64_json}`;
    }

    // If no proper image data found, log the response structure
    console.log('Unexpected response structure:', JSON.stringify(data, null, 2));
    throw new Error('No image data found in response');
    
  } catch (error) {
    console.error('Image generation error:', error);
    throw new Error(`Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function* generateAIResponseStream(
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  modelId: string,
  webMode: boolean = false,
  isImageGeneration: boolean = false
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

    // Enhanced system prompt with function calling support
    const systemPrompt = `You are Cognix, an intelligent AI assistant with real-time web search capabilities.

IMPORTANT: You have access to real-time information through web search results when provided. NEVER say "I don't have real-time access" or "I can't provide current information" - you can and do have access through search results.

${isWebSearchTriggered ? '🌐 **Web search was performed** - Use the provided search results to give accurate, current information. Present it naturally as if you knew it directly.' : ''}

For models that support function calling (GPT-4.1, Grok-4, Gemini-2.5-Flash):
Available functions:
- googleSearch(query: string): Search the web for real-time information

Format your responses using markdown:
- Use **bold** for important terms and emphasis
- Use *italics* for subtle emphasis or definitions  
- Use bullet points for lists
- Use ### for headings
- Include relevant emojis to make responses engaging
- For prices, dates, and specific data, use formatting like **₹1,499** or **Released: March 2024**

Always provide well-structured, formatted responses that are easy to read and understand.`;

    // For models that support function calling, add function definitions
    const supportsFunction = ['gemini-2.5-flash', 'gpt-4.1-nano', 'grok-4-0709'].includes(modelId);
    
    const requestBody: any = {
      model: model.apiModel,
      messages: [
        { role: 'system', content: systemPrompt },
        ...enhancedMessages
      ],
      stream: true,
    };

    // Add function calling for supported models
    if (supportsFunction && !isWebSearchTriggered) {
      requestBody.functions = [
        {
          name: 'googleSearch',
          description: 'Search the web for real-time information, current events, prices, news, or any time-sensitive data',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'The search query to find real-time information'
              }
            },
            required: ['query']
          }
        }
      ];
      requestBody.function_call = 'auto';
    }

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