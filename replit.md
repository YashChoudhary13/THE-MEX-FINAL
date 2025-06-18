# Restaurant Ordering System (The Mex)

## Overview

This is a full-stack restaurant ordering system built for "The Mex" - a Mexican-inspired fast food restaurant. The application provides a modern, responsive web interface for customers to browse the menu, place orders, and track their delivery status, along with a comprehensive admin dashboard for restaurant management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Context API for cart and notifications, TanStack Query for server state
- **Styling**: Tailwind CSS with custom design system using shadcn/ui components
- **Animations**: Framer Motion for smooth UI transitions
- **Mobile Support**: Responsive design with dedicated mobile components

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript for type safety
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local strategy and bcrypt for password hashing
- **Session Management**: Express sessions with PostgreSQL store
- **Real-time Updates**: WebSocket integration for order status updates

### Database Design
- **ORM**: Drizzle with PostgreSQL dialect
- **Schema Location**: `shared/schema.ts` for type sharing between client and server
- **Key Tables**: users, menu_categories, menu_items, orders, special_offers, promo_codes, system_settings
- **Migration Strategy**: Drizzle Kit for schema migrations

## Key Components

### Customer-Facing Features
1. **Menu Browsing**: Categorized menu with search and filtering capabilities
2. **Shopping Cart**: Persistent cart with local storage, promo code support
3. **Checkout System**: Multi-step checkout with delivery information collection
4. **Payment Integration**: Stripe integration for secure payment processing
5. **Order Tracking**: Real-time order status updates with WebSocket connection
6. **User Accounts**: Registration, login, password reset functionality

### Admin Dashboard
1. **Order Management**: Real-time order monitoring and status updates
2. **Menu Management**: CRUD operations for categories and menu items
3. **Promo Code System**: Create and manage discount codes
4. **Special Offers**: Manage daily specials and featured items
5. **System Settings**: Configure restaurant-wide settings

### Real-time Features
1. **Order Status Updates**: WebSocket connections for live order tracking
2. **Admin Notifications**: Real-time order notifications for kitchen staff
3. **Push Notifications**: Browser notifications for order confirmations

## Data Flow

1. **Order Placement**: Customer adds items to cart → proceeds to checkout → enters delivery info → processes payment → order created
2. **Order Processing**: Admin receives order → updates status → customer receives real-time updates
3. **Menu Management**: Admin creates/updates menu items → changes reflected immediately on customer interface
4. **User Authentication**: Login/register → session stored → protected routes accessible

## External Dependencies

### Payment Processing
- **Stripe**: Secure payment processing with client-side Elements integration
- **Configuration**: Requires STRIPE_SECRET_KEY and VITE_STRIPE_PUBLIC_KEY environment variables

### Notifications
- **Real-time Updates**: WebSocket connections for live order status updates
- **Toast Messages**: In-app notifications for user interactions and order confirmations

### Database Hosting
- **Neon Database**: Serverless PostgreSQL hosting
- **Configuration**: Requires DATABASE_URL environment variable

## Deployment Strategy

### Environment Configuration
- **Development**: Local development with hot reloading via Vite
- **Production**: Optimized build with static asset serving
- **Platform**: Configured for Replit deployment with autoscaling

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations ensure schema synchronization

### Scaling Considerations
- **Database**: Connection pooling with Neon serverless
- **Static Assets**: Served efficiently through Express
- **WebSocket**: In-memory connection management (consider Redis for multi-instance scaling)

## Changelog

```
Changelog:
- June 17, 2025. Initial setup
- June 18, 2025. Fixed WebSocket connection issues with proper URL construction
- June 18, 2025. Implemented Track Order button functionality with correct order ID routing
- June 18, 2025. Resolved Stripe console errors (ad blocker blocking analytics is safe to ignore)
- June 18, 2025. Eliminated localhost:undefined WebSocket fallback issues completely
- June 18, 2025. Fixed duplicate WebSocket connections in LiveStatsDisplay component
- June 18, 2025. Removed entire notification system including NotificationContext and service worker
- June 18, 2025. Completely removed Twilio SMS and SendGrid email notification systems
- June 18, 2025. Fixed admin dashboard crashes by restoring missing formatDublinTime and formatCurrency functions
- June 18, 2025. Implemented tabbed Recent Orders showing last 30 days with comprehensive order details
- June 18, 2025. Added daily reset order numbering system with separate today's order management
- June 18, 2025. Enhanced database schema with dailyOrderNumber, paymentReference, and completedAt fields
- June 18, 2025. Fixed order number consistency across all views (success page, admin dashboard, order confirmation)
- June 18, 2025. Restored original OrderManager functionality limited to today's orders only with real-time updates
- June 18, 2025. Fixed checkout success page to properly display daily order numbers and maintain flow
- June 18, 2025. Deployed comprehensive image management system for menu items:
  * Fixed database schema to make image field nullable (removed NOT NULL constraint)
  * Integrated advanced image management UI in both Add and Edit menu item forms
  * Implemented file upload with drag & drop interface (PNG, JPG, GIF up to 5MB)
  * Added real-time image preview with size, aspect ratio, and fit mode controls
  * Replaced old "Image URL Required" field with optional image system
  * Enhanced visual editing experience with image customization options
  * Fixed backend to accept menu items without images
- June 18, 2025. Fixed date parsing in special offers form:
  * Updated form submission to convert date strings to proper Date objects
  * Enhanced schema validation with z.coerce.date() for proper type conversion
  * Resolved JavaScript Date object conversion issues in Today's Special form
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```