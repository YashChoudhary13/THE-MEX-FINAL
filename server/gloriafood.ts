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
        items: JSON.stringify(orderData.items || []),
        total: parseFloat(orderData.total_price || '0'),
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
        throw new Error('GloriaFood credentials not configured');
      }
      
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
      
      // Transform and sync menu categories and items
      for (const category of menuData.categories || []) {
        // Create or update category
        const existingCategory = await storage.getMenuCategoryBySlug(category.slug);
        
        if (!existingCategory) {
          await storage.createMenuCategory({
            name: category.name,
            slug: category.slug,
            description: category.description || ''
          });
        }
        
        // Sync menu items for this category
        for (const item of category.items || []) {
          const categoryData = await storage.getMenuCategoryBySlug(category.slug);
          if (categoryData) {
            await storage.createMenuItem({
              name: item.name,
              description: item.description || '',
              price: parseFloat(item.price || '0'),
              categoryId: categoryData.id,
              image: item.image_url || '',
              featured: item.featured || false,
              prepTime: item.prep_time || 15
            });
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