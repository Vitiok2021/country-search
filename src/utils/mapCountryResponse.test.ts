import { describe, it, expect } from 'vitest';
import { mapCountryResponse } from './mapCountryResponse';
import { type RawCountry } from '../types/country';

describe('mapCountryResponse', () => {
  it('maps full raw country response to Country model', () => {
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
    const result = mapCountryResponse(rawCountry);
    expect(result).toEqual({
      name: 'United States of America',
      alpha3Code: 'USA',
      capital: 'USA',
      region: 'Americas',
      subregion: 'North America',
      population: 329484123,
      area: 9372610,
      flag: 'https://countries.dev/flags/us.svg',
      borders: ['CAN', 'MEX'],
      languages: ['English'],
      currencies: ['United States dollar'],
    });
  });
  it('provides fallback values when optional fields are missing', () => {
    const minimalRaw: RawCountry = {
      name: 'United States of America',
      alpha3Code: 'USA',
      region: 'Americas',
      population: 329484123,
      flag: 'https://countries.dev/flags/us.svg',
    };
    const result = mapCountryResponse(minimalRaw);
    expect(result).toEqual({
      name: 'United States of America',
      alpha3Code: 'USA',
      region: 'Americas',
      population: 329484123,
      flag: 'https://countries.dev/flags/us.svg',
      capital: 'N/A',
      subregion: 'N/A',
      area: null,
      borders: [],
      languages: [],
      currencies: [],
    });
  });
});
