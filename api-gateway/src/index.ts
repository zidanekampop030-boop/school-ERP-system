import express from 'express';
import cors from 'cors';
import proxy from 'express-http-proxy';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Service URLs (Defaults are for running services locally)
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const ACADEMIC_SERVICE = process.env.ACADEMIC_SERVICE_URL || 'http://localhost:5002';
const FINANCE_SERVICE = process.env.FINANCE_SERVICE_URL || 'http://localhost:5003';
const HR_SERVICE = process.env.HR_SERVICE_URL || 'http://localhost:5004';

// 1. Rate Limiting Middleware (Rule: Max 10 requests in 1 minute per IP)
const gatewayLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 10, // Limit each IP to 10 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: 'Too many requests, please try again later.',
    detail: 'Rate limit exceeded: Max 10 requests per minute allowed (Week 3 Gatekeeper Rule).',
  },
  // Ensure trust proxy is set to false or properly handled for local development
});

app.use(cors());

// Apply rate limiter to all routes
app.use(gatewayLimiter);

// 2. Swagger / OpenAPI Documentation setup
try {
  // Try to load the openapi.yaml document
  const openapiPath = path.join(__dirname, '../../docs/openapi.yaml');
  const swaggerDocument = YAML.load(openapiPath);
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log(`OpenAPI documentation loaded successfully. Available at http://localhost:${PORT}/docs`);
} catch (error) {
  console.warn('Warning: Could not load openapi.yaml documentation. /docs will be unavailable. Error:', error);
}

// Gateway info endpoint
app.get('/gateway-info', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the School ERP API Gateway (Front Door)',
    rateLimitPolicy: '10 requests per minute',
    services: {
      auth: AUTH_SERVICE,
      academic: ACADEMIC_SERVICE,
      finance: FINANCE_SERVICE,
      hr: HR_SERVICE,
    },
  });
});

// 3. Path-Based Microservice Proxy Routing
// Express http proxy forwards body and headers automatically
app.use('/api/v1/auth', proxy(AUTH_SERVICE, {
  proxyReqPathResolver: (req) => {
    return `/api/v1/auth${req.url}`;
  }
}));

app.use('/api/v1/academic', proxy(ACADEMIC_SERVICE, {
  proxyReqPathResolver: (req) => {
    return `/api/v1/academic${req.url}`;
  }
}));

app.use('/api/v1/finance', proxy(FINANCE_SERVICE, {
  proxyReqPathResolver: (req) => {
    return `/api/v1/finance${req.url}`;
  }
}));

app.use('/api/v1/hr', proxy(HR_SERVICE, {
  proxyReqPathResolver: (req) => {
    return `/api/v1/hr${req.url}`;
  }
}));

// Error handler for gateway fallback
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Gateway Error:', err);
  res.status(502).json({ error: 'Bad Gateway: Microservice might be offline or loading.' });
});

app.listen(PORT, () => {
  console.log(`API Gateway is running on port ${PORT}`);
});
