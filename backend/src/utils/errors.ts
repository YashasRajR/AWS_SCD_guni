import { ERROR_CODES, ERROR_CODE_STATUS, type ErrorCode } from '@scd/constants';

/**
 * The one error type controllers/services should throw. The central error
 * handler middleware knows how to turn this into the standard
 * ApiErrorResponse envelope with the right HTTP status.
 */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = ERROR_CODE_STATUS[code];
    this.details = details;
  }

  static authRequired(message = 'Authentication is required for this request.'): AppError {
    return new AppError(ERROR_CODES.AUTH_REQUIRED, message);
  }

  static invalidCredentials(message = 'Invalid email or password.'): AppError {
    return new AppError(ERROR_CODES.INVALID_CREDENTIALS, message);
  }

  static forbidden(message = 'You do not have permission to perform this action.'): AppError {
    return new AppError(ERROR_CODES.FORBIDDEN, message);
  }

  static notFound(entity: string, message?: string): AppError {
    return new AppError(ERROR_CODES.RESOURCE_NOT_FOUND, message ?? `${entity} not found.`);
  }

  static validation(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(ERROR_CODES.VALIDATION_ERROR, message, details);
  }

  static duplicate(message: string, details?: Record<string, unknown>): AppError {
    return new AppError(ERROR_CODES.DUPLICATE_RESOURCE, message, details);
  }

  static checkpointAlreadyCompleted(message = 'This checkpoint has already been completed.'): AppError {
    return new AppError(ERROR_CODES.CHECKPOINT_ALREADY_COMPLETED, message);
  }

  static checkpointNotAssigned(message = 'You are not assigned to this checkpoint.'): AppError {
    return new AppError(ERROR_CODES.CHECKPOINT_NOT_ASSIGNED, message);
  }

  static qrTokenInvalid(message = 'This QR code is not valid.'): AppError {
    return new AppError(ERROR_CODES.QR_TOKEN_INVALID, message);
  }

  static qrTokenRevoked(message = 'This QR code has been revoked. Ask the attendee for a reissued ticket.'): AppError {
    return new AppError(ERROR_CODES.QR_TOKEN_REVOKED, message);
  }

  static internal(message = 'Something went wrong. Please try again.'): AppError {
    return new AppError(ERROR_CODES.INTERNAL_ERROR, message);
  }

  static paymentProviderUnavailable(
    message = 'Online payment is not configured yet. Contact an organizer to complete your registration.',
  ): AppError {
    return new AppError(ERROR_CODES.PAYMENT_PROVIDER_UNAVAILABLE, message);
  }
}
