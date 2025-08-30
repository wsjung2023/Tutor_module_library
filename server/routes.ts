import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, isAdmin } from "./auth";
import { setupAuth } from "./auth";

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

  const httpServer = createServer(app);
  return httpServer;
}