/* New-tab dashboard. No CDN, tracking, dependencies, or build step. */
const M = Momentum;
let attempts=[], noteDrawerOpen=true, noteTrashOpen=false;
// Keep the rotating daily message separate from app renders and persisted state.
const MESSAGE_INTERVAL_MS = 12000;
let messageIndex = 0, lastMessageSwap = Date.now(), messageFadeTimer = null;
let focusNotice=null, noticeTabId=null;
let state, page='home', toastTimer;
const byId = id => document.getElementById(id);
const e = M.escapeHtml;
const icons = {
  zen:'<path d="M6 7.5h12l-12 9h12"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/>',
  target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  chart:'<path d="M3 3v18h18"/><path d="m7 15 5-6 4 3 5-7"/>',
  focus:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  settings:'<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"/><path d="M20 12a8.1 8.1 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15.5 3h-4L11 6a8 8 0 0 0-1.7 1L7 6l-2 3.5L7 11a8 8 0 0 0 0 2l-2 1.5L7 18l2.3-1a8 8 0 0 0 1.7 1l.5 3h4l.3-3a8 8 0 0 0 1.7-1l2.4 1 2-3.5L20 13a8 8 0 0 0 0-1Z" transform="translate(-1.5 0) scale(.97)"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon:'<path d="M20.7 13a8.5 8.5 0 0 1-9.7-9.7A8.5 8.5 0 1 0 20.7 13Z"/>',
  flame:'<path d="M12 22c4.5 0 7-3.5 7-7.1 0-3-2-6-4.5-7.9.4 3-1 4-2 4-1-2-1.8-4.5-1.5-8C8 5.8 5 9.6 5 14.9 5 19 7.5 22 12 22Z"/>',
  spark:'<path d="m12 2 2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2L12 2Z"/>',
  edit:'<path d="M14 5l5 5M4 20l4-.8L20 7a2.1 2.1 0 0 0-3-3L5 16l-1 4Z"/>',
  trash:'<path d="M3 6h18M8 6V4h8v2m3 0-1 15H6L5 6M10 10v7m4-7v7"/>',
  close:'<path d="M18 6 6 18M6 6l12 12"/>',
  play:'<path d="m7 4 13 8-13 8V4Z"/>',
  pause:'<path d="M7 4v16M17 4v16"/>',
  reset:'<path d="M3 11a9 9 0 1 1 2.5 6.3M3 4v7h7"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  external:'<path d="M14 4h6v6M20 4l-9 9"/><path d="M20 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 17v4h16v-4"/>',
  shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/>',
  checkcircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
  coffee:'<path d="M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8ZM17 9h2a3 3 0 0 1 0 6h-2M7 3v2m5-2v2"/>'
};
icons.pin='<path d="m16 3 5 5-3 1-2 5-3 1-2 6-1 1-1-7-6-6-7-1 1-1 6-2 1-3Z"/>';
icons.note='<path d="M5 3h14v18l-4-4H5z"/>';
icons.user='<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>'; 
icons.search='<circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>';
const ic = (name,size=18) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]||icons.spark}</svg>`;
const button = (label,action,klass='btn',extra='')=>`<button type="button" class="${klass}" data-action="${action}" ${extra}>${label}</button>`;
// Static wordmark: never navigates away from the current New Tab or workspace view.
const brand = ()=>`<div class="brand" aria-label="Zenith"><span class="brand-name">zenith<span class="brand-period">.</span></span></div>`;
const nav = [{id:'home',label:'New tab',icon:'spark'},{id:'dashboard',label:'Dashboard',icon:'grid'},{id:'goals',label:'Goals',icon:'target'},{id:'insights',label:'Progress',icon:'chart'},{id:'focus',label:'Pomodoro',icon:'clock'},{id:'settings',label:'Settings',icon:'settings'}];
const sessionModes = [{id:'focus',label:'Focus'},{id:'short',label:'Short break'},{id:'long',label:'Long break'}];
const weekdayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const goalOf = id=>state.goals.find(g=>g.id===id);
const goalStyle = goal=>goal?.color||'sage';
const goalGlyph = goal=>`<span class="goal-icon ${goalStyle(goal)}">${e(goal?.emoji||'✳')}</span>`;
function dateHuman(){return M.dateLabel(new Date())}
function greeting(){const hour=new Date().getHours();return hour<12?'Good morning':hour<18?'Good afternoon':'Good evening'}
function dailyMessage(index=messageIndex){
  if (index % 2) return `“${M.quoteFor()}”`;
  const name=String(state?.settings?.displayName||'').trim();
  return `${greeting()}${name?`, ${name}`:''}.`;
}
function tickDailyMessage(){
  if (page!=='home' || document.hidden) return;
  if (Date.now()-lastMessageSwap<MESSAGE_INTERVAL_MS) return;
  lastMessageSwap=Date.now();
  messageIndex=(messageIndex+1)%2;
  const label=document.querySelector('[data-daily-message]');
  if (!label) return;
  if (messageFadeTimer) clearTimeout(messageFadeTimer);
  // Make sure motion preferences apply even when changed mid-session.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    label.textContent=dailyMessage();
    label.classList.remove('is-fading');
    return;
  }
  label.classList.add('is-fading');
  messageFadeTimer=setTimeout(()=>{
    if (!label.isConnected) return;
    label.textContent=dailyMessage();
    label.classList.remove('is-fading');
    messageFadeTimer=null;
  },240);
}
function sectionTitle(h,action='',label='View all'){return `<div class="section-head"><h2>${h}</h2>${action?`<button class="link" data-action="${action}">${label} ${ic('arrow',14)}</button>`:''}</div>`}
function focusSwitch(compact=false){const on=!!state.settings.focusModeEnabled;return `<button class="focus-switch ${on?'is-on':''} ${compact?'focus-switch-small':''}" type="button" data-action="focus-toggle" role="switch" aria-checked="${on}" aria-label="${on?'Turn off':'Turn on'} focus mode"><span class="focus-switch-icon">${ic('shield',16)}</span><span>Focus ${on?'on':'off'}</span><span class="toggle-track"><i></i></span></button>`}
function sideBar(){return `<aside class="sidebar">${brand()}<div class="tiny-label side-label">WORKSPACE</div><nav class="nav" aria-label="Main navigation">${nav.map(n=>`<button class="nav-link ${page===n.id?'active':''}" data-action="navigate" data-page="${n.id}">${ic(n.icon)}<span>${n.label}</span></button>`).join('')}</nav><div class="side-bottom"><div class="sidebar-focus">${ic('shield',18)}<div><strong>Stay intentional</strong><p>Keep distracting sites out when you need it.</p></div>${focusSwitch(true)}</div><div class="side-foot"><span>Small steps, kept daily.</span>${button(ic(['dark','midnight'].includes(state.settings.theme)?'sun':'moon'), 'theme','theme-round', 'title="Toggle theme" aria-label="Toggle theme"')}</div></div></aside>`}
function topBar(){return `<div class="topbar"><div class="eyebrow"><span class="dot"></span> ZENITH / ${e(page.toUpperCase())}</div><div class="topbar-right">${focusSwitch(true)}<div class="today-pill">${ic('calendar')} ${dateHuman()}</div>${button(ic(['dark','midnight'].includes(state.settings.theme)?'sun':'moon'),'theme','theme-round','title="Toggle light and dark mode" aria-label="Toggle theme"')}</div></div>`}

// The full-screen timer is an in-page workspace, not another extension document.
function focusView(){
  const t=state.timer, block=state.settings.focusModeEnabled, f=M.focusStats(state);
  const ended=t.status==='completed'&&t.endedEarly;
  const active=['paused','running'].includes(t.status);
  const selecting=!active;
  const presets=[25,40,50,90];
  const phase=t.mode==='focus'&&t.phase==='auto-break';
  const breakMessage=state.settings.autoBreaks?`A ${state.settings.autoBreakMinutes}-minute rest every ${state.settings.autoBreakEvery} minutes of focus`:'Automatic breaks are off';
  const fmt=secs=>`${String(Math.floor(secs/60)).padStart(2,'0')}:${String(secs%60).padStart(2,'0')}`;
  return `<div class="focus-shell"><div class="focus-top"><div class="brand"><span class="brand-name">zenith<span class="brand-period">.</span></span></div><a class="btn btn-subtle" type="button" data-action="navigate" data-page="home">${ic('arrow')} Back to new tab</a></div><div class="focus-center"><div class="focus-overline">✳ &nbsp; THIS TIME IS YOURS</div><h1 class="focus-title">Be here, <em style="color:var(--green)">fully.</em></h1><p class="focus-description">One task. One clear mind. Everything else can wait.</p><div class="timer-options focus-mode-options">${[{id:'focus',label:'Focus'},{id:'short',label:'Short break'},{id:'long',label:'Long break'}].map(m=>`<button class="timer-mode ${m.id===t.mode?'selected':''}" data-action="set-mode" data-mode="${m.id}" ${active?'disabled title="End or reset the active session first"':''}>${m.label}</button>`).join('')}</div>
  ${t.mode==='focus'?`<div class="zen-session-presets" aria-label="Focus session length">${presets.map(n=>`<button class="zen-choice ${state.settings.focusMinutes===n?'active':''}" data-action="focus-preset" data-minutes="${n}" ${!selecting?'disabled title="End or reset this session before changing duration"':''}>${n} min</button>`).join('')}</div><details class="zen-timer-more"><summary>Custom duration & break preferences</summary><form id="focus-preferences" class="zen-focus-preferences"><div class="zen-setting-line"><label for="custom-focus-min">Focus minutes</label><input id="custom-focus-min" type="number" name="focusMinutes" min="1" max="180" value="${state.settings.focusMinutes}" required></div><label class="zen-timer-checkbox"><input type="checkbox" name="autoBreaks" ${state.settings.autoBreaks?'checked':''}> Take automatic short breaks</label><div class="zen-setting-line"><label for="custom-break-every">Break after (min)</label><input id="custom-break-every" type="number" name="autoBreakEvery" min="10" max="90" value="${state.settings.autoBreakEvery}" required></div><div class="zen-setting-line"><label for="custom-break-length">Break length (min)</label><input id="custom-break-length" type="number" name="autoBreakMinutes" min="2" max="30" value="${state.settings.autoBreakMinutes}" required></div><div class="zen-session-presets">${[[25,5],[50,10],[75,15]].map(([every,length])=>`<button type="button" class="zen-choice" data-action="break-preset" data-every="${every}" data-length="${length}" ${!selecting?'disabled':''}>${every}/${length}</button>`).join('')}</div><button class="btn btn-subtle" type="submit" ${!selecting?'disabled':''}>Save preferences</button>${active?'<p class="help">Finish the current session to change these settings.</p>':''}</form></details>`:''}
  <p class="zen-break-status" data-break-status>${phase?'Taking a short break — focus time is paused':t.mode==='focus'?breakMessage:''}</p>
  <div class="focus-ring"><svg viewBox="0 0 310 310"><circle class="back" cx="155" cy="155" r="138"/><circle class="front" data-progress-ring cx="155" cy="155" r="138" stroke-dasharray="867.08" stroke-dashoffset="0"/></svg><div class="focus-ring-content"><div class="focus-ring-time" data-focus-time>${fmt(M.secondsLeft(t))}</div><div class="focus-ring-label" data-focus-label>${phase?'Short break':t.status==='running'?'Stay with it':t.status==='completed'?(ended?'Time saved':'Session complete'):t.status==='paused'?'Paused for now':'Ready when you are'}</div></div></div><div class="focus-buttons"><button class="btn btn-primary" data-action="timer-toggle">${ic(t.status==='running'?'pause':'play')} ${t.status==='running'?'Pause session':t.status==='paused'?'Resume session':t.status==='completed'?'Start another':'Start focusing'}</button>${t.mode==='focus'&&active?`<button class="btn btn-subtle zen-end-session" data-action="timer-end">End & save time</button>`:''}<button class="btn btn-icon" title="Discard and reset timer" aria-label="Discard and reset timer" data-action="timer-reset">${ic('reset')}</button></div>
  <div class="focus-select field"><label for="habit-select">What are you focusing on?</label><select id="habit-select"><option value="">Just a focused session</option>${M.due(state).map(h=>`<option value="${e(h.id)}" ${t.contextHabitId===h.id?'selected':''}>${e(h.title)}</option>`).join('')}</select><span class="help" style="text-align:center">Only focused minutes count. Ending early saves the time you have already worked.</span></div></div><div class="focus-foot"><div class="focus-foot-stat">${ic('clock',16)} <strong>${f.count} session${f.count!==1?'s':''}</strong> recorded today &nbsp;·&nbsp; ${f.minutes} minutes</div><div style="display:flex;gap:10px;align-items:center"><span class="focus-block-badge">${ic('shield',14)} Focus mode ${block?'on':'off'}</span><a type="button" data-action="navigate" data-page="settings" class="link">Settings →</a></div></div></div>`;
}
function updateFocusDisplay(){
  if(page!=='focus'||!state)return;
  const t=state.timer,seconds=M.secondsLeft(t);
  const el=document.querySelector('[data-focus-time]');
  if(el)el.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  const ring=document.querySelector('[data-progress-ring]');
  if(ring){const denom=t.phase==='auto-break'?Math.max(1,t.breakLengthSec||300):Math.max(1,t.durationSec);ring.style.strokeDashoffset=String(867.08*(1-Math.min(1,Math.max(0,seconds/denom))));}
  if(t.status==='running'&&seconds<=0)refresh();
}
function routeTo(view){
  if(!['home','dashboard','goals','insights','settings','focus'].includes(view))return;
  page=view;render();window.scrollTo(0,0);
}

function render(){if(!state)return;M.applyTheme(state.settings);const inner=page==='dashboard'?overview():page==='goals'?goalsView():page==='insights'?insightsView():settingsView();byId('app').innerHTML=page==='home'?newTabHome():page==='focus'?focusView():`<div class="app-shell">${sideBar()}<main class="main">${topBar()}${inner}</main></div>`;document.body.classList.toggle('zen-inline-focus',page==='focus');updateTimerDisplay();updateFocusDisplay();updateHomeClock()}
// Explicit hour conversion avoids locale-specific 24:00 output at midnight.
function formatClock(now = new Date()) {
  const hour = now.getHours(), minutes = String(now.getMinutes()).padStart(2, '0');
  if (state?.settings?.timeFormat === '12') {
    return {time:`${String((hour % 12) || 12)}:${minutes}`, meridiem:hour < 12 ? 'AM' : 'PM'};
  }
  return {time:`${String(hour).padStart(2, '0')}:${minutes}`, meridiem:''};
}
function updateHomeClock(){
  const {time,meridiem}=formatClock();
  document.querySelectorAll('[data-live-clock]').forEach(el=>{if(el.textContent!==time)el.textContent=time});
  document.querySelectorAll('[data-live-meridiem]').forEach(el=>{if(el.textContent!==meridiem)el.textContent=meridiem});
}
function shortcutVisual(l){if(l.id==='gmail')return '&#9993;';if(l.id==='github')return '&lt;/&gt;';if(l.id==='google')return 'G';return e((l.title||'?').slice(0,1).toUpperCase())}
function quickLinks(){const links=(state.settings.shortcuts||[]).slice(0,8);return `<div class="quick-links">${links.map(l=>`<div class="quick-wrap"><a class="quick-link" href="${e(l.url)}" title="Open ${e(l.title)}"><span class="quick-icon">${shortcutVisual(l)}</span><span>${e(l.title)}</span></a><button class="quick-remove" type="button" data-action="remove-shortcut" data-id="${e(l.id)}" title="Remove ${e(l.title)}" aria-label="Remove ${e(l.title)}">${ic('close',12)}</button></div>`).join('')}${links.length<8?`<button class="quick-link quick-add" data-action="add-shortcut" title="Add shortcut"><span class="quick-icon">${ic('plus',19)}</span><span>Add link</span></button>`:''}</div>`}
function noteDock(){
  if (!state.settings.notesEnabled) return '';
  const visible=(state.notes||[]).slice(0,6);
  const trashed=(state.notesTrash||[]);
  return `<aside class="note-dock ${noteDrawerOpen?'open':''}" aria-label="Your pinned notes">
    <button class="note-tab" type="button" data-action="toggle-notes" aria-expanded="${noteDrawerOpen}">${ic('note',17)}<span>Notes</span><span class="note-count">${visible.length}</span></button>
    ${noteDrawerOpen?`<div class="note-drawer matte-pane">
      <div class="note-drawer-head"><div><small>YOUR THOUGHTS</small><h2>Keep it close.</h2></div><button class="note-add" data-action="add-note" title="New sticky note" aria-label="New sticky note">${ic('plus',18)}</button></div>
      <div class="note-scroll">${visible.map((n,i)=>`<article class="zen-sticky ${n.pinned?'pinned':''}" draggable="true" data-note-id="${e(n.id)}" style="--note-turn:${[-1.5,1.1,-.6,1.3][i%4]}deg"><button class="note-pin ${n.pinned?'is-pinned':''}" data-action="pin-note" data-id="${e(n.id)}" title="${n.pinned?'Unpin':'Pin'} note" aria-label="${n.pinned?'Unpin':'Pin'} note">${ic('pin',15)}</button><textarea aria-label="Sticky note" data-note-text="${e(n.id)}" spellcheck="false" maxlength="500" placeholder="A thought worth keeping…">${e(n.text)}</textarea><button class="note-delete" data-action="trash-note" data-id="${e(n.id)}" aria-label="Move note to trash" title="Move note to trash">${ic('trash',14)}</button></article>`).join('')}${visible.length===0?`<div class="notes-empty">Start with one thought.<br>Keep it light.</div>`:''}</div>
      <div class="note-drawer-footer"><div class="note-trash-drop" id="note-trash-target" aria-label="Drag note here to trash">${ic('trash',17)}<span>Drop to trash</span></div><button class="note-trash-open" data-action="toggle-note-trash">Trash ${trashed.length?`(${trashed.length})`:''}</button></div>
      ${noteTrashOpen?`<div class="note-trash-list">${trashed.length?trashed.map(n=>`<div class="note-trashed"><span>${e(n.text.slice(0,45))||'Empty note'}</span><button data-action="restore-note" data-id="${e(n.id)}" title="Restore">Restore</button></div>`).join(''): '<p>Trash is empty.</p>'}${trashed.length?`<button class="note-trash-empty" data-action="empty-note-trash">Empty trash</button>`:''}</div>`:''}
      <small class="note-hint">Drag a note into the bin to remove it.</small>
    </div>`:''}
  </aside>`;
}
function distractionPanel(){
  const now=Date.now(), days=Array.from({length:7},(_,i)=>M.shiftDay(M.dayKey(),i-6));
  const recent=attempts.filter(a=>Number.isFinite(a.ts)&&now-a.ts<=90*86400000);
  const counts=days.map(key=>recent.filter(a=>M.dayKey(new Date(a.ts))===key).length);
  const max=Math.max(1,...counts);
  const allDomains={};for(const a of recent){allDomains[a.domain]=(allDomains[a.domain]||0)+1}
  const top=Object.entries(allDomains).sort((a,b)=>b[1]-a[1]).slice(0,4);
  const weekTotal=counts.reduce((a,b)=>a+b,0), todayCount=counts[6];
  return `<section class="card card-pad distraction-card" aria-label="Distraction insights">
    <div class="distraction-head"><div><div class="eyebrow">ATTENTION INSIGHTS</div><h2>Distractions, noticed.</h2><p>Detected attempts to open a site on your Focus blocklist.</p></div><div class="distraction-total"><strong>${weekTotal}</strong><span>this week</span></div></div>
    <div class="distraction-chart" aria-label="Blocked-site navigation attempts in the last seven days">${days.map((key,i)=>`<div class="distraction-bar-item" title="${key}: ${counts[i]} detected attempts"><span class="distraction-bar-number">${counts[i]||''}</span><div class="distraction-bar-track"><div class="distraction-bar-fill" style="height:${Math.round(counts[i]/max*100)}%"></div></div><small>${['S','M','T','W','T','F','S'][M.weekday(key)]}</small></div>`).join('')}</div>
    <div class="distraction-bottom"><div><small>TODAY</small><strong>${todayCount} ${todayCount===1?'attempt':'attempts'}</strong></div><div class="distraction-sites"><small>TOP DISTRACTIONS · LAST 90 DAYS</small>${top.length?top.map(([d,n])=>`<span><b>${e(d)}</b><i>${n}</i></span>`).join(''):'<p>Nothing tracked yet. That is fine.</p>'}</div></div>
    <div class="distraction-footer"><small>Counts are approximate. Reloads and repeated navigation may count separately. No full URLs or browsing history are saved.</small><button class="subtle-link" data-action="clear-distractions">Clear history</button></div>
  </section>`;
}
function newTabHome(){
  const d=M.dayStats(state), tasks=M.due(state), pending=tasks.filter(h=>!M.isDone(state,h.id)), next=pending[0], remaining=pending.length;
  const dtext=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const nextSub=remaining>1?`${remaining-1} more scheduled after this`:(remaining===1?'Your next small step':d.total?'Your list is complete':'No habits scheduled for today');
  const topic=next?e(next.title):(d.total?'A day well spent.':'A little space to begin.');
  return `<div class="newtab-shell zen-newtab ${state.settings.ambientDots?'zen-dots-on':''}">
    <header class="newtab-header zen-topbar">
      ${brand()}
      <nav class="zen-navigation" aria-label="Workspace"><button data-action="navigate" data-page="dashboard">Dashboard</button><button data-action="navigate" data-page="insights">Progress</button></nav>
      <div class="newtab-actions zen-header-actions">${focusSwitch()}${button(ic(['dark','midnight'].includes(state.settings.theme)?'sun':'moon'),'theme','theme-round','aria-label="Toggle appearance" title="Toggle appearance"')}${button(ic('settings',18),'navigate','newtab-gear','data-page="settings" aria-label="Settings" title="Settings"')}</div>
    </header>
    ${noteDock()}
    <main class="zen-content">
      <section class="zen-hero" aria-label="New tab">
        <div class="zen-date">${e(dtext)}</div>
        <div class="zen-clock"><span data-live-clock>${formatClock().time}</span><span class="zen-meridiem" data-live-meridiem>${formatClock().meridiem}</span></div>
        <div class="zen-time-caption zen-daily-message" aria-label="Daily greeting or quote"><span data-daily-message>${e(dailyMessage())}</span></div>
        <form id="web-search" class="search-panel zen-search" autocomplete="off"><span class="search-icon">${ic('search',21)}</span><input aria-label="Search the web or enter a website" type="text" id="search-query" name="q" placeholder="Search or enter a URL" spellcheck="false" autocomplete="off"><span class="zen-search-hint">↵</span></form>
        ${focusNotice?`<section class="zen-focus-notice matte-pane" role="status" aria-label="Focus reminder">${state.settings.mascotEnabled?`<div class="zen-mascot zen-companion" aria-hidden="true"><svg viewBox="0 0 82 90" width="82" height="90" fill="none"><g class="zen-companion-head"><path d="M41 15C21 15 11 29 11 47c0 20 14 32 30 32s30-12 30-32C71 29 61 15 41 15Z" fill="var(--panel2)" stroke="var(--accent)" stroke-width="1.8"/><path d="M30 46v4m22-4v4" stroke="var(--text)" stroke-linecap="round" stroke-width="4"/><path d="M35 62q6 4 12 0" stroke="var(--text)" stroke-width="2.4" stroke-linecap="round"/><ellipse cx="20" cy="58" rx="5" ry="2.2" fill="var(--accent)" opacity=".21"/><ellipse cx="62" cy="58" rx="5" ry="2.2" fill="var(--accent)" opacity=".21"/></g><g class="zen-companion-hand"><path d="M62 40q5-12 9-14c3-2 6 1 4 5l-2 6q7-4 9 0t-4 9l-9 10" fill="var(--panel)" stroke="var(--accent)" stroke-width="2.1" stroke-linejoin="round" stroke-linecap="round"/></g></svg><span class="zen-companion-bubble">Not now!</span></div>`:''}<div class="zen-focus-kicker">FOCUS MODE · DISTRACTION INTERRUPTED</div><h2>Stay with what matters.</h2><p>${focusNotice.domain?`<strong>${e(focusNotice.domain)}</strong> is paused while you focus. `:'That site is paused while you focus. '}${e((state.settings.focusReason||'').trim()||'You chose to protect this time.')}</p><button type="button" data-action="dismiss-focus-notice" aria-label="Dismiss focus reminder">Continue with today ${ic('arrow',15)}</button></section>`:''}
        ${state.settings.showShortcuts!==false?quickLinks():''}
      </section>
      ${state.settings.showGoalsBar!==false?`<section class="zen-today" aria-label="Today's progress">
        <div class="zen-today-intro"><div class="zen-today-kicker"><span class="zen-today-dot"></span> YOUR DAY <span class="zen-today-fraction">${d.done} / ${d.total} done</span></div><h2>${topic}</h2><p>${e(nextSub)}</p></div>
        <div class="zen-today-controls">${next?`<button class="zen-mark-button" data-action="toggle-habit" data-id="${e(next.id)}">${ic('check',17)} Mark complete</button>`:''}<button class="zen-all-tasks" data-action="navigate" data-page="dashboard">View routine ${ic('arrow',16)}</button></div>
        <div class="zen-progress-line"><span style="width:${d.percent??0}%"></span></div>
      </section>`:''}
      <div class="zen-bottom"><p>A little progress, every day.</p><button data-action="navigate" data-page="focus">${ic('clock',16)} Pomodoro ${ic('arrow',15)}</button></div>
    </main>
    <footer class="zen-footer"><span>zenith<span class="brand-period">.</span></span><span>Progress without the noise.</span></footer>
  </div>`;
}
function heading(kicker,title,subtitle,buttonHtml=''){return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1 class="page-title">${title}</h1><p class="page-subtitle">${subtitle}</p></div>${buttonHtml}</div>`}
function weeklyStrip(){
  const today=M.dayKey(), current=M.weekday(today),first=M.shiftDay(today,-((current+6)%7));
  return `<div class="week-strip">${Array.from({length:7},(_,i)=>{const key=M.shiftDay(first,i),d=M.dayStats(state,key),future=key>today;return `<div class="day-pill ${key===today?'today':''} ${future?'future':''}" title="${key}: ${d.done}/${d.total} scheduled habits"><span>${weekdayNames[M.weekday(key)]}</span><strong>${M.parseDate(key).getDate()}</strong><div class="day-dot ${d.total&&d.done===d.total?'hit':d.done?'part':''}"></div></div>`}).join('')}</div>`;
}
function habitRows(){
  const habits=M.due(state);
  if(!habits.length)return `<div class="empty">${ic('coffee',23)}<strong>It's a rest day.</strong><p>No habits scheduled for today. Enjoy the breathing room.</p>${button(`Add a habit ${ic('plus')}`,'add-habit','btn btn-primary')}</div>`;
  return `<div class="habits zen-sortable" aria-label="Today’s habits; drag to reorder">${habits.map((h,i)=>{const g=goalOf(h.goalId),done=M.isDone(state,h.id);return `<div class="habit-row zen-draggable ${done?'is-done':''}" draggable="true" data-habit-id="${e(h.id)}"><button class="zen-drag-handle" type="button" tabindex="-1" aria-hidden="true" title="Drag to reorder">⠿</button><button type="button" aria-label="${done?'Uncheck':'Complete'} ${e(h.title)}" class="tick ${done?'checked':''}" data-action="toggle-habit" data-id="${e(h.id)}">${ic('check',15)}</button><div class="habit-info"><div class="habit-name">${e(h.title)}</div><div class="habit-meta"><span>${e(g?.title||'Personal')}</span><span>•</span><span>${e(h.period||'Anytime')}</span></div></div><div class="zen-sort-actions"><button type="button" data-action="move-habit" data-id="${e(h.id)}" data-dir="-1" aria-label="Move ${e(h.title)} up" ${i===0?'disabled':''}>↑</button><button type="button" data-action="move-habit" data-id="${e(h.id)}" data-dir="1" aria-label="Move ${e(h.title)} down" ${i===habits.length-1?'disabled':''}>↓</button></div><span class="habit-glyph ${goalStyle(g)}" title="${e(g?.title||'Personal')}">${e(g?.emoji||'✳')}</span></div>`}).join('')}</div>`;
}
function goalMini(g){const p=M.goalProgress(state,g);return `<article class="goal-mini"><div class="goal-mini-head">${goalGlyph(g)}<span class="tiny-label">${g.target?'MILESTONE':'ONGOING'}</span></div><h3>${e(g.title)}</h3><p>${state.habits.filter(h=>h.goalId===g.id).length} connected habits</p><div class="mini-track"><span style="width:${p.percent??0}%"></span></div><div class="mini-count"><span>${p.checks} check-ins</span><span>${g.target?`${p.percent}% of ${g.target}`:'No target'}</span></div></article>`}
function timerModes(){return `<div class="timer-options">${sessionModes.map(x=>`<button class="timer-mode ${state.timer.mode===x.id?'selected':''}" data-action="set-mode" data-mode="${x.id}" ${state.timer.status==='running'?'title="Pause timer before switching mode"':''}>${x.label}</button>`).join('')}</div>`}
function timerControls(){const t=state.timer;return `<div class="timer-actions">${button(`${ic(t.status==='running'?'pause':'play')} <span>${t.status==='running'?'Pause':t.status==='completed'?'Start again':t.status==='paused'?'Resume':'Start'}</span>`,'timer-toggle','btn btn-primary')}${t.mode==='focus'&&['running','paused'].includes(t.status)?button(`${ic('check')} End & save`,'timer-end','btn btn-subtle'):''}${button(ic('reset'),'timer-reset','btn btn-icon','aria-label="Discard and reset timer" title="Discard and reset timer"')}</div>`}
function tinyTimer(){const t=state.timer;return `<section class="card focus-widget">${sectionTitle('Focus timer')} ${timerModes()}<div class="timer-time" data-timer-text>25:00</div><div class="timer-sub">${t.mode==='focus'&&t.phase==='auto-break'?'Automatic break — focus time is paused':t.mode==='focus'?'A little focus goes a long way':t.mode==='short'?'Rest is part of progress':'Make room to recharge'}</div>${timerControls()}<div class="focus-link"><button class="link" data-action="navigate" data-page="focus">Open distraction-free focus ${ic('external',14)}</button></div></section>`}
function progressHero(){const d=M.dayStats(state), pct=d.percent??0;return `<section class="card hero-card"><div class="hero-copy"><div class="eyebrow">${ic('spark',12)} TODAY'S MOMENTUM</div><h2>${d.total===0?'A little room to rest.':d.done===d.total?'You showed up today.':'Every checkmark counts.'}</h2><p>${d.total?`${d.done} of ${d.total} habits completed today`:'No habits due today'}</p><div class="hero-footer"><div class="hero-progress-track"><div class="hero-progress-fill" style="width:${pct}%"></div></div><span>${pct}%</span></div></div><div class="progress-orbit" style="--p:${pct}%"><div class="orbit-inner"><b>${pct}%</b><span>Today</span></div></div></section>`}
function overview(){const d=M.dayStats(state), focus=M.focusStats(state),week=M.rangeStats(state,7);return `${heading('YOUR WORKSPACE','Make today <em>count.</em>','A clear plan for today. Your history lives in Progress.',button(`${ic('plus')} Add habit`,'add-habit','btn btn-primary'))}<div class="dash-layout revised-layout"><div class="stack"><section class="card card-pad dashboard-today"><div class="dashboard-priority-header"><div><div class="eyebrow">YOUR DAILY CHECKLIST</div><h2>${d.total===0?'A quiet day':d.done===d.total?'You did it.':'Start with one thing.'}</h2><p>${d.done} of ${d.total} habits completed</p></div><div class="priority-progress" style="--p:${d.percent??0}%">${d.percent??0}%</div></div><div class="home-track"><span style="width:${d.percent??0}%"></span></div>${weeklyStrip()}${habitRows()}</section><section class="card card-pad dashboard-goals">${sectionTitle('Long-term goals','goals','View goals')}<div class="goal-preview">${state.goals.slice(0,3).map(goalMini).join('')||'<p class="help">Create your first goal to see it here.</p>'}</div></section></div><div class="stack"><section class="card dashboard-focus"><div class="dashboard-focus-title">${ic('shield',20)}<div><strong>Focus mode</strong><small>${state.settings.focusModeEnabled?'Your distracting sites are blocked':'Block distracting sites when you choose'}</small></div>${focusSwitch(true)}</div><button class="subtle-link" data-action="navigate" data-page="settings">Manage blocked websites ${ic('arrow',14)}</button></section>${tinyTimer()}<section class="card card-pad dashboard-week">${sectionTitle('This week','insights','Full report')}${barChart(7)}<p class="bar-caption">${week.percent===null?'Start checking in to build your story.':`${week.percent}% of scheduled habits completed`}</p></section><div class="dashboard-stat-row"><span>${ic('flame',17)} ${M.streak(state)} complete days</span><span>${ic('clock',17)} ${focus.minutes} focus min today</span></div></div></div>`}
function barChart(daysCount=7){const {days}=M.rangeStats(state,daysCount);const labels=['S','M','T','W','T','F','S'];return `<div class="${daysCount>7?'big-chart':'bar-chart'}">${days.map((d,i)=>`<div class="bar-col ${d.key===M.dayKey()?'today':''}" title="${d.key}: ${d.done} / ${d.total} scheduled"><div class="bar-track"><div class="bar-fill" style="height:${d.percent??0}%"></div></div><small>${daysCount>7?((i%2===0)?M.parseDate(d.key).getDate():''):labels[M.weekday(d.key)]}</small></div>`).join('')}</div>`}
function goalsView(){return `${heading('BUILD SOMETHING THAT LASTS','Your <em>goals.</em>','Long-term outcomes, connected to the small things you do each day.',button(`${ic('plus')} Create a goal`,'add-goal','btn btn-primary'))}<div class="full-grid">${state.goals.map(g=>{const p=M.goalProgress(state,g),hs=state.habits.filter(h=>h.goalId===g.id);return `<section class="card goal-card"><div class="goal-card-head">${goalGlyph(g)}<div style="min-width:0;flex:1"><h3>${e(g.title)}</h3><p>${e(g.description||'Make progress, one day at a time.')}</p></div><div class="goal-card-head-actions"><button class="small-icon-btn" data-action="edit-goal" data-id="${e(g.id)}" title="Edit goal">${ic('edit')}</button><button class="small-icon-btn" data-action="delete-goal" data-id="${e(g.id)}" title="Delete goal">${ic('trash')}</button></div></div><div style="display:flex;justify-content:space-between;align-items:center;margin-top:25px"><span class="tiny-label">${g.target?'MILESTONE PROGRESS':'TOTAL CHECK-INS'}</span><strong style="font-size:12px">${p.checks}${g.target?` / ${g.target}`:''}</strong></div><div class="mini-track" style="margin-top:11px"><span style="width:${p.percent||0}%"></span></div><div class="goal-card-foot"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><strong style="font-size:12px">Connected habits</strong><button class="link" data-action="add-habit" data-goal="${e(g.id)}">${ic('plus',14)} Add</button></div>${hs.length?hs.map((h,i)=>`<div class="goal-habit-line zen-draggable" draggable="true" data-habit-id="${e(h.id)}"><span class="zen-drag-handle" aria-hidden="true" title="Drag to reorder">⠿</span><span>${e(h.title)}</span><div style="display:flex;align-items:center;gap:5px"><small>${h.days.length===7?'Daily':h.days.map(d=>weekdayNames[d]).join(', ')}</small><button data-action="move-habit" data-id="${e(h.id)}" data-dir="-1" title="Move habit up" aria-label="Move habit up" ${i===0?'disabled':''}>↑</button><button data-action="move-habit" data-id="${e(h.id)}" data-dir="1" title="Move habit down" aria-label="Move habit down" ${i===hs.length-1?'disabled':''}>↓</button><button title="Edit habit" data-action="edit-habit" data-id="${e(h.id)}">${ic('edit',14)}</button><button title="Delete habit" data-action="delete-habit" data-id="${e(h.id)}">${ic('trash',14)}</button></div></div>`).join(''):'<p>No habits yet. Connect your first habit.</p>'}</div></section>`}).join('')}${state.goals.length===0?`<section class="card card-pad empty">${ic('target',28)}<h3>No goals yet</h3><p>Create your first long-term goal.</p>${button('Create goal','add-goal','btn btn-primary')}</section>`:''}</div>`}
function heatmap(daysCount=42){const {days}=M.rangeStats(state,daysCount);return `<div class="heatmap insights-heat">${days.map(d=>`<div class="heat ${d.percent===null?'none':d.percent===100?'three':d.percent>=50?'two':'one'}" title="${d.key}: ${d.done}/${d.total} completed"></div>`).join('')}</div><div class="legend">Less <span class="heat none"></span><span class="heat one"></span><span class="heat two"></span><span class="heat three"></span> More <span style="margin-left:auto">Last ${daysCount} days</span></div>`}
function insightsView(){const week=M.rangeStats(state,7), month=M.rangeStats(state,30), todayFocus=M.focusStats(state);const allSeconds=M.totalFocusSeconds(state.sessions),allMin=Math.floor(allSeconds/60),focusDisplay=allSeconds>=3600?`${Math.floor(allSeconds/3600)}h ${Math.floor(allSeconds%3600/60)}m`:allSeconds>=60?`${allMin}m ${allSeconds%60?`${allSeconds%60}s`:''}`.trim():`${allSeconds}s`;return `${heading('LOOK HOW FAR YOU HAVE COME','Your <em>progress.</em>','Real progress, measured against what you actually scheduled.')}<div class="metric-grid"><section class="card metric"><div class="metric-title">Last 7 days consistency</div><div class="metric-value">${week.percent===null?'—':`${week.percent}%`}</div><div class="metric-foot">${week.done} of ${week.total} scheduled habits</div></section><section class="card metric"><div class="metric-title">Last 30 days consistency</div><div class="metric-value">${month.percent===null?'—':`${month.percent}%`}</div><div class="metric-foot">${month.done} of ${month.total} scheduled habits</div></section><section class="card metric"><div class="metric-title">Focus time accumulated</div><div class="metric-value zen-focus-metric">${focusDisplay}</div><div class="metric-foot">${state.sessions.length} sessions (including early finishes) • ${todayFocus.count} today</div></section></div>${distractionPanel()}<div class="insight-grid"><section class="card card-pad">${sectionTitle('Last 14 days')} ${barChart(14)}<p class="help" style="margin-top:18px">Each column shows the percentage of scheduled habits completed that day. Empty days are shown without a bar.</p></section><section class="card card-pad">${sectionTitle('Your activity map')}${heatmap(42)}</section></div><section class="card card-pad" style="margin-top:18px">${sectionTitle('Goal milestones','goals','Manage goals')}<div class="goal-preview">${state.goals.map(goalMini).join('')||'<p class="help">Create a goal to begin your journey.</p>'}</div><p class="help" style="margin:18px 0 0">A goal's milestone counts completed habit check-ins since the goal was created. It is not a prediction of achievement.</p></section>`}
function settingsView(){const s=state.settings;return `${heading('MAKE IT YOURS','Your <em>space.</em>','Choose how Zenith looks, works and protects your attention.')}<div class="settings-section"><section class="card setting-card"><div class="setting-head"><div><h2>Make it personal</h2><p>Your new tab alternates between a greeting and the quote of the day.</p></div>${ic('user',20)}</div><form id="name-form" class="profile-name-form"><div class="field"><label for="profile-name">Your name</label><input id="profile-name" name="displayName" type="text" maxlength="40" autocomplete="given-name" spellcheck="false" placeholder="e.g. Ali" value="${e(s.displayName||'')}"><p class="help">Try “Good morning, Ali.” Leave blank for a simple greeting. Only saved on this device.</p></div><button type="submit" class="btn btn-primary">Save name</button></form></section><section class="card setting-card"><div class="setting-head"><div><h2>Appearance</h2><p>Find a quiet colour palette or make your own.</p></div>${ic('sun',20)}</div>
<div class="zen-theme-grid" role="group" aria-label="Colour theme">
${[
  ['cream','Cream','#f5f3ee','#242521','#9a8164'],
  ['dark','Dark','#0c0d0e','#eeede8','#c7ad8a'],
  ['oat','Oat','#eee8dc','#302a25','#98715a'],
  ['midnight','Midnight','#111722','#e9edf1','#95a9c5'],
  ['custom','Custom',s.customTheme.background,s.customTheme.text,s.customTheme.accent]
].map(([key,label,bg,fg,accent])=>`<button class="zen-theme-option ${s.theme===key?'selected':''}" type="button" data-action="theme-set" data-theme="${key}" aria-pressed="${s.theme===key}"><span class="zen-theme-swatch" style="--sw-bg:${bg};--sw-fg:${fg};--sw-ac:${accent}"><i></i><i></i><i></i></span><span>${label}</span></button>`).join('')}
</div>
<details class="zen-theme-editor" ${s.theme==='custom'?'open':''}><summary>Customise palette</summary><p class="help">Choose the background, card surface, text and accent. Colour combinations must remain readable.</p>
<form id="custom-theme-form" class="zen-colour-grid">
${[['background','Background'],['surface','Cards'],['text','Text'],['accent','Accent']].map(([id,label])=>`<label class="zen-colour-field"><span>${label}</span><input type="color" name="${id}" value="${e(s.customTheme[id])}" aria-label="${label} colour"><code>${e(s.customTheme[id].toUpperCase())}</code></label>`).join('')}
<div class="zen-colour-actions"><button type="submit" class="btn btn-primary">Apply colours</button><button type="button" class="btn" data-action="reset-custom-theme">Reset custom</button></div></form>
</details></section><section class="card setting-card"><div class="setting-head"><div><h2>New tab</h2><p>Control what appears on your start page, without deleting any of your data.</p></div>${ic('clock',20)}</div><div class="newtab-preferences"><div class="newtab-setting-row"><div><h3>Time format</h3><p>Choose 24-hour time or 12-hour time with AM/PM.</p></div><div class="segmented" role="group" aria-label="Clock format"><button type="button" aria-pressed="${s.timeFormat!=='12'}" class="${s.timeFormat!=='12'?'selected':''}" data-action="time-format" data-format="24">24-hour</button><button type="button" aria-pressed="${s.timeFormat==='12'}" class="${s.timeFormat==='12'?'selected':''}" data-action="time-format" data-format="12">12-hour</button></div></div><div class="toggle-line newtab-setting-row"><div><h3>Quick links</h3><p>Show your saved website shortcuts beneath the search bar.</p></div><button class="switch ${s.showShortcuts!==false?'on':''}" data-action="shortcuts-toggle" role="switch" aria-checked="${s.showShortcuts!==false}" aria-label="Show quick links on new tab"></button></div><div class="toggle-line newtab-setting-row"><div><h3>Daily goals bar</h3><p>Show today’s routine card beneath your shortcuts.</p></div><button class="switch ${s.showGoalsBar!==false?'on':''}" data-action="goals-bar-toggle" role="switch" aria-checked="${s.showGoalsBar!==false}" aria-label="Show daily goals bar on new tab"></button></div><div class="toggle-line newtab-setting-row"><div><h3>Ambient dotted background</h3><p>A fine dotted texture with a soft, cursor-following glow. Off by default.</p></div><button class="switch ${s.ambientDots?'on':''}" data-action="ambient-dots-toggle" role="switch" aria-checked="${s.ambientDots===true}" aria-label="Toggle ambient dotted background"></button></div></div></section><section class="card setting-card"><div class="setting-head"><div><h2>Sticky notes</h2><p>A little note shelf along the left of your new tab, completely optional.</p></div>${ic('note',20)}</div><div class="toggle-line"><div><h3>Enable sticky notes</h3><p>Pin, edit or drag a note into the trash. Disabled by default.</p></div><button class="switch ${s.notesEnabled?'on':''}" data-action="notes-toggle" role="switch" aria-checked="${s.notesEnabled}" aria-label="Toggle pinned notes"></button></div></section><section class="card setting-card"><div class="setting-head"><div><h2>Focus sessions and breaks</h2><p>Choose a sustainable rhythm. Automatic breaks are optional and never count as focus time.</p></div>${ic('clock',20)}</div><div class="zen-presets" aria-label="Focus duration presets"><span>Quick focus lengths</span>${[25,40,50,90].map(n=>`<button class="zen-choice ${s.focusMinutes===n?'active':''}" data-action="focus-preset" data-minutes="${n}" type="button">${n} min</button>`).join('')}</div><form id="durations-form"><div class="form-grid"><div class="field"><label for="focus-min">Focus (minutes)</label><input id="focus-min" type="number" name="focusMinutes" min="1" max="180" required value="${s.focusMinutes}"></div><div class="field"><label for="short-min">Short break</label><input id="short-min" type="number" name="shortMinutes" min="1" max="60" required value="${s.shortMinutes}"></div><div class="field"><label for="long-min">Long break</label><input id="long-min" type="number" name="longMinutes" min="1" max="90" required value="${s.longMinutes}"></div></div><div style="margin-top:16px"> <button class="btn btn-primary" type="submit">Save durations</button></div></form><div class="zen-break-config"><div class="toggle-line"><div><h3>Automatic short breaks</h3><p>Pause the focus clock after a period of work, take a break and then resume automatically.</p></div><button class="switch ${s.autoBreaks?'on':''}" data-action="auto-breaks-toggle" role="switch" aria-checked="${s.autoBreaks}" aria-label="Automatic short breaks"></button></div><div class="zen-presets"><span>Break rhythm</span>${[[25,5,'25 / 5'],[50,10,'50 / 10'],[75,15,'75 / 15']].map(([f,b,label])=>`<button class="zen-choice ${s.autoBreakEvery===f&&s.autoBreakMinutes===b?'active':''}" data-action="break-preset" data-every="${f}" data-length="${b}" type="button">${label}</button>`).join('')}</div><form id="break-options-form"><div class="form-grid"><div class="field"><label for="break-every">Break after (focus minutes)</label><input id="break-every" type="number" name="autoBreakEvery" min="10" max="90" value="${s.autoBreakEvery}" required></div><div class="field"><label for="break-length">Break duration (minutes)</label><input id="break-length" type="number" name="autoBreakMinutes" min="2" max="30" value="${s.autoBreakMinutes}" required></div></div><button type="submit" class="btn btn-subtle zen-save-breaks">Save break rhythm</button><p class="help">Examples are starting points, not universal cognitive optima. Settings take effect with your next focus session.</p></form></div></section><section class="card setting-card"><div class="setting-head"><div><h2>Distraction blocking</h2><p>Focus Mode blocks listed domains and moves already-open matching tabs to a distraction-free screen. Pomodoro is separate.</p></div>${ic('shield',20)}</div><div class="toggle-line"><div><h3>Focus mode is independent of the timer</h3><p>Switch it on from any new tab. Switching it off immediately removes the blocking rules.</p></div><button class="switch ${s.focusModeEnabled?'on':''}" data-action="focus-toggle" role="switch" aria-checked="${s.focusModeEnabled}" aria-label="Toggle site blocking"></button></div><form id="sites-form" style="margin-top:19px"><div class="field"><label for="sites">Sites to block (one domain per line)</label><textarea id="sites" name="sites" rows="4" spellcheck="false" placeholder="youtube.com">${e((s.blockedSites||[]).join('\n'))}</textarea></div><p class="help">Enter hostnames like youtube.com, not full URLs. Subdomains are included. Existing blocked-site tabs are moved to the Zenith blocked screen when Focus Mode turns on. Chrome may ask for tab access to do this.</p><button class="btn btn-primary" type="submit">Save blocklist</button></form><form id="motive-form" style="margin-top:22px"><div class="field"><label for="focus-motive">Your reason for staying focused</label><textarea id="focus-motive" name="focusReason" maxlength="240" rows="3" placeholder="Why is your attention worth protecting?">${e(s.focusReason||'')}</textarea><p class="help">This personal message appears whenever you try to open a blocked site. Stored locally.</p></div><button class="btn btn-primary" type="submit">Save my reminder</button></form><div class="toggle-line zen-mascot-setting"><div><h3>Little focus companion</h3><p>Show a small, gently animated “not now” mascot on blocked-site reminders. Off by default.</p></div><button class="switch ${s.mascotEnabled?'on':''}" data-action="mascot-toggle" role="switch" aria-checked="${!!s.mascotEnabled}" aria-label="Show focus companion"></button></div><p class="help" style="margin-top:12px">To show the reminder before loading blocked websites, Chrome requests access to website addresses. Zenith only stores the blocked domain and attempt time, not complete URLs.</p></section><section class="card setting-card"><div class="setting-head"><div><h2>Your data, your device</h2><p>All goals, check-ins, notes and distraction history are stored locally in Chrome. No sign-in, servers or analytics.</p></div>${ic('download',20)}</div><div style="display:flex;gap:9px;flex-wrap:wrap">${button(`${ic('download')} Export backup`,'export','btn')}${button(`${ic('upload')} Import backup`,'import','btn')}<input id="backup-input" type="file" accept="application/json,.json" hidden></div><p class="help" style="margin:15px 0 0">Removing the extension may remove local data. Export a backup first. Import replaces your existing Zenith data.</p></section><section class="card setting-card"><div class="setting-head"><div><h2>Start fresh</h2><p>Clear your goals, habit history and focus sessions.</p></div>${ic('reset',20)}</div>${button('Reset all Zenith data','reset-all','btn btn-danger')}</section></div>`}
function toast(message,error=false){const root=byId('toast-root');root.innerHTML=`<div role="status" class="toast ${error?'error':''}">${e(message)}</div>`;clearTimeout(toastTimer);toastTimer=setTimeout(()=>root.innerHTML='',3300)}
function daysChecks(selected=[0,1,2,3,4,5,6]){return `<div class="day-picker">${weekdayNames.map((day,i)=>`<label class="day-check" title="${['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][i]}"><input type="checkbox" name="days" value="${i}" ${selected.includes(i)?'checked':''}><span>${day.slice(0,2)}</span></label>`).join('')}</div>`}
function modal(type,id=null,preGoal=null){const goal=type==='goal'?state.goals.find(g=>g.id===id):null;const habit=type==='habit'?state.habits.find(h=>h.id===id):null;const title=type==='goal'?(goal?'Edit goal':'A new goal'):(habit?'Edit habit':'A new habit');const subtitle=type==='goal'?'Give your long-term vision a name.':'Choose a small action and the days it belongs to.';
  let form = '';
  if(type==='goal')form=`<form id="goal-form" class="modal-form" data-id="${e(id||'')}"><div class="field"><label for="goal-title">Goal name</label><input id="goal-title" name="title" maxlength="80" required autofocus placeholder="e.g. Get stronger this year" value="${e(goal?.title||'')}"></div><div class="field"><label for="goal-desc">Why it matters (optional)</label><input id="goal-desc" name="description" maxlength="180" placeholder="A short note to your future self" value="${e(goal?.description||'')}"></div><div class="field"><label for="goal-target">Target check-ins (optional)</label><input id="goal-target" type="number" min="1" max="100000" name="target" placeholder="e.g. 60" value="${goal?.target||''}"><div class="help">Each completed connected habit counts as one check-in toward the milestone.</div></div><div class="field"><label>Choose an accent</label><div class="color-options">${['sage','peach','lavender'].map(c=>`<label class="color-swatch ${c}"><input type="radio" name="color" value="${c}" ${c===(goal?.color||'sage')?'checked':''}><span></span></label>`).join('')}</div></div><div class="field"><label for="goal-emoji">Symbol</label><select id="goal-emoji" name="emoji">${['✳','✦','☀','◈','✿','◉','↗','★','♡','☕'].map(sym=>`<option value="${sym}" ${sym===(goal?.emoji||'✳')?'selected':''}>${sym}</option>`).join('')}</select></div><div class="modal-footer">${button('Cancel','close-modal','btn')}<button type="submit" class="btn btn-primary">${goal?'Save goal':'Create goal'}</button></div></form>`;
  else form=`<form id="habit-form" class="modal-form" data-id="${e(id||'')}"><div class="field"><label for="habit-title">Habit name</label><input id="habit-title" name="title" maxlength="100" required autofocus placeholder="e.g. Walk for 30 minutes" value="${e(habit?.title||'')}"></div><div class="field"><label for="habit-goal">Connected goal</label><select id="habit-goal" name="goalId" required>${state.goals.map(g=>`<option value="${e(g.id)}" ${g.id===(habit?.goalId||preGoal||state.goals[0]?.id)?'selected':''}>${e(g.title)}</option>`).join('')}</select></div><div class="field"><label>Days to show this habit</label>${daysChecks(habit?.days||[0,1,2,3,4,5,6])}<span class="help">Unscheduled days never count as missed progress.</span></div><div class="field"><label for="habit-period">Time of day</label><select id="habit-period" name="period">${['Morning','Afternoon','Evening','Anytime'].map(p=>`<option value="${p}" ${p===(habit?.period||'Morning')?'selected':''}>${p}</option>`).join('')}</select></div><div class="modal-footer">${button('Cancel','close-modal','btn')}<button type="submit" class="btn btn-primary">${habit?'Save habit':'Add habit'}</button></div></form>`;
  byId('modal-root').innerHTML=`<div class="overlay" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-label="${e(title)}"><div class="modal-head"><div><h2 class="modal-title">${e(title)}</h2><p class="modal-sub">${e(subtitle)}</p></div>${button(ic('close'),'close-modal','btn btn-icon','aria-label="Close"')}</div>${form}</div></div>`;
  byId('modal-root').querySelector('input[autofocus]')?.focus();
}
async function saveGoal(form){const fd=new FormData(form),id=form.dataset.id,title=String(fd.get('title')||'').trim(),target=Number(fd.get('target'))||null;if(!title)return toast('Give the goal a name.',true);await M.update(s=>{const old=s.goals.find(g=>g.id===id);const payload={id:old?.id||M.uuid(),title,description:String(fd.get('description')||'').trim(),target,emoji:fd.get('emoji')||'✳',color:fd.get('color')||'sage',createdAt:old?.createdAt||M.dayKey()};if(old)Object.assign(old,payload);else s.goals.push(payload);return s});closeModal();await refresh();toast(id?'Goal updated.':'New goal created.');}
async function saveHabit(form){const fd=new FormData(form),id=form.dataset.id,title=String(fd.get('title')||'').trim(),days=fd.getAll('days').map(Number);if(!title||!days.length)return toast('Add a name and select at least one day.',true);const goalId=String(fd.get('goalId'));if(!state.goals.some(g=>g.id===goalId))return toast('Choose a goal first.',true);await M.update(s=>{const old=s.habits.find(h=>h.id===id);const payload={id:old?.id||M.uuid(),title,days,goalId,period:fd.get('period')||'Anytime',createdAt:old?.createdAt||M.dayKey()};if(old)Object.assign(old,payload);else s.habits.push(payload);return s});closeModal();await refresh();toast(id?'Habit updated.':'Habit added to your routine.');}
function shortcutModal(){const links=state.settings.shortcuts||[];if(links.length>=8)return toast('You can add up to 8 shortcuts.',true);byId('modal-root').innerHTML=`<div class="overlay" data-action="close-modal"><div class="modal" role="dialog" aria-modal="true" aria-label="Add a shortcut"><div class="modal-head"><div><h2 class="modal-title">Add a shortcut</h2><p class="modal-sub">Give a favorite site a place on your new tab.</p></div>${button(ic('close'),'close-modal','btn btn-icon','aria-label="Close"')}</div><form id="shortcut-form" class="modal-form"><div class="field"><label for="short-title">Name</label><input id="short-title" name="title" maxlength="20" placeholder="e.g. MDN Docs" required autofocus></div><div class="field"><label for="short-url">Website URL</label><input id="short-url" name="url" placeholder="https://developer.mozilla.org" required></div><div class="modal-footer">${button('Cancel','close-modal','btn')}<button class="btn btn-primary" type="submit">Save shortcut</button></div></form></div></div>`;byId('short-title')?.focus()}
async function saveShortcut(form){const data=new FormData(form),title=String(data.get('title')||'').trim();let address=String(data.get('url')||'').trim();if(!/^https?:\/\//i.test(address))address='https://'+address;let url;try{const u=new URL(address);if(!['https:','http:'].includes(u.protocol)||!u.hostname.includes('.'))throw Error();url=u.href;}catch{toast('Enter a valid website address.',true);return}if(!title)return toast('Name your shortcut.',true);await M.update(s=>{s.settings.shortcuts=[...(s.settings.shortcuts||[]),{id:M.uuid(),title,url}].slice(0,8);return s});closeModal();await refresh();toast('Shortcut added.')}
async function trashNote(id){await M.update(s=>{const n=s.notes.find(n=>n.id===id);if(n){s.notes=s.notes.filter(n=>n.id!==id);s.notesTrash=[n,...(s.notesTrash||[])].slice(0,50)}return s});await refresh()}
document.addEventListener('change',async ev=>{const id=ev.target?.dataset?.noteText;if(!id)return;const value=ev.target.value.slice(0,500);await M.update(s=>{const n=s.notes.find(n=>n.id===id);if(n)n.text=value;return s})});
document.addEventListener('dragstart',ev=>{const note=ev.target.closest('.zen-sticky');if(!note)return;ev.dataTransfer.setData('text/plain',note.dataset.noteId);ev.dataTransfer.effectAllowed='move';note.classList.add('dragging')});
document.addEventListener('dragend',ev=>ev.target.closest('.zen-sticky')?.classList.remove('dragging'));
document.addEventListener('dragover',ev=>{const bin=ev.target.closest('#note-trash-target');if(bin){ev.preventDefault();bin.classList.add('drag-hover')}});
document.addEventListener('dragleave',ev=>{const bin=ev.target.closest('#note-trash-target');if(bin)bin.classList.remove('drag-hover')});
document.addEventListener('drop',async ev=>{const bin=ev.target.closest('#note-trash-target');if(!bin)return;ev.preventDefault();bin.classList.remove('drag-hover');const id=ev.dataTransfer.getData('text/plain');if(id)await trashNote(id)});
function handleSearch(query){const q=String(query||'').trim();if(!q)return;let url='https://www.google.com/search?q='+encodeURIComponent(q);if(!/\s/.test(q)&&(/^(https?:\/\/)/i.test(q)||/^[^/]+\.[a-z]{2,}(?:[:/]|$)/i.test(q))){try{const u=new URL(/^https?:\/\//i.test(q)?q:'https://'+q);if(['https:','http:'].includes(u.protocol))url=u.href}catch{}}window.location.href=url}
function closeModal(){byId('modal-root').innerHTML=''}
async function refresh(){state=await M.load();attempts=await M.getAttempts();if(state.timer.status==='running'&&M.secondsLeft(state.timer)===0&&M.extensionStorage){await chrome.runtime.sendMessage({type:'SYNC_TIMER'}).catch(()=>{});state=await M.load()}M.finishIfDue(state)&&await M.save(state);render()}
async function toggleHabit(id){await M.update(s=>{const h=s.habits.find(h=>h.id===id);if(!M.isScheduled(h,M.dayKey()))return s;const key=M.dayKey(),arr=s.completions[key]||[];s.completions[key]=arr.includes(id)?arr.filter(x=>x!==id):[...arr,id];return s});await refresh();if(M.dayStats(state).total&&M.dayStats(state).done===M.dayStats(state).total)toast('Everything on today’s list. Beautiful work ✳')}
async function setTheme(v){await M.update(s=>{s.settings.theme=v;return s});await refresh()}
async function modifyTimer(action,mode){let refused=false,saved=0;
  if(action==='timer-reset'&&state.timer.mode==='focus'&&['running','paused'].includes(state.timer.status)&&M.focusRemaining(state.timer)<state.timer.durationSec){if(!confirm('Discard the focus time from this unfinished session? Choose “End & save” to keep it instead.'))return;}
  await M.update(s=>{
    M.finishIfDue(s);
    if(action==='set-mode'){
      if(['running','paused'].includes(s.timer.status)){refused=true;return s}
      s.timer=M.freshTimer(mode,s.settings);
    }else if(action==='timer-reset') s.timer=M.freshTimer(s.timer.mode,s.settings,s.timer.contextHabitId);
    else if(action==='timer-toggle') M.startOrPauseTimer(s);
    else if(action==='timer-end')saved=M.endFocusSession(s);
    return s;
  });
  await refresh();
  if(refused)toast('End or reset the current session before switching modes.',true);
  if(action==='timer-end'){const message=saved?`${Math.floor(saved/60)} min ${String(saved%60).padStart(2,'0')} sec added to your focus progress.`:'Session ended. No focus time was recorded.';toast(message);if(document.hidden&&M.extensionStorage&&chrome.notifications)chrome.notifications.create({type:'basic',iconUrl:'icons/icon128.png',title:'Focus time saved',message}).catch(()=>{});}
  if(M.extensionStorage)chrome.runtime.sendMessage({type:'SYNC_TIMER'}).catch(()=>{});
}
function updateTimerDisplay(){if(!state)return;updateFocusDisplay();const secs=M.secondsLeft(state.timer),mm=String(Math.floor(secs/60)).padStart(2,'0'),ss=String(secs%60).padStart(2,'0');document.querySelectorAll('[data-timer-text]').forEach(n=>n.textContent=`${mm}:${ss}`);if(state.timer.status==='running'&&secs===0)refresh();}
async function doExport(){const s=await M.load(),distractionAttempts=await M.getAttempts();const blob=new Blob([JSON.stringify({app:'zenith',exportedAt:new Date().toISOString(),state:s,distractionAttempts},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`zenith-backup-${M.dayKey()}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500)}
async function doImport(file){if(!file)return;try{const raw=JSON.parse(await file.text());const s=['momentum','zenith'].includes(raw?.app)?raw.state:raw;if(!s||!Array.isArray(s.goals)||!Array.isArray(s.habits)||!s.completions||!Array.isArray(s.sessions))throw Error('Not a valid Zenith backup');if(!confirm('Import this backup? Your current goals and progress will be replaced.'))return;await M.save(s);
if(Array.isArray(raw?.distractionAttempts)) {
  const clean=raw.distractionAttempts.filter(x=>typeof x.domain==='string' && Number.isFinite(x.ts)).slice(-2500);
  if(M.extensionStorage)await chrome.storage.local.set({[M.TRACK_KEY]:clean});
  else localStorage.setItem(M.TRACK_KEY,JSON.stringify(clean));
}
await refresh();toast('Backup imported.');}catch(err){toast('Could not import: '+err.message,true)}}
async function reorderHabit(sourceId,targetId,after=false){
  if(!sourceId||!targetId||sourceId===targetId)return;
  await M.update(s=>{const from=s.habits.findIndex(h=>h.id===sourceId);if(from<0)return s;const [moving]=s.habits.splice(from,1);let index=s.habits.findIndex(h=>h.id===targetId);if(index<0)return s;s.habits.splice(index+(after?1:0),0,moving);return s});
  await refresh();
}
let dragHabitId=null;
document.addEventListener('dragstart',event=>{
  const row=event.target.closest('.zen-draggable');
  if(!row||event.target.closest('button:not(.zen-drag-handle)'))return;
  dragHabitId=row.dataset.habitId;
  event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain',dragHabitId);
  row.classList.add('zen-dragging');
});
document.addEventListener('dragover',event=>{
  const row=event.target.closest('.zen-draggable');
  if(!row||!dragHabitId||row.dataset.habitId===dragHabitId)return;
  event.preventDefault();event.dataTransfer.dropEffect='move';
  document.querySelectorAll('.zen-drop-target').forEach(el=>el.classList.remove('zen-drop-target'));
  const rect=row.getBoundingClientRect();row.dataset.dropAfter=String(event.clientY>rect.top+rect.height/2);
  row.classList.add('zen-drop-target');
});
document.addEventListener('drop',async event=>{
  const row=event.target.closest('.zen-draggable');
  if(!row||!dragHabitId)return;
  event.preventDefault();const from=dragHabitId,to=row.dataset.habitId,after=row.dataset.dropAfter==='true';
  dragHabitId=null;
  document.querySelectorAll('.zen-dragging,.zen-drop-target').forEach(el=>el.classList.remove('zen-dragging','zen-drop-target'));
  if(from!==to)await reorderHabit(from,to,after);
});
document.addEventListener('dragend',()=>{dragHabitId=null;document.querySelectorAll('.zen-dragging,.zen-drop-target').forEach(el=>el.classList.remove('zen-dragging','zen-drop-target'))});
document.addEventListener('click',async evt=>{const node=evt.target.closest('[data-action]');if(!node)return;if(node.classList.contains('overlay')&&evt.target!==node)return;const action=node.dataset.action,id=node.dataset.id;
  if(action==='toggle-notes'){noteDrawerOpen=!noteDrawerOpen;render()}
  else if(action==='toggle-note-trash'){noteTrashOpen=!noteTrashOpen;render()}
  else if(action==='notes-toggle'){await M.update(s=>{s.settings.notesEnabled=!s.settings.notesEnabled;return s});await refresh()}
  else if(action==='time-format'){if(!['12','24'].includes(node.dataset.format))return;await M.update(s=>{s.settings.timeFormat=node.dataset.format;return s});await refresh()}
  else if(action==='shortcuts-toggle'){await M.update(s=>{s.settings.showShortcuts=s.settings.showShortcuts===false;return s});await refresh()}
  else if(action==='goals-bar-toggle'){await M.update(s=>{s.settings.showGoalsBar=s.settings.showGoalsBar===false;return s});await refresh()}
  else if(action==='auto-breaks-toggle'){await M.update(s=>{s.settings.autoBreaks=!s.settings.autoBreaks;return s});await refresh();toast(state.settings.autoBreaks?'Automatic breaks enabled for your next session.':'Automatic breaks disabled for your next session.')}
  else if(action==='mascot-toggle'){await M.update(s=>{s.settings.mascotEnabled=!s.settings.mascotEnabled;return s});await refresh()}
  else if(action==='focus-preset'){const n=Number(node.dataset.minutes);if(![25,40,50,90].includes(n))return;await M.update(s=>{s.settings.focusMinutes=n;if(['idle','completed'].includes(s.timer.status)&&s.timer.mode==='focus')s.timer=M.freshTimer('focus',s.settings);return s});await refresh();toast(`${n}-minute focus preset saved.`)}
  else if(action==='break-preset'){const n=Number(node.dataset.every),l=Number(node.dataset.length);await M.update(s=>{s.settings.autoBreakEvery=n;s.settings.autoBreakMinutes=l;return s});await refresh();toast(`Break rhythm: ${n} minutes focus, ${l} minutes rest.`)}
  else if(action==='ambient-dots-toggle'){await M.update(s=>{s.settings.ambientDots=!s.settings.ambientDots;return s});await refresh()}
  else if(action==='dismiss-focus-notice'){focusNotice=null;render()}
  else if(action==='add-note'){await M.update(s=>{s.notes=[{id:M.uuid(),text:'',pinned:true,createdAt:Date.now()},...(s.notes||[])].slice(0,25);return s});noteDrawerOpen=true;await refresh();document.querySelector('.zen-sticky textarea')?.focus()}
  else if(action==='pin-note'){await M.update(s=>{const n=s.notes.find(n=>n.id===id);if(n)n.pinned=!n.pinned;return s});await refresh()}
  else if(action==='trash-note'){const card=node.closest('.zen-sticky');card?.classList.add('is-discarding');setTimeout(async()=>{await trashNote(id)},190)}
  else if(action==='restore-note'){await M.update(s=>{const n=s.notesTrash.find(n=>n.id===id);if(n){s.notes.unshift(n);s.notesTrash=s.notesTrash.filter(n=>n.id!==id)}return s});await refresh()}
  else if(action==='empty-note-trash'){if(confirm('Permanently empty the note trash?')){await M.update(s=>{s.notesTrash=[];return s});await refresh()}}
  else if(action==='clear-distractions'){if(confirm('Delete your distraction attempt history?')){await M.clearAttempts();attempts=[];render();toast('Distraction history cleared.')}}
  else if(action==='add-shortcut')shortcutModal();
  else if(action==='remove-shortcut'){await M.update(s=>{s.settings.shortcuts=(s.settings.shortcuts||[]).filter(l=>l.id!==id);return s});await refresh();}
  else if(action==='navigate')routeTo(node.dataset.page)
  else if(action==='theme')await setTheme(M.nextTheme(state.settings.theme));
  else if(action==='theme-set')await setTheme(node.dataset.theme);
  else if(action==='reset-custom-theme'){await M.update(s=>{s.settings.customTheme=M.safeCustomTheme(null);s.settings.theme='custom';return s});await refresh();toast('Custom palette reset.');}
  else if(action==='goals'){page='goals';render()}
  else if(action==='insights'){page='insights';render()}
  else if(action==='add-goal')modal('goal');
  else if(action==='edit-goal')modal('goal',id);
  else if(action==='add-habit'){if(state.goals.length===0){toast('Create a goal first.',true);modal('goal')}else modal('habit',null,node.dataset.goal||null)}
  else if(action==='edit-habit')modal('habit',id);
  else if(action==='close-modal')closeModal();
  else if(action==='toggle-habit')await toggleHabit(id);
  else if(action==='move-habit'){const dir=Number(node.dataset.dir),arr=page==='goals'?state.habits.filter(h=>h.goalId===state.habits.find(x=>x.id===id)?.goalId):M.due(state);const i=arr.findIndex(h=>h.id===id),target=arr[i+dir];if(target){await reorderHabit(id,target.id,dir>0);}}

  else if(action==='set-mode')await modifyTimer(action,node.dataset.mode);
  else if(action==='timer-reset'||action==='timer-toggle'||action==='timer-end')await modifyTimer(action);
  else if(action==='delete-habit'){const h=state.habits.find(x=>x.id===id);if(h&&confirm(`Delete habit “${h.title}”? Historical check-ins for it will also be removed.`)){await M.update(s=>{s.habits=s.habits.filter(x=>x.id!==id);for(const key of Object.keys(s.completions))s.completions[key]=s.completions[key].filter(x=>x!==id);return s});await refresh();toast('Habit deleted.')}}
  else if(action==='delete-goal'){const g=goalOf(id);if(g&&confirm(`Delete goal “${g.title}” and its linked habits? This also removes their completed check-ins.`)){await M.update(s=>{const ids=new Set(s.habits.filter(h=>h.goalId===id).map(h=>h.id));s.goals=s.goals.filter(x=>x.id!==id);s.habits=s.habits.filter(h=>h.goalId!==id);for(const key of Object.keys(s.completions))s.completions[key]=s.completions[key].filter(x=>!ids.has(x));return s});await refresh();toast('Goal deleted.')}}
  else if(action==='focus-toggle'){try{const enable=!state.settings.focusModeEnabled;await M.setFocusMode(enable);await refresh();toast(enable?'Focus mode active. Listed sites are blocked.':'Focus mode off. Sites accessible again.')}catch(err){await refresh();toast('Focus Mode failed: '+err.message,true)}}
  else if(action==='export')await doExport();
  else if(action==='import')byId('backup-input')?.click();
  else if(action==='reset-all'){if(confirm('Permanently reset goals, check-ins, focus history and settings? Export a backup first if you want to save anything.')){await M.save(M.initialState());await M.clearAttempts();await refresh();toast('Zenith reset to starter examples.')}}
});
document.addEventListener('submit',async event=>{event.preventDefault();const form=event.target;if(form.id==='goal-form')await saveGoal(form);else if(form.id==='habit-form')await saveHabit(form);else if(form.id==='durations-form'){const fd=new FormData(form),mins=['focusMinutes','shortMinutes','longMinutes'].map(k=>Number(fd.get(k)));if(mins.some(n=>!Number.isInteger(n)||n<1||n>180))return toast('Enter valid durations.',true);await M.update(s=>{['focusMinutes','shortMinutes','longMinutes'].forEach((k,i)=>s.settings[k]=mins[i]);if(s.timer.status==='idle'||s.timer.status==='completed'){const sec=M.timerDuration(s.timer.mode,s.settings);s.timer=M.freshTimer(s.timer.mode,s.settings,s.timer.contextHabitId)}return s});await refresh();toast('Timer durations saved.');}
  else if(form.id==='focus-preferences'){
  const fd=new FormData(form),focus=Number(fd.get('focusMinutes')),every=Number(fd.get('autoBreakEvery')),length=Number(fd.get('autoBreakMinutes'));
  if(!Number.isInteger(focus)||focus<1||focus>180||!Number.isInteger(every)||every<10||every>90||!Number.isInteger(length)||length<2||length>30)return toast('Enter valid timer durations.',true);
  if(['running','paused'].includes(state.timer.status))return toast('End or reset the active session first.',true);
  await M.update(s=>{Object.assign(s.settings,{focusMinutes:focus,autoBreaks:fd.has('autoBreaks'),autoBreakEvery:every,autoBreakMinutes:length});if(s.timer.mode==='focus')s.timer=M.freshTimer('focus',s.settings,s.timer.contextHabitId);return s});
  await refresh();toast('Focus preferences saved.');
}
else if(form.id==='break-options-form'){
  const fd=new FormData(form),every=Number(fd.get('autoBreakEvery')),length=Number(fd.get('autoBreakMinutes'));
  if(!Number.isInteger(every)||every<10||every>90||!Number.isInteger(length)||length<2||length>30)return toast('Enter a break interval of 10–90 minutes and a break duration of 2–30 minutes.',true);
  await M.update(s=>{s.settings.autoBreakEvery=every;s.settings.autoBreakMinutes=length;return s});await refresh();toast('Break rhythm saved for the next session.');
}
else if(form.id==='custom-theme-form'){
  const data=new FormData(form),custom={};
  for(const key of ['background','surface','text','accent'])custom[key]=String(data.get(key)||'');
  const safe=M.safeCustomTheme(custom);
  if(M.contrast(safe.text,safe.background)<4.5||M.contrast(safe.text,safe.surface)<4.5){return toast('Text and background colours need at least 4.5:1 contrast. Try a darker text or lighter surface.',true)}
  await M.update(s=>{s.settings.customTheme=safe;s.settings.theme='custom';return s});
  await refresh();toast('Custom colours applied.');
}
else if(form.id==='name-form'){
  const name=String(new FormData(form).get('displayName')||'').replace(/\s+/g,' ').trim().slice(0,40);
  await M.update(s=>{s.settings.displayName=name;return s});
  messageIndex=0;
  lastMessageSwap=Date.now();
  await refresh();
  toast(name?'Name saved. Your greeting is ready.':'Name cleared. The greeting will be generic.');
}
else if(form.id==='shortcut-form')await saveShortcut(form);
else if(form.id==='motive-form'){const reason=String(new FormData(form).get('focusReason')||'').trim().slice(0,240);await M.update(s=>{s.settings.focusReason=reason;return s});await refresh();toast('Reminder saved.')} 
else if(form.id==='sites-form'){const raw=String(new FormData(form).get('sites')||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const normalized=raw.map(x=>x.toLowerCase().replace(/^https?:\/\//,'').replace(/^\*\./,'').replace(/^www\./,'').split('/')[0].split(':')[0]);if(normalized.length>90||normalized.some(x=>!/^(?=.{4,253}$)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(x)))return toast('Use up to 90 valid domains, one per line.',true);await M.update(s=>{s.settings.blockedSites=[...new Set(normalized)];return s});try{await M.syncBlocklist();await refresh();toast(state.settings.focusModeEnabled?'Blocklist saved and blocking verified.':'Blocklist saved. Enable Focus Mode to block these sites.')}catch(err){await refresh();toast('Saved, but blocking failed: '+err.message,true)}}
});
document.addEventListener('submit',event=>{if(event.target.id==='web-search'){event.preventDefault();handleSearch(new FormData(event.target).get('q'));}});
document.addEventListener('change',async event=>{
  if(event.target?.id==='backup-input')return doImport(event.target.files[0]);
  if(event.target?.id==='habit-select'){const id=event.target.value;await M.update(s=>{s.timer.contextHabitId=id||null;return s});await refresh();}
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal();if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)&&page==='home'){e.preventDefault();byId('search-query')?.focus()}});
if(M.extensionStorage)chrome.storage.onChanged.addListener((c,area)=>{if(area==='local'&&c[M.KEY]){state=c[M.KEY].newValue;render()} else if(area==='local'&&c[M.TRACK_KEY]){attempts=c[M.TRACK_KEY].newValue||[];if(page==='insights')render()}});

async function claimWorkspaceRoute(){
  if(!M.extensionStorage)return;
  const response=await chrome.runtime.sendMessage({type:'CLAIM_ZENITH_VIEW'}).catch(()=>null);
  if(response?.view)routeTo(response.view);
}
if(M.extensionStorage){
  chrome.runtime.onMessage.addListener(message=>{
    if(message?.type==='ZENITH_VIEW_READY')claimWorkspaceRoute().catch(()=>{});
  });
}

(async()=>{state=await M.load();attempts=await M.getAttempts();render();claimFocusNotice();claimWorkspaceRoute();setInterval(()=>{updateTimerDisplay();updateHomeClock();tickDailyMessage()},1000)})();

// Keep the rotation calm when returning to a background tab.
document.addEventListener('visibilitychange',()=>{if(!document.hidden)lastMessageSwap=Date.now()});

// The pattern is cosmetic and entirely optional. Throttle pointer changes so
// it stays lightweight even with several browser tabs open.
let dotFrame=0;
document.addEventListener('pointermove', event=>{
  if (!state?.settings?.ambientDots || page!=='home' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (dotFrame) return;
  const x=event.clientX, y=event.clientY;
  dotFrame=requestAnimationFrame(()=>{
    dotFrame=0;
    const shell=document.querySelector('.zen-newtab');
    if (shell){shell.style.setProperty('--pointer-x',x+'px');shell.style.setProperty('--pointer-y',y+'px')}
  });
},{passive:true});
async function claimFocusNotice(){
  if (!M.extensionStorage || !chrome.tabs?.getCurrent) return;
  try {
    const tab=await chrome.tabs.getCurrent();
    if (!Number.isInteger(tab?.id))return;
    noticeTabId=tab.id;
    const response=await chrome.runtime.sendMessage({type:'CLAIM_FOCUS_NOTICE'});
    if(response?.notice){focusNotice=response.notice;if(page!=='home')page='home';render()}
  } catch(error){console.warn('Could not load Focus reminder:',error)}
}
if(M.extensionStorage){
  chrome.runtime.onMessage.addListener(message=>{
    if(message?.type==='FOCUS_NOTICE_READY' && message.tabId===noticeTabId) claimFocusNotice();
  });
}
