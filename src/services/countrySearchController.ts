import { searchCountries } from '../api/searchCountries.js';
import { classifySearchError } from '../utils/classifySearchError.js';
import { debounce } from '../utils/debounce.js';
import { type Country } from '../types/country.js';

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; countries: Country[] }
  | { status: 'empty'; query: string }
  | { status: 'error'; message: string };

export interface CountrySearchControllerOptions {
  onStateChange: (state: SearchState) => void;
  debounceMs?: number;
}

export function createCountrySearchController({
  onStateChange,
  debounceMs = 300,
}: CountrySearchControllerOptions) {
  let activeController: AbortController | null = null;
  let lastQuery = '';
  let inputVersion = 0;

  async function executeSearch(query: string) {
    activeController?.abort();
    const controller = new AbortController();
    activeController = controller;
    onStateChange({ status: 'loading' });

    try {
      const countries = await searchCountries(query, controller.signal);
      if (controller.signal.aborted) {
        return;
      }
      if (countries.length === 0) onStateChange({ status: 'empty', query });
      else onStateChange({ status: 'success', countries });
    } catch (error: unknown) {
      const classified = classifySearchError(error);
      if (classified.type === 'aborted') {
        return;
      } else {
        onStateChange({ status: 'error', message: classified.message });
      }
    }
  }
  const debouncedSearch = debounce((query: string, version: number) => {
    if (version !== inputVersion) {
      return;
    }
    void executeSearch(query);
  }, debounceMs);
  function handleInput(rawQuery: string) {
    const currentVersion = ++inputVersion;
    activeController?.abort();
    activeController = null;
    const trimmed = rawQuery.trim();
    lastQuery = trimmed;
    if (!trimmed) {
      onStateChange({ status: 'idle' });
      return;
    } else {
      debouncedSearch(trimmed, currentVersion);
    }
  }
  function retry() {
    if (!lastQuery) {
      return;
    }
    void executeSearch(lastQuery);
  }
  return { handleInput, retry };
}
