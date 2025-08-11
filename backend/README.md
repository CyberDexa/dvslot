# DVSlot Backend - Real DVSA Integration

A comprehensive backend service that scrapes the DVSA website for real driving test slot availability.

## 🚀 Features

- **Real DVSA Scraping**: Automated scraping of driving test slots from DVSA website
- **Intelligent Scheduling**: Configurable scraping schedules with peak-time optimization  
- **Anti-Bot Protection**: Handles DVSA's anti-bot measures with random delays and user agents
- **Supabase Integration**: Stores real-time slot data in your Supabase database
- **Health Monitoring**: Built-in health checks and logging
- **Rate Limiting**: Respectful scraping with configurable delays
- **Docker Ready**: Easy deployment with Docker and Docker Compose

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- Supabase account with test centers data
- Chrome/Chromium for Puppeteer

### Quick Start

1. **Install dependencies:**
```bash
cd backend
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

3. **Run setup:**
```bash
chmod +x setup.sh
./setup.sh
```

4. **Start the service:**
```bash
npm start
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | Required |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Required |
| `SCRAPING_DELAY_MIN` | Minimum delay between requests (ms) | 5000 |
| `SCRAPING_DELAY_MAX` | Maximum delay between requests (ms) | 15000 |
| `MAX_CONCURRENT_SCRAPERS` | Max concurrent scraping tasks | 3 |
| `SCRAPE_INTERVAL_MINUTES` | Minutes between scheduled scrapes | 30 |

### Scraping Schedule

- **Business Hours**: Every 30 minutes (8AM-6PM, Mon-Fri)
- **Peak Times**: Every 10 minutes (7-9AM, 5-7PM)  
- **Weekends**: Every 2 hours (9AM-5PM)
- **Daily Cleanup**: 2AM daily

## 🚀 Usage

### Manual Commands

```bash
# Start server with scheduler
npm start

# Development mode with auto-reload
npm run dev

# Run manual scraping once
npm run scrape

# Test scraper functionality  
node scripts/testScraper.js
```

### API Endpoints

- `GET /health` - Service health check
- `POST /api/scrape` - Trigger manual scraping
- `GET /api/stats` - Get scraping statistics

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📊 Monitoring

### Health Checks
- Database connectivity
- Last scraping activity
- Browser status
- Memory usage

### Logging
- Structured JSON logs
- Separate error/combined log files
- Console output with colors
- Scraping statistics

### Example Log Output
```
2025-01-11 10:30:00 [INFO]: 🎯 Starting DVSA scraping for 168 test centers
2025-01-11 10:30:15 [INFO]: ✅ Found 12 slots at Birmingham (Garretts Green)  
2025-01-11 10:35:30 [INFO]: 🎉 Scraping completed: 164/168 centers, 847 slots found
```

## ⚠️ Legal & Ethical Considerations

**Important**: This scraper is designed to be respectful of DVSA's resources:

- Implements random delays (5-15 seconds between requests)
- Uses realistic browser fingerprints  
- Respects robots.txt guidelines
- Limited concurrent connections
- Peak-time optimization only during business hours

**Please ensure compliance with:**
- DVSA Terms of Service
- UK Computer Misuse Act
- Your organization's policies
- Rate limiting and fair usage

## 🛠️ Technical Architecture

### Core Components

1. **DVSAScraperService** - Main scraping engine with Puppeteer
2. **Scheduler** - Cron-based task scheduling  
3. **Logger** - Winston-based logging system
4. **Health Monitor** - System health checks

### Data Flow

1. Scheduler triggers scraping jobs
2. Scraper fetches test center list from Supabase  
3. Browser instances scrape DVSA for each center
4. Slot data is processed and stored in Supabase
5. Alerts are triggered for new slots
6. Health checks monitor system status

### Anti-Bot Measures Handled

- Random user agents and viewport sizes
- Variable delays between requests  
- CAPTCHA detection and handling
- Rate limit detection
- Browser fingerprint randomization

## 🔧 Troubleshooting

### Common Issues

**Browser fails to launch:**
```bash
# Install Chrome/Chromium dependencies
sudo apt-get update
sudo apt-get install -y chromium-browser
```

**CAPTCHA detected:**
- Increase delays in .env file
- Reduce MAX_CONCURRENT_SCRAPERS
- Check if IP is rate limited

**No slots found:**
- Verify DVSA website structure hasn't changed
- Check browser console logs  
- Test with manual navigation

### Debug Mode

```bash
# Enable debug logging
NODE_ENV=development npm start

# Test single center
node scripts/testScraper.js
```

## 📈 Performance

### Typical Performance
- **168 UK test centers**: ~15-25 minutes full scrape
- **Success rate**: 95%+ under normal conditions
- **Memory usage**: ~200-500MB depending on concurrent scrapers  
- **Slots found**: 500-2000+ during peak availability periods

### Optimization Tips
- Run during UK business hours for best results
- Use SSD storage for faster database operations
- Deploy close to UK servers (low latency)
- Monitor and adjust delays based on success rates

## 📞 Support

For issues or questions:
1. Check logs in `/logs` directory
2. Test with `scripts/testScraper.js`  
3. Verify environment configuration
4. Check Supabase connectivity

## 🔒 Security

- Service role keys for Supabase (not anonymous keys)
- Rate limiting on API endpoints
- Helmet.js security headers
- Input validation and sanitization
- Docker security best practices
