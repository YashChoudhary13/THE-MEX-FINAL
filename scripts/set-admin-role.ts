import { db } from "../server/db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

async function setAdminRole() {
  try {
    const result = await db
      .update(users)
      .set({ role: "admin" })
      .where(eq(users.username, "admin1234"))
      .returning();
    
    if (result.length > 0) {
      console.log("✅ User admin1234 role set to admin:", result[0]);
    } else {
      console.log("❌ User admin1234 not found");
    }
  } catch (error) {
    console.error("❌ Error setting admin role:", error);
  } finally {
    process.exit(0);
  }
}

setAdminRole();
