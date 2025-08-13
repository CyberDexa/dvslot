# DVSlot - Complete UK Driving Test Alert System

**The most comprehensive driving test slot monitoring system covering ALL 318 official UK DVSA test centers**

A real-time driving test slot monitoring and alerting system for the UK DVSA website. DVSlot helps learner drivers and parents/guardians find and book available driving test appointments through intelligent monitoring and instant notifications across the entire United Kingdom.

## 🚗 Features

- **Complete UK Coverage**: Monitors all 318 official DVSA test centers across England, Scotland, Wales, Northern Ireland
- **Real-time Monitoring**: Continuously monitors DVSA website for available driving test slots
- **Advanced Cancellation Detection**: Detects cancelled slots within 5-10 minutes across entire UK network
- **Intelligent Alerts**: Multi-channel notifications via push notifications, SMS, and email
- **Smart Filtering**: Location-based filtering with distance calculation and regional coverage
- **User Preferences**: Customizable alert preferences for dates, times, and locations
- **Multi-user Support**: Family account management for parents and guardians
- **Performance Optimized**: Redis caching and efficient web scraping across 350+ centers

## 🏗️ Architecture

### Backend Services
- **API Server**: Express.js REST API with JWT authentication
- **Web Scraper**: Puppeteer-based DVSA website monitoring
- **Message Queue**: RabbitMQ for asynchronous task processing
- **Scheduler**: Cron-based job scheduling for regular monitoring
- **Notification Services**: Push notifications, SMS, and email alerts

### Database
- **PostgreSQL**: Primary database with comprehensive schema
- **Redis**: Caching layer for performance optimization

### Infrastructure
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Reverse proxy with rate limiting and security headers

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd DVslot
```

2. **Environment Setup**
```bash
# Copy example environment file
cp .env.example .env

# Edit environment variables
nano .env
```

3. **Required Environment Variables**
```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=dvslot
DB_USER=dvslot
DB_PASSWORD=your_secure_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# JWT
JWT_SECRET=your_jwt_secret_key

# Firebase (for push notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email

# Email Service
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# SMS Service (optional)
SMS_API_KEY=your_sms_api_key
SMS_API_SECRET=your_sms_secret
```

4. **Start the Application**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

5. **Access the API**
- API: http://localhost:8080/api/v1
- Health Check: http://localhost:8080/health

## 📱 Mobile App

The React Native mobile application provides:
- User registration and authentication
- Test center search and selection
- Alert subscription management
- Real-time notifications
- User preferences configuration

## 🔧 Development

### Local Development Setup

1. **Install Dependencies**
```bash
npm install
```

2. **Database Setup**
```bash
# Start database services only
docker-compose up -d postgres redis rabbitmq

# Run migrations
npm run migrate

# Seed test data
npm run seed
```

3. **Start Development Server**
```bash
npm run dev
```

### API Documentation

#### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh

#### User Management
- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `PUT /api/v1/users/preferences` - Update preferences

#### Test Centers
- `GET /api/v1/test-centers` - Search test centers
- `GET /api/v1/test-centers/:id` - Get test center details

#### Appointments
- `GET /api/v1/appointments/search` - Search available slots
- `POST /api/v1/appointments/book` - Book appointment (external redirect)

#### Alerts
- `POST /api/v1/alerts/subscribe` - Create alert subscription
- `GET /api/v1/alerts/subscriptions` - Get user subscriptions
- `PUT /api/v1/alerts/subscriptions/:id` - Update subscription
- `DELETE /api/v1/alerts/subscriptions/:id` - Cancel subscription

### Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

## 📊 Monitoring

### Health Checks
- API Health: `GET /health`
- Service Metrics: Prometheus endpoints available
- Logging: Winston-based structured logging

### Performance Monitoring
- Redis caching for frequent queries
- Database query optimization with indexes
- Rate limiting via Nginx
- Message queue for asynchronous processing

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting on authentication endpoints
- CORS configuration
- Security headers via Nginx
- Environment variable configuration

## 📋 Business Model

### Target Market
- **Primary**: Learner drivers (17-25 years)
- **Secondary**: Parents and guardians
- **Tertiary**: Driving instructors

### Revenue Streams
1. **Freemium Model**: Basic alerts free, premium features paid
2. **Subscription Plans**: Monthly/annual premium subscriptions
3. **Advertising**: Targeted ads for driving-related services
4. **Affiliate Partnerships**: Driving lesson and insurance referrals

### Key Metrics
- User acquisition and retention rates
- Alert success rates (bookings made)
- Premium subscription conversion
- User engagement and satisfaction

## 🚀 Deployment

### Production Deployment

1. **Set Production Environment Variables**
2. **Configure SSL/TLS** (recommend Let's Encrypt)
3. **Set up Monitoring** (Prometheus + Grafana)
4. **Configure Backup Strategy** for PostgreSQL
5. **Set up CI/CD Pipeline**

### Scaling Considerations
- Horizontal scaling of API servers
- Redis clustering for cache scaling
- RabbitMQ clustering for queue reliability
- Database read replicas for improved performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- GitHub Issues: Report bugs and feature requests
- Documentation: Comprehensive API and setup docs
- Email: support@dvslot.com

## 📈 Roadmap

### Phase 1 (MVP) - ✅ Complete
- Core API development
- Basic web scraping
- User authentication
- Alert subscriptions
- Push notifications

### Phase 2 - In Progress
- React Native mobile app
- SMS notifications
- Advanced filtering options
- User analytics dashboard

### Phase 3 - Planned
- Machine learning for slot prediction
- Advanced booking automation
- Integration with driving schools
- White-label solutions

---

**DVSlot** - Making driving test booking effortless for UK learners 🇬🇧
