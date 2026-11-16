# Design & Architecture Decisions — Country Search

## 1. Stale Request Cancellation Mechanism (`AbortController` vs. Stale Flag)

### How It Works

Stale request cancellation is implemented across `src/services/countrySearchController.ts`, `src/api/searchCountries.ts`, and `src/utils/classifySearchError.ts`:

1. **Immediate cancellation on every input change:** Inside `handleInput` (`src/services/countrySearchController.ts`), `activeController?.abort()` is called immediately on every keystroke or input clear — before the debounce timer even expires. Any in-flight HTTP request is aborted right away.
2. **Debounce timer invalidation:** Each call to `handleInput` increments a local `inputVersion` counter. When `debouncedSearch` executes, it verifies `if (version !== inputVersion)` so outdated scheduled callbacks are discarded.
3. **Timeout & user signal composition:** Inside `searchCountries` (`src/api/searchCountries.ts`), the external `AbortSignal` is combined with `AbortSignal.timeout(...)` using `AbortSignal.any(...)`.
4. **Separating intentional aborts from real errors:** In `classifySearchError` (`src/utils/classifySearchError.ts`), a `DOMException` with `name === 'AbortError'` is classified as `{ type: 'aborted' }` and ignored silently in the controller's `catch` block. In contrast, `TimeoutError`, `HttpError`, and network failures transition the UI into the `error` state with a retry button.

### Why Not a Simple Boolean / Timestamp Flag?

A passive flag (e.g., ignoring responses whose request ID does not match the latest query) only discards stale data _after_ the network request finishes. Using `AbortController`:

- **Frees browser connections immediately:** Browsers enforce a limit on concurrent connections per origin (typically 6). Aborting obsolete requests prevents connection pool exhaustion during rapid typing.
- **Saves network bandwidth and CPU:** The browser stops downloading and parsing JSON payloads that will never be rendered.
- **Prevents race conditions at the transport level:** Aborted `fetch` promises reject before reaching state updates, guaranteeing that slow responses to earlier queries (`sp`) can never overwrite faster responses to later queries (`spain`).

## 2. Debounce Delay Justification (`300 ms`)

The custom `debounce` utility (`src/utils/debounce.ts`) is configured with a default delay of **`300 ms`** in `createCountrySearchController` (`src/services/countrySearchController.ts`).

- **Why `300 ms`:** Typical typing intervals between consecutive keystrokes during active input are around `150–250 ms`. A `300 ms` window reliably detects when the user pauses after typing a word or syllable while still feeling instantaneous.
- **If removed (`0 ms`):** Every single keystroke triggers an immediate HTTP request (`s` → `sp` → `spa` → `spai` → `spain`), creating unnecessary network traffic, risking API rate limits, and causing visual flickering between loading and result states.
- **If increased significantly (e.g., `1000–1500 ms`):** The interface feels sluggish and unresponsive — users finish typing and wait over a second before seeing any loading feedback or search results.

## 3. Time & Space Complexity (Big O) of `mapCountryResponse`

In `src/utils/mapCountryResponse.ts`, `mapCountryResponse(raw: RawCountry): Country` maps a single API DTO object into the internal `Country` domain model:

- **Single country (`mapCountryResponse`):**
  - **Time Complexity:** $O(L + C)$, where $L$ is the length of `raw.languages` and $C$ is the length of `raw.currencies`. Both arrays are iterated once via `.map()`, while scalar properties (`name`, `alpha3Code`, `region`, `population`, `flag`, `capital`, `subregion`, `area`) are accessed in $O(1)$ time. Because any country has a small bounded number of official languages and currencies ($L, C \le 15$), single-item mapping runs in $O(1)$ amortized time.
  - **Space Complexity:** $O(L + C + B)$, where $B$ is the length of `raw.borders`, due to allocating new arrays for `languages`, `currencies`, and `borders`.
- **Full API response (`data.map(mapCountryResponse)` in `src/api/searchCountries.ts`):**
  - **Time & Space Complexity:** $O(N \cdot (L + C))$, where $N$ is the number of matching countries returned by the API — linear $O(N)$ relative to the response size.

## 4. Clean Code Principles Applied

1. **Single Responsibility Principle (SRP):**
   - `debounce` (`src/utils/debounce.ts`) — handles only timer-based execution delay.
   - `mapCountryResponse` (`src/utils/mapCountryResponse.ts`) — pure data transformation from API DTO to `Country` with safe fallback defaults (`'N/A'`, `[]`, `null`).
   - `classifySearchError` (`src/utils/classifySearchError.ts`) — pure error categorization distinguishing `AbortError`, `TimeoutError`, `HttpError`, and network errors.
   - `searchCountries` (`src/api/searchCountries.ts`) — encapsulates `fetch`, `AbortSignal.any` composition, `response.ok` validation, and `404` empty-result semantics.
   - `createCountrySearchController` (`src/services/countrySearchController.ts`) — manages search state transitions and cancellation without any DOM dependencies.
   - `createCountryView` (`src/ui/countryView.ts`) — handles only safe DOM creation (`document.createElement`, `textContent`) and UI event listeners.

2. **Dependency Inversion & Decoupling:**
   - `createCountrySearchController` (`src/services/countrySearchController.ts`) depends only on the `onStateChange` callback abstraction rather than concrete DOM nodes, wired together in the composition root (`src/index.ts`). This enables fast, deterministic unit and race-condition tests in Vitest without a browser.

3. **Explicit State Machine (Discriminated Union):**
   - `SearchState` (`idle | loading | success | empty | error`) in `src/services/countrySearchController.ts` models all mutually exclusive UI states explicitly, preventing impossible states (such as rendering country cards and an error banner at the same time).

4. **DRY (Don't Repeat Yourself):**
   - Helper functions `createEl` and `createFlagElement` in `src/ui/countryView.ts` centralize repetitive DOM element creation and flag image resolution.
