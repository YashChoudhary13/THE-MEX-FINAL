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
  console.log(`🔐 Password comparison:`, {
    suppliedLength: supplied.length,
    storedLength: stored.length,
    storedPrefix: stored.substring(0, 10),
  });

  // Check if this is a bcrypt hash (starts with $2b$)
  if (stored.startsWith('$2b$') || stored.startsWith('$2a$') || stored.startsWith('$2y$')) {
    console.log(`✓ Detected bcrypt hash format`);
    const result = await bcrypt.compare(supplied, stored);
    console.log(`🔑 Bcrypt comparison result:`, result);
    return result;
  } 
  // Check if this is a scrypt hash (contains a period separating hash and salt)
  else if (stored.includes('.')) {
    console.log(`✓ Detected scrypt hash format`);
    const [hash, salt] = stored.split('.');
    const crypto = require('crypto');
    const { promisify } = require('util');
    const scryptAsync = promisify(crypto.scrypt);
    
    const suppliedBuffer = (await scryptAsync(supplied, salt, 64)) as Buffer;
    const storedBuffer = Buffer.from(hash, 'hex');
    
    const result = crypto.timingSafeEqual(suppliedBuffer, storedBuffer);
    console.log(`🔑 Scrypt comparison result:`, result);
    return result;
  }
  
  // If neither format matches, return false
  console.log(`❌ Password hash format not recognized!`, { storedStart: stored.substring(0, 20) });
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
      secure: process.env.NODE_ENV === "production" && process.env.HTTPS === "true", // Only enforce HTTPS if explicitly set
      httpOnly: true, // Prevent client-side JS from accessing the cookie
      sameSite: "lax", // Help prevent CSRF attacks
    }
  };

  console.log("🔐 Session config:", {
    secure: sessionSettings.cookie?.secure,
    httpOnly: sessionSettings.cookie?.httpOnly,
    sameSite: sessionSettings.cookie?.sameSite,
    storeType: storage.sessionStore.constructor.name
  });

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Debug middleware to log session info
  app.use((req: any, res, next) => {
    if (req.path.startsWith('/api/admin')) {
      console.log(`📋 Request to ${req.method} ${req.path}:`, {
        sessionID: req.sessionID,
        isAuthenticated: req.isAuthenticated(),
        user: req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null,
        cookies: req.cookies ? Object.keys(req.cookies) : [],
      });
    }
    next();
  });

  // Configure passport with local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        console.log(`🔑 LocalStrategy attempt:`, { username, passwordLength: password.length, password: password });
        const user = await storage.getUserByUsername(username);
        console.log(`📦 User from DB:`, { 
          found: !!user, 
          username: user?.username,
          storedPasswordLength: user?.password.length,
          storedPasswordStart: user?.password.substring(0, 20)
        });
        
        if (!user) {
          console.log(`❌ User not found: ${username}`);
          return done(null, false);
        }
        
        const passwordMatch = await comparePasswords(password, user.password);
        console.log(`🔐 Password match result:`, passwordMatch);
        
        if (!passwordMatch) {
          console.log(`❌ Password mismatch for user: ${username}`);
          return done(null, false);
        }
        
        console.log(`✅ Authentication successful for: ${username}`);
        return done(null, user);
      } catch (err) {
        console.error(`❌ LocalStrategy error:`, err);
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
      console.log(`🔍 Deserializing user ID: ${id}`);
      const user = await storage.getUser(id);
      console.log(`✅ User deserialized:`, user ? { id: user.id, username: user.username, role: user.role } : 'null');
      done(null, user);
    } catch (err) {
      console.error(`❌ Error deserializing user:`, err);
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
      console.log(`📝 Registration - Password hashed:`, {
        originalLength: req.body.password.length,
        hashedLength: hashedPassword.length,
        hashedStart: hashedPassword.substring(0, 20),
        hashedFull: hashedPassword
      });

      // Create user
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        role: req.body.role || "user", // Default role
      });

      console.log(`✅ User created in DB:`, {
        id: user.id,
        username: user.username,
        storedPasswordLength: user.password.length,
        storedPasswordStart: user.password.substring(0, 20),
        storedPasswordFull: user.password
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
      if (err) {
        console.error("❌ Login auth error:", err);
        return next(err);
      }
      if (!user) {
        console.warn("⚠️ Login failed: Invalid credentials");
        console.log(`📝 Login attempt - Username: ${req.body.username}`);
        return res.status(401).json({ message: "Invalid username or password" });
      }
      console.log(`🔐 User authenticated:`, { id: user.id, username: user.username, role: user.role });
      req.login(user, (err) => {
        if (err) {
          console.error("❌ Session save error:", err);
          return next(err);
        }
        // Ensure session is fully saved before responding
        req.session.save((err) => {
          if (err) {
            console.error("❌ Session persistence error:", err);
            return next(err);
          }
          console.log(`✅ User session saved and persisted:`, { id: user.id, username: user.username, sessionID: req.sessionID });
          return res.status(200).json(user);
        });
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
    if (req.isAuthenticated() && req.user && req.user.role === "admin") {
      return next();
    }
    console.log('Admin check failed:', {
      isAuthenticated: req.isAuthenticated(),
      user: req.user ? { id: req.user.id, username: req.user.username, role: req.user.role } : null
    });
    res.status(403).json({ message: "Admin privileges required" });
  };

  return { isAuthenticated, isAdmin };
}