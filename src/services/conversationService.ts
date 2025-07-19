import OpenAI from 'openai';

const a4fApiKey = "ddc-a4f-2708604e0a7f47ecb013784c4aaeaf40";
const a4fBaseUrl = 'https://api.a4f.co/v1';

const a4fClient = new OpenAI({
  apiKey: a4fApiKey,
  baseURL: a4fBaseUrl,
  dangerouslyAllowBrowser: true
});

export class ConversationService {
  
  async getAIResponse(userMessage: string): Promise<string> {
    try {
      console.log('Getting AI response for:', userMessage.substring(0, 50) + '...');
      
      const response = await a4fClient.chat.completions.create({
        model: "provider-6/gpt-4o-mini-search-preview",
        messages: [
          { role: "user", content: userMessage },
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const aiResponse = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      console.log('AI response received:', aiResponse.substring(0, 50) + '...');
      
      return aiResponse;
    } catch (error) {
      console.error('Error getting AI response:', error);
      throw new Error('Failed to get AI response');
    }
  }
}

export const conversationService = new ConversationService();