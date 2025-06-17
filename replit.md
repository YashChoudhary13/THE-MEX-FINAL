# The Mex - Mexican Fast Food Restaurant Application

## Overview

The Mex is a full-stack web application for a Mexican fast food restaurant, offering online ordering, real-time order tracking, and admin management capabilities. The application features a modern React frontend with Express.js backend, PostgreSQL database with Drizzle ORM, and integrations with external services for payments and notifications.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **State Management**: React Context API for global state (Cart, Auth, Notifications)
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for smooth UI interactions
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Authentication**: Passport.js with local strategy and session-based auth
- **Real-time Communication**: WebSocket server for order status updates
- **API Design**: RESTful endpoints with consistent error handling

### Database Architecture
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Modular schema definitions in shared directory
- **Migrations**: Database migrations managed through Drizzle Kit

## Key Components

### Core Features
1. **Menu Management**: Categories and items with rich metadata (price, images, dietary info)
2. **Shopping Cart**: Persistent cart with promo code support
3. **Order Processing**: Complete checkout flow with order tracking
4. **User Authentication**: Registration, login, password reset functionality
5. **Admin Dashboard**: Complete management interface for orders, menu, and promotions

### External Integrations
1. **GloriaFood**: Primary ordering system integration via webhooks
2. **Stripe**: Payment processing (configured but using GloriaFood as primary)
3. **SendGrid**: Email notifications for password resets
4. **Twilio**: SMS notifications for order updates

### Real-time Features
- WebSocket connections for live order status updates
- Browser push notifications for order confirmations
- Real-time admin dashboard updates

## Data Flow

### Order Processing Flow
1. Customer adds items to cart from menu
2. Checkout process collects customer information
3. Order submitted to backend and stored in database
4. GloriaFood webhook integration processes payment
5. Real-time updates sent to customer and admin via WebSocket
6. SMS/email notifications sent for status changes

### Authentication Flow
1. User registration/login via forms
2. Passport.js handles authentication with bcrypt password hashing
3. Session-based authentication with PostgreSQL session store
4. Role-based access control (customer/admin)

### Menu Management Flow
1. Admin creates/updates menu categories and items
2. Images handled via URL input or base64 upload
3. Real-time updates to frontend via React Query cache invalidation
4. Optional integration with GloriaFood menu sync

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **passport**: Authentication middleware
- **bcryptjs**: Password hashing

### UI/UX Dependencies
- **@radix-ui/**: Comprehensive UI component primitives
- **tailwindcss**: Utility-first CSS framework
- **framer-motion**: Animation library
- **lucide-react**: Icon library

### Integration Dependencies
- **@sendgrid/mail**: Email service
- **twilio**: SMS service
- **@stripe/stripe-js**: Payment processing
- **ws**: WebSocket implementation

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Database**: Drizzle migrations applied via `npm run db:push`

### Environment Configuration
- **Development**: `npm run dev` starts both frontend and backend
- **Production**: `npm run start` serves built application
- **Database**: Requires `DATABASE_URL` environment variable

### Replit Configuration
- **Modules**: nodejs-20, web, postgresql-16
- **Port**: Application runs on port 5000
- **Deployment**: Configured for Replit's autoscale deployment target

## Changelog

```
Changelog:
- June 17, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```