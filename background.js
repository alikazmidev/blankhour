/* Zenith Focus Mode. DNR rules are persistent in Chrome even when this service worker sleeps. */
importScripts('store.js');
const ALARM = 'momentum-finish';
const RULE_FROM = 850000;
const RULE_END = RULE_FROM + 200;
let syncQueue = Promise.resolve();

function normalizeDomains(domains) {
  if (!Array.isArray(domains)) return [];
  return [...new Set(domains.map(raw => String(raw || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/^\*\./, '').replace(/^www\./, '')
    .split(/[/?#]/)[0].split(':')[0])
    .filter(domain => /^(?=.{4,253}$)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(domain)))];
}
function matchesDomain(url, domains) {
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) return false;
    const host = urlObj.hostname.toLowerCase();
    return domains.some(domain => host === domain || host.endsWith('.' + domain));
  } catch { return false; }
}

// DNR must redirect to a real extension resource first. That page is now a
// short-lived hand-off, not the final blocked screen. Opening a *fresh* native
// New Tab avoids Chrome's known tabs.update(chrome://newtab/) override failure.
const NOTICE_PREFIX = 'zenith_focus_notice_';
const WORKSPACE_PREFIX = 'zenith_workspace_view_';
const workspaceFallback = new Map();
async function claimWorkspaceView(tabId){
  if(!Number.isInteger(tabId))return null;
  const key=WORKSPACE_PREFIX+tabId;
  let view=workspaceFallback.get(tabId)||null;
  try {const value=await chrome.storage.session.get(key);view=value[key]?.view||view;if(view)await chrome.storage.session.remove(key);}catch(error){console.warn('Could not claim Zenith workspace:',error);}
  workspaceFallback.delete(tabId);
  return ['dashboard','focus','home','goals','insights','settings'].includes(view)?view:null;
}
async function openWorkspaceView(view){
  if(!['dashboard','focus','home','goals','insights','settings'].includes(view))throw Error('Unknown Zenith workspace.');
  const tab=await chrome.tabs.create({url:'chrome://newtab/',active:true});
  const key=WORKSPACE_PREFIX+tab.id;
  workspaceFallback.set(tab.id,view);
  try{await chrome.storage.session.set({[key]:{view,at:Date.now()}});}catch(error){console.warn('Unable to persist workspace route:',error)}
  chrome.runtime.sendMessage({type:'ZENITH_VIEW_READY',tabId:tab.id}).catch(()=>{});
  return {ok:true,tabId:tab.id};
}

const noticeFallback = new Map();
async function openFocusNewTab(tab, domain = '', showNotice = true) {
  if (!Number.isInteger(tab?.id)) throw Error('The blocked tab could not be identified.');
  const created = await chrome.tabs.create({
    url: 'chrome://newtab/',
    active: tab.active !== false,
    index: tab.index,
    windowId: tab.windowId
  });
  if (showNotice && domain !== null) {
    const notice = {domain: String(domain || '').slice(0,253), at: Date.now()};
    noticeFallback.set(created.id, notice);
    try {await chrome.storage.session.set({[NOTICE_PREFIX + created.id]: notice});}
    catch (error) {console.warn('Could not persist the temporary focus reminder:', error);}
    // If the page started loading before the tab ID was available, ask it to
    // retry claiming its notification. This never transmits browsing URLs.
    chrome.runtime.sendMessage({type:'FOCUS_NOTICE_READY', tabId:created.id}).catch(()=>{});
  }
  await chrome.tabs.remove(tab.id);
  return {ok:true,tabId:created.id};
}
async function replaceOpenBlockedTabs(domains) {
  if (!domains.length) return;
  const tabs = await chrome.tabs.query({});
  await Promise.all(tabs.filter(tab => Number.isInteger(tab.id) && matchesDomain(tab.url, domains))
    .map(tab => {
      const host = new URL(tab.url).hostname.toLowerCase();
      const domain = domains.find(d => host === d || host.endsWith('.' + d)) || '';
      return openFocusNewTab(tab, domain).catch(error => {
        console.warn('Zenith: could not replace a blocked tab', tab.id, error);
      });
    }));
}

async function syncBlocking(state) {
  const enabled = state.settings.focusModeEnabled === true;
  const domains = enabled ? normalizeDomains(state.settings.blockedSites) : [];
  if (!chrome.declarativeNetRequest?.updateDynamicRules) throw Error('Chrome website blocking permission is unavailable. Check chrome://extensions.');
  const previous = await chrome.declarativeNetRequest.getDynamicRules();
  const removeRuleIds = previous.filter(rule => rule.id >= RULE_FROM && rule.id < RULE_END).map(rule => rule.id);
  // requestDomains matches the exact host as well as all its subdomains.
  const addRules = domains.slice(0, 90).flatMap((domain, i) => ([
    {id:RULE_FROM+i,priority:2,action:{type:'redirect',redirect:{extensionPath:'/blocked.html'}},condition:{requestDomains:[domain],resourceTypes:['main_frame']}},
    {id:RULE_FROM+100+i,priority:1,action:{type:'block'},condition:{requestDomains:[domain],resourceTypes:['sub_frame','xmlhttprequest','media','script','image','other','websocket']}}
  ]));
  await chrome.declarativeNetRequest.updateDynamicRules({removeRuleIds,addRules});
  const installed = (await chrome.declarativeNetRequest.getDynamicRules())
    .filter(rule => rule.id >= RULE_FROM && rule.id < RULE_END);
  const installedDomains = installed.flatMap(rule => rule.condition.requestDomains || []).sort();
  if (installedDomains.length !== domains.length * 2 || [...new Set(installedDomains)].sort().join('|') !== [...domains].sort().join('|')) {
    throw Error('Chrome did not install all the blocking rules.');
  }
  if (enabled) await replaceOpenBlockedTabs(domains);
  return {enabled,count:installed.length / 2,domains};
}

async function ensureTimerAndRules() {
  const state = await Momentum.load();
  const previousPhase = state.timer.phase;
  const previousStatus = state.timer.status;
  const finished = Momentum.finishIfDue(state);
  if (finished) {
    await Momentum.save(state);
    if (chrome.notifications && previousStatus === 'running') {
      const t=state.timer;
      const message=t.status==='completed' ? (t.mode==='focus'?'Focus session completed. Your focused time has been saved.':'Your break is complete.')
        : previousPhase==='focus' && t.phase==='auto-break'?'Time for a short break. Your focus clock is paused.'
        : previousPhase==='auto-break' && t.phase==='focus'?'Short break complete. Your focus clock is running again.':null;
      if(message)await chrome.notifications.create({
        type:'basic',iconUrl:'icons/icon128.png',title:'Zenith',message
      }).catch(()=>{});
    }
  }
  const timer=state.timer;
  await chrome.alarms.clear(ALARM);
  if(timer.status==='running' && timer.endAt>Date.now()) await chrome.alarms.create(ALARM,{when:timer.endAt});
  return syncBlocking(state);
}

function scheduleSync() {
  // Do not swallow errors before returning a result to the UI.
  const job = syncQueue.then(ensureTimerAndRules);
  syncQueue = job.catch(error => console.error('Zenith background sync failed:',error));
  return job;
}
chrome.runtime.onInstalled.addListener(() => {scheduleSync().catch(() => {});});
chrome.runtime.onStartup.addListener(() => {scheduleSync().catch(() => {});});
chrome.alarms.onAlarm.addListener(alarm => {if(alarm.name===ALARM)scheduleSync().catch(() => {});});
chrome.storage.onChanged.addListener((changes,area) => {
  if (area === 'local' && changes[Momentum.KEY]) {
    const old = changes[Momentum.KEY].oldValue;
    const now = changes[Momentum.KEY].newValue;
    if (!old || old.settings?.focusModeEnabled !== now?.settings?.focusModeEnabled ||
        JSON.stringify(old.settings?.blockedSites) !== JSON.stringify(now?.settings?.blockedSites) ||
        JSON.stringify(old.timer) !== JSON.stringify(now?.timer)) scheduleSync().catch(() => {});
  }
});
// Best-effort top-level navigation counter, not a DNR hit-counter. Deduplicate rapid duplicate navigation events.
const recentAttempts = new Map();
const blockedContexts = new Map();
let attemptsQueue = Promise.resolve();
function recordAttempt(domain, tabId, url) {
  const now = Date.now();
  const key = `${tabId}:${domain}`;
  if ((recentAttempts.get(key)||0) > now-1800) return;
  recentAttempts.set(key,now);
  if (recentAttempts.size > 200) for (const [k,t] of recentAttempts) if (t < now-10000) recentAttempts.delete(k);
  blockedContexts.set(tabId,{domain,at:now});
  attemptsQueue = attemptsQueue.then(async () => {
    const key=Momentum.TRACK_KEY;
    const existing=(await chrome.storage.local.get(key))[key]||[];
    const kept=existing.filter(a => a && Number.isFinite(a.ts) && a.ts>now-90*86400000).slice(-2499);
    kept.push({domain,ts:now});
    await chrome.storage.local.set({[key]:kept});
  }).catch(err => console.warn('Zenith attempts logging failed',err));
}
chrome.webNavigation.onBeforeNavigate.addListener(details => {
  if (details.frameId!==0 || details.tabId<0) return;
  // The navigation observer is deliberately not used to enforce blocking.
  Momentum.load().then(state => {
    if (!state.settings.focusModeEnabled) return;
    const domains=normalizeDomains(state.settings.blockedSites);
    try {
      const url=new URL(details.url);
      if(!['http:','https:'].includes(url.protocol))return;
      const match=domains.find(d=>url.hostname===d||url.hostname.endsWith('.'+d));
      if(match)recordAttempt(match,details.tabId,details.url);
    } catch {}
  }).catch(()=>{});
});
chrome.runtime.onMessage.addListener((message,sender,reply) => {
  if(message?.type==='OPEN_ZENITH_VIEW'){
    openWorkspaceView(message.view).then(reply).catch(error=>reply({ok:false,error:error?.message||String(error)}));
    return true;
  }
  if(message?.type==='CLAIM_ZENITH_VIEW'){
    claimWorkspaceView(sender.tab?.id).then(view=>reply({view})).catch(()=>reply({view:null}));
    return true;
  }

  if (message?.type === 'OPEN_FOCUS_NEW_TAB') {
    const tab = sender.tab;
    const context = blockedContexts.get(tab?.id);
    const domain = context && Date.now() - context.at < 30000 ? context.domain : '';
    openFocusNewTab(tab, domain, message.showNotice !== false)
      .then(reply)
      .catch(error => reply({ok:false,error:error?.message||String(error)}));
    return true;
  }
  if (message?.type === 'CLAIM_FOCUS_NOTICE') {
    const id = sender.tab?.id;
    if (!Number.isInteger(id)) {reply({notice:null});return;}
    const key=NOTICE_PREFIX + id;
    (async()=>{
      let notice=noticeFallback.get(id) || null;
      try {
        const data=await chrome.storage.session.get(key);
        notice=data[key] || notice;
        if (notice) await chrome.storage.session.remove(key);
      } catch(error) {console.warn('Could not access temporary notice:',error)}
      noticeFallback.delete(id);
      reply({notice:notice && Date.now()-notice.at<20000 ? notice:null});
    })().catch(()=>reply({notice:null}));
    return true;
  }

  if (message?.type==='GET_BLOCK_CONTEXT') {
    const context=blockedContexts.get(sender.tab?.id);
    reply({domain: context && Date.now()-context.at < 30000 ? context.domain : ''});
    return;
  }

  if (message?.type === 'SYNC_TIMER' || message?.type === 'SYNC_BLOCKING') {
    scheduleSync().then(info => reply({ok:true,...info})).catch(error => reply({ok:false,error:error?.message || String(error)}));
    return true;
  }
});
