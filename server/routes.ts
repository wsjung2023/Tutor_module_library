import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";

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

  // PortOne payment integration
  app.post('/api/subscribe', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    try {
      const { tier, provider } = req.body;
      const userId = req.user.id;
      
      // Real PortOne payment integration
      if (provider === 'portone') {
        const paymentAmounts: Record<string, number> = {
          starter: 4900,
          pro: 9900,
          premium: 19900
        };
        
        const paymentAmount = paymentAmounts[tier];
        
        if (!paymentAmount) {
          return res.status(400).json({ message: "Invalid tier" });
        }
        
        // Create PortOne payment request
        const portonePayment = await fetch('https://api.portone.io/payments', {
          method: 'POST',
          headers: {
            'Authorization': `PortOne ${process.env.PORTONE_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            paymentId: `subscription_${userId}_${Date.now()}`,
            orderName: `AI English Tutor ${tier} 플랜`,
            totalAmount: paymentAmount,
            currency: 'KRW',
            channelKey: 'channel-key-123', // PortOne에서 제공하는 채널 키
            customerId: userId,
            customer: {
              fullName: `${req.user.firstName} ${req.user.lastName}`,
              email: req.user.email
            }
          })
        });
        
        const paymentData = await portonePayment.json();
        
        if (portonePayment.ok) {
          // Update user subscription after successful payment
          const user = await storage.updateUserSubscription(userId, {
            subscriptionTier: tier,
            paymentProvider: provider,
            subscriptionStatus: 'active',
            customerId: paymentData.customerId,
            subscriptionId: paymentData.paymentId,
            subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          });
          
          res.json({ success: true, user, paymentData });
        } else {
          res.status(400).json({ message: "Payment failed", error: paymentData });
        }
      } else {
        // For other providers (Toss, Paddle), implement similar logic
        res.status(501).json({ message: "Payment provider not implemented yet" });
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

  const httpServer = createServer(app);
  return httpServer;
}