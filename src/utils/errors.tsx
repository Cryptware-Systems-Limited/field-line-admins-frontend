import { ApiError } from '../api';

export function getError(error: unknown) {
    if (error instanceof ApiError) return error.message;
    if (error instanceof TypeError) return 'Unable to reach the server. It may be waking up—try again shortly.';
    return 'Something went wrong. Please try again.';
}

/** Strips empty-string (and optionally null) fields before sending a payload. */
export function compact<T extends object>(form: T, dropNull = false): T {
    return Object.fromEntries(Object.entries(form).filter(([, value]) => value !== '' && (!dropNull || value !== null))) as T;
}