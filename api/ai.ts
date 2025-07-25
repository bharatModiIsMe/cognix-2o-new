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
    const { messages, model } = req.body;

    const openai = new OpenAI({
      apiKey: a4fApiKey,
      baseURL: a4fBaseUrl,
    });

    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
    });

    res.status(200).json(completion.choices[0].message);
  } catch (error: any) {
    console.error('Error calling A4F API:', error.message);
    res.status(500).json({ message: 'Error processing request', error: error.message });
  }
}