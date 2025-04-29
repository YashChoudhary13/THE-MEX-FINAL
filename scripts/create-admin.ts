import { storage } from "../server/storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdminUser() {
  try {
    // Create admin user with a different username
    const adminUser = await storage.createUser({
      username: "superadmin",
      password: await hashPassword("superadmin123"),
      role: "admin",
      email: "admin@themex.com",
    });
    
    console.log("New admin user created successfully:", adminUser.username);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    process.exit(0);
  }
}

createAdminUser();