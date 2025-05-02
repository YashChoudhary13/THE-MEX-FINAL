import twilio from 'twilio';
import { Order } from '@shared/schema';

// Check for required environment variables
const hasTwilioCredentials = !!process.env.TWILIO_ACCOUNT_SID && 
                             !!process.env.TWILIO_AUTH_TOKEN &&
                             !!process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client if credentials are available
let twilioClient: any = null;

if (hasTwilioCredentials) {
  twilioClient = new twilio(
    process.env.TWILIO_ACCOUNT_SID as string,
    process.env.TWILIO_AUTH_TOKEN as string
  );
  console.log('Twilio client initialized successfully');
} else {
  console.warn('Twilio credentials not found. SMS notifications will be disabled.');
}

/**
 * Send an SMS notification
 * @param to Phone number to send the message to
 * @param body Message body
 * @returns Promise that resolves when the message is sent
 */
export async function sendSMS(to: string, body: string): Promise<boolean> {
  if (!twilioClient) {
    console.warn('Twilio client not initialized. SMS will not be sent.');
    return false;
  }

  try {
    // Format the phone number to ensure it has the international format
    const formattedPhoneNumber = formatPhoneNumber(to);

    // Send the SMS
    const message = await twilioClient.messages.create({
      body: body,
      from: process.env.TWILIO_PHONE_NUMBER as string,
      to: formattedPhoneNumber
    });

    console.log(`SMS sent successfully. SID: ${message.sid}`);
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

/**
 * Format a phone number to ensure it has the proper format for Twilio
 * This is a simple implementation - in production, you might want to use a library like libphonenumber-js
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Add the + prefix if not already present
  if (!cleaned.startsWith('+')) {
    // If the number starts with 1, assume it's a US number
    if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = '+' + cleaned;
    }
    // Otherwise, assume US and add +1
    else if (cleaned.length === 10) {
      cleaned = '+1' + cleaned;
    } 
    // For other cases, just add +
    else {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

/**
 * Send an order status notification
 * @param order The order object
 * @param status The new status
 * @returns Promise that resolves when the notification is sent
 */
export async function sendOrderStatusNotification(order: Order, status: string): Promise<boolean> {
  if (!order.customerPhone) {
    console.warn('Cannot send SMS notification: No phone number provided for order #' + order.id);
    return false;
  }

  let message: string;

  switch (status) {
    case 'confirmed':
      message = `The Mex: Your order #${order.id} has been confirmed and will be prepared shortly.`;
      break;
    case 'preparing':
      message = `The Mex: Good news! Your order #${order.id} is now being prepared by our chefs.`;
      break;
    case 'ready':
      message = `The Mex: Your order #${order.id} is now ready for pickup! Please come to the restaurant to collect your food.`;
      break;
    case 'delivered':
      message = `The Mex: Your order #${order.id} has been marked as delivered. Enjoy your meal and thank you for choosing us!`;
      break;
    case 'cancelled':
      message = `The Mex: We're sorry, but your order #${order.id} has been cancelled. Please contact us for more information.`;
      break;
    default:
      message = `The Mex: Your order #${order.id} status has been updated to: ${status}.`;
      break;
  }

  return sendSMS(order.customerPhone, message);
}