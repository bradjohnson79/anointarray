# API Testing and Validation

Comprehensive testing suite for all ANOINT Array API endpoints.

## Authentication Endpoints
Test all authentication flows and edge cases.

### `/api/auth/*` (Supabase Integration)
```bash
# Test user registration
curl -X POST /api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# Test login
curl -X POST /api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# Test logout
curl -X POST /api/auth/signout \
  -H "Authorization: Bearer <token>"
```

## Admin API Endpoints
Verify all admin routes require proper authentication.

### `/api/admin/backup/*`
```bash
# Test backup creation (requires admin auth)
curl -X POST /api/admin/backup/create \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{"type":"full"}'

# Test backup listing
curl -X GET /api/admin/backup/create \
  -H "Authorization: Bearer <admin_token>"
```

### `/api/admin/generator/*`
```bash
# Test CSV upload
curl -X POST /api/admin/generator/upload-csv \
  -H "Authorization: Bearer <admin_token>" \
  -F "file=@test-glyphs.csv"

# Test AI system status
curl -X GET /api/admin/generator/test-ai \
  -H "Authorization: Bearer <admin_token>"
```

## Payment API Endpoints
Test all payment processors and webhooks.

### Stripe Integration
```bash
# Test payment intent creation
curl -X POST /api/payments/stripe \
  -H "Content-Type: application/json" \
  -d '{"amount":1000,"currency":"usd","sealArrayId":"test123"}'

# Test webhook handling
curl -X POST /api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: <webhook_signature>" \
  -d '<stripe_webhook_payload>'
```

### PayPal Integration
```bash
# Test PayPal order creation
curl -X POST /api/payments/paypal \
  -H "Content-Type: application/json" \
  -d '{"amount":10.00,"sealArrayId":"test123"}'
```

### Crypto Payments (NowPayments)
```bash
# Test crypto payment creation
curl -X POST /api/payments/nowpayments \
  -H "Content-Type: application/json" \
  -d '{"amount":10.00,"currency":"btc","sealArrayId":"test123"}'
```

## Generator API Endpoints
Test array generation and payment verification.

### `/api/generator/*`
```bash
# Test array generation (requires payment)
curl -X POST /api/generator/generate \
  -H "Content-Type: application/json" \
  -d '{"arrayType":"flower_of_life","intention":"healing","paymentId":"verified_payment_id"}'

# Test payment verification
curl -X POST /api/generator/verify-payment \
  -H "Content-Type: application/json" \
  -d '{"paymentId":"stripe_pi_test","provider":"stripe"}'
```

## Digital Product Endpoints
Test digital download generation and delivery.

### `/api/digital/*`
```bash
# Test download link generation
curl -X POST /api/digital/generate \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","products":["array_basic"]}'

# Test download with token
curl -X GET /api/digital/download/valid_token_here
```

## Merchandise Endpoints
Test Fourthwall integration and checkout process.

### `/api/merchandise/*`
```bash
# Test merchandise checkout
curl -X POST /api/merchandise/checkout \
  -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"tshirt","quantity":1}],"arrayId":"custom_array"}'

# Test pricing calculation
curl -X GET /api/fourthwall/pricing
```

## Testing Scenarios

### Success Cases
- [ ] Valid authentication tokens accepted
- [ ] Proper data validation and processing
- [ ] Correct response formats returned
- [ ] Successful payment processing
- [ ] Array generation with valid inputs

### Error Handling
- [ ] Invalid authentication rejected (401)
- [ ] Insufficient permissions blocked (403)
- [ ] Malformed requests return 400
- [ ] Missing required fields validated
- [ ] Rate limiting enforced (429)

### Edge Cases
- [ ] Very large request payloads
- [ ] Special characters in input data
- [ ] Concurrent request handling
- [ ] Network timeout scenarios
- [ ] Payment provider failures

## Performance Testing
```bash
# Load testing with Apache Bench
ab -n 100 -c 10 https://yourdomain.com/api/ai-status

# Monitor response times
curl -w "@curl-format.txt" -s -o /dev/null https://yourdomain.com/api/generator/generate
```

## Security Testing
- [ ] SQL injection attempts in all input fields
- [ ] XSS payloads in form submissions
- [ ] CSRF token bypass attempts
- [ ] Authentication bypass techniques
- [ ] Rate limiting circumvention

## Monitoring & Alerts
Set up monitoring for:
- **Response Times**: Track API latency
- **Error Rates**: Monitor 4xx and 5xx responses
- **Authentication Failures**: Watch for brute force attempts
- **Payment Anomalies**: Unusual payment patterns
- **Rate Limit Hits**: Potential abuse detection

## Automated Testing
```bash
# Run test suite
npm test

# API integration tests
npm run test:api

# End-to-end tests
npm run test:e2e
```

---

Execute these tests regularly and before any production deployment.

*Test Context: $ARGUMENTS*