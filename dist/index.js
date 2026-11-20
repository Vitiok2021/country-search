import { createCountrySearchController } from './services/countrySearchController.js';
import { createCountryView } from './ui/countryView.js';
const view = createCountryView(document.body, (query) => controller.handleInput(query), () => controller.retry());
const controller = createCountrySearchController({ onStateChange: (state) => view.render(state) });
