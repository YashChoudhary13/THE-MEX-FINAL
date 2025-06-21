import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";
// redis.ts
import { createClient } from "redis";
import dotenv from 'dotenv';
dotenv.config();


neonConfig.fetchConnectionCache = true; 

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export const redis = createClient({
  url: process.env.REDIS_URL,
});



export async function initRedis() {
  redis.on("error", (err) => console.error("Redis Client Error", err));
  await redis.connect();
}

// Push the schema to the database on server start
export async function syncSchema() {
  try {
    console.log('Syncing database schema...');
    
    // Add user_id and created_at columns to orders table if they don't exist
    try {
      await db.execute(`
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER;
        ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
      `);
      console.log('Ensured user_id and created_at columns exist in orders table');
    } catch (error) {
      console.error('Error adding columns to orders table:', error);
    }
    
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
        items JSONB NOT NULL,
        user_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
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
    
    // Check if any menu categories exist
    const categoriesExist = await db.execute(
      `SELECT COUNT(*) FROM menu_categories`
    );
    type CountRow = { count: string };
    const [countRow] = categoriesExist.rows as CountRow[];
    const count = parseInt(countRow?.count || "0");
    if (count === 0) {
      console.log('No menu categories found. Creating default categories and menu items...');
      
      // Create categories
      await db.execute(`
        INSERT INTO menu_categories (name, slug) VALUES 
        ('Starters', 'starters'),
        ('Main Courses', 'main-courses'),
        ('Sides', 'sides'),
        ('Desserts', 'desserts'),
        ('Drinks', 'drinks')
      `);
      
      // Get the category IDs
      const categories = await db.execute(`SELECT id, slug FROM menu_categories`);
      const categoryMap = categories.rows.reduce((map, cat: any) => {
        map[cat.slug] = cat.id;
        return map;
      }, {} as Record<string, number>);

      
      // Create menu items
      await db.execute(`
        INSERT INTO menu_items (name, description, price, category_id, image, popular, label, rating, review_count) VALUES 
        ('Loaded Nachos', 'Crispy tortilla chips topped with melted cheese, jalapeños, guacamole, and sour cream.', 8.99, ${categoryMap['starters']}, 'https://images.unsplash.com/photo-1559847844-5315695dadae', TRUE, 'Popular', 5.0, 126),
        ('Crispy Calamari', 'Lightly battered calamari rings served with lemon aioli and marinara sauce.', 10.99, ${categoryMap['starters']}, 'https://images.unsplash.com/photo-1625944525533-473f1b3d9684', FALSE, NULL, 4.5, 84),
        ('Spinach Artichoke Dip', 'Creamy spinach and artichoke dip served with toasted bread and vegetable crudités.', 9.99, ${categoryMap['starters']}, 'https://images.unsplash.com/photo-1576506295286-5cda18df43e7', FALSE, NULL, 4.8, 92),
        
        ('Grilled Salmon', 'Fresh Atlantic salmon fillet, grilled to perfection, served with asparagus and lemon butter sauce.', 18.99, ${categoryMap['main-courses']}, 'https://images.unsplash.com/photo-1565299507177-b0ac66763828', FALSE, 'Healthy', 5.0, 156),
        ('Classic Burger', 'Juicy beef patty with lettuce, tomato, pickles, and our special sauce on a brioche bun. Served with fries.', 14.99, ${categoryMap['main-courses']}, 'https://images.unsplash.com/photo-1513104890138-7c749659a591', TRUE, 'Best Seller', 4.8, 209),
        ('Margherita Pizza', 'Hand-tossed pizza with tomato sauce, fresh mozzarella, basil, and extra virgin olive oil.', 15.99, ${categoryMap['main-courses']}, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002', TRUE, NULL, 4.7, 178),
        
        ('Truffle Fries', 'Crispy French fries tossed with truffle oil, parmesan cheese, and fresh herbs.', 6.99, ${categoryMap['sides']}, 'https://images.unsplash.com/photo-1639744093327-1aecff9c17b8', FALSE, NULL, 4.9, 112),
        ('Garlic Bread', 'Toasted bread with garlic butter and melted mozzarella cheese.', 5.99, ${categoryMap['sides']}, 'https://images.unsplash.com/photo-1619535860434-cf54aab1a60c', FALSE, NULL, 4.6, 87),
        
        ('Chocolate Lava Cake', 'Warm chocolate cake with a molten center, served with vanilla ice cream.', 7.99, ${categoryMap['desserts']}, 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51', TRUE, 'Popular', 4.9, 143),
        ('New York Cheesecake', 'Creamy classic cheesecake with graham cracker crust and berry compote.', 8.99, ${categoryMap['desserts']}, 'https://images.unsplash.com/photo-1567171466295-4afa63d45416', FALSE, NULL, 4.8, 124),
        
        ('Signature Cocktail', 'House special cocktail with premium spirits, fresh juice, and aromatic bitters.', 12.99, ${categoryMap['drinks']}, 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b', TRUE, 'Signature', 4.9, 98),
        ('Fresh Berry Smoothie', 'Blend of seasonal berries, yogurt, and honey.', 6.99, ${categoryMap['drinks']}, 'https://images.unsplash.com/photo-1553530666-ba11a90a0868', FALSE, 'Healthy', 4.7, 76)
      `);
      
      console.log('Default menu categories and items created successfully');
    }

    console.log('Database schema synced successfully');
    return true;
  } catch (error) {
    console.error('Error syncing database schema:', error);
    return false;
  }
}