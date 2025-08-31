import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import MemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.log("Invalid stored password format");
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log("Password comparison result:", result);
    return result;
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Use different session storage for production vs development
  let sessionStore;
  if (isProduction) {
    // For production, store sessions in cookies with encryption
    sessionStore = undefined; // Use default cookie storage
  } else {
    // Development memory store
    const Store = MemoryStore(session);
    sessionStore = new Store({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: true, // Changed to true for production compatibility
    store: sessionStore, // Will be undefined for production (uses cookies)
    name: 'connect.sid', // Use default session name
    cookie: {
      secure: isProduction, // HTTPS only in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true, // Keep secure
      sameSite: 'lax', // Use lax for better compatibility
    }
  };

  app.set("trust proxy", 1);
  
  // Additional CORS setup for production
  if (isProduction) {
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Credentials', 'true');
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });
  }
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' },
      async (email, password, done) => {
        try {
          console.log("Attempting login for:", email);
          const user = await storage.getUserByEmail(email);
          
          if (!user) {
            console.log("User not found:", email);
            return done(null, false);
          }
          
          console.log("User found, checking password...");
          console.log("Stored password:", user.password);
          console.log("Provided password:", password);
          
          // Use proper password comparison
          if (!user.password || !(await comparePasswords(password, user.password))) {
            console.log("Password mismatch - login failed");
            return done(null, false);
          } else {
            console.log("Password match - login successful");
            return done(null, user);
          }
        } catch (error) {
          console.error("LocalStrategy error:", error);
          return done(error);
        }
      }
    )
  );

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: `https://${process.env.REPLIT_DEV_DOMAIN}/api/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found in Google profile"));
          }

          let user = await storage.getUserByEmail(email);
          if (!user) {
            // Create new user with admin rights for mainstop3@gmail.com
            const isAdmin = email === "mainstop3@gmail.com";
            user = await storage.createUser({
              email,
              firstName: profile.name?.givenName || "",
              lastName: profile.name?.familyName || "",
              profileImageUrl: profile.photos?.[0]?.value,
              subscriptionTier: 'free',
              subscriptionStatus: 'active',
              isAdmin: isAdmin
            });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const user = await storage.createUser({
        email,
        password: await hashPassword(password),
        firstName,
        lastName,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json(user);
      });
    })(req, res, next);
  });

  // User endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });

  // Logout endpoints (both GET and POST for flexibility)
  app.get("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(req.user);
  });

  // Google OAuth routes
  app.get("/api/google", 
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get("/api/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
      // Store user ID in session for production compatibility
      (req.session as any).userId = req.user?.id;
      // Successful authentication, redirect home
      res.redirect("/");
    }
  );
}

// Authentication middleware
export function isAuthenticated(req: any, res: any, next: any) {
  if ((req.session as any)?.userId || req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

// Admin authentication middleware
export function isAdmin(req: any, res: any, next: any) {
  if (req.isAuthenticated() && req.user?.isAdmin === true) {
    return next();
  }
  res.status(403).json({ message: "Admin access required" });
}