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
): Promise<{ 
  response: string; 
  feedback?: { 
    accuracy: number; 
    suggestions: string[];
    needsCorrection?: boolean;
    koreanExplanation?: string;
    betterExpression?: string;
  };
  shouldEndConversation?: boolean;
  endingMessage?: string;
}> {
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  try {
    console.log('Generating conversation response for:', { userInput, character, topic });
    
    // Build conversation context
    const historyText = conversationHistory
      .slice(-6) // Keep only last 6 exchanges for context
      .map(turn => `${turn.speaker}: ${turn.text}`)
      .join('\n');

    // Check conversation length for ending
    const conversationLength = conversationHistory.length;
    const shouldConsiderEnding = conversationLength >= 10; // After 10 exchanges

    const prompt = `You are ${character.name}, playing a natural HUMAN character in a ${topic} scenario. 

Previous conversation:
${historyText}

User just said: "${userInput}"

CRITICAL INSTRUCTIONS:
1. NEVER use "Certainly" to start responses - you're overusing it! Use varied, natural starters like:
   - "Great!", "Perfect!", "Oh I see", "Well", "Actually", "Sure", "Of course", "Absolutely", "That sounds good", "Interesting", "Right", "Okay"
2. Respond like a REAL HUMAN in this situation, not a formal assistant
3. Keep responses short and conversational (1-2 sentences max)
4. Advance the scenario naturally (ordering food, checking in, etc.)
${shouldConsiderEnding ? '5. Consider if this conversation should naturally end now (task complete, meal finished, etc.)' : ''}

KOREAN LANGUAGE CORRECTION (for grammar/pronunciation errors):
- If user makes grammar mistakes or pronunciation errors, set "needsCorrection": true
- Provide Korean explanation: "음~ 지금 말한 표현은 정확하지 않아요. 보통 이럴 때는 '올바른 영어 표현' 이렇게 말합니다. 다시 해보세요!"
- For awkward but understandable English: "그렇게 말해도 되지만 이렇게 말하면 더 자연스럽습니다: '더 자연스러운 표현' 이렇게 해보세요"

Respond in JSON format:
{
  "response": "Your natural response (NO 'Certainly!' - use varied conversation starters!)",
  "feedback": {
    "accuracy": 85,
    "needsCorrection": false,
    "koreanExplanation": "발음이나 문법 오류시에만 한국어 설명",
    "betterExpression": "More natural alternative if needed", 
    "suggestions": ["Brief helpful tips"]
  },
  "shouldEndConversation": false,
  "endingMessage": "Natural conversation ending if shouldEndConversation is true"
}`;

    console.log('Sending prompt to OpenAI...');
    
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

    console.log('OpenAI response received:', completion.choices[0].message.content);
    
    const result = JSON.parse(completion.choices[0].message.content || '{}');
    
    return {
      response: result.response || "I'm not sure how to respond to that. Could you try saying something else?",
      feedback: result.feedback,
      shouldEndConversation: result.shouldEndConversation || false,
      endingMessage: result.endingMessage
    };
  } catch (error) {
    console.error("Conversation generation failed:", error);
    throw new Error(`Conversation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}