import { HttpError } from './HttpError.js';
import { mapCountryResponse } from '../utils/mapCountryResponse.js';
import { type Country, type RawCountry } from '../types/country.js';

const BASE_URL = 'https://countries.dev/name';
const REQUEST_TIMEOUT_MS = 8000;

export async function searchCountries(query: string, signal: AbortSignal): Promise<Country[]> {
  const combinedSignal = AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]);
  const response = await fetch(`${BASE_URL}/${encodeURIComponent(query)}`, {
    signal: combinedSignal,
  });
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    throw new HttpError(response.status, `Request failed with status ${response.status}`);
  }
  const data = (await response.json()) as RawCountry[];
  return data.map(mapCountryResponse);
}
