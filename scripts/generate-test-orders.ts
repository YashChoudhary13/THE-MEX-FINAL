import { db } from "../server/db";
import { orders } from "@shared/schema";

async function generateTestOrders() {
  console.log("Generating 30 test orders across the past 2 months...");
  
  const now = new Date();
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(now.getMonth() - 2);
  
  const statuses = ['completed', 'pending', 'cancelled', 'processing', 'ready'];
  const statusWeights = [0.7, 0.15, 0.05, 0.05, 0.05]; // 70% completed, others distributed
  
  const customerNames = [
    "John Smith", "Sarah Johnson", "Michael Brown", "Emma Wilson", "David Lee",
    "Lisa Chen", "Robert Davis", "Maria Garcia", "James Miller", "Jennifer Taylor",
    "Christopher Moore", "Amanda White", "Daniel Anderson", "Jessica Thomas",
    "Matthew Jackson", "Ashley Martin", "Andrew Clark", "Michelle Rodriguez",
    "Joshua Lewis", "Stephanie Walker", "Ryan Hall", "Nicole Allen", "Kevin Young",
    "Rachel King", "Brandon Wright", "Melissa Scott", "Tyler Green", "Laura Adams",
    "Jonathan Baker", "Rebecca Turner"
  ];
  
  const cities = ["Dublin", "Cork", "Galway", "Limerick", "Waterford"];
  const menuItems = [
    { id: 5, name: "Classic Burger", price: 14.99 },
    { id: 6, name: "Chicken Wrap", price: 12.99 },
    { id: 7, name: "Fish Tacos", price: 16.99 },
    { id: 8, name: "Veggie Bowl", price: 13.99 },
    { id: 9, name: "BBQ Ribs", price: 22.99 }
  ];
  
  function getRandomStatus(): string {
    const random = Math.random();
    let cumulative = 0;
    for (let i = 0; i < statuses.length; i++) {
      cumulative += statusWeights[i];
      if (random <= cumulative) {
        return statuses[i];
      }
    }
    return statuses[0];
  }
  
  function getRandomTimestamp(): Date {
    const start = twoMonthsAgo.getTime();
    const end = now.getTime();
    const randomTime = start + Math.random() * (end - start);
    return new Date(randomTime);
  }
  
  function generateRandomOrder(index: number) {
    const customerName = customerNames[index];
    const city = cities[Math.floor(Math.random() * cities.length)];
    const status = getRandomStatus();
    const createdAt = getRandomTimestamp();
    
    // Generate 1-3 random items
    const numItems = Math.floor(Math.random() * 3) + 1;
    const orderItems = [];
    let subtotal = 0;
    
    for (let i = 0; i < numItems; i++) {
      const item = menuItems[Math.floor(Math.random() * menuItems.length)];
      const quantity = Math.floor(Math.random() * 2) + 1; // 1-2 quantity
      const itemTotal = item.price * quantity;
      subtotal += itemTotal;
      
      orderItems.push({
        id: item.id,
        quantity,
        price: item.price
      });
    }
    
    const deliveryFee = 2.99;
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + deliveryFee + tax;
    
    return {
      customerName,
      customerEmail: `${customerName.toLowerCase().replace(' ', '.')}@example.com`,
      customerPhone: `+353-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
      deliveryAddress: `${Math.floor(Math.random() * 999) + 1} ${['Main St', 'Oak Ave', 'Pine Rd', 'Church St', 'High St'][Math.floor(Math.random() * 5)]}`,
      city,
      zipCode: `${city.charAt(0)}${Math.floor(Math.random() * 99) + 10} ${['ABC', 'DEF', 'GHI', 'JKL'][Math.floor(Math.random() * 4)]}${Math.floor(Math.random() * 9) + 1}`,
      deliveryInstructions: Math.random() > 0.7 ? "Leave at door" : null,
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      status,
      items: orderItems,
      userId: null,
      createdAt
    };
  }
  
  try {
    for (let i = 0; i < 30; i++) {
      const orderData = generateRandomOrder(i);
      console.log(`Creating order ${i + 1}: ${orderData.customerName} - €${orderData.total} (${orderData.status}) - ${orderData.createdAt.toISOString()}`);
      
      await db.insert(orders).values(orderData);
    }
    
    console.log("✅ Successfully generated 30 test orders!");
    process.exit(0);
  } catch (error) {
    console.error("Error generating test orders:", error);
    process.exit(1);
  }
}

generateTestOrders();