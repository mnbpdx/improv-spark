# Improv Spark

A Progressive Web App (PWA) that generates random chord progressions for improv musicians. Hit a button, get a progression — simple as that.

**Live app: [improv-spark.vercel.app](https://improv-spark.vercel.app)**

## What It Does

- Generates chord progressions in any key (or a random key)
- Three complexity levels for both progressions and chord voicings
- Displays chords as note names or Roman numerals
- Optional random word prompt for extra creative constraint
- Save favorite progressions locally (persisted in `localStorage`)
- Full keyboard shortcut support
- Installable as a PWA (works offline after first load)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Spark a new progression |
| `F` | Toggle favorite |
| `H` | Toggle chord / Roman numeral display |
| `W` | Toggle word prompt |
| `S` | Open / close settings |
| `V` | Open / close favorites |
| `Esc` | Back to performance view |
| `1` `2` `3` | Progression: simple / medium / complex |
| `4` `5` `6` | Chords: basic / extended / rich |
| `?` | Show / hide keyboard shortcuts |

## Running Locally

No build step required — it's plain HTML, CSS, and JavaScript.

```bash
git clone https://github.com/mnbpdx/improv-spark.git
cd improv-spark
```

Then serve the files with any static file server. For example:

```bash
# Python
python3 -m http.server 8080

# Node (npx)
npx serve .
```

Open `http://localhost:8080` in your browser.

> Note: The service worker requires a server (not `file://`), so opening `index.html` directly won't enable offline support.

## License

MIT — see [LICENSE](LICENSE).
