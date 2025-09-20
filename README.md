# Trace Lens - MERN Face Detection Application

A comprehensive MERN stack application with face detection capabilities, JWT authentication, OTP verification, and multi-language support.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for development)
- MongoDB (Docker will handle this)
- Redis (Docker will handle this)

### One-Command Setup
```bash
# Clone and start the entire application
docker compose up --build
```

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

## 🏗️ Architecture

### Frontend (React + Vite)
- **Login System**: Exact replica of provided trace.html/css/js
- **Dashboard**: Image upload and face detection results
- **Multi-language**: English and Hindi support
- **Real-time**: Face detection with bounding boxes

### Backend (Node.js + Express)
- **Authentication**: JWT + OTP verification
- **Face Detection**: Google Cloud Vision API
- **Database**: MongoDB with Mongoose
- **Caching**: Redis for OTP storage
- **File Upload**: Multer with validation

### Services
- **MongoDB**: User and image data storage
- **Redis**: OTP caching and session management
- **Google Vision**: Face detection processing
- **Twilio**: SMS OTP delivery

## 🔧 Environment Setup

1. Copy environment template:
   ```bash
   cp .env.example .env
   ```

2. Update the following in `.env`:
   - `JWT_SECRET`: Generate a secure secret (min 32 chars)
   - `GOOGLE_APPLICATION_CREDENTIALS`: Path to GCP service key
   - `TWILIO_*`: Your Twilio credentials for SMS
   - Other service-specific configurations

## 📱 Features

### Authentication & Security
- ✅ JWT-based authentication
- ✅ OTP verification (6-digit, 5-min expiry)
- ✅ Mobile number validation (10 digits)
- ✅ Rate limiting and security headers
- ✅ Input validation and sanitization

### Image Processing
- ✅ Drag & drop image upload
- ✅ Multiple image support
- ✅ Face detection with Google Vision API
- ✅ Bounding box visualization
- ✅ Confidence score display

### User Experience
- ✅ Exact trace.html styling replica
- ✅ Multi-language support (EN/HI)
- ✅ Responsive design
- ✅ Real-time form validation
- ✅ Loading states and feedback

## 🧪 Development

### Local Development
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

### Testing
```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage
```

### API Documentation
- Swagger UI: http://localhost:3001/api-docs (when enabled)
- Postman collection available in `/docs`

## 🚀 Deployment

### Production Deployment
```bash
# Build and deploy with Docker
docker compose -f docker-compose.prod.yml up -d
```

### Environment-specific configs:
- **Development**: `docker-compose.yml`
- **Production**: `docker-compose.prod.yml`
- **Testing**: `docker-compose.test.yml`

## 📊 Monitoring

- **Health Check**: `/health` endpoint
- **Logs**: Structured logging with Winston
- **Metrics**: Performance monitoring ready

## 🔒 Security Considerations

- JWT tokens stored in memory (not localStorage)
- OTP expiry and rate limiting
- File upload validation and size limits
- CORS and security headers configured
- Input validation on all endpoints

## 📁 Project Structure

```
trace-lens-app/
├── docker-compose.yml          # Service orchestration
├── frontend/                   # React application
├── backend/                    # Node.js API
├── docs/                      # Documentation
└── scripts/                   # Utility scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Note**: This application replicates the exact styling and functionality of the provided trace.html/css/js files while adding comprehensive backend functionality and containerization.

