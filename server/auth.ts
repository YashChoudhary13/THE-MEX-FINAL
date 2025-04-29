import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { User as UserType } from "@shared/schema";
import { storage } from "./storage";

declare global {
  namespace Express {
    interface User extends UserType {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: "mex-restaurant-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.verifyUser(username, password);
        if (!user) {
          return done(null, false, { message: "Invalid credentials" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Authentication routes
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.json({ 
          id: user.id, 
          username: user.username, 
          role: user.role,
          email: user.email
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as User;
    res.json({ 
      id: user.id, 
      username: user.username, 
      role: user.role,
      email: user.email
    });
  });

  // Register route (disabled in production to prevent unauthorized user creation)
  if (process.env.NODE_ENV !== "production") {
    app.post("/api/register", async (req, res, next) => {
      try {
        const { username, password, email, role } = req.body;
        
        if (!username || !password) {
          return res.status(400).json({ message: "Username and password are required" });
        }
        
        // Check if user already exists
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" });
        }
        
        // Create new user
        const newUser = await storage.createUser({
          username,
          password,
          email,
          role: role || "user",
        });
        
        // Auto-login after registration
        req.logIn(newUser, (err) => {
          if (err) return next(err);
          return res.status(201).json({ 
            id: newUser.id, 
            username: newUser.username, 
            role: newUser.role,
            email: newUser.email
          });
        });
      } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Registration failed" });
      }
    });
  }

  // Middleware for checking if user is authenticated
  app.use("/api/admin/*", (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    const user = req.user as User;
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  });
}