# ANOINT Array - Auth Redirect Tester

An automated testing suite that continuously monitors the admin login flow for `info@anoint.me` on anointarray.com, ensuring proper authentication and redirect behavior to the admin dashboard.

## Features

- **Complete Login Flow Testing**: Tests the entire authentication process from login page to admin dashboard
- **Admin Redirect Validation**: Verifies that admin users are redirected to `/admin` (not `/dashboard`)
- **Continuous Monitoring**: Runs tests every 2 minutes with configurable intervals
- **Comprehensive Reporting**: Detailed logs, statistics, and error tracking
- **Screenshot Capture**: Takes screenshots on test failures for debugging
- **Performance Metrics**: Tracks response times and success rates
- **Error Detection**: Monitors for JavaScript errors, failed authentication, and loading issues
- **Graceful Handling**: Robust error handling for network issues and timeouts

## Installation

1. **Navigate to the tester directory:**
   ```bash
   cd auth-redirect-tester
   ```

2. **Install dependencies:**
   ```bash
   npm run setup
   ```
   This will install all npm packages and Playwright browsers.

3. **Alternative manual installation:**
   ```bash
   npm install
   npx playwright install
   ```

## Usage

### Single Test Run
Run a single authentication test:
```bash
npm test -- --single
```

### Continuous Testing
Run continuous testing (every 2 minutes):
```bash
npm run test:continuous
```

### Custom Interval
Run with custom interval (in seconds):
```bash
node auth-tester.js --continuous --interval=60
```

### Headed Mode (Show Browser)
Run with visible browser for debugging:
```bash
node auth-tester.js --single --headed
```

## Configuration

### Environment Variables
Edit `.env` file to customize:

```env
BASE_URL=https://anointarray.com
TEST_EMAIL=info@anoint.me
TEST_PASSWORD=AdminPassword123
TEST_INTERVAL=120000  # 2 minutes
TEST_TIMEOUT=30000    # 30 seconds
HEADLESS=true
MAX_RETRIES=3
```

### Command Line Options

- `--single` - Run single test and exit
- `--continuous` - Run tests continuously
- `--headed` - Show browser window (for debugging)
- `--interval=N` - Set test interval in seconds
- `--help` - Show help information

## Test Process

The tester performs the following steps:

1. **Navigate to Login Page** - Goes to `anointarray.com/login`
2. **Fill Credentials** - Enters admin email and password
3. **Submit Login Form** - Clicks submit and waits for redirect
4. **Verify Admin Redirect** - Confirms redirect to `/admin` (not `/dashboard`)
5. **Validate Admin Dashboard** - Checks for admin-specific content and elements
6. **Performance Tracking** - Records response times and loading metrics

## Monitoring & Reporting

### Log Files
- `auth-test.log` - Simple timestamped test results
- `test-report.json` - Detailed test results with steps and timing
- `stats.json` - Aggregated statistics and performance metrics

### Screenshots
Failed tests automatically capture screenshots in the `screenshots/` directory.

### Real-time Statistics
The tester displays live statistics including:
- Total tests run
- Success/failure counts
- Success rate percentage
- Average response time
- Last successful/failed test timestamps
- System uptime

## Test Result Structure

Each test generates a comprehensive result object:

```json
{
  "testId": "test-1234567890",
  "timestamp": "2025-01-XX...",
  "success": true,
  "duration": 2450,
  "steps": [
    {
      "step": "navigate_to_login",
      "status": "completed",
      "duration": 850,
      "timestamp": "2025-01-XX..."
    }
  ],
  "errors": [],
  "responseTime": 1200,
  "redirectTime": 450,
  "adminDashboardLoadTime": 800
}
```

## Error Detection

The tester monitors for:

- **Authentication Failures**: Invalid credentials or auth system errors
- **Incorrect Redirects**: Redirect to wrong dashboard type
- **JavaScript Errors**: Console errors during login process
- **Loading Issues**: Timeouts or slow page loading
- **Missing Elements**: Admin dashboard components not found
- **Network Problems**: Connection timeouts or server errors

## Troubleshooting

### Common Issues

1. **Playwright Installation**:
   ```bash
   npx playwright install
   ```

2. **Permission Issues**:
   ```bash
   chmod +x auth-tester.js
   ```

3. **Dependencies**:
   ```bash
   npm install
   ```

4. **Browser Issues**:
   - Try running with `--headed` to see what's happening
   - Check if the website is accessible manually

### Debug Mode

Run with visible browser to debug issues:
```bash
node auth-tester.js --single --headed
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Auth Redirect Tests
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd auth-redirect-tester
          npm run setup
      - name: Run auth test
        run: |
          cd auth-redirect-tester
          npm test -- --single
```

## Performance Expectations

### Normal Performance Ranges

- **Login Page Load**: 500-2000ms
- **Authentication**: 800-3000ms
- **Admin Redirect**: 200-1000ms
- **Dashboard Load**: 1000-4000ms
- **Total Test Time**: 2000-8000ms

### Alert Thresholds

- **Warning**: Test takes longer than 8 seconds
- **Critical**: Test fails or times out (30+ seconds)
- **Emergency**: Multiple consecutive failures (3+)

## Security Considerations

- **Credentials**: Store safely in environment variables
- **Network**: Ensure secure connections (HTTPS)
- **Logs**: Be careful not to log sensitive information
- **Access**: Restrict access to test reports and logs

## Maintenance

### Regular Tasks

1. **Update Dependencies**: `npm update`
2. **Clean Screenshots**: Remove old failure screenshots
3. **Rotate Logs**: Archive old test logs
4. **Monitor Disk Space**: Test reports and screenshots can accumulate

### Monitoring the Tester

- Check that the process is running: `ps aux | grep auth-tester`
- Verify log files are being updated
- Monitor success rates and response times
- Review failure screenshots regularly

## Support

For issues or questions:

1. Check the logs in `auth-test.log`
2. Review the detailed report in `test-report.json`
3. Run a single test with `--headed` to debug visually
4. Check network connectivity to anointarray.com

## License

MIT License - See LICENSE file for details.