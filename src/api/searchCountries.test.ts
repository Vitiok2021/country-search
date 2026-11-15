import { describe, it, expect, vi, afterEach } from 'vitest';
import { searchCountries } from './searchCountries';
import { HttpError } from './HttpError';
import { type RawCountry } from '../types/country';

describe('searchCountries', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });
  it('fetches countries with encoded query and maps response', async () => {
    const rawCountry: RawCountry = {
      name: 'United States of America',
      alpha3Code: 'USA',
      capital: 'USA',
      region: 'Americas',
      subregion: 'North America',
      population: 329484123,
      area: 9372610,
      flag: 'https://countries.dev/flags/us.svg',
      borders: ['CAN', 'MEX'],
      languages: [{ name: 'English' }],
      currencies: [{ name: 'United States dollar', code: 'USD' }],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: true, status: 200, json: async () => [rawCountry] });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const result = await searchCountries('united states', controller.signal);
    expect(fetchMock).toHaveBeenCalledWith('https://countries.dev/name/united%20states', {
      signal: expect.any(AbortSignal),
    });
    expect(result).toHaveLength(1);
    expect(result[0].languages).toEqual(['English']);
  });
  it('returns an empty array when API responds with 404', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 404 });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const result = await searchCountries('unknowncountry', controller.signal);
    expect(result).toEqual([]);
  });
  it('throws HttpError when API responds with server error', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    const promise = searchCountries('spain', controller.signal);
    await expect(promise).rejects.toBeInstanceOf(HttpError);
    await expect(promise).rejects.toMatchObject({ status: 500 });
  });
  it('forwards abort signal to fetch', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();
    controller.abort();
    await searchCountries('spain', controller.signal);
    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.signal?.aborted).toBe(true);
  });
});
