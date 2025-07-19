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
    console.log('🖼️ Starting image editing with flux-kontext-dev...');
    console.log('Image file:', imageFile.name, 'Size:', imageFile.size);
    console.log('Edit prompt:', prompt);

    // Convert image to base64
    const imageBase64 = await fileToBase64(imageFile);
    
    // Use flux-kontext-dev for direct image editing
    const editResponse = await a4fClient.chat.completions.create({
      model: 'provider-3/flux-kontext-dev',
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: "text", 
              text: `Edit this image: ${prompt}. Keep the original composition and style while making the requested changes.`
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

    const editResult = editResponse.choices[0]?.message?.content;
    if (!editResult) {
      throw new Error('Failed to get image edit result');
    }

    console.log('✅ Image editing with flux-kontext-dev successful');
    
    // If the result contains an image URL, return it
    // Otherwise, fall back to generating a new image based on the edit
    if (editResult.includes('http')) {
      const urlMatch = editResult.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        return urlMatch[0];
      }
    }

    // Fallback: Generate image based on analysis
    const imageResponse = await a4fClient.images.generate({
      model: 'provider-3/FLUX.1-dev',
      prompt: `${editResult}. High quality, detailed image.`,
      n: 1,
      size: "1024x1024",
      response_format: "url"
    });

    const imageUrl = imageResponse.data[0]?.url;
    if (imageUrl) {
      console.log('✅ Fallback image generation successful:', imageUrl);
      return imageUrl;
    }

    throw new Error('No valid image URL received from editing service');
    
  } catch (error) {
    console.error('❌ Image editing failed:', error);
    throw new Error(`Image editing failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try with a more specific prompt.`);
  }
}
