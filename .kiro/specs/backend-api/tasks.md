# Implementation Plan: Xzeon Technologies Backend API

## Overview

This implementation plan breaks down the backend API development into discrete, incremental tasks. Each task builds on previous work, starting with project setup and progressing through database models, routes, controllers, services, and finally integration. The implementation uses JavaScript (Node.js) with Express.js, MongoDB, and Resend email service.

## Tasks

- [ ] 1. Initialize project structure and dependencies
  - Create `backend/` directory
  - Initialize npm project with `package.json`
  - Install dependencies: express, mongoose, resend, dotenv, cors, helmet, express-rate-limit, morgan, joi, compression
  - Install dev dependencies: nodemon
  - Create `.env` file with environment variables (MONGODB_URI, RESEND_API_KEY, PORT, FRONTEND_URL, WHATSAPP_BUSINESS_NUMBER)
  - Create `.gitignore` to exclude `node_modules/`, `.env`, and log files
  - Create directory structure: `config/`, `routes/`, `controllers/`, `models/`, `validators/`, `middleware/`, `services/`, `utils/`
  - _Requirements: 10.1, 10.6, 10.7_

- [ ] 2. Set up database and configuration
  - [ ] 2.1 Create database configuration module
    - Write `config/database.js` with MongoDB connection logic using Mongoose
    - Export `connectDatabase()` function that connects to MongoDB using `process.env.MONGODB_URI`
    - Add connection success and error logging
    - _Requirements: 10.5_
  
  - [ ] 2.2 Create Resend email client configuration
    - Write `config/resend.js` to initialize Resend client
    - Export configured Resend client using `process.env.RESEND_API_KEY`
    - _Requirements: 6.5_

- [ ] 3. Create Mongoose data models
  - [ ] 3.1 Create Contact model
    - Write `models/Contact.js` with Mongoose schema
    - Fields: name (String, required), email (String, required), phone (String), company (String), service (String, required), budget (String), message (String, required), status (String, default "new"), createdAt (Date, default now)
    - Add indexes on email and createdAt
    - _Requirements: 8.1_
  
  - [ ] 3.2 Create Newsletter model
    - Write `models/Newsletter.js` with Mongoose schema
    - Fields: email (String, required, unique), subscribedAt (Date, default now)
    - Add unique index on email
    - _Requirements: 8.2_
  
  - [ ] 3.3 Create Booking model
    - Write `models/Booking.js` with Mongoose schema
    - Fields: name (String, required), email (String, required), datetime (Date, required), projectType (String, required), notes (String), createdAt (Date, default now)
    - Add indexes on email and datetime
    - _Requirements: 8.3_
  
  - [ ] 3.4 Create Project model
    - Write `models/Project.js` with Mongoose schema
    - Fields: title (String, required), category (String, required), description (String), technologies (Array), image (String), github (String), liveDemo (String), featured (Boolean, default false), createdAt (Date)
    - Add indexes on category and featured
    - _Requirements: 8.4_

- [ ] 4. Create Joi validation schemas
  - [ ] 4.1 Create contact form validation
    - Write `validators/contactValidation.js`
    - Define Joi schema for contact form with validation rules: name (required, 2-100 chars), email (required, valid format), phone (optional, valid format), company (optional, max 100), service (required, enum), budget (optional, enum), message (required, 10-2000 chars)
    - Export validation schema
    - _Requirements: 1.2, 7.4_
  
  - [ ] 4.2 Create newsletter validation
    - Write `validators/newsletterValidation.js`
    - Define Joi schema: email (required, valid format)
    - Export validation schema
    - _Requirements: 2.2_
  
  - [ ] 4.3 Create booking validation
    - Write `validators/bookingValidation.js`
    - Define Joi schema: name (required, 2-100 chars), email (required, valid format), preferredDate (required, ISO date), preferredTime (required, time format), projectType (required, enum), notes (optional, max 500)
    - Export validation schema
    - _Requirements: 3.2_

- [ ] 5. Create middleware components
  - [ ] 5.1 Create validation middleware
    - Write `middleware/validateRequest.js`
    - Implement middleware factory that accepts Joi schema and validates req.body
    - Return 400 with error details if validation fails
    - Call next() if validation succeeds
    - _Requirements: 7.4_
  
  - [ ] 5.2 Create rate limiter middleware
    - Write `middleware/rateLimiter.js`
    - Configure express-rate-limit: 100 requests per 15 minutes
    - Return JSON error response on rate limit exceeded
    - _Requirements: 7.3_
  
  - [ ] 5.3 Create error handler middleware
    - Write `middleware/errorHandler.js`
    - Implement global error handler that logs errors and returns standardized JSON response
    - Sanitize error messages in production (hide stack traces)
    - Set appropriate HTTP status codes (400, 404, 500)
    - _Requirements: 7.5_
  
  - [ ] 5.4 Create 404 not found handler
    - Write `middleware/notFound.js`
    - Return JSON response with success: false and 404 status
    - _Requirements: 7.6_

- [ ] 6. Create utility and service modules
  - [ ] 6.1 Create response utility helpers
    - Write `utils/response.js`
    - Implement `successResponse(res, message, data, statusCode)` helper
    - Implement `errorResponse(res, message, errors, statusCode)` helper
    - Export both functions
    - _Requirements: 9.6_
  
  - [ ] 6.2 Create email service
    - Write `services/emailService.js`
    - Implement `sendContactEmail(contactData, recipientEmail)` - sends inquiry to team
    - Implement `sendConfirmationEmail(clientEmail, clientName)` - sends confirmation to client
    - Implement `sendBookingEmail(bookingData)` - sends booking confirmation
    - Implement `sendNewsletterWelcome(subscriberEmail)` - sends welcome email
    - All functions use Resend client and return promises
    - Add error logging for failed emails
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_
  
  - [ ] 6.3 Create WhatsApp service
    - Write `services/whatsappService.js`
    - Implement `generateWhatsAppURL(name, business, budget)` function
    - Generate pre-filled WhatsApp message and encode URL
    - Use `process.env.WHATSAPP_BUSINESS_NUMBER`
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 7. Checkpoint - Verify core modules
  - Run `node -c` checks on all created files to verify syntax
  - Ensure all imports/exports are correct
  - Confirm environment variables are properly referenced

- [ ] 8. Create controllers
  - [ ] 8.1 Create contact controller
    - Write `controllers/contactController.js`
    - Implement `submitContact` async function
    - Extract contact data from req.body, save to Contact model
    - Call emailService.sendContactEmail() and sendConfirmationEmail()
    - Return success JSON response
    - Handle errors with try-catch
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 1.6, 1.8_
  
  - [ ] 8.2 Create newsletter controller
    - Write `controllers/newsletterController.js`
    - Implement `subscribe` async function
    - Check if email exists in Newsletter collection
    - If exists, return 409 with "already subscribed" message
    - If new, save to Newsletter model and send welcome email
    - Return success JSON response
    - _Requirements: 2.1, 2.3, 2.4, 2.5, 2.6_
  
  - [ ] 8.3 Create booking controller
    - Write `controllers/bookingController.js`
    - Implement `createBooking` async function
    - Combine preferredDate and preferredTime into datetime field
    - Save to Booking model
    - Call emailService.sendBookingEmail()
    - Return success JSON response with booking details
    - _Requirements: 3.1, 3.3, 3.4, 3.5_
  
  - [ ] 8.4 Create project controller
    - Write `controllers/projectController.js`
    - Implement `getProjects` async function
    - Query all projects from Project model
    - If empty, return mock/seed data (hardcoded array of sample projects)
    - Return success JSON response with projects array
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 9. Create API routes
  - [ ] 9.1 Create contact routes
    - Write `routes/contactRoutes.js`
    - Define POST / route with validateRequest(contactValidation) middleware
    - Connect to contactController.submitContact
    - Export router
    - _Requirements: 9.1_
  
  - [ ] 9.2 Create newsletter routes
    - Write `routes/newsletterRoutes.js`
    - Define POST / route with validateRequest(newsletterValidation) middleware
    - Connect to newsletterController.subscribe
    - Export router
    - _Requirements: 9.2_
  
  - [ ] 9.3 Create booking routes
    - Write `routes/bookingRoutes.js`
    - Define POST / route with validateRequest(bookingValidation) middleware
    - Connect to bookingController.createBooking
    - Export router
    - _Requirements: 9.3_
  
  - [ ] 9.4 Create project routes
    - Write `routes/projectRoutes.js`
    - Define GET / route with no validation
    - Connect to projectController.getProjects
    - Export router
    - _Requirements: 9.4_

- [ ] 10. Create server entry point
  - Write `server.js`
  - Load dotenv at the top
  - Import database connection, routes, middleware
  - Create Express app
  - Apply middleware in order: Helmet → CORS (with frontend origin) → Morgan → compression → express.json()
  - Apply rate limiter to all `/api/*` routes
  - Mount routes: `/api/contact` → contactRoutes, `/api/newsletter` → newsletterRoutes, `/api/booking` → bookingRoutes, `/api/projects` → projectRoutes
  - Apply 404 handler and error handler middleware
  - Connect to database and start server on configured PORT
  - Log server start message
  - _Requirements: 10.2, 10.3, 10.5, 7.1, 7.2, 7.3_

- [ ] 11. Add npm scripts to package.json
  - Add `"start": "node server.js"` for production
  - Add `"dev": "nodemon server.js"` for development with auto-restart
  - Add `"test": "echo \"No tests specified yet\" && exit 0"` placeholder
  - _Requirements: 10.1_

- [ ] 12. Checkpoint - Test server startup
  - Set environment variables in `.env`
  - Run `npm run dev` to start development server
  - Verify server starts without errors
  - Verify MongoDB connection succeeds
  - Verify all routes are registered
  - Stop server

- [ ]* 13. Write unit tests for validators
  - Create `__tests__/validators/` directory
  - Test contactValidation with valid and invalid inputs (missing fields, invalid email, short message)
  - Test newsletterValidation with valid and invalid emails
  - Test bookingValidation with valid and invalid date/time formats
  - Use Jest framework
  - _Requirements: 1.2, 2.2, 3.2, 7.4_

- [ ]* 14. Write unit tests for services
  - Create `__tests__/services/` directory
  - Test emailService functions with mocked Resend client
  - Test whatsappService.generateWhatsAppURL with various inputs
  - Verify correct URL encoding and message format
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 6.4_

- [ ]* 15. Write integration tests for API endpoints
  - Create `__tests__/integration/` directory
  - Use supertest library for HTTP testing
  - Use mongodb-memory-server for isolated database testing
  - Test POST /api/contact with valid data returns 200
  - Test POST /api/contact with invalid data returns 400
  - Test POST /api/newsletter with duplicate email returns 409
  - Test POST /api/booking with valid data returns 200
  - Test GET /api/projects returns array of projects
  - Test rate limiter (send 101 requests, verify 429 on 101st)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 7.3_

- [ ] 16. Create sample seed data for projects
  - Create `utils/seedProjects.js` script
  - Define array of 5-10 sample projects with all fields (title, category, description, technologies, image URLs, github, liveDemo)
  - Export seed function that inserts projects into database if Projects collection is empty
  - Optionally run seed script to populate database
  - _Requirements: 4.2, 4.4_

- [ ] 17. Final integration and documentation
  - [ ] 17.1 Test all endpoints with Postman or similar tool
    - Send POST request to /api/contact with valid data
    - Send POST request to /api/newsletter with email
    - Send POST request to /api/booking with booking details
    - Send GET request to /api/projects
    - Verify all responses have correct structure
    - Verify emails are sent (check Resend dashboard)
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ] 17.2 Create README.md documentation
    - Document environment variables required
    - Document how to install dependencies (`npm install`)
    - Document how to run development server (`npm run dev`)
    - Document API endpoints with example requests/responses
    - Document deployment instructions
    - _Requirements: 10.6_
  
  - [ ] 17.3 Test CORS and security headers
    - Verify OPTIONS preflight requests work
    - Verify Helmet headers are present in responses
    - Verify rate limiting works correctly
    - _Requirements: 7.1, 7.2, 7.3_

- [ ] 18. Final checkpoint - End-to-end verification
  - Start backend server
  - Open frontend in browser
  - Submit contact form from frontend and verify it reaches backend
  - Subscribe to newsletter from frontend
  - Verify all API integrations work end-to-end
  - Check MongoDB that records are saved correctly
  - Check Resend dashboard that emails were sent
  - Verify no errors in server logs

## Notes

- Tasks marked with `*` are optional test-related tasks that can be skipped for faster MVP delivery
- Each controller task includes error handling with try-catch blocks
- All validation is handled by Joi schemas before reaching controllers
- Email sending failures are logged but don't block request success (graceful degradation)
- Environment variables must be set before running the server
- Use MongoDB Atlas for production database hosting
- For production deployment, consider using PM2 process manager
- Future migration to Next.js will involve moving controller logic into Next.js API routes
