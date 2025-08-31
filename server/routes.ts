import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, isAdmin, setupAuth, hashPassword } from "./auth";
import passport from "passport";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Pricing helper function
function getTierPrice(tier: string): number {
  switch (tier) {
    case 'starter': return 4900; // ₩4,900
    case 'pro': return 9900; // ₩9,900
    case 'premium': return 19900; // ₩19,900
    default: return 0;
  }
}

// Paddle Price ID mapping - FluentDrama 실제 Price ID
function getPaddlePriceId(tier: string): string {
  switch (tier) {
    case 'starter': return 'pri_01k3xqqv4bp4xdjxn2b0p0f0n4'; // Starter Plan
    case 'pro': return 'pri_01k3xqt841ry893jwdbjybyp2q'; // Pro Plan
    case 'premium': return 'pri_01k3xqw6mges1rt7kmkv57xpb0'; // Premium Plan
    default: throw new Error(`Invalid tier: ${tier}`);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Google OAuth routes
  app.get("/api/google", passport.authenticate("google", { scope: ["profile", "email"] }));

  app.get("/api/google/callback", 
    passport.authenticate("google", { failureRedirect: "/auth" }),
    (req, res) => {
      res.redirect("/"); // Redirect to home after successful login
    }
  );

  // Authentication endpoints
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "사용자가 이미 존재합니다" });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        subscriptionTier: 'free',
        subscriptionStatus: 'active'
      });

      req.login(user, (err: any) => {
        if (err) return next(err);
        // Store user ID in session for production compatibility
        (req.session as any).userId = user.id;
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "등록 실패" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    // Store user ID in session for production compatibility
    (req.session as any).userId = req.user?.id;
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res) => {
    // Clear session
    (req.session as any).userId = null;
    req.logout((err: any) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", async (req: any, res) => {
    try {
      // More lenient user check for production deployment
      const userId = (req.session as any)?.userId || req.user?.id;
      
      // Log session and user details for debugging
      console.log("Session details:", {
        sessionId: req.sessionID,
        sessionUserId: (req.session as any)?.userId,
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        userFromPassport: req.user?.id,
        sessionStore: !!req.session
      });
      
      if (!userId && !req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Try to get user ID from either session or passport
      const finalUserId = userId || req.user?.id;
      if (!finalUserId) {
        return res.status(401).json({ message: "No user ID found" });
      }
      
      const user = await storage.getUser(finalUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Payment routes for Korean providers
  // Usage limit checking endpoint
  app.post('/api/check-usage', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if daily usage needs reset (monthly for free tier)
      const now = new Date();
      const lastReset = user.lastUsageReset ? new Date(user.lastUsageReset) : new Date();
      const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));
      
      let currentUsage = parseInt(user.dailyUsageCount || "0");
      
      // Reset usage if 30 days have passed (monthly reset for free tier)
      if (daysSinceReset >= 30) {
        currentUsage = 0;
        await storage.updateUserSubscription(userId, {
          dailyUsageCount: "0",
          lastUsageReset: now
        });
      }
      
      // Define usage limits by tier
      const limits = {
        free: { conversations: 30, images: 1 },
        starter: { conversations: 300, images: 15 },
        pro: { conversations: 600, images: 25 },
        premium: { conversations: 1200, images: 60 }
      };
      
      const userLimit = limits[user.subscriptionTier as keyof typeof limits] || limits.free;
      const canUse = currentUsage < userLimit.conversations;
      
      res.json({
        canUse,
        currentUsage,
        limit: userLimit.conversations,
        tier: user.subscriptionTier,
        daysUntilReset: 30 - daysSinceReset
      });
      
    } catch (error) {
      console.error("Usage check error:", error);
      res.status(500).json({ message: "Failed to check usage" });
    }
  });
  
  // Increment usage counter
  app.post('/api/increment-usage', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const newUsage = parseInt(user.dailyUsageCount || "0") + 1;
      
      await storage.updateUserSubscription(userId, {
        dailyUsageCount: newUsage.toString()
      });
      
      res.json({ success: true, newUsage });
      
    } catch (error) {
      console.error("Usage increment error:", error);
      res.status(500).json({ message: "Failed to increment usage" });
    }
  });

  // Paddle payment integration only
  app.post('/api/subscribe', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { tier, provider } = req.body;
      const userId = req.user.id;
      
      if (provider === 'paddle') {
        try {
          if (!process.env.PADDLE_API_KEY) {
            return res.status(400).json({ 
              message: "Paddle API 키가 설정되지 않았습니다." 
            });
          }

          // Paddle 실제 API 호출
          const paddlePayment = await fetch('https://api.paddle.com/transactions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.PADDLE_API_KEY}`,
              'Paddle-Version': '1',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              items: [{
                price_id: getPaddlePriceId(tier),
                quantity: 1
              }],
              collection_mode: 'automatic',
              custom_data: {
                user_id: userId,
                tier: tier
              }
            })
          });

          const paddleData = await paddlePayment.json();
          
          if (paddlePayment.ok) {
            const user = await storage.updateUserSubscription(userId, {
              subscriptionTier: tier,
              paymentProvider: provider,
              subscriptionStatus: 'active',
              customerId: paddleData.customer_id || userId,
              subscriptionId: paddleData.id || `paddle_${Date.now()}`,
              subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            });
            
            res.json({ success: true, user, paymentData: paddleData });
          } else {
            res.status(400).json({ message: "Paddle 결제 실패", error: paddleData });
          }
        } catch (paddleError) {
          console.error("Paddle request error:", paddleError);
          res.status(500).json({ message: "Paddle 결제 처리 중 오류가 발생했습니다." });
        }

      } else {
        res.status(400).json({ message: "현재 Paddle 결제만 지원합니다." });
      }
      
    } catch (error) {
      console.error("Subscription error:", error);
      res.status(500).json({ message: "Failed to create subscription" });
    }
  });

  app.post('/api/cancel-subscription', (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const userId = req.user.id;
      
      const user = storage.updateUserSubscription(userId, {
        subscriptionTier: 'free',
        subscriptionStatus: 'cancelled'
      });
      
      res.json({ success: true, user });
    } catch (error) {
      console.error("Cancel subscription error:", error);
      res.status(500).json({ message: "Failed to cancel subscription" });
    }
  });

  // Admin endpoints
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/user/:email", isAdmin, async (req, res) => {
    try {
      const { email } = req.params;
      const user = await storage.getUserByEmail(decodeURIComponent(email));
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/admin/user/:id/subscription", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { tier } = req.body;
      
      const user = await storage.updateUserSubscription(id, {
        subscriptionTier: tier,
        subscriptionStatus: tier === 'free' ? 'inactive' : 'active',
        paymentProvider: tier === 'free' ? null : 'admin',
        customerId: tier === 'free' ? null : `admin_${id}`,
        subscriptionId: tier === 'free' ? null : `admin_sub_${Date.now()}`,
        subscriptionExpiresAt: tier === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      res.json(user);
    } catch (error) {
      console.error("Update subscription error:", error);
      res.status(500).json({ message: "Failed to update subscription" });
    }
  });

  app.put("/api/admin/user/:id/reset-usage", isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await storage.resetUserUsage(id);
      
      res.json(user);
    } catch (error) {
      console.error("Reset usage error:", error);
      res.status(500).json({ message: "Failed to reset usage" });
    }
  });

  // AI Learning API Endpoints
  app.post('/api/generate-image', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { name, gender, style, audience, scenario } = req.body;
      const userId = req.user.id;

      // Check usage limits
      const usageCheck = await checkUsageLimit(userId);
      if (!usageCheck.canUse) {
        return res.status(429).json({ 
          message: "사용 한도에 도달했습니다. 구독을 업그레이드해주세요.",
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit
        });
      }

      // Define scenario-specific backgrounds
      const getScenarioBackground = (scenario: string) => {
        const backgrounds = {
          restaurant: "elegant restaurant interior with dining tables and ambient lighting",
          airport: "modern airport terminal with check-in counters and departure boards", 
          coffee_shop: "trendy coffee shop with espresso machines and cozy seating",
          office: "professional corporate office with modern furniture",
          school: "bright classroom with educational materials and whiteboards",
          hotel: "luxurious hotel lobby with reception desk and elegant decor",
          shopping_mall: "modern shopping center with stores and shoppers",
          hospital: "clean medical facility with professional healthcare setting",
          bank: "professional banking environment with teller counters",
          library: "quiet library with bookshelves and study areas"
        };
        return backgrounds[scenario as keyof typeof backgrounds] || "professional indoor setting";
      };

      // Define style characteristics
      const styleMap = {
        cheerful: "bright smile, friendly expression, energetic pose",
        calm: "serene expression, gentle demeanor, relaxed posture", 
        strict: "serious expression, professional appearance, confident stance"
      };

      // Get scenario-specific background
      const background = scenario ? getScenarioBackground(scenario) : `professional setting suitable for ${audience} level English learning`;
      
      // Get appropriate outfit and pose based on scenario and style
      const getOutfitForScenario = (scenario: string, style: string) => {
        const outfits = {
          restaurant: style === 'strict' ? 'formal server uniform, black apron' : 'casual restaurant uniform, friendly smile',
          airport: 'professional flight attendant uniform, name badge',
          coffee_shop: 'casual barista apron over comfortable clothing',
          office: 'professional business attire, suit or blazer',
          hotel: 'elegant concierge uniform, professional appearance',
          school: 'professional teacher attire, educational setting appropriate',
          shopping_mall: 'retail employee uniform or casual professional attire',
          hospital: 'medical professional attire, clean and professional',
          bank: 'formal business attire, professional banking appearance',
          library: 'librarian or academic professional attire'
        };
        return outfits[scenario as keyof typeof outfits] || 'professional casual attire';
      };

      const getPoseForStyle = (style: string) => {
        const poses: Record<string, string> = {
          cheerful: 'standing confidently with warm welcoming gesture',
          calm: 'standing peacefully with relaxed, approachable posture',
          strict: 'standing professionally with confident, authoritative stance'
        };
        return poses[style] || 'standing naturally with friendly posture';
      };

      const outfit = getOutfitForScenario(scenario || 'restaurant', style);
      const pose = getPoseForStyle(style);
      const styleCharacteristics = styleMap[style as keyof typeof styleMap] || "friendly expression";

      // Create comprehensive prompt with scenario context following user requirements
      const comprehensivePrompt = `FULL LENGTH BODY SHOT: Professional photograph of a real human ${gender} person, ENTIRE BODY visible from head to feet, standing ${pose}, wearing ${outfit}, at ${background}. 

MANDATORY FRAMING: Complete figure visible - head at top 20% of image, feet at bottom 10% of image, showing shoes/footwear. Person should occupy 60-70% of image height to ensure full body is captured without cropping any limbs.

CAMERA SETUP: Positioned 8-10 feet back from subject, wide angle lens (24-35mm equivalent), vertical orientation, adequate space above head and below feet.

Ultra photorealistic, natural skin texture, realistic human proportions, professional portrait lighting.
High quality DSLR shot, f/2.8, soft natural light, balanced exposure.

STRICTLY NO: head-and-shoulders only, waist-up shots, cropped legs, cropped feet, tight framing that cuts off any body parts, illustration, no anime, no 3D render, no doll-like face, no over-smoothing, no plastic skin, no exaggerated eyes.`;

      // Generate character image using OpenAI DALL-E
      const openaiResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: comprehensivePrompt,
          n: 1,
          size: "1024x1792", // Maximum vertical ratio for full body shots
          quality: "hd", // High quality for realistic images
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const imageData = await openaiResponse.json();
      const imageUrl = imageData.data[0].url;

      // Increment usage
      await storage.incrementUsage(userId, 'imageGeneration');

      res.json({ 
        imageUrl,
        character: { name, gender, style },
        message: "캐릭터 이미지가 생성되었습니다!"
      });

    } catch (error) {
      console.error('Image generation error:', error);
      res.status(500).json({ 
        message: "이미지 생성 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/generate-dialogue', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { character, scenario, messages } = req.body;
      const userId = req.user.id;

      // Check usage limits
      const usageCheck = await checkUsageLimit(userId);
      if (!usageCheck.canUse) {
        return res.status(429).json({ 
          message: "사용 한도에 도달했습니다. 구독을 업그레이드해주세요.",
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit
        });
      }

      // Generate dialogue using OpenAI GPT-4
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are ${character.name}, a ${character.gender} English tutor with a ${character.style} personality. You're helping students practice English conversation in a ${scenario.presetKey || 'general'} scenario. Respond naturally and provide helpful corrections when needed. Keep responses conversational and encouraging.`
            },
            ...messages
          ],
          max_tokens: 150,
          temperature: 0.8,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const dialogueData = await openaiResponse.json();
      const response = dialogueData.choices[0].message.content;

      // Increment usage
      await storage.incrementUsage(userId, 'conversation');

      res.json({ 
        response,
        character: character.name,
        message: "대화가 생성되었습니다!"
      });

    } catch (error) {
      console.error('Dialogue generation error:', error);
      res.status(500).json({ 
        message: "대화 생성 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  app.post('/api/tts', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const { text, character } = req.body;
      const userId = req.user.id;

      // Check usage limits
      const usageCheck = await checkUsageLimit(userId);
      if (!usageCheck.canUse) {
        return res.status(429).json({ 
          message: "사용 한도에 도달했습니다. 구독을 업그레이드해주세요.",
          currentUsage: usageCheck.currentUsage,
          limit: usageCheck.limit
        });
      }

      // Generate TTS using OpenAI
      const voice = character.gender === 'female' ? 'nova' : 'echo';
      
      const openaiResponse = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "tts-1",
          input: text,
          voice: voice,
          response_format: "mp3"
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI TTS API error: ${openaiResponse.status}`);
      }

      const audioBuffer = await openaiResponse.arrayBuffer();
      const audioBase64 = Buffer.from(audioBuffer).toString('base64');

      // Increment usage
      await storage.incrementUsage(userId, 'tts');

      res.json({ 
        audioUrl: `data:audio/mp3;base64,${audioBase64}`,
        message: "음성이 생성되었습니다!"
      });

    } catch (error) {
      console.error('TTS generation error:', error);
      res.status(500).json({ 
        message: "음성 생성 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Helper function for usage limit checking
  async function checkUsageLimit(userId: string) {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return { canUse: false, currentUsage: 0, limit: 0 };
      }

      const tier = user.subscriptionTier || 'free';
      const limits = {
        'free': 30,
        'starter': 300,
        'pro': 1000,
        'premium': 5000
      };

      const limit = limits[tier as keyof typeof limits] || 30;
      const currentUsage = parseInt(user.conversationCount || '0');

      return {
        canUse: currentUsage < limit,
        currentUsage,
        limit
      };
    } catch (error) {
      console.error('Usage limit check error:', error);
      return { canUse: false, currentUsage: 0, limit: 0 };
    }
  }

  // Generate dynamic opening line for drama scenes
  app.post('/api/generate-opening', async (req, res) => {
    try {
      const { character, scenario, audience } = req.body;
      
      // Create contextual opening based on character and scenario
      const systemPrompt = `You are ${character.name}, a ${character.gender} with a ${character.style} personality. 
      
Context: ${scenario.presetKey || 'general conversation'} situation
Audience: ${audience} level English learner
Scenario details: ${scenario.freeText || 'General conversation practice'}

Generate a completely natural opening line that:
- Reflects your personality (${character.style})
- Fits the situation perfectly
- Is appropriate for ${audience} English level
- Sounds spontaneous, not scripted
- Creates immediate engagement
- Is 1-2 sentences maximum

Be authentic and contextual. Avoid generic greetings.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create a natural opening line for this exact moment in the ${scenario.presetKey || 'conversation'} scenario.` }
        ],
        max_tokens: 100,
        temperature: 0.9
      });

      const openingLine = response.choices[0].message.content?.trim() || "Hello! How are you today?";
      
      res.json({ openingLine });
      
    } catch (error) {
      console.error('Opening generation error:', error);
      // Fallback to simple but still dynamic response
      const fallbackOpening = `Hi there! I'm ${req.body.character?.name || 'your tutor'}. ${req.body.character?.style === 'cheerful' ? 'Great to meet you!' : req.body.character?.style === 'calm' ? 'Nice to see you.' : 'Let\'s get started.'} How can I help you practice today?`;
      res.json({ openingLine: fallbackOpening });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}