import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateImageRequestSchema, 
  generateDialogueRequestSchema, 
  ttsRequestSchema,
  speechRecognitionRequestSchema
} from "@shared/schema";
import { generateCharacterImage } from "./services/openai";
import { generateDialogue } from "./services/openai";
import { recognizeSpeech, generateConversationResponse } from "./services/speech-recognition";
import { generateTTS } from "./services/supertone";

export async function registerRoutes(app: Express): Promise<Server> {
  // Character Image Generation
  app.post("/api/generate-image", async (req, res) => {
    try {
      const validatedData = generateImageRequestSchema.parse(req.body);
      const result = await generateCharacterImage(validatedData);
      res.json(result);
    } catch (error) {
      console.error("Image generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate character image",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Dialogue Generation
  app.post("/api/generate-dialogue", async (req, res) => {
    try {
      const validatedData = generateDialogueRequestSchema.parse(req.body);
      const result = await generateDialogue(validatedData);
      res.json(result);
    } catch (error) {
      console.error("Dialogue generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate dialogue",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Speech Recognition endpoint
  app.post("/api/speech-recognition", async (req, res) => {
    try {
      const validatedData = speechRecognitionRequestSchema.parse(req.body);
      const result = await recognizeSpeech(validatedData);
      res.json(result);
    } catch (error) {
      console.error("Speech recognition error:", error);
      res.status(500).json({ 
        message: "Failed to recognize speech",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Conversation response generation
  app.post("/api/conversation-response", async (req, res) => {
    try {
      const { userInput, conversationHistory, character, topic } = req.body;
      const result = await generateConversationResponse(userInput, conversationHistory, character, topic);
      res.json(result);
    } catch (error) {
      console.error("Conversation response error:", error);
      res.status(500).json({ 
        message: "Failed to generate conversation response",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Text-to-Speech Generation
  app.post("/api/tts", async (req, res) => {
    try {
      const validatedData = ttsRequestSchema.parse(req.body);
      const result = await generateTTS(validatedData);
      res.json(result);
    } catch (error) {
      console.error("TTS generation error:", error);
      res.status(500).json({ 
        message: "Failed to generate audio",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}
