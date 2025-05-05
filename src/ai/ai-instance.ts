import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY, // Ensure this environment variable is set correctly
    }),
  ],
  model: 'googleai/gemini-2.0-flash', // Ensure this model supports the features you need
});
