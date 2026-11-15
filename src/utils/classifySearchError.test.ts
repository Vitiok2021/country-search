import { describe, it, expect } from 'vitest';
import { classifySearchError } from './classifySearchError';
import { HttpError } from '../api/HttpError';

describe('classifySearchError', () => {
  it('identifies AbortError as aborted without error message', () => {
    const error = new DOMException('The operation was aborted', 'AbortError');
    const result = classifySearchError(error);
    expect(result).toEqual({ type: 'aborted' });
  });
  it('identifies TimeoutError as an error with timeout message', () => {
    const error = new DOMException('The operation timed out', 'TimeoutError');
    const result = classifySearchError(error);
    expect(result).toEqual({ type: 'error', message: 'Request timed out. Please try again.' });
  });
  it('identifies HttpError as an error with status details', () => {
    const error = new HttpError(500, 'Request failed with status 500');
    const result = classifySearchError(error);
    expect(result).toEqual({ type: 'error', message: 'Server error (500). Please try again.' });
  });
  it('identifies network or unknown errors as a connection error', () => {
    const error = new TypeError('Failed to fetch');
    const result = classifySearchError(error);
    expect(result).toEqual({
      type: 'error',
      message: 'Network error. Please check your connection and try again.',
    });
  });
});
