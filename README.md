# Mac-os-theme

A zero-dependency, macOS-inspired desktop interface built with vanilla HTML, CSS, and JavaScript.

## Features

- macOS-style menu bar, dock, desktop icons, and context menu
- Draggable, focusable, minimizable, closable, and zoomable windows
- Finder, Notes, Terminal, Calculator, and About This Mac apps
- Spotlight search with `Ctrl+K` or `Cmd+K`
- Sonoma, Ventura, and Monterey wallpapers
- Light and dark appearance modes
- Persistent notes, theme, and wallpaper settings
- Keyboard-operable Spotlight, menus, desktop icons, and app windows
- Touch-friendly window dragging on mobile devices

## Run

Open `index.html` directly in a modern browser, or serve the folder locally:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

Use `Ctrl+K` or `Cmd+K` to open Spotlight, arrow keys to select results, and `Enter` to launch. Use `Ctrl+W` or `Cmd+W` to close the active window and `Ctrl+M` or `Cmd+M` to minimize it.

## Notes

This is a browser UI simulation and does not provide access to a real filesystem or operating system. Theme, wallpaper, and notes are stored in the browser's local storage on this device.

## Security

- The page applies a Content Security Policy that blocks inline scripts, plugins, and untrusted network connections.
- Wallpapers load from Unsplash; the policy only permits images from `images.unsplash.com`.
- Notes are rendered as text and are not executed as HTML. Browser storage is unencrypted and should not be used for sensitive information.
- This static demo has no server-side authentication or backend. Add equivalent HTTP security headers in your hosting provider for protections that cannot be set by a page meta tag.

## Deploy to GitHub Pages

The workflow in `.github/workflows/deploy.yml` publishes the static site after changes reach `main`. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**. The first successful run will publish the site at `https://prashanthdevlab-hub.github.io/Mac-os-theme/`.
