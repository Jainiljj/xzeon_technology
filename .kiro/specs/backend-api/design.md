# Design Document - Xzeon Technologies Backend API

## Overview

This document details the technical design for a production-ready Node.js/Express REST API backend that serves the Xzeon Technologies agency website. The backend provides four core API endpoints (contact form submissions, newsletter subscriptions, booking requests, and project portfolio data), integrates email delivery via Resend, and stores data in MongoDB. The architecture follows a modular, controller-based pattern that aligns with Next.js API routes structure to facilitate future migration.

### Key Design Goals

1. **RESTful API Design**: Clean, predictable endpoints following REST conventions
2. **Modular Architecture**: Clear separation of concerns (routes → controllers → models → services)
3. **Security-First**: Helmet, CORS, rate limiting, input validation, environment variables
4. **Production-Ready**: Error handling, logging, compression, graceful database connections
5. **Migration-Friendly**: Structure compatible with Next.js API routes for future transition

### Technology Stack

- **Runtime**: Node.js (v18+ LTS recommended)
- **Framework**: Express.js (web server and routing)
- **Database**: MongoDB with Mongoose ODM
- **Email Service**: Resend (transactional email delivery)
- **Validation**: Joi (schema validation)
- **Security**: Helmet (HTTP headers), CORS, express-rate-limit
- **Logging**: Morgan (HTTP request logging)
- **Utilities**: dotenv (environment config), compression (response compression)

## Architecture

### High-Level Architecture

```
Frontend (HTML/CSS/JS) 
    ↓ Fetch API
REST API (Express.js)
    ↓
Controllers → Validators → Services → Models
    ↓                           ↓
External Services          MongoDB
(Resend Email)           (Data Storage)
```

### Request Flow

1. **Request Reception**: Frontend sends HTTP request to Express route
2. **Middleware Chain**: Request passes through security middleware (Helmet, CORS, rate limiter)
3. **Validation**: Joi validator checks request body schema
4. **Controller Logic**: Controller extracts data, calls services/models
5. **Business Logic**: Services handle complex operations (email sending, WhatsApp URL generation)
6. **Data Persistence**: Models interact with MongoDB via Mongoose
7. **Response**: Controller sends JSON response back to frontend

### Directory Structure

```
backend/
├── server.js                 # Application entry point
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables (not committed)
├── .gitignore                # Git exclusions
│
├── config/
│   ├── database.js           # MongoDB connection logic
│   └── resend.js             # Resend client initialization
│
├── routes/
│   ├── contactRoutes.js      # POST /api/contact
│   ├── newsletterRoutes.js   # POST /api/newsletter
│   ├── bookingRoutes.js      # POST /api/booking
│   └── projectRoutes.js      # GET /api/projects
│
├── controllers/
│   ├── contactController.js      # Handle contact form submissions
│   ├── newsletterController.js   # Handle newsletter subscriptions
│   ├── bookingController.js      # Handle booking requests
│   └── projectController.js      # Retrieve project portfolio data
│
├── models/
│   ├── Contact.js            # Mongoose schema for contacts
│   ├── Newsletter.js         # Mongoose schema for subscribers
│   ├── Booking.js            # Mongoose schema for bookings
│   └── Project.js            # Mongoose schema for projects
│
├── validators/
│   ├── contactValidation.js      # Joi schema for contact form
│   ├── bookingValidation.js      # Joi schema for bookings
│   └── newsletterValidation.js   # Joi schema for newsletter
│
├── middleware/
│   ├── validateRequest.js    # Validation middleware wrapper
│   ├── errorHandler.js       # Global error handler
│   ├── rateLimiter.js        # Rate limiting config
│   └── notFound.js           # 404 handler
│
├── services/
│   ├── emailService.js       # Resend email operations
│   ├── whatsappService.js    # WhatsApp URL generation
│   └── calendlyService.js    # Calendly integration (future)
│
└── utils/
    ├── logger.js             # Winston or console logger
    └── response.js           # Standardized response helpers
```

## Components and Interfaces

### 1. Server Entry Point (server.js)

**Responsibility**: Initialize Express app, configure middleware, register routes, connect to database, start server.

**Key Operations**:
- Load environment variables via dotenv
- Connect to MongoDB using database.js config
- Apply middleware in correct order: Helmet → CORS → Morgan → compression → express.json()
- Mount API routes under `/api` prefix
- Apply rate limiter to all `/api/*` routes
- Register 404 and error handling middleware
- Start server on configured port

**Pseudocode**:
```
FUNCTION initializeServer():
  LOAD environment variables from .env
  CONNECT to MongoDB
  
  CREATE Express app
  
  APPLY middleware:
    - Helmet (security headers)
    - CORS (allow frontend origin)
    - Morgan (HTTP logging)
    - Compression
    - express.json() (parse JSON bodies)
    - Rate limiter on /api/*
  
  REGISTER routes:
    - /api/contact → contactRoutes
    - /api/newsletter → newsletterRoutes
    - /api/booking → bookingRoutes
    - /api/projects → projectRoutes
  
  APPLY error handlers:
    - 404 not found
    - Global error handler
  
  START server on PORT
  LOG "Server running on port {PORT}"
```

### 2. Database Configuration (config/database.js)

**Responsibility**: Establish and manage MongoDB connection using Mongoose.

**Interface**:
```
FUNCTION connectDatabase():
  INPUT: MongoDB URI from environment variable
  OUTPUT: Connected Mongoose instance
  
  CONNECT to MongoDB with options:
    - useNewUrlParser: true
    - useUnifiedTopology: true
  
  ON success:
    LOG "MongoDB connected successfully"
  
  ON error:
    LOG error details
    EXIT process with code 1
```

### 3. Resend Configuration (config/resend.js)

**Responsibility**: Initialize and export Resend client for email operations.

**Interface**:
```
IMPORT Resend from 'resend'

CONST resendClient = NEW Resend(process.env.RESEND_API_KEY)

EXPORT resendClient
```

### 4. Routes

Each route file defines HTTP endpoints and connects them to controller functions.

**Example: contactRoutes.js**
```
IMPORT express.Router
IMPORT contactController
IMPORT validateRequest middleware
IMPORT contactValidation schema

CREATE router

POST /
  APPLY validateRequest(contactValidation)
  CALL contactController.submitContact

EXPORT router
```

### 5. Controllers

Controllers handle HTTP request/response logic, orchestrate business logic, and return JSON responses.

#### contactController.js

```
FUNCTION submitContact(req, res, next):
  TRY:
    EXTRACT { name, email, phone, company, service, budget, message } FROM req.body
    
    CREATE new Contact document with extracted data
    SAVE contact to MongoDB
    
    CALL emailService.sendContactEmail(contact data, team email)
    CALL emailService.sendConfirmationEmail(email, name)
    
    RETURN JSON response:
      success: true
      message: "Thank you! We'll respond within 24 hours."
  
  CATCH error:
    PASS error to next(error) for error handler
```

#### newsletterController.js

```
FUNCTION subscribe(req, res, next):
  TRY:
    EXTRACT { email } FROM req.body
    
    CHECK if email already exists in Newsletter collection
    IF exists:
      RETURN JSON response:
        success: false
        message: "This email is already subscribed."
    
    CREATE new Newsletter document with email
    SAVE to MongoDB
    
    CALL emailService.sendNewsletterWelcome(email)
    
    RETURN JSON response:
      success: true
      message: "Successfully subscribed!"
  
  CATCH error:
    PASS error to next(error)
```

#### bookingController.js

```
FUNCTION createBooking(req, res, next):
  TRY:
    EXTRACT { name, email, preferredDate, preferredTime, projectType } FROM req.body
    
    CREATE datetime from preferredDate + preferredTime
    
    CREATE new Booking document
    SAVE to MongoDB
    
    CALL emailService.sendBookingEmail(booking details)
    
    RETURN JSON response:
      success: true
      message: "Booking confirmed! We'll send calendar invite shortly."
      booking: { id, name, datetime }
  
  CATCH error:
    PASS error to next(error)
```

#### projectController.js

```
FUNCTION getProjects(req, res, next):
  TRY:
    QUERY all projects from Projects collection
    
    IF no projects found:
      RETURN mock/seed data
    
    RETURN JSON response:
      success: true
      data: projects array
  
  CATCH error:
    PASS error to next(error)
```

### 6. Models (Mongoose Schemas)

#### Contact Model

```
SCHEMA Contact:
  name: String (required, trim)
  email: String (required, lowercase, trim)
  phone: String (optional, trim)
  company: String (optional, trim)
  service: String (required)
  budget: String (optional)
  message: String (required)
  status: String (default: "new", enum: ["new", "contacted", "closed"])
  createdAt: Date (default: Date.now)
  
  INDEXES:
    - email (for searching)
    - createdAt (descending, for sorting)
```

#### Newsletter Model

```
SCHEMA Newsletter:
  email: String (required, unique, lowercase, trim)
  subscribedAt: Date (default: Date.now)
  
  INDEXES:
    - email (unique)
```

#### Booking Model

```
SCHEMA Booking:
  name: String (required, trim)
  email: String (required, lowercase, trim)
  datetime: Date (required)
  projectType: String (required)
  notes: String (optional)
  createdAt: Date (default: Date.now)
  
  INDEXES:
    - email
    - datetime
```

#### Project Model

```
SCHEMA Project:
  title: String (required)
  category: String (required, enum: ["web", "mobile", "ai", "software", "design"])
  description: String
  technologies: Array of Strings
  image: String (URL)
  github: String (URL, optional)
  liveDemo: String (URL, optional)
  featured: Boolean (default: false)
  createdAt: Date (default: Date.now)
  
  INDEXES:
    - category
    - featured
```

### 7. Validators (Joi Schemas)

#### contactValidation.js

```
SCHEMA contactSchema:
  name: string, required, min 2 chars, max 100 chars
  email: string, required, valid email format
  phone: string, optional, pattern: phone number format
  company: string, optional, max 100 chars
  service: string, required, valid options: [
    "Custom Software", "Web Development", "AI & Automation",
    "Mobile App", "UI/UX Design", "Other"
  ]
  budget: string, optional, valid options: [
    "Less than $5K", "$5K – $20K", "$20K – $50K", "$50K+", "Let's Discuss"
  ]
  message: string, required, min 10 chars, max 2000 chars
```

#### newsletterValidation.js

```
SCHEMA newsletterSchema:
  email: string, required, valid email format
```

#### bookingValidation.js

```
SCHEMA bookingSchema:
  name: string, required, min 2 chars, max 100 chars
  email: string, required, valid email format
  preferredDate: string, required, ISO date format
  preferredTime: string, required, time format (HH:MM)
  projectType: string, required, valid options: [
    "Custom Software", "Web Development", "AI & Automation",
    "Mobile App", "UI/UX Design", "Consultation", "Other"
  ]
  notes: string, optional, max 500 chars
```

### 8. Middleware

#### validateRequest.js

```
FUNCTION validateRequest(schema):
  RETURN async middleware function(req, res, next):
    TRY:
      VALIDATE req.body against schema
      IF valid:
        CALL next()
      ELSE:
        THROW validation error
    CATCH validation error:
      RETURN JSON response:
        success: false
        message: "Validation failed"
        errors: array of error messages
        status: 400
```

#### rateLimiter.js

```
IMPORT rateLimit from 'express-rate-limit'

EXPORT limiter = rateLimit({
  windowMs: 15 * 60 * 1000  // 15 minutes
  max: 100                    // 100 requests per window
  message: {
    success: false
    message: "Too many requests, please try again later."
  }
  standardHeaders: true
  legacyHeaders: false
})
```

#### errorHandler.js

```
FUNCTION errorHandler(err, req, res, next):
  LOG error details (stack trace, request info)
  
  DETERMINE status code:
    - IF err.statusCode exists: USE it
    - ELSE IF validation error: 400
    - ELSE IF not found: 404
    - ELSE: 500
  
  RETURN JSON response:
    success: false
    message: error message (sanitized for production)
    stack: error stack (only in development)
    status: status code
```

#### notFound.js

```
FUNCTION notFoundHandler(req, res, next):
  RETURN JSON response:
    success: false
    message: "Route not found"
    path: req.originalUrl
    status: 404
```

### 9. Services

#### emailService.js

**Responsibility**: Handle all email operations via Resend.

```
IMPORT resendClient from config/resend.js

FUNCTION sendContactEmail(contactData, recipientEmail):
  CONSTRUCT email:
    from: "Xzeon Technologies <notifications@xzeontechnologies.com>"
    to: recipientEmail (default: "xzenontechnologies@gmail.com")
    subject: "New Contact Form Submission"
    html: formatted HTML with contact details
  
  SEND via resendClient.emails.send()
  RETURN result

FUNCTION sendConfirmationEmail(clientEmail, clientName):
  CONSTRUCT email:
    from: "Xzeon Technologies <hello@xzeontechnologies.com>"
    to: clientEmail
    subject: "Thanks for reaching out!"
    html: personalized confirmation message
  
  SEND via resendClient.emails.send()
  RETURN result

FUNCTION sendBookingEmail(bookingData):
  CONSTRUCT email:
    from: "Xzeon Technologies <bookings@xzeontechnologies.com>"
    to: bookingData.email
    subject: "Booking Confirmation"
    html: booking details with calendar attachment option
  
  SEND via resendClient.emails.send()
  RETURN result

FUNCTION sendNewsletterWelcome(subscriberEmail):
  CONSTRUCT email:
    from: "Xzeon Technologies <newsletter@xzeontechnologies.com>"
    to: subscriberEmail
    subject: "Welcome to Xzeon Newsletter"
    html: welcome message with unsubscribe link
  
  SEND via resendClient.emails.send()
  RETURN result
```

#### whatsappService.js

**Responsibility**: Generate WhatsApp deep links with pre-filled messages.

```
FUNCTION generateWhatsAppURL(name, business, budget):
  CONST phoneNumber = "917340591251"  // India number without + or spaces
  
  CONST message = `Hello Xzeon Technologies,
I visited your website and I'm interested in your services.

Name: ${name}
Business: ${business}
Budget: ${budget}

Please contact me to discuss my project.

Thank you!`
  
  CONST encodedMessage = encodeURIComponent(message)
  CONST url = `https://wa.me/${phoneNumber}?text=${encodedMessage}`
  
  RETURN url
```

### 10. Utilities

#### response.js

**Responsibility**: Standardized response helper functions.

```
FUNCTION successResponse(res, message, data = null, statusCode = 200):
  RETURN res.status(statusCode).json({
    success: true,
    message: message,
    data: data
  })

FUNCTION errorResponse(res, message, errors = null, statusCode = 500):
  RETURN res.status(statusCode).json({
    success: false,
    message: message,
    errors: errors
  })
```

## Data Models

### Contact Document
```json
{
  "_id": "ObjectId",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1-555-0100",
  "company": "Acme Corp",
  "service": "Web Development",
  "budget": "$5K – $20K",
  "message": "We need a new website for our startup...",
  "status": "new",
  "createdAt": "2025-06-15T10:30:00.000Z"
}
```

### Newsletter Document
```json
{
  "_id": "ObjectId",
  "email": "subscriber@example.com",
  "subscribedAt": "2025-06-15T10:30:00.000Z"
}
```

### Booking Document
```json
{
  "_id": "ObjectId",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "datetime": "2025-06-20T14:00:00.000Z",
  "projectType": "Custom Software",
  "notes": "Looking to build a SaaS platform",
  "createdAt": "2025-06-15T10:30:00.000Z"
}
```

### Project Document
```json
{
  "_id": "ObjectId",
  "title": "E-Commerce Platform",
  "category": "web",
  "description": "Full-stack e-commerce solution with inventory management",
  "technologies": ["React", "Node.js", "MongoDB", "Stripe"],
  "image": "https://cdn.xzeon.tech/projects/ecommerce.jpg",
  "github": "https://github.com/xzeon/ecommerce",
  "liveDemo": "https://demo.xzeon-ecommerce.tech",
  "featured": true,
  "createdAt": "2025-05-01T10:00:00.000Z"
}
```

## Error Handling

### Error Types

1. **Validation Errors** (400 Bad Request)
   - Missing required fields
   - Invalid email format
   - Field length violations
   - Invalid enum values

2. **Duplicate Entry Errors** (409 Conflict)
   - Newsletter email already subscribed
   - MongoDB unique constraint violations

3. **Not Found Errors** (404 Not Found)
   - Undefined API routes
   - Resource not found

4. **Server Errors** (500 Internal Server Error)
   - Database connection failures
   - Email service failures
   - Unexpected exceptions

### Error Response Format

All errors follow this consistent structure:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": ["Array of specific error messages"],
  "status": 400
}
```

### Error Handling Strategy

1. **Try-Catch Blocks**: All async controller functions wrapped in try-catch
2. **Express Error Handler**: Global middleware catches all errors
3. **Sanitized Messages**: Production mode hides stack traces and sensitive info
4. **Logging**: All errors logged with context (user, endpoint, timestamp)
5. **Graceful Degradation**: Services fail gracefully (e.g., if email fails, contact still saved)

## Testing Strategy

### Unit Testing Approach

Given the nature of this backend API, testing will focus on:

1. **Controller Logic Tests**
   - Test each controller function with valid/invalid inputs
   - Mock database operations and external services
   - Verify correct response structure and status codes

2. **Validation Schema Tests**
   - Test Joi schemas with valid and invalid data
   - Verify all validation rules (required fields, formats, lengths)
   - Test edge cases (empty strings, special characters, SQL injection attempts)

3. **Service Function Tests**
   - Test email template generation
   - Test WhatsApp URL generation with various inputs
   - Mock external API calls (Resend)

4. **Integration Tests**
   - Test complete request flow (route → controller → database → response)
   - Use in-memory MongoDB (MongoDB Memory Server) for isolated testing
   - Test error handling paths

### Test Framework

- **Framework**: Jest (JavaScript testing framework)
- **Assertions**: Jest expect API
- **Mocking**: Jest mocks for database and external services
- **Coverage Target**: >80% code coverage for critical paths

### Example Test Cases

**Contact Controller Tests**:
- Valid contact submission returns 200 and success message
- Missing required field returns 400 with validation error
- Database error returns 500 with error message
- Email service failure still saves contact (logs error)

**Newsletter Controller Tests**:
- New subscription returns 200 and success message
- Duplicate email returns 409 with appropriate message
- Invalid email format returns 400 with validation error

**Validation Tests**:
- Invalid email format rejected
- Message too short rejected (< 10 chars)
- All required fields enforced
- Optional fields properly handled

### Why Property-Based Testing Is Not Applicable

This backend API is primarily concerned with **infrastructure integration** (MongoDB, Resend email service, HTTP endpoints) rather than pure algorithmic logic. The feature involves:

- **External service integration**: Database writes, email API calls
- **CRUD operations**: Simple create/read operations with no complex transformations
- **Configuration and wiring**: Setting up middleware, routes, environment variables

Property-based testing excels at finding edge cases in pure functions with complex input spaces (parsers, algorithms, data transformations). For this API:

- Input validation is handled by Joi schemas (already thoroughly tested)
- Database operations are tested by Mongoose (well-tested library)
- Email delivery is handled by Resend (external service)
- Controller logic is straightforward request handling

**Testing Strategy**: Use **example-based unit tests** for controller logic, **integration tests** for end-to-end flows (with 2-3 representative examples), and **schema validation tests** for input validation. This provides comprehensive coverage without the overhead of property-based testing where it doesn't add value.

## Security Considerations

### 1. HTTP Security Headers (Helmet)

Helmet sets various HTTP headers to protect against common vulnerabilities:
- Content-Security-Policy: Prevents XSS attacks
- X-Frame-Options: Prevents clickjacking
- X-Content-Type-Options: Prevents MIME sniffing
- Strict-Transport-Security: Enforces HTTPS

### 2. CORS Configuration

```javascript
cors({
  origin: process.env.FRONTEND_URL,  // Only allow frontend domain
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: false
})
```

### 3. Rate Limiting

- **API Rate Limit**: 100 requests per 15 minutes per IP
- **Prevents**: Brute force attacks, API abuse, DDoS attempts
- **Response**: 429 Too Many Requests with retry-after header

### 4. Input Validation

- **Joi Schemas**: Validate all input before processing
- **Sanitization**: Trim whitespace, lowercase emails
- **Type Checking**: Enforce expected data types
- **Length Limits**: Prevent buffer overflow attacks

### 5. Environment Variables

All sensitive data stored in `.env` file:
- `MONGODB_URI`: Database connection string
- `RESEND_API_KEY`: Email service API key
- `FRONTEND_URL`: Allowed CORS origin
- `PORT`: Server port
- `WHATSAPP_BUSINESS_NUMBER`: WhatsApp contact number

**Never commit `.env` to version control**

### 6. Error Message Sanitization

Production mode error responses hide:
- Stack traces
- Database structure details
- Internal file paths
- Sensitive configuration values

### 7. MongoDB Injection Prevention

Mongoose automatically escapes queries, but additional measures:
- Validate input types before queries
- Never pass user input directly to MongoDB operators
- Use parameterized queries

## Deployment Considerations

### Environment Setup

**Development**:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/xzeon
RESEND_API_KEY=re_dev_xxxxx
FRONTEND_URL=http://localhost:3000
TEAM_EMAIL=xzenontechnologies@gmail.com
WHATSAPP_BUSINESS_NUMBER=917340591251
BUSINESS_PHONE=+919166504708
```

**Production**:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/xzeon
RESEND_API_KEY=re_live_xxxxx
FRONTEND_URL=https://xzeontechnologies.com
TEAM_EMAIL=xzenontechnologies@gmail.com
WHATSAPP_BUSINESS_NUMBER=917340591251
BUSINESS_PHONE=+919166504708
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use MongoDB Atlas (cloud) instead of local MongoDB
- [ ] Enable MongoDB connection pooling
- [ ] Configure process manager (PM2) for auto-restart
- [ ] Set up monitoring (logs, error tracking)
- [ ] Enable HTTPS (reverse proxy via Nginx/Caddy)
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Review and tighten rate limits if needed

### Hosting Options

1. **VPS/Cloud**: DigitalOcean, AWS EC2, Linode
2. **Platform-as-a-Service**: Railway, Render, Fly.io
3. **Serverless**: AWS Lambda (requires adapter), Vercel (with limitations)

### Future Migration to Next.js

Current structure aligns with Next.js API routes:

**Current**: `routes/contactRoutes.js` → `controllers/contactController.js`  
**Next.js**: `pages/api/contact.js` or `app/api/contact/route.js`

Migration path:
1. Copy controller logic into Next.js API route handlers
2. Keep validators, models, services, utils unchanged
3. Adapt middleware to Next.js middleware pattern
4. Update environment variable access (process.env works same way)

This modular design minimizes refactoring during migration.

## Summary

This design provides a production-ready, secure, and maintainable REST API backend for the Xzeon Technologies website. The modular architecture with clear separation of concerns (routes, controllers, validators, models, services) ensures code organization, testability, and future extensibility. Security is built-in from the ground up with Helmet, CORS, rate limiting, and input validation. The structure intentionally mirrors Next.js patterns to facilitate smooth migration when needed.

Key architectural decisions:
- **Express + MongoDB**: Proven, widely-adopted stack
- **Resend for Email**: Modern, developer-friendly email API
- **Joi for Validation**: Declarative, comprehensive schema validation
- **Modular Services**: Email and WhatsApp logic isolated for reusability
- **Standard Error Handling**: Consistent JSON error responses across all endpoints
- **Environment-Based Config**: Secure, flexible configuration management

This backend will reliably serve the existing frontend and provide a solid foundation for future enhancements.
