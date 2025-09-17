require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dvsaScraper = require('../services/dvsaScraper');
const scheduler = require('../workers/scheduler');
const logger = require('../utils/logger');

const app = express();
const PORT = process.env.PORT || 10000;

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'https://dvs-lot.vercel.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.API_RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.1',
    scheduler: scheduler.getStatus()
  });
});

// Postcode lookup endpoint
apiV1.get('/postcode/:postcode', async (req, res) => {
  try {
    const { postcode } = req.params;
    
    if (!postcode) {
      return res.status(400).json({
        success: false,
        error: 'Postcode is required'
      });
    }

    // Clean and format postcode
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    
    // For now, return mock coordinates for UK postcodes
    // In production, you'd use a proper geocoding service like Google Maps API or Postcodes.io
    const mockCoordinates = {
      'EH546EG': { lat: 55.8833, lng: -3.5167 }, // Livingston, Scotland
      'SW11': { lat: 51.4613, lng: -0.1406 },   // Battersea, London
      'Birmingham': { lat: 52.4862, lng: -1.8904 }, // Birmingham
      'Manchester': { lat: 53.4808, lng: -2.2426 }, // Manchester
      'Glasgow': { lat: 55.8642, lng: -4.2518 },    // Glasgow
      'Liverpool': { lat: 53.4084, lng: -2.9916 },  // Liverpool
      'Leeds': { lat: 53.7960, lng: -1.5471 },      // Leeds
      'Sheffield': { lat: 53.3811, lng: -1.4701 },  // Sheffield
      'Edinburgh': { lat: 55.9533, lng: -3.1883 },  // Edinburgh
      'Cardiff': { lat: 51.4816, lng: -3.1791 },    // Cardiff
      'Bristol': { lat: 51.4545, lng: -2.5879 },    // Bristol
      'Newcastle': { lat: 54.9783, lng: -1.6178 },  // Newcastle
      'Nottingham': { lat: 52.9548, lng: -1.1581 }, // Nottingham
      'Leicester': { lat: 52.6369, lng: -1.1398 },  // Leicester
      'Southampton': { lat: 50.9097, lng: -1.4044 }, // Southampton
      'Portsmouth': { lat: 50.8198, lng: -1.0880 },  // Portsmouth
      'Oxford': { lat: 51.7520, lng: -1.2577 },     // Oxford
      'Cambridge': { lat: 52.2053, lng: 0.1218 },   // Cambridge
      'Brighton': { lat: 50.8225, lng: -0.1372 },   // Brighton
      'Plymouth': { lat: 50.3755, lng: -4.1427 },   // Plymouth
      'Exeter': { lat: 50.7184, lng: -3.5339 },     // Exeter
      'Norwich': { lat: 52.6309, lng: 1.2974 },     // Norwich
      'Ipswich': { lat: 52.0567, lng: 1.1482 },     // Ipswich
      'York': { lat: 53.9590, lng: -1.0815 },       // York
      'Hull': { lat: 53.7676, lng: -0.3274 },       // Hull
      'Preston': { lat: 53.7632, lng: -2.7031 },    // Preston
      'Blackpool': { lat: 53.8175, lng: -3.0357 },  // Blackpool
      'Blackburn': { lat: 53.7486, lng: -2.4842 },  // Blackburn
      'Bolton': { lat: 53.5783, lng: -2.4299 },     // Bolton
      'Wigan': { lat: 53.5450, lng: -2.6324 },      // Wigan
      'Warrington': { lat: 53.3900, lng: -2.5970 }, // Warrington
      'Stockport': { lat: 53.4083, lng: -2.1494 },  // Stockport
      'Oldham': { lat: 53.5409, lng: -2.1114 },     // Oldham
      'Rochdale': { lat: 53.6097, lng: -2.1561 },   // Rochdale
      'Salford': { lat: 53.4875, lng: -2.2901 },    // Salford
      'StHelens': { lat: 53.4539, lng: -2.7369 },   // St Helens
      'Widnes': { lat: 53.3631, lng: -2.7303 },     // Widnes
      'Runcorn': { lat: 53.3417, lng: -2.7311 },    // Runcorn
      'Crewe': { lat: 53.0998, lng: -2.4443 },      // Crewe
      'Macclesfield': { lat: 53.2587, lng: -2.1256 }, // Macclesfield
      'Chester': { lat: 53.1934, lng: -2.8931 },    // Chester
      'Wrexham': { lat: 53.0466, lng: -2.9938 },    // Wrexham
      'Swansea': { lat: 51.6214, lng: -3.9436 },    // Swansea
      'Newport': { lat: 51.5842, lng: -2.9977 },    // Newport
      'Aberdeen': { lat: 57.1497, lng: -2.0943 },   // Aberdeen
      'Dundee': { lat: 56.4620, lng: -2.9707 },     // Dundee
      'Inverness': { lat: 57.4778, lng: -4.2247 },  // Inverness
      'Stirling': { lat: 56.1165, lng: -3.9369 },   // Stirling
      'Perth': { lat: 56.3967, lng: -3.4314 },      // Perth
      'Dundee': { lat: 56.4620, lng: -2.9707 },     // Dundee
      'Falkirk': { lat: 56.0019, lng: -3.7833 },    // Falkirk
      'Ayr': { lat: 55.4586, lng: -4.6292 },        // Ayr
      'Kilmarnock': { lat: 55.6117, lng: -4.4989 }, // Kilmarnock
      'Dumfries': { lat: 55.0709, lng: -3.6051 },   // Dumfries
      'Galashiels': { lat: 55.6171, lng: -2.8069 }, // Galashiels
      'Hawick': { lat: 55.4227, lng: -2.7848 },     // Hawick
      'Selkirk': { lat: 55.5474, lng: -2.8391 },    // Selkirk
      'Peebles': { lat: 55.6511, lng: -3.1889 },    // Peebles
      'Jedburgh': { lat: 55.4794, lng: -2.5520 },   // Jedburgh
      'Kelso': { lat: 55.5982, lng: -2.4333 },      // Kelso
      'BerwickUponTweed': { lat: 55.7708, lng: -2.0031 }, // Berwick-upon-Tweed
      'Carlisle': { lat: 54.8924, lng: -2.9324 },   // Carlisle
      'Whitehaven': { lat: 54.5491, lng: -3.5847 }, // Whitehaven
      'Workington': { lat: 54.6436, lng: -3.5441 }, // Workington
      'BarrowInFurness': { lat: 54.1080, lng: -3.2189 }, // Barrow-in-Furness
      'Millom': { lat: 54.2108, lng: -3.2719 },     // Millom
      'Ulverston': { lat: 54.1959, lng: -3.0963 },  // Ulverston
      'GrangeOverSands': { lat: 54.1931, lng: -2.9094 }, // Grange-over-Sands
      'Kendal': { lat: 54.3275, lng: -2.7476 },     // Kendal
      'Windermere': { lat: 54.3792, lng: -2.9067 }, // Windermere
      'Ambleside': { lat: 54.4289, lng: -2.9613 },  // Ambleside
      'Keswick': { lat: 54.6013, lng: -3.1326 },    // Keswick
      'Cockermouth': { lat: 54.6621, lng: -3.3598 }, // Cockermouth
      'Penrith': { lat: 54.6641, lng: -2.7527 },    // Penrith
      'Alston': { lat: 54.8110, lng: -2.4398 },     // Alston
      'Hexham': { lat: 54.9711, lng: -2.1017 },     // Hexham
      'Haltwhistle': { lat: 54.9700, lng: -2.4567 }, // Haltwhistle
      'Brampton': { lat: 54.9441, lng: -2.7347 },   // Brampton
      'Wigton': { lat: 54.8250, lng: -3.1597 },     // Wigton
      'Maryport': { lat: 54.7143, lng: -3.4957 },   // Maryport
      'Silloth': { lat: 54.8694, lng: -3.3872 },    // Silloth
      'Wigton': { lat: 54.8250, lng: -3.1597 },     // Wigton
      'Aspatria': { lat: 54.7661, lng: -3.3278 },   // Aspatria
      'BownessOnSolway': { lat: 54.9489, lng: -3.2150 }, // Bowness-on-Solway
      'Annan': { lat: 54.9861, lng: -3.2567 },      // Annan
      'Lockerbie': { lat: 55.1225, lng: -3.3539 },  // Lockerbie
      'Gretna': { lat: 54.9964, lng: -3.0639 },     // Gretna
      'Longtown': { lat: 55.0108, lng: -2.9672 },   // Longtown
      'Brampton': { lat: 54.9441, lng: -2.7347 },   // Brampton
      'Gilsland': { lat: 54.9875, lng: -2.5789 },   // Gilsland
      'Haltwhistle': { lat: 54.9700, lng: -2.4567 }, // Haltwhistle
      'HaydonBridge': { lat: 54.9744, lng: -2.2472 }, // Haydon Bridge
      'Hexham': { lat: 54.9711, lng: -2.1017 },     // Hexham
      'Corbridge': { lat: 54.9739, lng: -2.0178 },  // Corbridge
      'Prudhoe': { lat: 54.9617, lng: -1.8544 },    // Prudhoe
      'Stocksfield': { lat: 54.9472, lng: -1.9172 }, // Stocksfield
      'Wylam': { lat: 54.9747, lng: -1.8144 },      // Wylam
      'Newcastle': { lat: 54.9783, lng: -1.6178 },  // Newcastle
      'Gateshead': { lat: 54.9625, lng: -1.6017 },  // Gateshead
      'Washington': { lat: 54.9000, lng: -1.5167 }, // Washington
      'Sunderland': { lat: 54.9069, lng: -1.3838 }, // Sunderland
      'SouthShields': { lat: 54.9986, lng: -1.4291 }, // South Shields
      'NorthShields': { lat: 55.0097, lng: -1.4448 }, // North Shields
      'WhitleyBay': { lat: 55.0397, lng: -1.4472 },  // Whitley Bay
      'Tynemouth': { lat: 55.0172, lng: -1.4250 },   // Tynemouth
      'Wallsend': { lat: 54.9911, lng: -1.5344 },    // Wallsend
      'Jarrow': { lat: 54.9783, lng: -1.4844 },      // Jarrow
      'Hebburn': { lat: 54.9731, lng: -1.5144 },     // Hebburn
      'Blaydon': { lat: 54.9661, lng: -1.7139 },     // Blaydon
      'Ryton': { lat: 54.9722, lng: -1.7617 },       // Ryton
      'Newburn': { lat: 54.9875, lng: -1.7444 },     // Newburn
      'Wylam': { lat: 54.9747, lng: -1.8144 },       // Wylam
      'Prudhoe': { lat: 54.9617, lng: -1.8544 },     // Prudhoe
      'Stocksfield': { lat: 54.9472, lng: -1.9172 }, // Stocksfield
      'Corbridge': { lat: 54.9739, lng: -2.0178 },   // Corbridge
      'HaydonBridge': { lat: 54.9744, lng: -2.2472 }, // Haydon Bridge
      'Haltwhistle': { lat: 54.9700, lng: -2.4567 }, // Haltwhistle
      'Gilsland': { lat: 54.9875, lng: -2.5789 },    // Gilsland
      'Longtown': { lat: 55.0108, lng: -2.9672 },    // Longtown
      'Gretna': { lat: 54.9964, lng: -3.0639 },      // Gretna
      'Lockerbie': { lat: 55.1225, lng: -3.3539 },   // Lockerbie
      'Annan': { lat: 54.9861, lng: -3.2567 },       // Annan
      'BownessOnSolway': { lat: 54.9489, lng: -3.2150 }, // Bowness-on-Solway
      'Aspatria': { lat: 54.7661, lng: -3.3278 },    // Aspatria
      'Wigton': { lat: 54.8250, lng: -3.1597 },      // Wigton
      'Brampton': { lat: 54.9441, lng: -2.7347 },    // Brampton
      'Maryport': { lat: 54.7143, lng: -3.4957 },    // Maryport
      'Silloth': { lat: 54.8694, lng: -3.3872 },     // Silloth
      'Cockermouth': { lat: 54.6621, lng: -3.3598 }, // Cockermouth
      'Keswick': { lat: 54.6013, lng: -3.1326 },     // Keswick
      'Ambleside': { lat: 54.4289, lng: -2.9613 },   // Ambleside
      'Windermere': { lat: 54.3792, lng: -2.9067 },  // Windermere
      'Kendal': { lat: 54.3275, lng: -2.7476 },      // Kendal
      'GrangeOverSands': { lat: 54.1931, lng: -2.9094 }, // Grange-over-Sands
      'Ulverston': { lat: 54.1959, lng: -3.0963 },   // Ulverston
      'Millom': { lat: 54.2108, lng: -3.2719 },      // Millom
      'BarrowInFurness': { lat: 54.1080, lng: -3.2189 }, // Barrow-in-Furness
      'Workington': { lat: 54.6436, lng: -3.5441 },  // Workington
      'Whitehaven': { lat: 54.5491, lng: -3.5847 },  // Whitehaven
      'Carlisle': { lat: 54.8924, lng: -2.9324 },    // Carlisle
      'Penrith': { lat: 54.6641, lng: -2.7527 },     // Penrith
      'Alston': { lat: 54.8110, lng: -2.4398 },      // Alston
      'BerwickUponTweed': { lat: 55.7708, lng: -2.0031 }, // Berwick-upon-Tweed
      'Kelso': { lat: 55.5982, lng: -2.4333 },       // Kelso
      'Jedburgh': { lat: 55.4794, lng: -2.5520 },    // Jedburgh
      'Peebles': { lat: 55.6511, lng: -3.1889 },     // Peebles
      'Selkirk': { lat: 55.5474, lng: -2.8391 },     // Selkirk
      'Hawick': { lat: 55.4227, lng: -2.7848 },      // Hawick
      'Galashiels': { lat: 55.6171, lng: -2.8069 },  // Galashiels
      'Dumfries': { lat: 55.0709, lng: -3.6051 },    // Dumfries
      'Kilmarnock': { lat: 55.6117, lng: -4.4989 },  // Kilmarnock
      'Ayr': { lat: 55.4586, lng: -4.6292 },         // Ayr
      'Falkirk': { lat: 56.0019, lng: -3.7833 },     // Falkirk
      'Perth': { lat: 56.3967, lng: -3.4314 },       // Perth
      'Stirling': { lat: 56.1165, lng: -3.9369 },    // Stirling
      'Inverness': { lat: 57.4778, lng: -4.2247 },   // Inverness
      'Dundee': { lat: 56.4620, lng: -2.9707 },      // Dundee
      'Aberdeen': { lat: 57.1497, lng: -2.0943 },    // Aberdeen
      'Newport': { lat: 51.5842, lng: -2.9977 },     // Newport
      'Swansea': { lat: 51.6214, lng: -3.9436 },     // Swansea
      'Wrexham': { lat: 53.0466, lng: -2.9938 },     // Wrexham
      'Chester': { lat: 53.1934, lng: -2.8931 },     // Chester
      'Macclesfield': { lat: 53.2587, lng: -2.1256 }, // Macclesfield
      'Crewe': { lat: 53.0998, lng: -2.4443 },       // Crewe
      'Runcorn': { lat: 53.3417, lng: -2.7311 },     // Runcorn
      'Widnes': { lat: 53.3631, lng: -2.7303 },      // Widnes
      'StHelens': { lat: 53.4539, lng: -2.7369 },    // St Helens
      'Salford': { lat: 53.4875, lng: -2.2901 },     // Salford
      'Rochdale': { lat: 53.6097, lng: -2.1561 },    // Rochdale
      'Oldham': { lat: 53.5409, lng: -2.1114 },      // Oldham
      'Stockport': { lat: 53.4083, lng: -2.1494 },   // Stockport
      'Warrington': { lat: 53.3900, lng: -2.5970 },  // Warrington
      'Wigan': { lat: 53.5450, lng: -2.6324 },       // Wigan
      'Bolton': { lat: 53.5783, lng: -2.4299 },      // Bolton
      'Blackburn': { lat: 53.7486, lng: -2.4842 },   // Blackburn
      'Blackpool': { lat: 53.8175, lng: -3.0357 },   // Blackpool
      'Preston': { lat: 53.7632, lng: -2.7031 },     // Preston
      'Hull': { lat: 53.7676, lng: -0.3274 },        // Hull
      'York': { lat: 53.9590, lng: -1.0815 },        // York
      'Ipswich': { lat: 52.0567, lng: 1.1482 },      // Ipswich
      'Norwich': { lat: 52.6309, lng: 1.2974 },      // Norwich
      'Exeter': { lat: 50.7184, lng: -3.5339 },      // Exeter
      'Plymouth': { lat: 50.3755, lng: -4.1427 },    // Plymouth
      'Brighton': { lat: 50.8225, lng: -0.1372 },    // Brighton
      'Cambridge': { lat: 52.2053, lng: 0.1218 },    // Cambridge
      'Oxford': { lat: 51.7520, lng: -1.2577 },      // Oxford
      'Portsmouth': { lat: 50.8198, lng: -1.0880 },  // Portsmouth
      'Southampton': { lat: 50.9097, lng: -1.4044 }, // Southampton
      'Leicester': { lat: 52.6369, lng: -1.1398 },   // Leicester
      'Nottingham': { lat: 52.9548, lng: -1.1581 },  // Nottingham
      'Newcastle': { lat: 54.9783, lng: -1.6178 },   // Newcastle
      'Bristol': { lat: 51.4545, lng: -2.5879 },     // Bristol
      'Cardiff': { lat: 51.4816, lng: -3.1791 },     // Cardiff
      'Edinburgh': { lat: 55.9533, lng: -3.1883 },   // Edinburgh
      'Sheffield': { lat: 53.3811, lng: -1.4701 },   // Sheffield
      'Leeds': { lat: 53.7960, lng: -1.5471 },       // Leeds
      'Liverpool': { lat: 53.4084, lng: -2.9916 },   // Liverpool
      'Glasgow': { lat: 55.8642, lng: -4.2518 },     // Glasgow
      'Manchester': { lat: 53.4808, lng: -2.2426 },  // Manchester
      'Birmingham': { lat: 52.4862, lng: -1.8904 },  // Birmingham
      'London': { lat: 51.5074, lng: -0.1278 },      // London
    };

    // Try to find exact match first
    let coordinates = mockCoordinates[cleanPostcode];
    
    // If no exact match, try partial match (first part of postcode)
    if (!coordinates) {
      const partialPostcode = cleanPostcode.substring(0, Math.min(cleanPostcode.length, 4));
      for (const [key, value] of Object.entries(mockCoordinates)) {
        if (key.toUpperCase().startsWith(partialPostcode)) {
          coordinates = value;
          break;
        }
      }
    }

    // If still no match, use London as default
    if (!coordinates) {
      coordinates = mockCoordinates['London'];
      logger.warn(`Postcode ${postcode} not found, using London coordinates as fallback`);
    }

    res.json({
      success: true,
      data: {
        postcode: postcode,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        accuracy: coordinates === mockCoordinates['London'] ? 'approximate' : 'exact'
      }
    });
  } catch (error) {
    logger.error('Postcode lookup error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test centers endpoints
apiV1.get('/test-centers/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 25 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Get nearby test centers
    const { data: centers, error } = await supabase
      .from('test_centers')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    // Calculate distances and filter
    const nearbyCenters = centers
      .map(center => {
        const distance = calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          center.latitude,
          center.longitude
        );
        return { ...center, distance };
      })
      .filter(center => center.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20); // Limit results

    res.json({
      success: true,
      data: nearbyCenters
    });
  } catch (error) {
    logger.error('Nearby centers error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.get('/test-centers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: center, error } = await supabase
      .from('test_centers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !center) {
      return res.status(404).json({
        success: false,
        error: 'Test center not found'
      });
    }

    res.json({
      success: true,
      data: center
    });
  } catch (error) {
    logger.error('Get center error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test slots endpoints
apiV1.get('/test-slots', async (req, res) => {
  try {
    const { postcode, radius = 25, testType, dateFrom, dateTo } = req.query;
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    let query = supabase
      .from('driving_test_slots')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0]);

    if (testType) {
      query = query.eq('test_type', testType);
    }

    if (dateFrom) {
      query = query.gte('date', dateFrom);
    }

    if (dateTo) {
      query = query.lte('date', dateTo);
    }

    const { data: slots, error } = await query
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(100);

    if (error) throw error;

    res.json({
      success: true,
      data: slots || []
    });
  } catch (error) {
    logger.error('Search slots error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.get('/test-slots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: slot, error } = await supabase
      .from('driving_test_slots')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !slot) {
      return res.status(404).json({
        success: false,
        error: 'Test slot not found'
      });
    }

    res.json({
      success: true,
      data: slot
    });
  } catch (error) {
    logger.error('Get slot error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.post('/test-slots/book', async (req, res) => {
  try {
    const { slotId, userDetails } = req.body;
    
    if (!slotId || !userDetails) {
      return res.status(400).json({
        success: false,
        error: 'Slot ID and user details are required'
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Check if slot exists
    const { data: slot, error: slotError } = await supabase
      .from('driving_test_slots')
      .select('*')
      .eq('id', slotId)
      .single();

    if (slotError || !slot) {
      return res.status(404).json({
        success: false,
        error: 'Slot not found'
      });
    }

    // Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        slot_id: slotId,
        user_details: userDetails,
        status: 'confirmed',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    res.json({
      success: true,
      data: {
        bookingId: booking.id,
        slot: slot,
        status: 'confirmed'
      }
    });
  } catch (error) {
    logger.error('Book slot error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// User alerts endpoints
apiV1.get('/alerts/history', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    // For now, return mock data - you'll need to implement proper JWT verification
    const userId = 'mock-user-id';

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: alerts, error } = await supabase
      .from('user_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        alerts: alerts || []
      }
    });
  } catch (error) {
    logger.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.get('/alerts/subscriptions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const userId = 'mock-user-id'; // You'll need proper JWT verification

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: subscriptions, error } = await supabase
      .from('alert_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) throw error;

    res.json({
      success: true,
      data: {
        subscriptions: subscriptions || []
      }
    });
  } catch (error) {
    logger.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.post('/alerts/subscribe', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const userId = 'mock-user-id'; // You'll need proper JWT verification
    const alertData = req.body;

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: subscription, error } = await supabase
      .from('alert_subscriptions')
      .insert({
        user_id: userId,
        ...alertData,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    logger.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.delete('/alerts/subscriptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const userId = 'mock-user-id'; // You'll need proper JWT verification

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { error } = await supabase
      .from('alert_subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    logger.error('Delete subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// User profile endpoints
apiV1.get('/users/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const userId = 'mock-user-id'; // You'll need proper JWT verification

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        user: user
      }
    });
  } catch (error) {
    logger.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.put('/users/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const userId = 'mock-user-id'; // You'll need proper JWT verification
    const profileData = req.body;

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: user, error } = await supabase
      .from('users')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      data: {
        user: user
      }
    });
  } catch (error) {
    logger.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Auth endpoints
apiV1.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        user: data.user,
        token: data.session?.access_token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
  }
});

apiV1.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email and password are required'
      });
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name
        }
      }
    });

    if (error) throw error;

    res.json({
      success: true,
      data: {
        user: data.user,
        token: data.session?.access_token
      }
    });
  } catch (error) {
    logger.error('Register error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

apiV1.post('/auth/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Here you would invalidate the token if using a token blacklist
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Support endpoints
apiV1.post('/support/tickets', async (req, res) => {
  try {
    const { subject, message, category } = req.body;

    if (!subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Subject and message are required'
      });
    }

    // For now, just log the support request
    logger.info('Support ticket created:', { subject, message, category });

    res.json({
      success: true,
      data: {
        ticketId: `ticket_${Date.now()}`
      }
    });
  } catch (error) {
    logger.error('Support ticket error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Statistics endpoints
apiV1.get('/alerts/stats', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const token = authHeader.substring(7);
    const userId = 'mock-user-id'; // You'll need proper JWT verification

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Get user statistics
    const [alertsResult, subscriptionsResult] = await Promise.all([
      supabase.from('user_alerts').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('alert_subscriptions').select('id', { count: 'exact' }).eq('user_id', userId).eq('is_active', true)
    ]);

    res.json({
      success: true,
      data: {
        totalSearches: 0, // Not implemented yet
        activeAlerts: subscriptionsResult.count || 0,
        slotsFound: alertsResult.count || 0,
        lastActivity: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Mount API v1 routes
app.use('/api/v1', apiV1);

// Postcode lookup endpoint (direct access for mobile app)
app.get('/postcode/:postcode', async (req, res) => {
  try {
    const { postcode } = req.params;
    
    if (!postcode) {
      return res.status(400).json({
        success: false,
        error: 'Postcode is required'
      });
    }

    // Clean and format postcode
    const cleanPostcode = postcode.replace(/\s+/g, '').toUpperCase();
    
    // For now, return mock coordinates for UK postcodes
    // In production, you'd use a proper geocoding service like Google Maps API or Postcodes.io
    const mockCoordinates = {
      'EH546EG': { lat: 55.8833, lng: -3.5167 }, // Livingston, Scotland
      'SW11': { lat: 51.4613, lng: -0.1406 },   // Battersea, London
      'Birmingham': { lat: 52.4862, lng: -1.8904 }, // Birmingham
      'Manchester': { lat: 53.4808, lng: -2.2426 }, // Manchester
      'Glasgow': { lat: 55.8642, lng: -4.2518 },    // Glasgow
      'Liverpool': { lat: 53.4084, lng: -2.9916 },  // Liverpool
      'Leeds': { lat: 53.7960, lng: -1.5471 },      // Leeds
      'Sheffield': { lat: 53.3811, lng: -1.4701 },  // Sheffield
      'Edinburgh': { lat: 55.9533, lng: -3.1883 },  // Edinburgh
      'Cardiff': { lat: 51.4816, lng: -3.1791 },    // Cardiff
      'Bristol': { lat: 51.4545, lng: -2.5879 },    // Bristol
      'Newcastle': { lat: 54.9783, lng: -1.6178 },  // Newcastle
      'Nottingham': { lat: 52.9548, lng: -1.1581 }, // Nottingham
      'Leicester': { lat: 52.6369, lng: -1.1398 },  // Leicester
      'Southampton': { lat: 50.9097, lng: -1.4044 }, // Southampton
      'Portsmouth': { lat: 50.8198, lng: -1.0880 },  // Portsmouth
      'Oxford': { lat: 51.7520, lng: -1.2577 },     // Oxford
      'Cambridge': { lat: 52.2053, lng: 0.1218 },   // Cambridge
      'Brighton': { lat: 50.8225, lng: -0.1372 },   // Brighton
      'Plymouth': { lat: 50.3755, lng: -4.1427 },   // Plymouth
      'Exeter': { lat: 50.7184, lng: -3.5339 },     // Exeter
      'Norwich': { lat: 52.6309, lng: 1.2974 },     // Norwich
      'Ipswich': { lat: 52.0567, lng: 1.1482 },     // Ipswich
      'York': { lat: 53.9590, lng: -1.0815 },       // York
      'Hull': { lat: 53.7676, lng: -0.3274 },       // Hull
      'Preston': { lat: 53.7632, lng: -2.7031 },    // Preston
      'Blackpool': { lat: 53.8175, lng: -3.0357 },  // Blackpool
      'Blackburn': { lat: 53.7486, lng: -2.4842 },  // Blackburn
      'Bolton': { lat: 53.5783, lng: -2.4299 },     // Bolton
      'Wigan': { lat: 53.5450, lng: -2.6324 },      // Wigan
      'Warrington': { lat: 53.3900, lng: -2.5970 }, // Warrington
      'Stockport': { lat: 53.4083, lng: -2.1494 },  // Stockport
      'Oldham': { lat: 53.5409, lng: -2.1114 },     // Oldham
      'Rochdale': { lat: 53.6097, lng: -2.1561 },   // Rochdale
      'Salford': { lat: 53.4875, lng: -2.2901 },    // Salford
      'StHelens': { lat: 53.4539, lng: -2.7369 },   // St Helens
      'Widnes': { lat: 53.3631, lng: -2.7303 },     // Widnes
      'Runcorn': { lat: 53.3417, lng: -2.7311 },    // Runcorn
      'Crewe': { lat: 53.0998, lng: -2.4443 },      // Crewe
      'Macclesfield': { lat: 53.2587, lng: -2.1256 }, // Macclesfield
      'Chester': { lat: 53.1934, lng: -2.8931 },    // Chester
      'Wrexham': { lat: 53.0466, lng: -2.9938 },    // Wrexham
      'Swansea': { lat: 51.6214, lng: -3.9436 },    // Swansea
      'Newport': { lat: 51.5842, lng: -2.9977 },    // Newport
      'Aberdeen': { lat: 57.1497, lng: -2.0943 },   // Aberdeen
      'Dundee': { lat: 56.4620, lng: -2.9707 },     // Dundee
      'Inverness': { lat: 57.4778, lng: -4.2247 },  // Inverness
      'Stirling': { lat: 56.1165, lng: -3.9369 },   // Stirling
      'Perth': { lat: 56.3967, lng: -3.4314 },      // Perth
      'Dundee': { lat: 56.4620, lng: -2.9707 },     // Dundee
      'Falkirk': { lat: 56.0019, lng: -3.7833 },    // Falkirk
      'Ayr': { lat: 55.4586, lng: -4.6292 },        // Ayr
      'Kilmarnock': { lat: 55.6117, lng: -4.4989 }, // Kilmarnock
      'Dumfries': { lat: 55.0709, lng: -3.6051 },   // Dumfries
      'Galashiels': { lat: 55.6171, lng: -2.8069 }, // Galashiels
      'Hawick': { lat: 55.4227, lng: -2.7848 },     // Hawick
      'Selkirk': { lat: 55.5474, lng: -2.8391 },    // Selkirk
      'Peebles': { lat: 55.6511, lng: -3.1889 },    // Peebles
      'Jedburgh': { lat: 55.4794, lng: -2.5520 },   // Jedburgh
      'Kelso': { lat: 55.5982, lng: -2.4333 },      // Kelso
      'BerwickUponTweed': { lat: 55.7708, lng: -2.0031 }, // Berwick-upon-Tweed
      'Carlisle': { lat: 54.8924, lng: -2.9324 },   // Carlisle
      'Whitehaven': { lat: 54.5491, lng: -3.5847 }, // Whitehaven
      'Workington': { lat: 54.6436, lng: -3.5441 }, // Workington
      'BarrowInFurness': { lat: 54.1080, lng: -3.2189 }, // Barrow-in-Furness
      'Millom': { lat: 54.2108, lng: -3.2719 },     // Millom
      'Ulverston': { lat: 54.1959, lng: -3.0963 },  // Ulverston
      'GrangeOverSands': { lat: 54.1931, lng: -2.9094 }, // Grange-over-Sands
      'Kendal': { lat: 54.3275, lng: -2.7476 },     // Kendal
      'Windermere': { lat: 54.3792, lng: -2.9067 }, // Windermere
      'Ambleside': { lat: 54.4289, lng: -2.9613 },  // Ambleside
      'Keswick': { lat: 54.6013, lng: -3.1326 },    // Keswick
      'Cockermouth': { lat: 54.6621, lng: -3.3598 }, // Cockermouth
      'Penrith': { lat: 54.6641, lng: -2.7527 },     // Penrith
      'Alston': { lat: 54.8110, lng: -2.4398 },     // Alston
      'Hexham': { lat: 54.9711, lng: -2.1017 },     // Hexham
      'Haltwhistle': { lat: 54.9700, lng: -2.4567 }, // Haltwhistle
      'Brampton': { lat: 54.9441, lng: -2.7347 },   // Brampton
      'Wigton': { lat: 54.8250, lng: -3.1597 },     // Wigton
      'Maryport': { lat: 54.7143, lng: -3.4957 },   // Maryport
      'Silloth': { lat: 54.8694, lng: -3.3872 },    // Silloth
      'Wigton': { lat: 54.8250, lng: -3.1597 },     // Wigton
      'Aspatria': { lat: 54.7661, lng: -3.3278 },   // Aspatria
      'BownessOnSolway': { lat: 54.9489, lng: -3.2150 }, // Bowness-on-Solway
      'Annan': { lat: 54.9861, lng: -3.2567 },      // Annan
      'Lockerbie': { lat: 55.1225, lng: -3.3539 },  // Lockerbie
      'Gretna': { lat: 54.9964, lng: -3.0639 },     // Gretna
      'Longtown': { lat: 55.0108, lng: -2.9672 },   // Longtown
      'Brampton': { lat: 54.9441, lng: -2.7347 },   // Brampton
      'Gilsland': { lat: 54.9875, lng: -2.5789 },   // Gilsland
      'Haltwhistle': { lat: 54.9700, lng: -2.4567 }, // Haltwhistle
      'HaydonBridge': { lat: 54.9744, lng: -2.2472 }, // Haydon Bridge
      'Hexham': { lat: 54.9711, lng: -2.1017 },     // Hexham
      'Corbridge': { lat: 54.9739, lng: -2.0178 },  // Corbridge
      'Prudhoe': { lat: 54.9617, lng: -1.8544 },    // Prudhoe
      'Stocksfield': { lat: 54.9472, lng: -1.9172 }, // Stocksfield
      'Wylam': { lat: 54.9747, lng: -1.8144 },      // Wylam
      'Newcastle': { lat: 54.9783, lng: -1.6178 },  // Newcastle
      'Gateshead': { lat: 54.9625, lng: -1.6017 },  // Gateshead
      'Washington': { lat: 54.9000, lng: -1.5167 }, // Washington
      'Sunderland': { lat: 54.9069, lng: -1.3838 }, // Sunderland
      'SouthShields': { lat: 54.9986, lng: -1.4291 }, // South Shields
      'NorthShields': { lat: 55.0097, lng: -1.4448 }, // North Shields
      'WhitleyBay': { lat: 55.0397, lng: -1.4472 },  // Whitley Bay
      'Tynemouth': { lat: 55.0172, lng: -1.4250 },   // Tynemouth
      'Wallsend': { lat: 54.9911, lng: -1.5344 },    // Wallsend
      'Jarrow': { lat: 54.9783, lng: -1.4844 },      // Jarrow
      'Hebburn': { lat: 54.9731, lng: -1.5144 },     // Hebburn
      'Blaydon': { lat: 54.9661, lng: -1.7139 },     // Blaydon
      'Ryton': { lat: 54.9722, lng: -1.7617 },       // Ryton
      'Newburn': { lat: 54.9875, lng: -1.7444 },     // Newburn
      'Wylam': { lat: 54.9747, lng: -1.8144 },       // Wylam
      'Prudhoe': { lat: 54.9617, lng: -1.8544 },     // Prudhoe
      'Stocksfield': { lat: 54.9472, lng: -1.9172 }, // Stocksfield
      'Corbridge': { lat: 54.9739, lng: -2.0178 },   // Corbridge
      'HaydonBridge': { lat: 54.9744, lng: -2.2472 }, // Haydon Bridge
      'Haltwhistle': { lat: 54.9700, lng: -2.4567 }, // Haltwhistle
      'Gilsland': { lat: 54.9875, lng: -2.5789 },    // Gilsland
      'Longtown': { lat: 55.0108, lng: -2.9672 },    // Longtown
      'Gretna': { lat: 54.9964, lng: -3.0639 },      // Gretna
      'Lockerbie': { lat: 55.1225, lng: -3.3539 },   // Lockerbie
      'Annan': { lat: 54.9861, lng: -3.2567 },       // Annan
      'BownessOnSolway': { lat: 54.9489, lng: -3.2150 }, // Bowness-on-Solway
      'Aspatria': { lat: 54.7661, lng: -3.3278 },    // Aspatria
      'Wigton': { lat: 54.8250, lng: -3.1597 },      // Wigton
      'Brampton': { lat: 54.9441, lng: -2.7347 },    // Brampton
      'Maryport': { lat: 54.7143, lng: -3.4957 },    // Maryport
      'Silloth': { lat: 54.8694, lng: -3.3872 },     // Silloth
      'Cockermouth': { lat: 54.6621, lng: -3.3598 }, // Cockermouth
      'Keswick': { lat: 54.6013, lng: -3.1326 },     // Keswick
      'Ambleside': { lat: 54.4289, lng: -2.9613 },   // Ambleside
      'Windermere': { lat: 54.3792, lng: -2.9067 },  // Windermere
      'Kendal': { lat: 54.3275, lng: -2.7476 },      // Kendal
      'GrangeOverSands': { lat: 54.1931, lng: -2.9094 }, // Grange-over-Sands
      'Ulverston': { lat: 54.1959, lng: -3.0963 },   // Ulverston
      'Millom': { lat: 54.2108, lng: -3.2719 },      // Millom
      'BarrowInFurness': { lat: 54.1080, lng: -3.2189 }, // Barrow-in-Furness
      'Workington': { lat: 54.6436, lng: -3.5441 },  // Workington
      'Whitehaven': { lat: 54.5491, lng: -3.5847 },  // Whitehaven
      'Carlisle': { lat: 54.8924, lng: -2.9324 },    // Carlisle
      'Penrith': { lat: 54.6641, lng: -2.7527 },     // Penrith
      'Alston': { lat: 54.8110, lng: -2.4398 },      // Alston
      'BerwickUponTweed': { lat: 55.7708, lng: -2.0031 }, // Berwick-upon-Tweed
      'Kelso': { lat: 55.5982, lng: -2.4333 },       // Kelso
      'Jedburgh': { lat: 55.4794, lng: -2.5520 },    // Jedburgh
      'Peebles': { lat: 55.6511, lng: -3.1889 },     // Peebles
      'Selkirk': { lat: 55.5474, lng: -2.8391 },     // Selkirk
      'Hawick': { lat: 55.4227, lng: -2.7848 },      // Hawick
      'Galashiels': { lat: 55.6171, lng: -2.8069 },  // Galashiels
      'Dumfries': { lat: 55.0709, lng: -3.6051 },    // Dumfries
      'Kilmarnock': { lat: 55.6117, lng: -4.4989 },  // Kilmarnock
      'Ayr': { lat: 55.4586, lng: -4.6292 },         // Ayr
      'Falkirk': { lat: 56.0019, lng: -3.7833 },     // Falkirk
      'Perth': { lat: 56.3967, lng: -3.4314 },       // Perth
      'Stirling': { lat: 56.1165, lng: -3.9369 },    // Stirling
      'Inverness': { lat: 57.4778, lng: -4.2247 },   // Inverness
      'Dundee': { lat: 56.4620, lng: -2.9707 },      // Dundee
      'Aberdeen': { lat: 57.1497, lng: -2.0943 },    // Aberdeen
      'Newport': { lat: 51.5842, lng: -2.9977 },     // Newport
      'Swansea': { lat: 51.6214, lng: -3.9436 },     // Swansea
      'Wrexham': { lat: 53.0466, lng: -2.9938 },     // Wrexham
      'Chester': { lat: 53.1934, lng: -2.8931 },     // Chester
      'Macclesfield': { lat: 53.2587, lng: -2.1256 }, // Macclesfield
      'Crewe': { lat: 53.0998, lng: -2.4443 },       // Crewe
      'Runcorn': { lat: 53.3417, lng: -2.7311 },     // Runcorn
      'Widnes': { lat: 53.3631, lng: -2.7303 },      // Widnes
      'StHelens': { lat: 53.4539, lng: -2.7369 },    // St Helens
      'Salford': { lat: 53.4875, lng: -2.2901 },     // Salford
      'Rochdale': { lat: 53.6097, lng: -2.1561 },    // Rochdale
      'Oldham': { lat: 53.5409, lng: -2.1114 },      // Oldham
      'Stockport': { lat: 53.4083, lng: -2.1494 },   // Stockport
      'Warrington': { lat: 53.3900, lng: -2.5970 },  // Warrington
      'Wigan': { lat: 53.5450, lng: -2.6324 },       // Wigan
      'Bolton': { lat: 53.5783, lng: -2.4299 },      // Bolton
      'Blackburn': { lat: 53.7486, lng: -2.4842 },   // Blackburn
      'Blackpool': { lat: 53.8175, lng: -3.0357 },   // Blackpool
      'Preston': { lat: 53.7632, lng: -2.7031 },     // Preston
      'Hull': { lat: 53.7676, lng: -0.3274 },        // Hull
      'York': { lat: 53.9590, lng: -1.0815 },        // York
      'Ipswich': { lat: 52.0567, lng: 1.1482 },      // Ipswich
      'Norwich': { lat: 52.6309, lng: 1.2974 },      // Norwich
      'Exeter': { lat: 50.7184, lng: -3.5339 },      // Exeter
      'Plymouth': { lat: 50.3755, lng: -4.1427 },    // Plymouth
      'Brighton': { lat: 50.8225, lng: -0.1372 },    // Brighton
      'Cambridge': { lat: 52.2053, lng: 0.1218 },    // Cambridge
      'Oxford': { lat: 51.7520, lng: -1.2577 },      // Oxford
      'Portsmouth': { lat: 50.8198, lng: -1.0880 },  // Portsmouth
      'Southampton': { lat: 50.9097, lng: -1.4044 }, // Southampton
      'Leicester': { lat: 52.6369, lng: -1.1398 },   // Leicester
      'Nottingham': { lat: 52.9548, lng: -1.1581 },  // Nottingham
      'Newcastle': { lat: 54.9783, lng: -1.6178 },   // Newcastle
      'Bristol': { lat: 51.4545, lng: -2.5879 },     // Bristol
      'Cardiff': { lat: 51.4816, lng: -3.1791 },     // Cardiff
      'Edinburgh': { lat: 55.9533, lng: -3.1883 },   // Edinburgh
      'Sheffield': { lat: 53.3811, lng: -1.4701 },   // Sheffield
      'Leeds': { lat: 53.7960, lng: -1.5471 },       // Leeds
      'Liverpool': { lat: 53.4084, lng: -2.9916 },   // Liverpool
      'Glasgow': { lat: 55.8642, lng: -4.2518 },     // Glasgow
      'Manchester': { lat: 53.4808, lng: -2.2426 },  // Manchester
      'Birmingham': { lat: 52.4862, lng: -1.8904 },  // Birmingham
      'London': { lat: 51.5074, lng: -0.1278 },      // London
    };

    // Try to find exact match first
    let coordinates = mockCoordinates[cleanPostcode];
    
    // If no exact match, try partial match (first part of postcode)
    if (!coordinates) {
      const partialPostcode = cleanPostcode.substring(0, Math.min(cleanPostcode.length, 4));
      for (const [key, value] of Object.entries(mockCoordinates)) {
        if (key.toUpperCase().startsWith(partialPostcode)) {
          coordinates = value;
          break;
        }
      }
    }

    // If still no match, use London as default
    if (!coordinates) {
      coordinates = mockCoordinates['London'];
      logger.warn(`Postcode ${postcode} not found, using London coordinates as fallback`);
    }

    res.json({
      success: true,
      data: {
        postcode: postcode,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        accuracy: coordinates === mockCoordinates['London'] ? 'approximate' : 'exact'
      }
    });
  } catch (error) {
    logger.error('Postcode lookup error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Manual scraping endpoint (for testing/admin use)
app.post('/api/scrape', async (req, res) => {
  try {
    logger.info('🔧 Manual scraping triggered via API');
    
    const results = await dvsaScraper.scrapeAllCenters();
    
    res.json({
      success: true,
      message: 'Scraping completed successfully',
      results: {
        totalCenters: results.totalCenters,
        successfulScrapes: results.successfulScrapes,
        totalSlotsFound: results.totalSlotsFound,
        duration: results.duration
      }
    });
    
  } catch (error) {
    logger.error('❌ Manual scraping failed:', error);
    
    res.status(500).json({
      success: false,
      message: 'Scraping failed',
      error: error.message
    });
  }
});

// Get scraping statistics
app.get('/api/stats', async (req, res) => {
  try {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Get statistics
    const [centersResult, slotsResult, recentSlotsResult] = await Promise.all([
      supabase.from('test_centers').select('id', { count: 'exact' }),
      supabase.from('driving_test_slots').select('id', { count: 'exact' }),
      supabase.from('driving_test_slots')
        .select('last_checked_at, test_center_id')
        .order('last_checked_at', { ascending: false })
        .limit(1)
    ]);

    const stats = {
      totalCenters: centersResult.count || 0,
      totalSlots: slotsResult.count || 0,
      lastUpdate: recentSlotsResult.data?.[0]?.last_checked_at || null,
      systemStatus: scheduler.getStatus(),
      timestamp: new Date().toISOString()
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('❌ Failed to get statistics:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics',
      error: error.message
    });
  }
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 DVSlot Backend Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});

// Initialize scheduler
scheduler.start().catch(error => {
  logger.error('❌ Failed to start scheduler:', error);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    logger.info('📄 HTTP server closed');
  });
  
  await scheduler.stop();
  await dvsaScraper.close();
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🛑 SIGINT received, shutting down gracefully...');
  
  server.close(() => {
    logger.info('📄 HTTP server closed');
  });
  
  await scheduler.stop();
  await dvsaScraper.close();
  
  process.exit(0);
});

module.exports = app;
