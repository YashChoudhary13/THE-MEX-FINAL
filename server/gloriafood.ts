import { Request, Response } from 'express';
import { storage } from './storage';

// GloriaFood webhook handlers
export class GloriaFoodService {
  
  // Handle incoming orders from GloriaFood
  static async handleOrderWebhook(req: Request, res: Response) {
    try {
      const orderData = req.body;
      
      console.log('Received GloriaFood order:', orderData);
      
      // Transform GloriaFood order format to our internal format
      const transformedOrder = {
        customerName: orderData.customer?.first_name + ' ' + orderData.customer?.last_name,
        customerEmail: orderData.customer?.email || '',
        customerPhone: orderData.customer?.phone || '',
        deliveryAddress: orderData.address?.full_address || '',
        city: orderData.address?.city || '',
        zipCode: orderData.address?.zipcode || '',
        subtotal: parseFloat(orderData.subtotal || orderData.total_price || '0'),
        deliveryFee: parseFloat(orderData.delivery_fee || '0'),
        tax: parseFloat(orderData.tax || '0'),
        total: parseFloat(orderData.total_price || '0'),
        items: JSON.stringify(orderData.items || []),
        status: 'pending',
        paymentStatus: orderData.payment_status || 'paid',
        gloriaFoodOrderId: orderData.id
      };
      
      // Save order to our database
      const order = await storage.createOrder(transformedOrder);
      
      res.status(200).json({ success: true, orderId: order.id });
    } catch (error) {
      console.error('Error processing GloriaFood order:', error);
      res.status(500).json({ error: 'Failed to process order' });
    }
  }
  
  // Sync menu from GloriaFood
  static async syncMenu() {
    try {
      if (!process.env.GLORIAFOOD_API_KEY || !process.env.GLORIAFOOD_RESTAURANT_ID) {
        console.log('GloriaFood credentials not found - using current menu data');
        return true;
      }
      
      // Clear existing menu items and categories first
      console.log('Clearing existing menu data...');
      
      const response = await fetch(`https://api.gloriafood.com/v2/restaurants/${process.env.GLORIAFOOD_RESTAURANT_ID}/menu`, {
        headers: {
          'Authorization': `Bearer ${process.env.GLORIAFOOD_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GloriaFood API error: ${response.status}`);
      }
      
      const menuData = await response.json();
      console.log('Received menu data from GloriaFood:', menuData);
      
      // Transform and sync menu categories and items
      for (const category of menuData.categories || []) {
        console.log(`Processing category: ${category.name}`);
        
        // Create category if it doesn't exist
        let categoryData = await storage.getMenuCategoryBySlug(category.slug || category.name.toLowerCase());
        
        if (!categoryData) {
          categoryData = await storage.createMenuCategory({
            name: category.name,
            slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-')
          });
        }
        
        // Sync menu items for this category
        for (const item of category.items || []) {
          console.log(`Processing item: ${item.name}`);
          
          try {
            await storage.createMenuItem({
              name: item.name,
              description: item.description || '',
              price: parseFloat(item.price || '0'),
              categoryId: categoryData.id,
              image: item.image_url || item.image || '',
              featured: item.featured || false,
              prepTime: item.prep_time || 15
            });
          } catch (error) {
            console.log(`Item ${item.name} may already exist, skipping...`);
          }
        }
      }
      
      console.log('Menu synced successfully from GloriaFood');
      return true;
    } catch (error) {
      console.error('Error syncing menu from GloriaFood:', error);
      return false;
    }
  }
  
  // Send order to GloriaFood
  static async sendOrderToGloriaFood(orderData: any) {
    try {
      if (!process.env.GLORIAFOOD_API_KEY || !process.env.GLORIAFOOD_RESTAURANT_ID) {
        throw new Error('GloriaFood credentials not configured');
      }
      
      const response = await fetch(`https://api.gloriafood.com/v2/restaurants/${process.env.GLORIAFOOD_RESTAURANT_ID}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GLORIAFOOD_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        throw new Error(`GloriaFood API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending order to GloriaFood:', error);
      throw error;
    }
  }
}