# blankhour.

**A quiet new tab for focus, habits and progress.**

blankhour. is a free, local-first browser extension that gives your new tab a simple clock, search, daily habits and an optional distraction blocker. It also includes Pomodoro sessions, progress charts, sticky notes and theme customisation.

**Beta release: v0.2.0**

This is an early version and it is still in development. You might find bugs or unfinished features. Please share suggestions, report problems or contribute improvements through GitHub Issues and pull requests.

## Features

- Minimal new tab with a clock, greeting, daily quote and search
- Optional quick links and daily goals card
- Habits with custom days and drag-to-reorder
- Goal progress charts and focus-time history
- Focus Mode with a website blocklist and personal reminders
- Pomodoro timer with presets, custom durations and optional automatic breaks
- Partial focus sessions count towards total focus time
- Optional sticky notes and a small animated focus companion
- Cream, Dark, Oat, Midnight and custom colour themes
- Manual export and import of your local data

## Install the beta

blankhour. is not yet available on the Chrome Web Store, so it needs to be installed manually.

1. Download the source ZIP from the GitHub release or choose **Code → Download ZIP**.
2. Extract the ZIP to a permanent folder.
3. Open `chrome://extensions` in Chrome or use `brave://extensions` or `edge://extensions`.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the folder that contains `manifest.json`.
7. Open a new tab to start using blankhour.

Keep the extracted folder in place. The browser loads the extension directly from it.

## Getting started

1. Open **Settings** to set your name, time format and appearance.
2. Add goals and habits with the days you want to work on them.
3. Set up your Focus Mode blocklist if you want to block distracting sites.
4. Start a focus session or use Pomodoro with optional breaks.
5. Review your routine and accumulated focus time in **Progress**.

## Updating an existing installation

1. **Export a backup** under Settings before making changes.
2. Download the new version and replace the files in the **same extension folder**.
3. Open `chrome://extensions` and click **Reload** on blankhour.

If you uninstall or load the extension from a different folder, Chrome may assign a different extension ID. Local data may not move with it. Import your backup after a clean installation.

### Moving from Zenith to blankhour.

blankhour. is the continuation of Zenith. Existing Zenith JSON backups are supported by the import feature. For a clean rebrand installation, export your Zenith data first, install blankhour. and then import the backup.

Internally, a couple of legacy storage keys are retained so that users who update an unpacked installation do not lose their goals or distraction history. These keys are not part of the new branding.

## Privacy and permissions

Your goals, habits, settings, notes and focus history are stored locally in your browser. There is no account or cloud sync in this beta.

The extension requests browser permissions for local storage, alarms, notifications, tab management, detecting blocked navigation attempts and applying website-blocking rules. Focus Mode only blocks sites you choose.

External search engines and bookmarked websites work as normal when you use them. Favicons may be fetched from external sites.

## Contributing

Found a bug or have an idea? Open a GitHub Issue with your browser version, what happened and what you expected. Screenshots and steps to reproduce the problem help a lot.

Pull requests are welcome. Please keep changes focused and avoid adding unnecessary dependencies.

## Development

This version uses **HTML, CSS and vanilla JavaScript** with **Chrome Extension Manifest V3**. There is no React app, build step or backend.

For now, the goal is to stabilise the beta and improve it through community feedback.

## Licence

A licence has not been selected yet. Please ask the maintainer before reusing or redistributing the source outside this repository.
