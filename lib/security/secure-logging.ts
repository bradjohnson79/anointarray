// Secure logging utilities to prevent format string injection
// Ensures user input cannot inject format specifiers into log messages

/**
 * Safely logs messages by ensuring format strings are constant
 * Prevents CWE-134: Use of Externally-Controlled Format String
 */
export class SecureLogger {
  /**
   * Log info messages with constant format string
   */
  static info(message: string, data?: any): void {
    if (data) {
      console.log('[INFO]', message, JSON.stringify(data))
    } else {
      console.log('[INFO]', message)
    }
  }

  /**
   * Log error messages with constant format string
   */
  static error(message: string, error?: any): void {
    if (error) {
      console.error('[ERROR]', message, error instanceof Error ? error.message : JSON.stringify(error))
    } else {
      console.error('[ERROR]', message)
    }
  }

  /**
   * Log warning messages with constant format string
   */
  static warn(message: string, data?: any): void {
    if (data) {
      console.warn('[WARN]', message, JSON.stringify(data))
    } else {
      console.warn('[WARN]', message)
    }
  }

  /**
   * Log debug messages with constant format string (only in development)
   */
  static debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      if (data) {
        console.debug('[DEBUG]', message, JSON.stringify(data))
      } else {
        console.debug('[DEBUG]', message)
      }
    }
  }

  /**
   * Safely sanitize user input for logging
   * Removes potentially dangerous format specifiers
   */
  static sanitizeForLog(input: string): string {
    if (typeof input !== 'string') {
      return '[NON-STRING INPUT]'
    }
    
    // Remove format specifiers and control characters
    return input
      .replace(/%[sdifoxX%]/g, '[FORMAT_REMOVED]') // Remove format specifiers
      .replace(/[\x00-\x1F\x7F]/g, '[CTRL_CHAR]') // Remove control characters
      .substring(0, 1000) // Limit length to prevent log flooding
  }

  /**
   * Log payment-related events safely
   */
  static paymentEvent(event: string, orderId: string, data: any = null): void {
    const safeOrderId = this.sanitizeForLog(orderId)
    const safeEvent = this.sanitizeForLog(event)
    
    this.info(`Payment event: ${safeEvent} for order: ${safeOrderId}`, data)
  }

  /**
   * Log webhook events safely
   */
  static webhookEvent(provider: string, eventType: string, eventId: string, data: any = null): void {
    const safeProvider = this.sanitizeForLog(provider)
    const safeEventType = this.sanitizeForLog(eventType)
    const safeEventId = this.sanitizeForLog(eventId)
    
    this.info(`Webhook from ${safeProvider}: ${safeEventType} (${safeEventId})`, data)
  }

  /**
   * Log shipping events safely
   */
  static shippingEvent(event: string, trackingNumber: string, data: any = null): void {
    const safeEvent = this.sanitizeForLog(event)
    const safeTrackingNumber = this.sanitizeForLog(trackingNumber)
    
    this.info(`Shipping event: ${safeEvent} for tracking: ${safeTrackingNumber}`, data)
  }
}