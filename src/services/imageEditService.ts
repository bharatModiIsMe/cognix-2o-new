
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
    console.log('🖼️ Starting image editing with context...');
    console.log('Image file:', imageFile.name, 'Size:', imageFile.size);
    console.log('Edit prompt:', prompt);

    // Convert image to base64
    const imageBase64 = await fileToBase64(imageFile);
    
    // Use vision model to understand the image and create editing instructions
    const analysisResponse = await a4fClient.chat.completions.create({
      model: 'provider-6/gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { 
              type: "text", 
              text: `Analyze this image and describe what you see in detail. Then, based on this description, create a detailed prompt for image generation that incorporates the following edit: "${prompt}". 

              The prompt should maintain the original composition, lighting, pose, and overall structure while making only the requested changes. Be very specific about preserving existing elements while describing the edit.`
            },
            {
              type: "image_url",
              image_url: { url: imageBase64 }
            }
          ]
        }
      ],
      max_tokens: 500,
    });

    const analysisContent = analysisResponse.choices[0]?.message?.content;
    if (!analysisContent) {
      throw new Error('Failed to analyze image for editing');
    }

    console.log('📝 Image analysis completed:', analysisContent);

    // Generate new image based on analysis and edit instruction
    const imageResponse = await a4fClient.images.generate({
      model: 'provider-3/FLUX.1-dev',
      prompt: analysisContent,
      n: 1,
      size: "1024x1024",
      response_format: "url"
    });

    const imageUrl = imageResponse.data[0]?.url;
    if (imageUrl) {
      console.log('✅ Image editing successful:', imageUrl);
      return imageUrl;
    }

    throw new Error('No valid image URL received from editing service');
    
  } catch (error) {
    console.error('❌ Image editing failed:', error);
    throw new Error(`Image editing failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try with a more specific prompt.`);
  }
}
