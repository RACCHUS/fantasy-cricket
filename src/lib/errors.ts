/**
 * Custom API Error class for consistent error handling
 */
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message);
    this.name = 'APIError';
  }

  static badRequest(message: string) {
    return new APIError(message, 400, 'BAD_REQUEST');
  }

  static unauthorized(message = 'Unauthorized') {
    return new APIError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden') {
    return new APIError(message, 403, 'FORBIDDEN');
  }

  static notFound(message = 'Not found') {
    return new APIError(message, 404, 'NOT_FOUND');
  }

  static rateLimit(message = 'Too many requests') {
    return new APIError(message, 429, 'RATE_LIMITED');
  }

  static internal(message = 'Internal server error') {
    return new APIError(message, 500, 'INTERNAL_ERROR');
  }

  toJSON() {
    return {
      error: this.message,
      code: this.code,
      statusCode: this.statusCode,
    };
  }
}

/**
 * User-friendly error messages
 */
export const ERROR_MESSAGES: Record<string, { title: string; message: string }> = {
  NETWORK_ERROR: {
    title: 'No internet connection',
    message: 'Please check your connection and try again.',
  },
  RATE_LIMITED: {
    title: 'Too many requests',
    message: 'Please wait a moment and try again.',
  },
  UNAUTHORIZED: {
    title: 'Session expired',
    message: 'Please sign in again to continue.',
  },
  NOT_FOUND: {
    title: 'Not found',
    message: "We couldn't find what you're looking for.",
  },
  INTERNAL_ERROR: {
    title: 'Something went wrong',
    message: 'An unexpected error occurred. Please try again.',
  },
  VALIDATION_ERROR: {
    title: 'Invalid input',
    message: 'Please check your input and try again.',
  },
};

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: unknown): { title: string; message: string } {
  if (error instanceof APIError) {
    return ERROR_MESSAGES[error.code] ?? ERROR_MESSAGES.INTERNAL_ERROR;
  }

  if (error instanceof Error) {
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
  }

  return ERROR_MESSAGES.INTERNAL_ERROR;
}

/**
 * Safe JSON Response for API routes
 */
export function errorResponse(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof APIError) {
    return Response.json(error.toJSON(), { status: error.statusCode });
  }

  return Response.json(
    { error: 'Internal server error', code: 'INTERNAL_ERROR' },
    { status: 500 }
  );
}
