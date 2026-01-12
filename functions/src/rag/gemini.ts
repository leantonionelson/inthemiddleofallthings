import { GoogleGenerativeAI } from '@google/generative-ai';

const REQUIRED_ENV = 'GEMINI_API_KEY';

export function requireGeminiApiKey(): string {
  const key = process.env[REQUIRED_ENV];
  if (!key) {
    throw new Error(`Missing ${REQUIRED_ENV}. Set it in your Functions environment or .env used during deploy.`);
  }
  return key;
}

export function createGeminiClient() {
  const apiKey = requireGeminiApiKey();
  return new GoogleGenerativeAI(apiKey);
}


