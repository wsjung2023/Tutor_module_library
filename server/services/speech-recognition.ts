import OpenAI from "openai";
import type { SpeechRecognitionRequest } from "@shared/schema";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function recognizeSpeech(request: SpeechRecognitionRequest): Promise<{ text: string; confidence: number }> {
  const { audioBlob, language } = request;
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBlob, 'base64');
    
    // Create a temporary file for the audio
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempFilePath = path.join(tempDir, `audio_${Date.now()}.webm`);
    fs.writeFileSync(tempFilePath, audioBuffer);
    
    // Create a readable stream for OpenAI API
    const audioStream = fs.createReadStream(tempFilePath);
    
    const transcription = await openai.audio.transcriptions.create({
      file: audioStream,
      model: "whisper-1",
      language: language === 'en' ? 'en' : 'ko',
      response_format: 'json',
      temperature: 0.2, // Lower temperature for more consistent results
    });

    // Clean up temporary file
    fs.unlinkSync(tempFilePath);

    return {
      text: transcription.text.trim(),
      confidence: 0.9 // Whisper doesn't provide confidence scores, so we use a default high value
    };
  } catch (error) {
    console.error("Speech recognition failed:", error);
    throw new Error(`Speech recognition failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function generateConversationResponse(
  userInput: string,
  conversationHistory: Array<{ speaker: string; text: string }>,
  character: { name: string; style: string },
  topic: string
): Promise<{ response: string; feedback?: { accuracy: number; suggestions: string[] } }> {
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    // Build conversation context
    const historyText = conversationHistory
      .slice(-6) // Keep only last 6 exchanges for context
      .map(turn => `${turn.speaker}: ${turn.text}`)
      .join('\n');

    const prompt = `You are ${character.name}, a ${character.style} English tutor. You're having a conversation about ${topic}.

Previous conversation:
${historyText}

User just said: "${userInput}"

Respond naturally as ${character.name} and provide helpful feedback. Your response should:
1. Acknowledge what the user said
2. Continue the conversation naturally
3. Gently correct any major grammar errors if needed
4. Ask a follow-up question to keep the conversation going

Respond in JSON format:
{
  "response": "Your natural response as the character",
  "feedback": {
    "accuracy": 85,
    "suggestions": ["Optional grammar suggestions"]
  }
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a helpful English conversation tutor. Always respond in valid JSON format with 'response' and optional 'feedback' fields."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      response: result.response || "I'm not sure how to respond to that. Could you try saying something else?",
      feedback: result.feedback
    };
  } catch (error) {
    console.error("Conversation generation failed:", error);
    throw new Error(`Conversation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}