import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { paymentService } from "./services/payment";
import { 
  insertSessionSchema,
  generateImageRequestSchema, 
  generateDialogueRequestSchema, 
  ttsRequestSchema,
  speechRecognitionRequestSchema
} from "@shared/schema";
import { generateCharacterImage } from "./services/openai";
import { generateDialogue } from "./services/openai";
import { recognizeSpeech, generateConversationResponse } from "./services/speech-recognition";
import { generateTTS } from "./services/supertone";
import { generateOpenAITTS, getOpenAIVoiceForCharacter } from "./services/openai-tts";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Subscription routes
  app.post('/api/subscribe', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { plan, provider } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const paymentProvider = paymentService.getProvider(provider) || 
                              paymentService.getRecommendedProvider('KR');
      
      const result = await paymentProvider.createSubscription(user, plan);
      
      if (result.status === 'active') {
        await storage.updateUserSubscription(userId, {
          subscriptionTier: plan,
          subscriptionStatus: 'active',
          paymentProvider: paymentProvider.name,
          customerId: result.customerId,
          subscriptionId: result.subscriptionId,
          subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30일
        });
      }

      res.json(result);
    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.post('/api/cancel-subscription', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.subscriptionId || !user.paymentProvider) {
        return res.status(400).json({ message: "No active subscription found" });
      }

      const provider = paymentService.getProvider(user.paymentProvider);
      if (provider) {
        await provider.cancelSubscription(user.subscriptionId);
        
        await storage.updateUserSubscription(userId, {
          subscriptionTier: 'free',
          subscriptionStatus: 'canceled',
          paymentProvider: user.paymentProvider,
          customerId: user.customerId!,
          subscriptionId: user.subscriptionId,
        });
      }

      res.json({ message: "Subscription canceled successfully" });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });
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

  // Text-to-Speech Generation with OpenAI fallback
  app.post("/api/tts", async (req, res) => {
    try {
      const validatedData = ttsRequestSchema.parse(req.body);
      
      // Try OpenAI TTS first (much cheaper and more reliable)
      try {
        console.log("Trying OpenAI TTS...");
        const voice = getOpenAIVoiceForCharacter(
          validatedData.character?.style || 'friendly', 
          validatedData.character?.gender || 'female',
          validatedData.character?.role || ''
        );
        
        const emotion = validatedData.emotion || 'neutral';
        const audioUrl = await generateOpenAITTS(validatedData.text, voice, emotion as any);
        console.log('Sending TTS response with audioUrl:', audioUrl ? 'Present' : 'Missing');
        res.json({ audioUrl });
        return;
      } catch (openaiError) {
        console.log("OpenAI TTS failed, trying Supertone fallback:", openaiError);
      }
      
      // Fallback to Supertone if OpenAI fails
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
