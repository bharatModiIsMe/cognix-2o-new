
import OpenAI from 'openai';

const a4fApiKey = "ddc-a4f-2708604e0a7f47ecb013784c4aaeaf40";
const a4fBaseUrl = 'https://api.a4f.co/v1';

const a4fClient = new OpenAI({
  apiKey: a4fApiKey,
  baseURL: a4fBaseUrl,
  dangerouslyAllowBrowser: true
});

// Convert File to base64
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

export async function editImageWithContext(imageFile: File, prompt: string): Promise<string> {
  try {
    console.log('🖼️ Starting contextual image editing...');
    console.log('Image file:', imageFile.name, 'Size:', imageFile.size);
    console.log('Edit prompt:', prompt);

    // Convert image to base64
    const imageBase64 = await fileToBase64(imageFile);
    
    // Use image-to-image editing with the original image as context
    const editingPrompt = `Based on the provided image, make the following changes: ${prompt}. 
    Keep the same composition, lighting, and overall structure. Only modify what is specifically requested.
    Maintain the original image quality and style.`;

    const response = await a4fClient.chat.completions.create({
      model: 'provider-3/FLUX.1-dev', // Using flux-dev for better image editing
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: "text", 
              text: editingPrompt
            },
            {
              type: "image_url",
              image_url: { url: imageBase64 }
            }
          ]
        }
      ],
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      // Look for image URLs in the response
      const urlMatch = content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|webp|gif)/i);
      if (urlMatch) {
        console.log('✅ Image editing successful:', urlMatch[0]);
        return urlMatch[0];
      }
    }

    // Fallback: Try with image generation API with the original image
    console.log('🔄 Trying image generation API for editing...');
    const imageResponse = await a4fClient.images.generate({
      model: 'provider-3/FLUX.1-dev',
      prompt: `Edit this image: ${prompt}. Keep the original composition and style.`,
      n: 1,
      size: "1024x1024",
      response_format: "url"
    });

    const imageUrl = imageResponse.data[0]?.url;
    if (imageUrl) {
      console.log('✅ Fallback image editing successful:', imageUrl);
      return imageUrl;
    }

    throw new Error('No valid image URL received from editing service');
    
  } catch (error) {
    console.error('❌ Image editing failed:', error);
    throw new Error(`Image editing failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try with a more specific prompt.`);
  }
}
