import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce';
describe('debounce', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });
    it('calls function only after delay', () => {
        const fn = vi.fn();
        const debounceFn = debounce(fn, 300);
        debounceFn();
        vi.advanceTimersByTime(299);
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(fn).toHaveBeenCalledTimes(1);
    });
    it('resets timer on repeated calls and uses latest arguments', () => {
        const fn = vi.fn();
        const debounceFn = debounce(fn, 300);
        debounceFn('sp');
        vi.advanceTimersByTime(200);
        debounceFn('spain');
        vi.advanceTimersByTime(200);
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith('spain');
    });
});
