import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Push the schema to the database on server start
export async function syncSchema() {
  try {
    console.log('Syncing database schema...');
    
    // Create the tables if they don't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS menu_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price DOUBLE PRECISION NOT NULL,
        category_id INTEGER NOT NULL,
        image TEXT NOT NULL,
        popular BOOLEAN DEFAULT FALSE,
        label TEXT,
        rating DOUBLE PRECISION DEFAULT 5.0,
        review_count INTEGER DEFAULT 0,
        ingredients TEXT,
        calories TEXT,
        allergens TEXT,
        dietary_info TEXT[]
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email TEXT,
        customer_phone TEXT NOT NULL,
        delivery_address TEXT NOT NULL,
        city TEXT NOT NULL,
        zip_code TEXT NOT NULL,
        delivery_instructions TEXT,
        subtotal DOUBLE PRECISION NOT NULL,
        delivery_fee DOUBLE PRECISION NOT NULL,
        tax DOUBLE PRECISION NOT NULL,
        total DOUBLE PRECISION NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        items JSONB NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS special_offers (
        id SERIAL PRIMARY KEY,
        menu_item_id INTEGER NOT NULL,
        discount_type TEXT NOT NULL DEFAULT 'percentage',
        discount_value DOUBLE PRECISION NOT NULL,
        original_price DOUBLE PRECISION NOT NULL,
        special_price DOUBLE PRECISION NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        start_date TIMESTAMP DEFAULT NOW(),
        end_date TIMESTAMP
      );
    `);
    
    // Insert admin user if it doesn't exist
    const adminExists = await db.execute(
      `SELECT * FROM users WHERE username = 'admin'`
    );
    
    if (!adminExists.rows || adminExists.rows.length === 0) {
      await db.execute(
        `INSERT INTO users (username, password, role) VALUES ('admin', '$2b$10$qzfJKARQo5AF.jTXEBFpK.TLvVGSLEEbB6vqdVJiYI/COGThaRBDW', 'admin')`
      );
      console.log('Admin user created successfully');
    }

    console.log('Database schema synced successfully');
    return true;
  } catch (error) {
    console.error('Error syncing database schema:', error);
    return false;
  }
}