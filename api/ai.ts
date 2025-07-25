import OpenAI from 'openai';
import formidable from 'formidable';
import fs from 'fs';

// Disable body parsing for this route to handle multipart/form-data manually
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const a4fApiKey = process.env.A4F_API_KEY;
  const a4fBaseUrl = 'https://api.a4f.co/v1';

  if (!a4fApiKey) {
    return res.status(500).json({ message: 'A4F_API_KEY is not set in environment variables.' });
  }

  try {
    // Parse the incoming form data
    const form = formidable({
      multiples: false,
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);

    const type = Array.isArray(fields.type) ? fields.type[0] : fields.type;
    const model = Array.isArray(fields.model) ? fields.model[0] : fields.model;
    const prompt = Array.isArray(fields.prompt) ? fields.prompt[0] : fields.prompt;
    const n = Array.isArray(fields.n) ? parseInt(fields.n[0]) : fields.n;
    const size = Array.isArray(fields.size) ? fields.size[0] : fields.size;
    const image = Array.isArray(fields.image) ? fields.image[0] : fields.image;
    const mask = Array.isArray(fields.mask) ? fields.mask[0] : fields.mask;
    const instruction = Array.isArray(fields.instruction) ? fields.instruction[0] : fields.instruction;
    const input = Array.isArray(fields.input) ? fields.input[0] : fields.input;
    const voice = Array.isArray(fields.voice) ? fields.voice[0] : fields.voice;
    const language = Array.isArray(fields.language) ? fields.language[0] : fields.language;

    const openai = new OpenAI({
      apiKey: a4fApiKey,
      baseURL: a4fBaseUrl,
    });

    let response;

    switch (type) {
      case 'chatCompletion':
        const messages = Array.isArray(fields.messages) ? JSON.parse(fields.messages[0]) : JSON.parse(fields.messages);
        response = await openai.chat.completions.create({
          model: model,
          messages: messages,
          stream: true,
        });
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
        // For image editing, you'll need to handle the image file similarly to audio transcription
        // This example assumes 'image' and 'mask' are file paths from formidable parsing
        const imageFile = files.image ? fs.createReadStream(files.image[0].filepath) : undefined;
        const maskFile = files.mask ? fs.createReadStream(files.mask[0].filepath) : undefined;

        if (!imageFile) {
          return res.status(400).json({ message: 'No image file provided for image editing.' });
        }

        response = await openai.images.edit({
          model: model,
          image: imageFile as any, // Cast to any due to formidable's file type
          mask: maskFile as any,
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
        res.writeHead(200, {
          'Content-Type': 'audio/mpeg',
        });
        response.pipe(res);
        return;
      case 'audioTranscription':
        const audioFile = files.file ? fs.createReadStream(files.file[0].filepath) : undefined;

        if (!audioFile) {
          return res.status(400).json({ message: 'No audio file provided for transcription.' });
        }

        response = await openai.audio.transcriptions.create({
          file: audioFile as any, // Cast to any due to formidable's file type
          model: model,
          language: language,
        });
        break;
      default:
        return res.status(400).json({ message: 'Invalid request type' });
    }

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Error calling A4F API:', error.message);
    res.status(500).json({ message: 'Error processing request', error: error.message });
  }
}