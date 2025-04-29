import { storage } from "../server/storage";
import { comparePasswords } from "../server/auth";

async function testAuthentication() {
  try {
    // Test admin account
    const admin = await storage.getUserByUsername("admin");
    if (!admin) {
      console.log("Admin user not found");
      return;
    }
    
    console.log("Testing admin account:", admin.username);
    console.log("Stored password hash:", admin.password);
    
    const adminMatch = await comparePasswords("admin", admin.password);
    console.log("Password 'admin' match:", adminMatch);
    
    // Test superadmin account
    const superAdmin = await storage.getUserByUsername("superadmin");
    if (!superAdmin) {
      console.log("SuperAdmin user not found");
      return;
    }
    
    console.log("\nTesting superadmin account:", superAdmin.username);
    console.log("Stored password hash:", superAdmin.password);
    
    const superAdminMatch = await comparePasswords("superadmin123", superAdmin.password);
    console.log("Password 'superadmin123' match:", superAdminMatch);
    
  } catch (error) {
    console.error("Error testing authentication:", error);
  } finally {
    process.exit(0);
  }
}

testAuthentication();