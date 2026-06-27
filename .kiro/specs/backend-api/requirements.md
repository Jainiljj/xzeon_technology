# Requirements Document - Xzeon Technologies Backend API

## Introduction

This document defines the requirements for building a production-ready REST API backend for the Xzeon Technologies agency website. The backend will expose APIs that the existing HTML/CSS/JavaScript frontend can consume using the Fetch API, with architecture designed for future Next.js migration.

## Glossary

- **API**: Application Programming Interface - a set of endpoints that allow external systems to interact with the backend
- **Backend**: Server-side application handling API requests, business logic, and database operations
- **Mongoose**: MongoDB object modeling tool for Node.js
- **Resend**: Email delivery service for transactional emails
- **Frontend**: The existing HTML, CSS, and Vanilla JavaScript website
- **Rate Limiting**: Security measure to prevent API abuse by limiting request frequency
- **Validation**: Process of ensuring input data meets required standards
- **Middleware**: Functions that execute during the request-response cycle

## Requirements

### Requirement 1: Contact Form API

**User Story:** As a website visitor, I want to submit a contact inquiry form so that I can receive a response from the Xzeon team.

#### Acceptance Criteria

1. WHEN a POST request is received at /api/contact, THE Contact Controller SHALL extract name, email, phone, company, service, budget, and message fields from the request body
2. WHEN the contact form data is received, THE Validator SHALL validate that all required fields are present and properly formatted
3. WHEN validation succeeds, THE Contact Model SHALL store the inquiry in the Contacts MongoDB collection with a default status of "new"
4. WHEN the inquiry is stored successfully, THE Email Service SHALL send an email notification to the Xzeon team via Resend
5. WHEN the team notification is sent, THE Email Service SHALL send a confirmation email to the client
6. WHEN all operations complete successfully, THE Contact Controller SHALL return a JSON response with success: true and a confirmation message
7. WHEN validation fails, THE Contact Controller SHALL return a JSON response with success: false and an array of validation errors
8. IF an error occurs during processing, THE Error Handler SHALL log the error and return a JSON response with success: false and a descriptive error message

### Requirement 2: Newsletter Subscription API

**User Story:** As a website visitor, I want to subscribe to the Xzeon newsletter so that I receive updates about their services.

#### Acceptance Criteria

1. WHEN a POST request is received at /api/newsletter, THE Newsletter Controller SHALL extract the email field from the request body
2. WHEN the email is received, THE Validator SHALL validate that the email is a valid email address format
3. WHEN validation succeeds, THE Newsletter Model SHALL check if the email already exists in the collection
4. IF the email already exists, THE Newsletter Controller SHALL return a JSON response with success: false and a message indicating the email is already subscribed
5. IF the email does not exist, THE Newsletter Model SHALL store the email in the Newsletter MongoDB collection with the current timestamp
6. WHEN the subscription is successful, THE Newsletter Controller SHALL return a JSON response with success: true and a confirmation message

### Requirement 3: Booking API

**User Story:** As a potential client, I want to book a consultation appointment so that I can discuss my project requirements with Xzeon.

#### Acceptance Criteria

1. WHEN a POST request is received at /api/booking, THE Booking Controller SHALL extract name, email, preferredDate, preferredTime, and projectType from the request body
2. WHEN the booking data is received, THE Validator SHALL validate that all required fields are present and properly formatted
3. WHEN validation succeeds, THE Booking Model SHALL store the booking in the Bookings MongoDB collection with a createdAt timestamp
4. WHEN the booking is stored successfully, THE Email Service SHALL send a booking confirmation email to the client
5. WHEN all operations complete successfully, THE Booking Controller SHALL return a JSON response with success: true and booking confirmation details

### Requirement 4: Projects API

**User Story:** As a website visitor, I want to view Xzeon's portfolio projects so that I can evaluate their work quality.

#### Acceptance Criteria

1. WHEN a GET request is received at /api/projects, THE Project Controller SHALL retrieve project data from the Projects MongoDB collection
2. IF the Projects collection is empty, THE Project Controller SHALL return mock project data as a fallback
3. WHEN project data is retrieved, THE Project Controller SHALL return a JSON response with success: true and an array of project objects
4. EACH project object SHALL contain title, category, description, technologies, image, github, and liveDemo fields

### Requirement 5: WhatsApp Integration Service

**User Story:** As a website visitor, I want to contact Xzeon via WhatsApp with a pre-filled message so that I can easily start a conversation.

#### Acceptance Criteria

1. WHEN a user initiates WhatsApp contact, THE WhatsApp Service SHALL generate a WhatsApp URL with the format https://wa.me/{phoneNumber}?text={encodedMessage}
2. THE WhatsApp Service SHALL include the user's name, business name, and budget in the pre-filled message
3. THE pre-filled message SHALL follow the format: "Hello Xzeon Team,\nI'm interested in your services.\nName: {name}\nBusiness: {business}\nBudget: {budget}\nPlease contact me."
4. THE WhatsApp Service SHALL URL-encode special characters in the message
5. THE Frontend SHALL redirect the user to the generated WhatsApp URL

### Requirement 6: Email Service

**User Story:** As the system, I want to send transactional emails so that both the Xzeon team and clients receive relevant notifications.

#### Acceptance Criteria

1. THE Email Service SHALL provide a sendContactEmail() function that sends inquiry details to the Xzeon team
2. THE Email Service SHALL provide a sendConfirmationEmail() function that sends an acknowledgment to the client who submitted the contact form
3. THE Email Service SHALL provide a sendBookingEmail() function that sends booking confirmation to the client
4. THE Email Service SHALL provide a sendNewsletterWelcome() function that sends a welcome message to new newsletter subscribers
5. ALL email functions SHALL use Resend as the email delivery provider
6. ALL email functions SHALL handle errors gracefully and log failures

### Requirement 7: Security Middleware

**User Story:** As the system administrator, I want to implement security measures so that the API is protected from common vulnerabilities.

#### Acceptance Criteria

1. THE Helmet middleware SHALL be configured and applied to all routes
2. THE CORS middleware SHALL be configured to allow requests from the frontend origin
3. THE Rate Limiter middleware SHALL limit requests to 100 per 15 minutes per IP address
4. THE Validator middleware SHALL validate all input data using Joi schemas
5. THE Error Handler middleware SHALL catch and format all errors consistently
6. THE Not Found middleware SHALL return a JSON response for undefined routes
7. ALL sensitive configuration values SHALL be stored in environment variables and never exposed in responses

### Requirement 8: MongoDB Data Models

**User Story:** As a developer, I want well-defined data models so that data is stored consistently in MongoDB.

#### Acceptance Criteria

1. THE Contact Model SHALL have fields: name (String, required), email (String, required), phone (String), company (String), service (String, required), budget (String), message (String, required), status (String, default: "new"), createdAt (Date, default: now)
2. THE Newsletter Model SHALL have fields: email (String, required, unique), subscribedAt (Date, default: now)
3. THE Booking Model SHALL have fields: name (String, required), email (String, required), datetime (Date, required), projectType (String, required), createdAt (Date, default: now)
4. THE Project Model SHALL have fields: title (String, required), category (String, required), description (String), technologies (Array of Strings), image (String), github (String), liveDemo (String)

### Requirement 9: Frontend Integration

**User Story:** As a frontend developer, I want to consume the API using Fetch so that the frontend can communicate with the backend.

#### Acceptance Criteria

1. THE Contact endpoint SHALL accept POST /api/contact and return JSON with success and message fields
2. THE Newsletter endpoint SHALL accept POST /api/newsletter and return JSON with success and message fields
3. THE Booking endpoint SHALL accept POST /api/booking and return JSON with success and message fields
4. THE Projects endpoint SHALL accept GET /api/projects and return JSON with success and data fields
5. ALL endpoints SHALL return appropriate HTTP status codes (200, 201, 400, 404, 500)
6. ALL error responses SHALL follow a consistent format: { success: false, message: "...", errors?: [...] }

### Requirement 10: Code Quality and Architecture

**User Story:** As a developer, I want a modular and maintainable codebase so that the project can be easily extended and migrated to Next.js.

#### Acceptance Criteria

1. THE project SHALL follow the defined folder structure with separate directories for config, controllers, routes, models, middleware, validators, services, and utils
2. ALL routes SHALL use RESTful conventions (proper HTTP methods and resource naming)
3. ALL controller functions SHALL use async/await for asynchronous operations
4. THE code SHALL include JSDoc comments for exported functions
5. THE server.js SHALL serve as the entry point and configure all middleware and routes
6. THE .env file SHALL contain all configuration variables (database URI, Resend API key, port, etc.)
7. THE .gitignore file SHALL exclude node_modules, .env, and other sensitive files from version control

## Technical Implementation Notes

### Project Structure
```
backend/
├── package.json
├── server.js
├── .env
├── .gitignore
├── config/
│   ├── database.js
│   └── resend.js
├── controllers/
│   ├── contactController.js
│   ├── newsletterController.js
│   ├── bookingController.js
│   └── projectController.js
├── routes/
│   ├── contactRoutes.js
│   ├── newsletterRoutes.js
│   ├── bookingRoutes.js
│   └── projectRoutes.js
├── models/
│   ├── Contact.js
│   ├── Newsletter.js
│   ├── Booking.js
│   └── Project.js
├── middleware/
│   ├── errorHandler.js
│   ├── validateRequest.js
│   ├── rateLimiter.js
│   └── notFound.js
├── validators/
│   ├── contactValidation.js
│   ├── bookingValidation.js
│   └── newsletterValidation.js
├── services/
│   ├── emailService.js
│   ├── whatsappService.js
│   └── calendlyService.js
├── utils/
│   ├── logger.js
│   └── response.js
└── uploads/
```

### Dependencies
- express: Web framework
- mongoose: MongoDB ODM
- resend: Email service
- dotenv: Environment variable management
- cors: Cross-origin resource sharing
- helmet: Security headers
- express-rate-limit: Rate limiting
- morgan: HTTP request logging
- joi: Input validation
- compression: Response compression