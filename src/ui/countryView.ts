import { type Country } from '../types/country.js';
import { type SearchState } from '../services/countrySearchController.js';

function createEl(tag: string, className?: string, text?: string): HTMLElement {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (text !== undefined) {
    el.textContent = text;
  }
  return el;
}
function createFlagElement(flagValue: string, countryName: string, className: string): HTMLElement {
  let src = flagValue;

  if (!flagValue.startsWith('http')) {
    const chars = [...flagValue];
    if (chars.length === 2) {
      const code = chars
        .map((char) => {
          const cp = char.codePointAt(0);
          return cp !== undefined ? String.fromCharCode(cp - 0x1f1e6 + 97) : '';
        })
        .join('');
      if (code.length === 2) {
        src = `https://flagcdn.com/${code}.svg`;
      }
    }
  }

  const img = document.createElement('img');
  img.className = className;
  img.src = src;
  img.alt = `Flag of ${countryName}`;
  img.loading = 'lazy';
  return img;
}
export function createCountryView(
  root: HTMLElement,
  onInput: (query: string) => void,
  onRetry: () => void,
) {
  const container = createEl('div', 'app');
  const title = createEl('h1', 'app-title', 'Country Search');

  const input = document.createElement('input');
  input.className = 'search-input';
  input.type = 'search';
  input.placeholder = 'Search for a country...';
  input.addEventListener('input', () => onInput(input.value));

  const content = createEl('main');
  container.append(title, input, content);
  root.replaceChildren(container);

  function renderIdle() {
    content.replaceChildren(createEl('p', 'status-message', 'Start typing a country name...'));
  }

  function renderLoading() {
    content.replaceChildren(createEl('p', 'status-message', 'Loading countries...'));
  }

  function renderEmpty(query: string) {
    content.replaceChildren(createEl('p', 'status-message', `No countries found for "${query}".`));
  }

  function renderError(message: string) {
    const box = createEl('div', 'error-box');
    const text = createEl('p', undefined, message);
    const retryBtn = createEl('button', 'retry-btn', 'Retry');
    retryBtn.addEventListener('click', onRetry);

    box.append(text, retryBtn);
    content.replaceChildren(box);
  }

  function renderDetails(country: Country, onBack: () => void) {
    const wrapper = createEl('div', 'country-details');

    const backBtn = createEl('button', 'close-details-btn', '← Back to results');
    backBtn.addEventListener('click', onBack);

    const detailsContent = createEl('div', 'details-content');

    const flag = createFlagElement(country.flag, country.name, 'details-flag');

    const info = createEl('div', 'details-info');
    const heading = createEl('h2', undefined, country.name);
    const regionText = country.subregion
      ? `${country.region} (${country.subregion})`
      : country.region;
    const areaText = country.area !== null ? `${country.area.toLocaleString()} km²` : 'N/A';
    const languagesText = country.languages.length > 0 ? country.languages.join(', ') : 'N/A';
    const currenciesText = country.currencies.length > 0 ? country.currencies.join(', ') : 'N/A';
    const bordersText = country.borders.length > 0 ? country.borders.join(', ') : 'None';

    info.append(
      heading,
      createEl('p', undefined, `Capital: ${country.capital}`),
      createEl('p', undefined, `Region: ${regionText}`),
      createEl('p', undefined, `Population: ${country.population.toLocaleString()}`),
      createEl('p', undefined, `Area: ${areaText}`),
      createEl('p', undefined, `Languages: ${languagesText}`),
      createEl('p', undefined, `Currencies: ${currenciesText}`),
      createEl('p', undefined, `Borders: ${bordersText}`),
    );

    detailsContent.append(flag, info);
    wrapper.append(backBtn, detailsContent);
    content.replaceChildren(wrapper);
  }

  function renderCountries(countries: Country[]) {
    const grid = createEl('div', 'countries-grid');

    for (const country of countries) {
      const card = createEl('article', 'country-card');

      const flag = createFlagElement(country.flag, country.name, 'country-flag');

      const body = createEl('div', 'country-card-body');
      const heading = createEl('h2', undefined, country.name);
      const capital = createEl('p', undefined, `Capital: ${country.capital}`);
      const region = createEl('p', undefined, `Region: ${country.region}`);
      const population = createEl(
        'p',
        undefined,
        `Population: ${country.population.toLocaleString()}`,
      );

      body.append(heading, capital, region, population);
      card.append(flag, body);
      card.addEventListener('click', () => {
        renderDetails(country, () => renderCountries(countries));
      });

      grid.append(card);
    }

    content.replaceChildren(grid);
  }

  function render(state: SearchState) {
    switch (state.status) {
      case 'idle':
        renderIdle();
        break;
      case 'loading':
        renderLoading();
        break;
      case 'empty':
        renderEmpty(state.query);
        break;
      case 'error':
        renderError(state.message);
        break;
      case 'success':
        renderCountries(state.countries);
        break;
    }
  }

  renderIdle();

  return { render };
}
