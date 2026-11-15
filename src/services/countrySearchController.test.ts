import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createCountrySearchController, type SearchState } from './countrySearchController';
import { type RawCountry } from '../types/country';

function createDeferredResponse() {
  let resolve!: (value: Response) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<Response>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('countrySearchController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  it('aborts outdated request on new input and resolves only the latest query', async () => {
    const baseCountry: RawCountry = {
      name: 'Spain',
      alpha3Code: 'ESP',
      capital: 'Madrid',
      region: 'Europe',
      subregion: 'Southern Europe',
      population: 47351567,
      area: 505992,
      flag: 'https://countries.dev/flags/es.svg',
      borders: ['FRA', 'PRT'],
      languages: [{ name: 'Spanish' }],
      currencies: [{ name: 'Euro', code: 'EUR' }],
    };
    const firstRequest = createDeferredResponse();
    const secondRequest = createDeferredResponse();
    const requests = [firstRequest, secondRequest];
    let callIndex = 0;

    const fetchMock = vi.fn((_url: string, options?: RequestInit) => {
      const current = requests[callIndex++];
      options?.signal?.addEventListener('abort', () => {
        current.reject(new DOMException('The operation was aborted', 'AbortError'));
      });
      return current.promise;
    });
    vi.stubGlobal('fetch', fetchMock);

    const states: SearchState[] = [];
    const controller = createCountrySearchController({
      onStateChange: (state) => states.push(state),
      debounceMs: 300,
    });
    controller.handleInput('sp');
    await vi.advanceTimersByTimeAsync(300);

    controller.handleInput('spain');
    await vi.advanceTimersByTimeAsync(300);

    secondRequest.resolve({
      ok: true,
      status: 200,
      json: async () => [baseCountry],
    } as Response);

    firstRequest.resolve({
      ok: true,
      status: 200,
      json: async () => [{ ...baseCountry, name: 'Singapore' }],
    } as Response);

    await vi.advanceTimersByTimeAsync(0);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(states.at(-1)).toEqual({
      status: 'success',
      countries: [expect.objectContaining({ name: 'Spain' })],
    });
  });
  it('resets state to idle and sends no request on empty input', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const states: SearchState[] = [];
    const controller = createCountrySearchController({
      onStateChange: (state) => states.push(state),
      debounceMs: 300,
    });
    controller.handleInput('sp');
    controller.handleInput('   ');
    await vi.advanceTimersByTimeAsync(300);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(states.at(-1)).toEqual({ status: 'idle' });
  });
  it('sets empty state when search returns no countries (404)', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal('fetch', fetchMock);
    const states: SearchState[] = [];
    const controller = createCountrySearchController({
      onStateChange: (state) => states.push(state),
      debounceMs: 300,
    });
    controller.handleInput('atlantis');
    await vi.advanceTimersByTimeAsync(300);
    expect(states.at(-1)).toEqual({ status: 'empty', query: 'atlantis' });
  });
  it('sets error state on failure and retries the last query', async () => {
    const rawCountry: RawCountry = {
      name: 'Italy',
      alpha3Code: 'ESP',
      capital: 'Milan',
      region: 'Europe',
      subregion: 'Southern Europe',
      population: 47351567,
      area: 505992,
      flag: 'https://countries.dev/flags/es.svg',
      borders: ['FRA', 'PRT'],
      languages: [{ name: 'Spanish' }],
      currencies: [{ name: 'Euro', code: 'EUR' }],
    };
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch'));
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: async () => [rawCountry] });
    vi.stubGlobal('fetch', fetchMock);
    const states: SearchState[] = [];
    const controller = createCountrySearchController({
      onStateChange: (state) => states.push(state),
      debounceMs: 300,
    });
    controller.handleInput('italy');
    await vi.advanceTimersByTimeAsync(300);
    expect(states.at(-1)).toEqual({
      status: 'error',
      message: 'Network error. Please check your connection and try again.',
    });
    controller.retry();
    await vi.advanceTimersByTimeAsync(0);
    await Promise.resolve();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(states.at(-1)).toEqual({
      status: 'success',
      countries: [expect.objectContaining({ name: 'Italy' })],
    });
  });
});
