import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { User as UserType } from "@shared/schema";
import dotenv from 'dotenv';
dotenv.config();

declare global {
  namespace Express {
    interface User extends UserType {}
  }
}

async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

export async function comparePasswords(supplied: string, stored: string) {
  // Check if this is a bcrypt hash (starts with $2b$)
  if (stored.startsWith('$2b$')) {
    return await bcrypt.compare(supplied, stored);
  } 
  // Check if this is a scrypt hash (contains a period separating hash and salt)
  else if (stored.includes('.')) {
    const [hash, salt] = stored.split('.');
    const crypto = require('crypto');
    const { promisify } = require('util');
    const scryptAsync = promisify(crypto.scrypt);
    
    const suppliedBuffer = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const storedBuffer = Buffer.from(hash, 'hex');
    
    return crypto.timingSafeEqual(suppliedBuffer, storedBuffer);
  }
  
  // If neither format matches, return false
  return false;
}

export function setupAuth(app: Express) {
  // Session configuration
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "mex-restaurant-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
      secure: process.env.NODE_ENV === "production", // true in prod, false in dev
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport with local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Serialize and deserialize user
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Authentication endpoints
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(req.body.password);

      // Create user
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        role: req.body.role || "user", // Default role
      });

      // Log in the new user
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(201).json(user);
      });
    } catch (error) {
      console.error("Register error:", error);
      return res.status(500).json({ message: "Error creating user account" });
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: UserType) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    return res.json(req.user);
  });

  // Authentication middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Authentication required" });
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Admin privileges required" });
  };

  return { isAuthenticated, isAdmin };
}