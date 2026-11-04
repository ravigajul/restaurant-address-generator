# How the extension works internally

A Chrome/Edge extension is a small web app made of ordinary HTML, JavaScript and a JSON manifest. The browser gives it extra powers (the `chrome.*` APIs) and runs each part in its own sandbox. This one has four files:

| File | Role |
|---|---|
| `extension/manifest.json` | Declares the extension, its popup and its permissions |
| `extension/popup.html` | The UI shown when you click the toolbar icon |
| `extension/popup.js` | Popup logic, plus the function that gets injected into the page |
| `extension/generator.js` | The data generator (auto-copied from `index.html`) |

```
 click icon ──► popup.html (isolated mini web page)
                  │  generator.js → makes names, address, tax ID
                  │  popup.js     → Generate / Fill buttons
                  │
                  │  chrome.scripting.executeScript(fillPage, data)
                  ▼
              the website tab (all frames) ──► fillPage() finds fields and fills them
                  │
                  └─ returns { filled, notes } ──► popup shows the result
```

## 1. `manifest.json`: the contract with the browser

```json
{ "manifest_version": 3,
  "permissions": ["activeTab", "scripting", "storage"],
  "action": { "default_popup": "popup.html" } }
```

The browser reads this first and uses it to decide:

- **`action.default_popup`**: clicking the toolbar icon opens `popup.html`.
- **`permissions`**: what the extension may do. Anything not listed is blocked.
  - `activeTab`: when the user clicks the icon, the extension gets temporary access to the current tab only. There is no standing access to every site, so the install prompt does not warn about reading data on all websites.
  - `scripting`: allows injecting code into a page.
  - `storage`: lets the popup remember the last locale.
- **Manifest V3** is the current format. Chrome and Edge share it, which is why one folder works in both.

## 2. The popup is an isolated mini web page

`popup.html` loads `generator.js`, then `popup.js`. It runs at `chrome-extension://<id>/popup.html`, not on the website you are filling, so it cannot see that page's JavaScript or DOM.

- **Lifetime:** it exists only while the popup is open and is destroyed when you click away. That is why the last locale is saved in `chrome.storage.local`.
- **Shared generator:** `generator.js` is the same code the website uses. `build-extension.sh` copies it out of `index.html`, so there is one source of truth.
- **Scope gotcha:** `generator.js` and `popup.js` share one global scope. Both once declared a function called `fill`, which is a syntax error that silently disabled every button. `popup.js` is now wrapped in `(() => { ... })()` so its names stay private.

## 3. The popup cannot touch the page, so it injects a function

The popup and the website live in separate worlds. The bridge is `chrome.scripting.executeScript`:

```js
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
await chrome.scripting.executeScript({
  target: { tabId: tab.id, allFrames: true },
  func: fillPage,          // the function itself
  args: [data, STATES]     // the generated values
});
```

- **How the function travels:** Chrome converts `fillPage` to source text, sends it to the tab and runs it there. It must therefore be fully self-contained and cannot use variables from `popup.js`. Everything it needs arrives through `args`.
- **What it can do there:** inside the page it has full access to `document`, so it can read and change the form.
- **`allFrames: true`:** it also runs inside iframes, where many checkout and application forms live.
- **Return value:** it sends `{ filled, notes }` back to the popup, which shows "Filled 11 fields…" and any warnings.
- **The `activeTab` grant:** this call works because the user clicked the icon.

## 4. How `fillPage` finds and fills fields

1. **Collect:** every visible, enabled `input`, `textarea` and `select`, plus custom dropdowns (`role=combobox`).
2. **Classify:** for each field, in this order:
   - the `autocomplete` attribute (`given-name`, `postal-code`, ...), the most reliable signal;
   - otherwise a combined hint of the `name`, `id`, `placeholder`, `aria-label` and `<label>` text, tested against regexes.
   - Rule order matters. `email`, `first` and `last` are tested before `name`, so a "First name" field never receives the restaurant name.
3. **Fill once per type:** the first match wins, so billing fields are filled and later fields of the same kind are left alone.
4. **Country first:** it fills the country, waits 600 ms, then re-scans. Many forms load the state list only after a country is chosen, and the re-scan finds the freshly built dropdown.
5. **`<select>` dropdowns:** it polls for up to about 2 seconds for a matching option, comparing value and text loosely ("NY", "New York", "NY – New York").
6. **Skipped on purpose:** hidden, disabled and read-only fields, passwords, address line 2, and fields whose hint looks like a username or search box.

## 5. Why it uses the native setter and fires events

React and Vue keep their own copy of each field's value. Writing `input.value = "x"` leaves them unaware, so the field looks filled but submits empty. The code instead does this:

```js
const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
setter.call(el, v);                                  // bypass the framework's wrapper
el.dispatchEvent(new Event('input',  { bubbles: true }));
el.dispatchEvent(new Event('change', { bubbles: true }));
```

It calls the browser's original setter and then fires the events a real keystroke would, so the framework updates its state.

## 6. What the generator produces

Everything runs in the browser, with no backend.

- **Uniqueness:** random values come from `crypto.getRandomValues`, and a session `Set` rejects any repeat.
- **Addresses:** a real city, a postcode in that city's range, and a random street in the locale's format.
- **Tax IDs:** they follow each country's real format and check-digit rule (Luhn, mod 11, mod 97, and so on), so they pass format validators. They are not registered to any business, so they are for testing only.
- **Phone:** national digits only, with no country code.
- **Email:** `first.last##@example.com`. The `example.com` domain is reserved for documentation, so mail never reaches a real inbox.
- **Locale lookup:** `en_IT` falls back to the country part, `it_IT`.

## 7. Testing

`tests/e2e.js` launches real Chrome with the extension loaded, serves two test forms from `tests/site/`, opens the popup, clicks Generate then Fill, and checks every field across 8 locales. One test form loads its state list late, to mimic real apps.

```
cd tests && npm i && npm test
BROWSER="/path/to/msedge" npm test     # same suite in Edge
```

The test uses a temporary copy of the extension with one extra host permission for the local test server. This stands in for the `activeTab` grant that a toolbar click gives, because automation cannot click the toolbar. The code under test is otherwise identical.

## 8. Developing and extending

- **Load unpacked:** Chrome and Edge read the folder directly, so there is no build step. After an edit, click the reload icon on the extension's card, then reopen the popup.
- **Debug the popup:** right-click inside it, then Inspect.
- **Debug the injected code:** use the page's own DevTools console, because that is where `fillPage` runs.
- **Add a field type:** add an entry to the `rules` array in `fillPage`, and a value in `values`.
- **Add a locale:** add an entry to `LOCALES` in `index.html` (cities, street format, phone pattern, tax generator), add its country to `EN` in `popup.js`, then run `./build-extension.sh`.
- **Auto-fill on chosen sites:** declare a `content_scripts` entry in the manifest. That needs a broader permission prompt, which is why this project uses the click-to-fill `activeTab` approach.
