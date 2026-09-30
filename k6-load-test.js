import http from 'k6/http';
import { sleep, check } from 'k6';

// k6 configuration options
export const options = {
  stages: [
    { duration: '5s', target: 15 }, // Ramp up to 15 virtual users (VUs) over 5 seconds
    { duration: '10s', target: 15 }, // Stay at 15 VUs for 10 seconds
    { duration: '5s', target: 0 },  // Ramp down to 0 VUs over 5 seconds
  ],
  thresholds: {
    http_req_failed: ['rate<0.8'], // Error rate must be less than 80% (429 status code is expected due to rate-limiting!)
    http_req_duration: ['p(95)<500'], // 95% of requests must complete within 500ms
  },
};

export default function () {
  // Test endpoint on the API Gateway
  const url = 'http://localhost:5000/gateway-info';
  
  const res = http.get(url);
  
  // Verify that we get either 200 (Success) or 429 (Rate limited)
  check(res, {
    'status is 200 or 429': (r) => r.status === 200 || r.status === 429,
    'status is 200': (r) => r.status === 200,
    'status is 429 (Rate Limiter Triggered!)': (r) => r.status === 429,
  });

  // Short pause between requests
  sleep(0.5); 
}
