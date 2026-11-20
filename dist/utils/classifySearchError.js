import { HttpError } from '../api/HttpError.js';
export function classifySearchError(error) {
    if (error instanceof DOMException) {
        if (error.name === 'AbortError') {
            return { type: 'aborted' };
        }
        if (error.name === 'TimeoutError') {
            return { type: 'error', message: 'Request timed out. Please try again.' };
        }
    }
    if (error instanceof HttpError) {
        return { type: 'error', message: `Server error (${error.status}). Please try again.` };
    }
    return { type: 'error', message: 'Network error. Please check your connection and try again.' };
}
