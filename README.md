# Zenith v4.1.5 — Single New Tab + Theme Options

Built from v4.1.4 with the original Zenith design retained.

## Fixing the Pomodoro navigation
- There is **no `focus.html` file** in this package. All timer interactions, from the new tab and Dashboard, are rendered as internal views of `newtab.html`.
- The toolbar popup opens a native `chrome://newtab/` request and asks that tab to show the Pomodoro view; it never requests a URL ending in `focus.html`.
- `chrome://newtab/` is Chrome's own special page and the internal extension resource is inevitable under the hood; the extension itself does not navigate to visible `chrome-extension://.../focus.html`.
- If a `focus.html` URL still opens after a clean installation, another or older copy of Zenith (or an old tab/bookmark) is being launched. **Close old focus.html tabs and remove duplicate Zenith installations in chrome://extensions.**

## Themes and mascot
- Themes: Cream, Dark, Oat, Midnight and Custom.
- Custom lets you choose background, card, text and accent colours. It checks text contrast against both backgrounds before saving.
- Your custom palette is stored locally and included in JSON backups. Theme changes also apply to the toolbar popup and blocked-page fallback.
- The optional focus companion gives a brief head shake and hand wag and says “Not now!” inside the blocked-site reminder in the new tab. It respects reduced motion.

## Clean install (recommended to eliminate stale extension URLs)
1. Export a backup from your current Zenith settings.
2. Go to `chrome://extensions`; remove every old duplicate of Zenith. **Removing clears extension-local data.**
3. Close tabs showing `chrome-extension://.../focus.html`; remove old bookmarks to that page.
4. Extract the ZIP into a new permanent folder.
5. Enable Developer Mode, click **Load unpacked**, select the folder with `manifest.json`.
6. Open a new tab, verify it reads `New Tab`, and import your backup.
7. Test the Pomodoro link and toolbar Pomodoro: neither should end on `focus.html`.

All other functionality from v4.1.4 is retained. Native Chromium extension behaviour requires testing on an actual Chrome installation.

# Zenith v4.1.4 — Attention, with intention

A **locally stored, source-included Chrome/Edge/Brave new-tab extension**. Classic browser new-tab search and shortcuts, scheduled habits, goals and progress, Focus Mode blocking, Pomodoro, distraction-awareness charts and optional sticky notes.

## Installation / Updating without losing your goals

1. **Back up first:** Zenith Settings → Export backup.
2. Extract this ZIP to a permanent folder containing `manifest.json`.
3. Visit `chrome://extensions`, enable Developer mode and choose **Load unpacked**. Select that folder.
4. **For an existing Zenith installation**, overwrite the files in the *same existing unpacked extension directory*, then select **Reload** rather than installing a new extension. You may need to approve newly requested website access. If you install into a new folder, use **Import backup**.
5. Open a new tab. Optionally enter your name under Settings → Make it personal. Configure your blocked-site reminder under Settings → Distraction blocking, then switch on Focus Mode.

**Do not uninstall the previous extension before exporting your data.** Chrome stores each extension's local data under its extension ID. A new installation can receive a different ID, so its previous local data will not automatically carry over.

## What changed in v4.1.4

- **Unified New Tab workspace:** Pomodoro and Focus are now in-page views of the same New Tab extension document, not links to `focus.html`. "Back to new tab" and Settings stay in the same tab without writing `newtab.html` or URL hashes into the omnibox. Chrome still internally hosts this extension, but the normal new-tab address experience is retained by using the native New Tab.
- **Popup launch:** Dashboard and Pomodoro buttons request a fresh native New Tab and a tab-scoped, short-lived workspace view. They no longer create extension-file URLs.
- **Saved-time notice:** Ending a focus session displays a small accessible in-app toast rather than a blocking JavaScript alert. If the tab is hidden, Chromium may also display a system notification. Session duration and accumulation calculations are unchanged.
- **Little mascot:** The optional reminder companion is now a small illustrated inline SVG character with subtle head-shaking and hand-waving animation. Off by default and motion-reduced when requested. No GIF downloads or third-party assets.
- **Compatibility:** Back-up and storage format are unchanged. `focus.html` remains only as a brief compatibility bridge for old saved bookmarks; it is no longer opened by Zenith's own controls. For new install, extract the complete ZIP and load the folder containing `manifest.json`.

## What changed in v4.1.3

- **Focus duration:** Choose 25, 40, 50 or 90 minutes from the Focus page or Settings, or enter a custom focus length between 1 and 180 minutes. Changing a duration cannot discard a running or paused session.
- **Optional automatic short breaks:** Off by default. During a focus session, optionally stop the focus clock for a short rest every specified number of *focused* minutes, then automatically resume. Presets are 25/5, 50/10 and 75/15 (focus minutes / break minutes); custom intervals are 10–90 minutes and breaks 2–30 minutes. These are practical starting points rather than proven cognitive optima. A break does **not** count towards accumulated focus time. Standalone short/long break timers still work.
- **Finish early:** Pause or stop an unfinished focus session and select **End & save time**. The actual time spent focusing is stored, even if the planned session was not completed. Example: 9 minutes of a 40-minute focus session adds 9 minutes. Ending during an automatic break saves only the focus time. Reset explicitly warns if it would discard time. The Progress total adds underlying seconds across all sessions before formatting, avoiding per-session rounding errors. Fully completed sessions cannot be saved twice.
- **Habit order:** Drag checklist rows in Dashboard and connected habit rows in Goals. Up/down buttons are included for keyboard and touch access. Ordering is saved in the existing habits array, so the new-tab next task and popup follow the same order. Scheduled days and completion history are unaffected.
- **New-tab overflow:** Reduced excessive vertical spacing at shorter desktop heights and retained natural page scrolling only where content genuinely exceeds the viewport. Sticky notes and optional panels remain functional.
- **Optional little mascot:** Under Settings → Distraction blocking, enable **Little focus companion** to show a subtle, locally rendered animated waving character alongside the inline blocked-site reminder. Off by default, with reduced-motion support. No GIF downloads or outside image requests.
- **Focus transition notices:** When Chrome can deliver extension notifications, automatic break start/end and finished sessions can trigger a notification even if the Focus page is closed. Focus Mode website blocking remains independent of the timer.
- **Compatibility:** All settings are added with defaults; the existing `momentum_state_v1` key, manifest permissions, backing storage and earlier sessions remain compatible. No AI integrations or external telemetry.

## What changed in v4.1.2

- Blocked-site redirects now use `blocked.html` as a temporary bridge, then create a fresh `chrome://newtab/` tab while closing the intercepted tab. A contextual, dismissible reminder appears directly in the new tab. This avoids leaving `blocked.html` or `newtab.html` in the omnibox after a successful redirect. Chrome may briefly pass through the extension URL. If native new-tab creation fails, the existing blocked page stays as a fallback.
- The *Return to what matters* fallback button and *End Focus Mode* both use the same new-tab hand-off, no longer an `href="newtab.html"`.
- The new-tab clock uses a more balanced display weight and less cramped figures. 12-hour mode displays `9:30 PM` instead of `09:30 PM`.
- Settings → New tab adds an **optional** fine dotted background with a subtle cursor-following matte glow. Off by default, respects reduced-motion preferences. The existing Cream and Dark palettes remain unchanged.
- No new permissions or external data transfers; blocked site reminder context is ephemeral (`chrome.storage.session`), and existing local data is unchanged.

## What changed in v4.1.1

- Removed the decorative Z mark from the Zenith wordmark. On the new tab and dashboard, the wordmark is now plain text and cannot navigate away to a `chrome-extension://.../newtab.html` URL.
- The new-tab browser title is always **New Tab**, including when visiting Dashboard and Settings in the same tab.
- The clock is heavier and Settings → New tab offers **24-hour** (default) or **12-hour with AM/PM**.
- Settings → New tab lets you independently hide/show quick links and the daily goals bar. Both remain enabled by default for existing installs. Hiding either does not remove the underlying shortcuts, goals or check-ins.
- All settings remain local, continue using the existing `momentum_state_v1` key and are included in exported backups.

## What's new in v4.1

- **Personal greetings:** under Settings → Make it personal, set your name (up to 40 characters). The new-tab caption under the clock alternates between “Good morning/afternoon/evening, [Name].” and the fixed quote of the day every ~12 seconds. This greeting uses the device's local time; the quote changes with the calendar day. An empty name uses “Good morning.” etc. Transitions are gentle and respect reduced-motion settings. The quote no longer repeats in the new-tab footer. All data stays in existing local storage, is included in backup and imports correctly from older versions.

## What's new in v4

- **Distraction patterns:** an unobtrusive 7-day bar chart and top blocked domains under **Progress**. The count is based on *detected top-level navigation attempts* while Focus Mode is active. It can miss some navigations because Chrome's release-build DNR API does not expose a reliable complete list of matched rules. Rapid duplicate navigation events are deduplicated (~1.8 seconds per tab/domain). This is an approximate awareness metric, not an exact count or psychological assessment. Only domain and event timestamp are stored; no path, query, page content or full browsing history is saved. Recent history is retained for up to 90 days, up to 2,500 events. You can clear the log from Progress.
- **Personal Focus reminder:** add your own message under Settings → Distraction blocking. Opening a blocked domain redirects to a local Zenith reminder screen, instead of only a browser error page. The domain label is best-effort. Embedded/subresource requests remain blocked without a reminder. Existing matching tabs are replaced with a native New Tab showing the reminder when Focus Mode turns on.
- **Optional sticky notes:** enable under Settings → Sticky notes. The left-side shelf includes add/edit, pin/unpin, a subtle pin animation and drag-to-trash. Removed notes go to a recoverable trash list; you can restore or permanently empty the bin. It is hidden by default to keep the new tab quiet.
- **Visual refresh:** near-black default dark mode; soft ivory light mode; consistent sans typography, quieter controls and selective frosted/matte surfaces. The new tab only shows a clock, search, shortcuts, one daily next step and a Focus switch.
- **All previous features:** schedule-aware habit check-ins, milestones, heatmap, goal dashboard, Pomodoro and saved sessions, quick popup, JSON backup/restore and local-only data.
- **AI is not included.** No API key collection, AI provider calls or cloud sync.

## How blocking works

Zenith v4 uses Chrome Manifest V3 `declarativeNetRequest` to intercept *top-level navigations* to listed domains/subdomains via a brief `blocked.html` hand-off and then open a native New Tab with your personal reminder. Separate rules prevent loading embedded frames and other requests to those domains during Focus Mode. Domain requests still run through Chrome's DNR engine even when the background service worker sleeps.

- Rules are created only while Focus Mode is enabled and removed when it is disabled.
- There is a 90-domain limit for custom blocked sites. List entries must be hostnames like `facebook.com`.
- Chrome can enforce its own restrictions on particular browser pages, internal links, policies, incognito tabs or other extensions. This is a self-control aid, not an anti-tamper device.
- `webNavigation` observes navigation attempts for *configured blocked domains only* while Focus Mode is on, and stores domain + timestamp. Navigations can be missed depending on browser event ordering; counts are approximate.
- The initial activation does **not** log the automatic relocation of already-open blocked tabs as a fresh user attempt.

## Privacy and permissions

- **storage:** local goals, notes, history, settings and timer state.
- **alarms + notifications:** timer completion.
- **declarativeNetRequest:** install/remove native blocking rules.
- **tabs:** relocate matching already-open blocked tabs when Focus Mode starts.
- **webNavigation:** count detected attempts to navigate to configured blocked domains.
- **host_permissions for HTTP and HTTPS sites:** Chrome requires host access to **redirect a blocked website to Zenith's local reminder page** rather than simply displaying a browser network error. This is a broader browser permission than v3, so review and accept it knowingly. The extension does not transmit URLs, notes, goals or API keys to any server.
- **web_accessible_resources:** expose the local blocked-page files solely so Chrome can redirect blocked requests to the reminder.

No account, external script, advertising, telemetry, fonts, analytics servers, or model calls. Search and your own shortcuts open the sites you choose.

## Storage and data

- Main app state retains the legacy storage key `momentum_state_v1` for backward compatibility with earlier Momentum and Zenith versions.
- Distraction attempts are saved separately under `zenith_distraction_events_v1` to avoid forcing a blocker-rule refresh every time you attempt to open a site.
- Export includes both main state and distraction attempts. Import accepts Zenith and Momentum backups from older versions (which will not include the new history).
- The general reset also clears distraction history.

## Source files

- `newtab.html` / `app.js`: new-tab UI and dashboard, goals, insights, notes and settings
- `v4.css`: current palette, surfaces, notes, charts and blocked page (overrides the older `styles.css`)
- `blocked.html` / `blocked.js`: the local motivational reminder
- `background.js`: native blocking rules, navigation-attempt detection, timer alarms
- `store.js`: persistent data helpers and backward-compatible state
- `popup.html` / `popup.js`: toolbar popup
- `focus.html` / `focus.js`: dedicated Pomodoro screen

## Testing status

JavaScript syntax, CSS parsing, source-render smoke checks and simulated Chrome API tests for domain rules and logging passed. The available test Chromium has an administrator policy disabling unpacked extensions, so **the exact redirect behavior and attempt counts need real-world confirmation in a normal Chrome/Edge/Brave installation**. To diagnose, open `chrome://extensions` → Zenith → **Service worker / Inspect** and review console errors and the result of `chrome.declarativeNetRequest.getDynamicRules()`.

## Verification checklist for Chrome (v4.1.3)

The local Chromium test environment blocks unpacked extensions, so production Chrome's tab override must be checked manually:

1. Open a fresh new tab. Confirm browser title is **New Tab** and your saved habits remain.
2. In Settings → Distraction blocking, save `facebook.com`, then enable Focus Mode.
3. Navigate to `facebook.com` from an ordinary tab. Zenith should open a fresh native New Tab, close the intercepted tab and display a dismissible Focus reminder there. A short-lived `blocked.html` navigation may still occur before the hand-off.
4. Check that *Continue with today* dismisses the reminder without navigation. If Chrome refuses to create the native tab, `blocked.html` remains with working fallback buttons.
5. Repeat with an already-open Facebook tab, then disable Focus Mode and verify browsing works again.
6. Settings → New tab → Ambient dotted background. Confirm dots follow pointer subtly in both themes and disappear when disabled.
7. Settings → New tab → 12-hour. Confirm it reads like `9:25 PM` rather than `09:25 PM`.

The successful native new-tab hand-off has been tested with simulated Chrome APIs, not a fully installed extension.

## Focus session regression checks

1. Select a 40-minute focus session. Work for 9 minutes, pause, then select **End & save time**. Progress should show 9 minutes added. Repeating the end action must not count the session twice.
2. Enable 25/5 automatic breaks. With a 40-minute focus target, the focus countdown stops at 15:00 remaining after 25 minutes, displays a five-minute rest and resumes for the final 15 minutes. Total focus recorded is 40 minutes, not 45.
3. Pause midway through a break. Resuming should finish only the remaining break time; the total focus time should remain unchanged during rest.
4. Reorder a habit from the Goals card or Dashboard; ensure ordering persists in a new tab and exported backup.
5. At short screen heights, scrolling should occur only when enabled content genuinely exceeds the viewport.

Core timer edge cases passed automated tests, and the UI rendered and accepted settings interactions using an isolated DOM browser test. Real Chrome extension alarm delivery, redirect behaviour and notifications still need testing inside an installed unpacked extension.
