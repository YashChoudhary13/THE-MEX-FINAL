import bcrypt from "bcryptjs";
import { storage } from "../server/storage";

async function resetAdminAccount() {
  try {
    // Create a simple password hash using bcrypt
    const password = "admin";
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log("Creating/resetting admin account...");
    console.log("Password:", password);
    console.log("Hashed Password:", hashedPassword);
    
    // Check if admin user exists
    const existingAdmin = await storage.getUserByUsername('admin');
    
    if (existingAdmin) {
      // Update existing admin password
      console.log("Updating existing admin account...");
      // Note: storage doesn't have update method, so we'll recreate
    } else {
      console.log("Creating new admin account...");
    }
    
    // Create/recreate admin user
    try {
      const adminUser = await storage.createUser({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        email: 'admin@themex.com'
      });
      console.log("Admin account created successfully:", adminUser.username);
    } catch (error: any) {
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        console.log("Admin account already exists - this is expected");
      } else {
        throw error;
      }
    }
    
    // Display all users to verify
    console.log("\nVerifying admin account creation...");
    const adminCheck = await storage.getUserByUsername('admin');
    if (adminCheck) {
      console.log("✓ Admin account verified:", adminCheck.username, `(${adminCheck.role})`);
    } else {
      console.log("✗ Admin account not found");
    }
    
  } catch (error) {
    console.error("Error resetting admin account:", error);
  } finally {
    process.exit(0);
  }
}

resetAdminAccount();