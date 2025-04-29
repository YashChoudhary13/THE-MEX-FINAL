import bcrypt from "bcryptjs";
import { db } from "../server/db";

async function createTestAdmin() {
  try {
    // Create a simple password hash using bcrypt
    const password = "password123";
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log("Password:", password);
    console.log("Hashed Password:", hashedPassword);
    
    // Insert the new admin user
    const query = `
      INSERT INTO users (username, password, role, email) 
      VALUES ('simpleadmin', $1, 'admin', 'simple@example.com')
      RETURNING id, username, role;
    `;
    
    const result = await db.execute(query, [hashedPassword]);
    console.log("Admin user created:", result.rows[0]);
  } catch (error) {
    console.error("Error creating test admin:", error);
  } finally {
    process.exit(0);
  }
}

createTestAdmin();