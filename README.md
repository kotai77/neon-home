# Skillmatch - AI-Powered Job Management Platform

Skillmatch is a comprehensive, production-ready job management and recruitment platform that leverages artificial intelligence to match candidates with job opportunities. Built with modern technologies and designed for scalability, it serves both recruiters and job seekers with intelligent automation and seamless user experience.

## 🚀 Features

### Core Functionality

- **Dual User Types**: Separate interfaces for recruiters and job applicants
- **AI-Powered Matching**: Intelligent candidate-job matching using configurable AI providers
- **Job Management**: Complete CRUD operations for job postings with advanced filtering
- **Application Tracking**: Comprehensive application management with status workflows
- **Advanced Search**: AI-enhanced search functionality for both jobs and candidates
- **Web Scraping**: Extract candidate data from LinkedIn profiles and resumes with OCR
- **File Management**: Secure object storage for resumes, documents, and media
- **Real-time Updates**: WebSocket support for live notifications and updates

### AI & Automation

- **Configurable AI Providers**: Support for OpenAI, Anthropic, Azure, and custom providers
- **Resume Analysis**: Automated resume parsing and skill extraction
- **Candidate Scoring**: AI-driven compatibility scoring for job matches
- **Smart Recommendations**: Personalized job and candidate suggestions
- **OCR Processing**: Text extraction from images and scanned documents

### Authentication & Security

- **Multi-Provider OAuth2**: Google, GitHub, LinkedIn authentication
- **JWT-based Sessions**: Secure token management with refresh capability
- **Role-based Access Control**: Granular permissions system
- **Rate Limiting**: Protection against abuse and brute force attacks
- **Data Encryption**: Secure handling of sensitive information

### Business Features

- **Subscription Management**: Stripe integration for payments and billing
- **Analytics Dashboard**: Comprehensive metrics and insights
- **Team Collaboration**: Multi-user support with team management
- **Demo Mode**: Full-featured demo accounts for testing
- **API Documentation**: Complete REST API with OpenAPI specification

## 🛠 Technology Stack

### Frontend

- **React 18** with TypeScript
- **Vite** for build tooling and development
- **TailwindCSS** for styling with custom design system
- **Radix UI** for accessible component primitives
- **React Router 6** for client-side routing
- **TanStack Query** for data fetching and caching
- **Zod** for runtime type validation

### Backend

- **Node.js** with Express.js framework
- **SQLite** with Drizzle ORM for database management
- **JWT** for authentication and session management
- **Passport.js** for OAuth2 integration
- **Winston** for comprehensive logging
- **Bull** for background job processing
- **Socket.io** for real-time communication

### AI & Processing

- **OpenAI API** for natural language processing
- **Puppeteer** for web scraping automation
- **Tesseract.js** for OCR text extraction
- **Sharp** for image processing
- **PDF-Parse** for document analysis

### Infrastructure

- **Docker** for containerization
- **Redis** for caching and session storage
- **AWS S3** compatible object storage
- **Stripe** for payment processing
- **Nodemailer** for email delivery

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (>= 18.0.0)
- **npm** (>= 9.0.0) or **yarn** (>= 1.22.0)
- **Docker** (>= 20.10.0) - optional but recommended
- **Git** (>= 2.25.0)

## 🚦 Quick Start

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/your-org/skillmatch.git
cd skillmatch
\`\`\`

### 2. Environment Setup

Copy the environment template and configure your settings:

\`\`\`bash

# Frontend environment

cp .env.example .env.local

# Backend environment

cp server/.env.example server/.env
\`\`\`

### 3. Install Dependencies

\`\`\`bash

# Install frontend dependencies

npm install

# Install backend dependencies

cd server
npm install
cd ..
\`\`\`

### 4. Database Setup

\`\`\`bash

# Initialize database and run migrations

cd server
npm run migrate

# Seed with demo data

npm run db:seed
cd ..
\`\`\`

### 5. Start Development Servers

\`\`\`bash

# Terminal 1: Start backend API server

cd server
npm run dev

# Terminal 2: Start frontend development server

npm run dev
\`\`\`

The application will be available at:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **API Documentation**: http://localhost:3001/docs

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)

\`\`\`env

# AI Configuration

VITE_OPENAI_API_KEY=your-openai-api-key

# Stripe Configuration

VITE_STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key

# API Configuration

VITE_API_URL=http://localhost:3001/api
\`\`\`

#### Backend (server/.env)

\`\`\`env

# Server Configuration

NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Database

DATABASE_URL=./data/skillmatch.db

# Authentication

JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# OAuth Providers

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret

# AI Providers

OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# Stripe

STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# File Storage

AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=skillmatch-files

# Email

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Redis (for background jobs)

REDIS_URL=redis://localhost:6379

# Logging

LOG_LEVEL=info
\`\`\`

### AI Provider Configuration

Skillmatch supports multiple AI providers. Configure them in the admin panel or directly in the database:

\`\`\`javascript
// Example AI configuration
{
"providers": {
"openai": {
"apiKey": "your-openai-key",
"model": "gpt-4",
"enabled": true
},
"anthropic": {
"apiKey": "your-anthropic-key",
"model": "claude-3-sonnet",
"enabled": false
}
},
"primaryProvider": "openai",
"fallbackProvider": "anthropic"
}
\`\`\`

## 🧪 Testing

### Running Tests

\`\`\`bash

# Run all tests

cd server
npm test

# Run tests in watch mode

npm run test:watch

# Run integration tests

npm run test:integration

# Generate test coverage report

npm test -- --coverage
\`\`\`

### Test Structure

\`\`\`
server/tests/
├── setup.js # Test environment setup
├── unit/ # Unit tests
│ ├── auth.test.js # Authentication tests
│ ├── jobs.test.js # Job management tests
│ └── ai.test.js # AI functionality tests
├── integration/ # Integration tests
│ ├── api.test.js # Full API workflow tests
│ └── auth-flow.test.js # Authentication flow tests
└── fixtures/ # Test data and fixtures
├── users.json
└── jobs.json
\`\`\`

### Writing Tests

Tests use Jest and follow Tiger-style assertion patterns:

\`\`\`javascript
import { describe, test, expect } from '@jest/globals';
import { assert } from '../src/lib/types.js';

describe('User Registration', () => {
test('should create user successfully', async () => {
// Tiger-style assertion at start
assert(userData.email, 'Email must be provided');

    const response = await request(app)
      .post('/api/auth/register')
      .send(userData);

    // Tiger-style assertion at end
    assert(response.body.success, 'Registration should succeed');
    assert(response.body.data.user.id, 'User ID must be set');

});
});
\`\`\`

## 🐳 Docker Deployment

### Development with Docker

\`\`\`bash

# Build and start all services

docker-compose up --build

# Start in background

docker-compose up -d

# View logs

docker-compose logs -f skillmatch-api
\`\`\`

### Production Deployment

\`\`\`bash

# Build production images

docker build -t skillmatch-api ./server
docker build -t skillmatch-web .

# Run production containers

docker run -d \
--name skillmatch-api \
-p 3001:3001 \
--env-file server/.env.production \
skillmatch-api

docker run -d \
--name skillmatch-web \
-p 80:80 \
skillmatch-web
\`\`\`

### Docker Compose Configuration

\`\`\`yaml
version: '3.8'
services:
api:
build: ./server
ports: - "3001:3001"
environment: - NODE_ENV=production
volumes: - ./data:/app/data - ./logs:/app/logs
depends_on: - redis

redis:
image: redis:7-alpine
ports: - "6379:6379"
volumes: - redis-data:/data

web:
build: .
ports: - "80:80"
depends_on: - api

volumes:
redis-data:
\`\`\`

## 📚 API Documentation

### Authentication Endpoints

\`\`\`
POST /api/auth/register # Register new user
POST /api/auth/login # User login
POST /api/auth/logout # User logout
GET /api/auth/me # Get current user
POST /api/auth/refresh # Refresh JWT token

# OAuth2 Endpoints

GET /api/auth/google # Google OAuth
GET /api/auth/github # GitHub OAuth
GET /api/auth/linkedin # LinkedIn OAuth
\`\`\`

### Job Management Endpoints

\`\`\`
GET /api/jobs # List jobs with filtering
POST /api/jobs # Create new job
GET /api/jobs/:id # Get job details
PUT /api/jobs/:id # Update job
DELETE /api/jobs/:id # Delete job
GET /api/jobs/:id/applications # Get job applications
\`\`\`

### Application Management Endpoints

\`\`\`
GET /api/applications # List applications
POST /api/applications # Create application
GET /api/applications/:id # Get application details
PUT /api/applications/:id # Update application status
\`\`\`

### AI & Search Endpoints

\`\`\`
POST /api/ai/analyze-resume # Analyze resume with AI
POST /api/ai/match-candidates # Find candidate matches
POST /api/search/jobs # AI-powered job search
POST /api/search/candidates # AI-powered candidate search
\`\`\`

### File Management Endpoints

\`\`\`
POST /api/files/upload # Upload file
DELETE /api/files/:id # Delete file
GET /api/files/:id # Download file
\`\`\`

## 🔄 Background Jobs

Skillmatch uses Bull queues for background processing:

### Job Types

- **Email Jobs**: Welcome emails, notifications, password resets
- **AI Processing**: Resume analysis, candidate matching
- **Web Scraping**: Profile extraction, bulk processing
- **Analytics**: Data aggregation, report generation
- **File Processing**: Image optimization, document parsing

### Worker Management

\`\`\`bash

# Start background workers

cd server
npm run worker:start

# Monitor job queues

npm run worker:dashboard
\`\`\`

## 📊 Monitoring & Observability

### Logging

Skillmatch implements comprehensive logging using Winston:

\`\`\`javascript
// Logger usage with Tiger-style assertions
import { logger } from './lib/api.js';

function processApplication(application) {
assert(application, 'Application must be provided');

logger.info('Processing application', {
applicationId: application.id,
userId: application.applicantId
});

try {
// Process application
const result = analyzeApplication(application);

    assert(result.score >= 0, 'Score must be non-negative');
    logger.info('Application processed successfully', {
      applicationId: application.id,
      score: result.score
    });

    return result;

} catch (error) {
logger.error('Application processing failed', {
applicationId: application.id,
error: error.message,
stack: error.stack
});
throw error;
}
}
\`\`\`

### Health Checks

\`\`\`bash

# API health check

curl http://localhost:3001/health

# Database health check

curl http://localhost:3001/health/database

# AI services health check

curl http://localhost:3001/health/ai
\`\`\`

### Metrics Dashboard

Access the metrics dashboard at http://localhost:3001/metrics for:

- Request/response times
- Error rates
- Database query performance
- AI processing metrics
- User activity analytics

## 🚀 Deployment

### Production Checklist

- [ ] Configure production environment variables
- [ ] Set up SSL certificates
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Set up monitoring and alerting
- [ ] Configure automated backups
- [ ] Set up log aggregation
- [ ] Configure CDN for static assets
- [ ] Set up error tracking (Sentry)

### Scaling Considerations

#### Horizontal Scaling

- **Load Balancing**: Use nginx or AWS ALB for request distribution
- **Database**: Consider PostgreSQL for production at scale
- **File Storage**: Use AWS S3 or compatible object storage
- **Redis Cluster**: For session and cache scaling
- **Worker Nodes**: Scale background job processing

#### Performance Optimization

- **Database Indexing**: Optimize queries with proper indexes
- **Caching**: Implement Redis caching for frequent queries
- **CDN**: Use CloudFront or similar for static asset delivery
- **Compression**: Enable gzip compression
- **Connection Pooling**: Optimize database connections

## 🤝 Contributing

### Development Setup

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/amazing-feature\`
3. Make your changes following the coding standards
4. Add tests for new functionality
5. Run the test suite: \`npm test\`
6. Commit changes: \`git commit -m 'Add amazing feature'\`
7. Push to the branch: \`git push origin feature/amazing-feature\`
8. Open a Pull Request

### Coding Standards

#### Tiger-Style Assertions

All functions must include Tiger-style assertions:

\`\`\`javascript
function createUser(userData) {
// Assertion at function start
assert(userData, 'User data must be provided');
assert(userData.email, 'Email must be provided');
assert(userData.role, 'Role must be specified');

// Function logic here
const user = processUserData(userData);

// Assertion at function end
assert(user.id, 'User ID must be generated');
assert(user.createdAt, 'Created timestamp must be set');

return user;
}
\`\`\`

#### Code Style

- Use TypeScript for type safety
- Follow ESLint configuration
- Use Prettier for code formatting
- Write comprehensive JSDoc comments
- Implement proper error handling

#### Database Patterns

- Use Drizzle ORM for all database operations
- Implement proper transactions for multi-table operations
- Use prepared statements for performance
- Follow proper indexing strategies

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Errors

\`\`\`bash

# Reset database

cd server
npm run db:reset

# Check database file permissions

ls -la data/skillmatch.db
\`\`\`

#### Authentication Issues

\`\`\`bash

# Verify JWT secret is set

echo $JWT_SECRET

# Check OAuth configuration

curl http://localhost:3001/api/auth/google
\`\`\`

#### AI Provider Errors

\`\`\`bash

# Test OpenAI connection

curl -H "Authorization: Bearer $OPENAI_API_KEY" \\
https://api.openai.com/v1/models

# Check AI configuration

curl -H "Authorization: Bearer $JWT_TOKEN" \\
http://localhost:3001/api/ai/config
\`\`\`

#### File Upload Issues

\`\`\`bash

# Check upload directory permissions

ls -la server/uploads/

# Test file upload endpoint

curl -X POST \\
-H "Authorization: Bearer $JWT_TOKEN" \\
-F "file=@test-resume.pdf" \\
http://localhost:3001/api/files/upload
\`\`\`

### Debug Mode

Enable debug logging:

\`\`\`bash

# Backend debug mode

cd server
LOG_LEVEL=debug npm run dev

# Frontend with debugging

DEBUG=skillmatch:\* npm run dev
\`\`\`

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [OpenAI](https://openai.com/) for AI capabilities
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Drizzle ORM](https://orm.drizzle.team/) for database operations
- [TailwindCSS](https://tailwindcss.com/) for styling system

## 📞 Support

For support and questions:

- 📧 Email: support@skillmatch.dev
- 💬 Discord: [Skillmatch Community](https://discord.gg/skillmatch)
- 📚 Documentation: [docs.skillmatch.dev](https://docs.skillmatch.dev)
- 🐛 Bug Reports: [GitHub Issues](https://github.com/your-org/skillmatch/issues)

---

Built with ❤️ by the Skillmatch Team
