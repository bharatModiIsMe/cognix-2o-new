import OpenAI from 'openai';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Ensure your API key is stored as an environment variable on Vercel
  const a4fApiKey = process.env.A4F_API_KEY;
  const a4fBaseUrl = 'https://api.a4f.co/v1';

  if (!a4fApiKey) {
    return res.status(500).json({ message: 'A4F_API_KEY is not set in environment variables.' });
  }

  try {
    const { type, messages, model, prompt, n, size, image, mask, instruction, input, voice } = req.body;

    const openai = new OpenAI({
      apiKey: a4fApiKey,
      baseURL: a4fBaseUrl,
    });

    let response;

    switch (type) {
      case 'chatCompletion':
        response = await openai.chat.completions.create({
          model: model,
          messages: messages,
          stream: true, // Assuming streaming is desired for chat completions
        });
        // For streaming, we need to pipe the response directly
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
        });
        for await (const chunk of response) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        res.end();
        return;
      case 'imageGeneration':
        response = await openai.images.generate({
          model: model,
          prompt: prompt,
          n: n,
          size: size,
        });
        break;
      case 'imageEdit':
        response = await openai.images.edit({
          model: model,
          image: image,
          mask: mask,
          prompt: prompt,
          n: n,
          size: size,
        });
        break;
      case 'textToSpeech':
        response = await openai.audio.speech.create({
          model: model,
          voice: voice,
          input: input,
        });
        // For audio, send the buffer directly
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
        });
        response.pipe(res);
        return;
      default:
        return res.status(400).json({ message: 'Invalid request type' });
    }

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error calling A4F API:', error.message);
    res.status(500).json({ message: 'Error processing request', error: error.message });
  }
}