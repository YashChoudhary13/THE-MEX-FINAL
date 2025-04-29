import bcrypt from "bcryptjs";
import { db } from "../server/db";

async function resetAdminAccount() {
  try {
    // Create a simple password hash using bcrypt
    const password = "admin";
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log("Creating/resetting admin account...");
    console.log("Password:", password);
    console.log("Hashed Password:", hashedPassword);
    
    // First update the main admin user
    const updateResult = await db.execute(
      `UPDATE users SET password = $1 WHERE username = 'admin'`,
      [hashedPassword]
    );
    console.log("Admin account updated:", updateResult.rowCount > 0);
    
    // If admin doesn't exist, create it
    if (updateResult.rowCount === 0) {
      const insertResult = await db.execute(
        `INSERT INTO users (username, password, role, email) 
         VALUES ('admin', $1, 'admin', 'admin@themex.com')`,
        [hashedPassword]
      );
      console.log("Admin account created:", insertResult.rowCount > 0);
    }
    
    // Delete other admin accounts except admin
    const deleteResult = await db.execute(
      `DELETE FROM users WHERE role = 'admin' AND username != 'admin'`
    );
    console.log("Removed other admin accounts:", deleteResult.rowCount);
    
    // Display current users
    const users = await db.execute(`SELECT id, username, email, role FROM users`);
    console.log("Current users:");
    users.rows.forEach(user => {
      console.log(` - ${user.username} (${user.role})`);
    });
    
  } catch (error) {
    console.error("Error resetting admin account:", error);
  } finally {
    process.exit(0);
  }
}

resetAdminAccount();