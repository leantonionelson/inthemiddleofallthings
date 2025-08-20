import { GoogleGenerativeAI } from '@google/generative-ai';
import { ConversationTone } from '../types';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

// Text completion models
const textModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Live audio model configuration
export const liveAudioConfig = {
  model: "gemini-2.5-flash-preview-native-audio-dialog",
  generationConfig: {
    responseModalities: ["AUDIO"],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: "Orus"
        }
      }
    }
  }
};

// System prompts for different conversation types
const systemPrompts = {
  [ConversationTone.REFLECTIVE]: `You are a gentle, contemplative guide helping someone explore their inner thoughts and feelings. Your responses should be warm, encouraging, and help the user discover insights about themselves. Focus on asking thoughtful questions and reflecting back what you hear. Keep responses concise and poetic.`,
  
  [ConversationTone.INTERPRETIVE]: `You are a wise literary companion helping someone understand deeper meanings in text. Provide clear, insightful explanations while maintaining a sense of wonder and discovery. Help them see connections and symbols they might have missed. Be accessible but profound.`,
  
  [ConversationTone.PHILOSOPHICAL]: `You are a philosophical companion exploring life's big questions. Help the user think deeply about concepts like impermanence, meaning, and existence. Use gentle Socratic questioning and draw connections to universal human experiences. Be contemplative and patient.`
};

export class GeminiService {
  async generateReflection(
    text: string, 
    tone: ConversationTone = ConversationTone.REFLECTIVE,
    context?: string
  ): Promise<string> {
    try {
      const systemPrompt = systemPrompts[tone];
      const userPrompt = context 
        ? `Context: ${context}\n\nText to reflect on: "${text}"\n\nWhat insights or reflections can you offer?`
        : `Please reflect on this text: "${text}"`;

      const chat = textModel.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: systemPrompt }]
          },
          {
            role: "model", 
            parts: [{ text: "I understand. I'll provide thoughtful, gentle guidance in this conversational tone." }]
          }
        ]
      });

      const result = await chat.sendMessage(userPrompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating reflection:', error);
      return 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.';
    }
  }

  async interpretPassage(text: string): Promise<string> {
    return this.generateReflection(text, ConversationTone.INTERPRETIVE);
  }

  async philosophicalInquiry(question: string): Promise<string> {
    return this.generateReflection(question, ConversationTone.PHILOSOPHICAL);
  }

  async generateSymbolDescription(
    userContext: string,
    interactionHistory: string[]
  ): Promise<string> {
    try {
      const prompt = `Based on this user's journey and interactions, create a poetic description for their evolving personal symbol:

User context: ${userContext}
Recent interactions: ${interactionHistory.join(', ')}

Describe how their symbol might look and what it represents. Keep it mystical and meaningful, focusing on geometric forms, natural elements, and spiritual symbolism. 1-2 sentences maximum.`;

      const result = await textModel.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating symbol description:', error);
      return 'A unique geometric form that reflects your inner journey.';
    }
  }
}

export const geminiService = new GeminiService(); 