import { HttpErrorResponse } from '@angular/common/http';
import { ApiProblemDetails } from '../../models/api.models';

/**
 * Normalized shape the UI works with, regardless of what the backend
 * actually returned (ValidationProblemDetails, ProblemDetails, plain text,
 * a network failure, etc).
 */
export interface ApiError {
  /** Human readable message safe to show in a toast or banner. */
  message: string;
  /** Field-level messages keyed by the backend property name, e.g. "title" -> ["..."]. */
  fieldErrors: Record<string, string[]>;
  status: number;
}

/**
 * Extracts a friendly message and any field-level validation errors from an
 * HttpErrorResponse produced by the SmartTaskOptimizer API. The API returns
 * RFC 9110 ProblemDetails (optionally with an `errors` dictionary for
 * validation failures), so we centralize the parsing here instead of letting
 * every component guess at the response shape.
 */
export function parseApiError(error: unknown): ApiError {
  if (!(error instanceof HttpErrorResponse)) {
    return { message: 'An unexpected error occurred. Please try again.', fieldErrors: {}, status: 0 };
  }

  if (error.status === 0) {
    return { message: 'Unable to reach the server. Check your connection and try again.', fieldErrors: {}, status: 0 };
  }

  const body = error.error as ApiProblemDetails | string | null | undefined;
  const fieldErrors: Record<string, string[]> = {};

  if (body && typeof body === 'object' && body.errors) {
    for (const [key, messages] of Object.entries(body.errors)) {
      // ASP.NET keys nested/binding failures like "$.dependencyIds[0]" - normalize
      // to the plain property name so the UI can map it back to a form control.
      const normalized = normalizeFieldKey(key);
      fieldErrors[normalized] = [...(fieldErrors[normalized] ?? []), ...messages];
    }
  }

  let message: string | undefined;
  if (body && typeof body === 'object') {
    message = body.detail || body.title;
  } else if (typeof body === 'string' && body.trim().length > 0) {
    message = body;
  }

  if (!message) {
    const fieldMessages = Object.values(fieldErrors).flat();
    message = fieldMessages[0];
  }

  if (!message) {
    message = fallbackMessageForStatus(error.status);
  }

  return { message, fieldErrors, status: error.status };
}

function normalizeFieldKey(key: string): string {
  // "$.dependencyIds[0]" -> "dependencyIds", "dto.Title" -> "title"
  const match = key.match(/([A-Za-z0-9_]+)(\[\d+\])?$/);
  const raw = match ? match[1] : key;
  return raw.charAt(0).toLowerCase() + raw.slice(1);
}

function fallbackMessageForStatus(status: number): string {
  switch (status) {
    case 400: return 'The request was invalid. Please review the highlighted fields.';
    case 401: return 'Your session has expired. Please sign in again.';
    case 403: return 'You do not have permission to perform this action.';
    case 404: return 'The requested item could not be found.';
    case 409: return 'This item was changed by someone else. Refresh and try again.';
    case 429: return 'Too many requests. Please slow down and try again shortly.';
    default: return status >= 500 ? 'The server ran into a problem. Please try again.' : 'Something went wrong.';
  }
}
