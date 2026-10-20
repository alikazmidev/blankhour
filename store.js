/* Momentum's shared, dependency-free data layer. Everything stays on your device. */
const Momentum = (() => {
  const KEY = 'momentum_state_v1';
  const DAY_MS = 86400000;
  const uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const parseDate = str => {const [y,m,d] = str.split('-').map(Number);return new Date(y,m-1,d,12)};
  const shiftDay = (str, amount) => {const d = parseDate(str);d.setDate(d.getDate()+amount);return dayKey(d)};
  const weekday = str => parseDate(str).getDay();
  const QUOTES = [
    'A little effort, repeated, changes the shape of a life.',
    'You do not need a perfect day to make real progress.',
    'The quiet work is often the work that matters.',
    'Momentum begins with the next small action.',
    'Show up for the person you are becoming.',
    'Progress is a direction, not a competition.',
    'Keep promises to yourself, one day at a time.',
    'Let the work be simple. Let the repetition be powerful.',
    'A good routine makes space for a remarkable life.',
    'What you repeat becomes what you can rely on.',
    'Build a day you will be glad you lived.',
    'Small commitments deserve to be celebrated.',
    'Your future is built in ordinary afternoons.',
    'You can begin again without beginning from nothing.',
    'Do the small thing beautifully.',
    'Every honest checkmark is evidence of effort.',
    'Consistency is ambition made visible.',
    'Focus is choosing what deserves your attention.',
    'Some days, showing up is the achievement.',
    'Protect the hour. The year will follow.',
    'Progress needs patience more than drama.',
    'Let the next hour belong to what matters.',
    'Take care of today. Give tomorrow a head start.',
    'One purposeful hour can change a whole day.',
    'Growth often looks like repeating the basics.',
    'Celebrate the process, not just the finish line.',
    'A habit is a vote for the life you want.',
    'Return to the work. That is the practice.',
    'Your pace is allowed to be sustainable.',
    'Keep going in small, unmistakable ways.',
    'Make space for effort and for rest.'
  ];
  const quoteFor = (key = dayKey()) => {
    const n = Math.floor(parseDate(key).getTime()/DAY_MS);
    return QUOTES[Math.abs(n)%QUOTES.length];
  };
  const initialState = () => {
    const today = dayKey();
    const g1=uuid(),g2=uuid(),g3=uuid();
    return {
      version:1,
      goals:[
        {id:g1,title:'Feel stronger',description:'Build energy through consistent movement.',emoji:'✳',color:'sage',target:60,createdAt:today},
        {id:g2,title:'Grow my skills',description:'Make room for deep, deliberate learning.',emoji:'✦',color:'peach',target:100,createdAt:today},
        {id:g3,title:'Make mornings mine',description:'Start each day with intention.',emoji:'☀',color:'lavender',target:60,createdAt:today}
      ],
      habits:[
        {id:uuid(),goalId:g3,title:'Wake up by 5:30 AM',days:[0,1,2,3,4,5,6],period:'Morning',createdAt:today},
        {id:uuid(),goalId:g1,title:'Exercise for 30 minutes',days:[1,3,5,6],period:'Morning',createdAt:today},
        {id:uuid(),goalId:g2,title:'Study or build for 45 minutes',days:[0,1,2,3,4,5,6],period:'Afternoon',createdAt:today},
        {id:uuid(),goalId:g3,title:'Read 10 pages',days:[0,1,2,3,4,5,6],period:'Evening',createdAt:today}
      ],
      completions:{},sessions:[],notes:[],notesTrash:[],
      settings:{displayName:'',timeFormat:'24',showShortcuts:true,showGoalsBar:true,ambientDots:false,theme:'dark',customTheme:{background:'#f5f3ee',surface:'#fdfcf9',text:'#242521',accent:'#9a8164'},focusMinutes:25,shortMinutes:5,longMinutes:15,autoBreaks:false,autoBreakEvery:25,autoBreakMinutes:5,mascotEnabled:true,focusModeEnabled:false,blockEnabled:false,notesEnabled:false,focusReason:'I want to protect my time for the things that matter.',blockedSites:['youtube.com','instagram.com','reddit.com','x.com'],shortcuts:[{id:'google',title:'Google',url:'https://www.google.com'},{id:'gmail',title:'Gmail',url:'https://mail.google.com'},{id:'github',title:'GitHub',url:'https://github.com'}]},
      timer:{mode:'focus',status:'idle',durationSec:1500,remainingSec:1500,endAt:null,startedAt:null,sessionId:null,contextHabitId:null}
    };
  };
  const extensionStorage = typeof chrome !== 'undefined' && !!chrome.storage?.local;
  async function load() {
    let saved;
    if (extensionStorage) {const obj=await chrome.storage.local.get(KEY);saved=obj[KEY]}
    else {try {saved=JSON.parse(localStorage.getItem(KEY)||'null')} catch(e){saved=null}}
    if (!saved || !Array.isArray(saved.goals) || !Array.isArray(saved.habits)) {
      saved=initialState();await save(saved);
    }
    saved.settings={...initialStateSettings(),...(saved.settings||{})};
    saved.settings.timeFormat = saved.settings.timeFormat === '12' ? '12' : '24';
    saved.settings.showShortcuts = saved.settings.showShortcuts !== false;
    saved.settings.showGoalsBar = saved.settings.showGoalsBar !== false;
    saved.settings.ambientDots = saved.settings.ambientDots === true;
    if (saved.settings.focusModeEnabled !== true) saved.settings.focusModeEnabled = false;
    if (!Array.isArray(saved.settings.shortcuts)) saved.settings.shortcuts = initialStateSettings().shortcuts;
    saved.timer={...defaultTimer(saved.settings),...(saved.timer||{})};
    saved.settings.autoBreaks = saved.settings.autoBreaks === true;
    saved.settings.mascotEnabled = saved.settings.mascotEnabled !== false;
    saved.settings.theme = ['cream','dark','oat','midnight','custom'].includes(saved.settings.theme) ? saved.settings.theme : 'dark';
    saved.settings.customTheme = safeCustomTheme(saved.settings.customTheme);

    saved.settings.autoBreakEvery = clampMinutes(saved.settings.autoBreakEvery,25,10,90);
    saved.settings.autoBreakMinutes = clampMinutes(saved.settings.autoBreakMinutes,5,2,30);
    saved.completions=saved.completions&&typeof saved.completions==='object'?saved.completions:{};
    saved.sessions=Array.isArray(saved.sessions)?saved.sessions:[];
    saved.notes=Array.isArray(saved.notes)?saved.notes:[];
    saved.notesTrash=Array.isArray(saved.notesTrash)?saved.notesTrash:[];
    return saved;
  }
  const initialStateSettings = () => ({displayName:'',timeFormat:'24',showShortcuts:true,showGoalsBar:true,ambientDots:false,theme:'dark',customTheme:{background:'#f5f3ee',surface:'#fdfcf9',text:'#242521',accent:'#9a8164'},focusMinutes:25,shortMinutes:5,longMinutes:15,autoBreaks:false,autoBreakEvery:25,autoBreakMinutes:5,mascotEnabled:true,focusModeEnabled:false,blockEnabled:false,notesEnabled:false,focusReason:'I want to protect my time for the things that matter.',blockedSites:['youtube.com','instagram.com','reddit.com','x.com'],shortcuts:[{id:'google',title:'Google',url:'https://www.google.com'},{id:'gmail',title:'Gmail',url:'https://mail.google.com'},{id:'github',title:'GitHub',url:'https://github.com'}]});
  const DEFAULT_CUSTOM_THEME = Object.freeze({background:'#f5f3ee',surface:'#fdfcf9',text:'#242521',accent:'#9a8164'});
  const isHexColor = value => typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);
  function safeCustomTheme(input){
    return Object.fromEntries(Object.entries(DEFAULT_CUSTOM_THEME).map(([key,fallback])=>[key,isHexColor(input?.[key])?input[key].toLowerCase():fallback]));
  }
  const rgb = hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
  const toHex = values => '#'+values.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
  const mix = (a,b,k) => toHex(rgb(a).map((c,i)=>c*(1-k)+rgb(b)[i]*k));
  function luminance(hex){
    const [r,g,b]=rgb(hex).map(n=>{const v=n/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
    return .2126*r+.7152*g+.0722*b;
  }
  function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
  function applyTheme(settings){
    if (typeof document==='undefined')return;
    const root=document.documentElement;
    const mode=['cream','dark','oat','midnight','custom'].includes(settings?.theme)?settings.theme:'dark';
    root.dataset.theme=mode;
    root.style.removeProperty('color-scheme');
    const names=['--bg','--panel','--panel2','--sidebar','--text','--soft','--muted','--line','--green','--green-2','--green-tint','--peach','--lavender','--ring','--accent','--glow','--shadow','--glass','--glass-border','--scroll'];
    for (const name of names)root.style.removeProperty(name);
    if(mode!=='custom')return;
    const t=safeCustomTheme(settings.customTheme),dark=luminance(t.background)<.18;
    const bg=t.background,panel=t.surface,fg=t.text,accent=t.accent;
    const target=dark?'#ffffff':'#000000';
    const hint=dark?'#ffffff':'#000000';
    const soft=mix(fg,bg,.29),muted=mix(fg,bg,.38),line=mix(bg,hint,dark?.18:.12);
    const tokens={
      '--bg':bg,'--panel':panel,'--panel2':mix(panel,hint,dark?.07:.045),
      '--sidebar':mix(panel,bg,.35),'--text':fg,'--soft':soft,'--muted':muted,
      '--line':line,'--green':fg,'--green-2':soft,'--green-tint':mix(bg,fg,.08),
      '--peach':mix(bg,accent,.14),'--lavender':mix(bg,fg,.055),'--ring':line,
      '--accent':accent,'--glow':dark?'rgba(255,255,255,.018)':'rgba(0,0,0,.015)',
      '--shadow':dark?'0 15px 40px rgba(0,0,0,.18)':'0 16px 45px rgba(0,0,0,.04)',
      '--glass':mix(panel,bg,.1),'--glass-border':line,'--scroll':soft
    };
    for(const [key,value] of Object.entries(tokens))root.style.setProperty(key,value);
    root.style.colorScheme=dark?'dark':'light';
  }
  const nextTheme = theme => ['dark','midnight'].includes(theme)?'cream':'dark';
  const clampMinutes=(v,fallback,min,max)=>Number.isInteger(Number(v))&&Number(v)>=min&&Number(v)<=max?Number(v):fallback;
  const defaultTimer = settings => ({mode:'focus',phase:'focus',status:'idle',durationSec:settings.focusMinutes*60,remainingSec:settings.focusMinutes*60,endAt:null,startedAt:null,sessionId:null,contextHabitId:null});
  async function save(s) {
    if (extensionStorage) await chrome.storage.local.set({[KEY]:s});
    else localStorage.setItem(KEY,JSON.stringify(s));
    return s;
  }
  async function update(fn) { const s=await load();const next=fn(s)||s;await save(next);return next }
  // Confirm Chrome really applied the blocklist before calling Focus Mode active.
  async function syncBlocklist() {
    if (!extensionStorage) return {ok:true,preview:true};
    const response = await chrome.runtime.sendMessage({type:'SYNC_BLOCKING'});
    if (!response?.ok) throw Error(response?.error || 'Focus Mode could not reach the blocker. Check the extension permissions.');
    const s = await load();
    if (response.enabled !== (s.settings.focusModeEnabled === true)) throw Error('Focus Mode and Chrome blocking rules are out of sync.');
    if (s.settings.focusModeEnabled && response.count !== new Set(s.settings.blockedSites.map(v => String(v).toLowerCase().trim().replace(/^www\./, ''))).size) throw Error('Some blocked domains were not activated.');
    return response;
  }
  async function setFocusMode(enabled) {
    const previous = (await load()).settings.focusModeEnabled === true;
    await update(s => {s.settings.focusModeEnabled=!!enabled;return s});
    try {return await syncBlocklist();}
    catch (error) {
      await update(s => {s.settings.focusModeEnabled=previous;return s});
      await syncBlocklist().catch(() => {});
      throw error;
    }
  }
  const TRACK_KEY = 'zenith_distraction_events_v1';
  async function getAttempts() {
    if (extensionStorage) {const v=await chrome.storage.local.get(TRACK_KEY);return Array.isArray(v[TRACK_KEY])?v[TRACK_KEY]:[];}
    try {return JSON.parse(localStorage.getItem(TRACK_KEY)||'[]')} catch {return []}
  }
  async function clearAttempts() {
    if (extensionStorage) await chrome.storage.local.remove(TRACK_KEY);
    else localStorage.removeItem(TRACK_KEY);
  }
  const isScheduled=(habit,key)=>!!habit && (habit.createdAt||'0000-00-00')<=key && Array.isArray(habit.days) && habit.days.includes(weekday(key));
  const due=(state,key=dayKey())=>state.habits.filter(h=>isScheduled(h,key));
  const isDone=(state,habitId,key=dayKey())=>!!state.completions[key]?.includes(habitId);
  const dayStats=(state,key=dayKey())=> {const tasks=due(state,key),done=tasks.filter(h=>isDone(state,h.id,key)).length;return {total:tasks.length,done,percent:tasks.length?Math.round(done/tasks.length*100):null}};
  function rangeStats(state,count=7,end=dayKey()){
    const keys=Array.from({length:count},(_,i)=>shiftDay(end,i-count+1));
    const days=keys.map(key=>({key,...dayStats(state,key)}));
    const total=days.reduce((a,d)=>a+d.total,0),done=days.reduce((a,d)=>a+d.done,0);
    return {days,total,done,percent:total?Math.round(done/total*100):null};
  }
  function streak(state){
    let count=0, key=dayKey(),checked=0;
    // Ongoing today must not break an otherwise perfect streak.
    if(dayStats(state,key).done < dayStats(state,key).total) key=shiftDay(key,-1);
    while(checked++<3650){
      const d=dayStats(state,key);
      if(d.total && d.done!==d.total) break;
      if(d.total)count++;
      key=shiftDay(key,-1);
      const earliest=state.habits.reduce((min,h)=>h.createdAt<min?h.createdAt:min,dayKey());
      if(key<earliest)break;
    }
    return count;
  }
  const goalProgress=(state,goal)=>{
    const ids=new Set(state.habits.filter(h=>h.goalId===goal.id).map(h=>h.id));
    const checks=Object.entries(state.completions).reduce((n,[key,arr])=>n+(key>=goal.createdAt?arr.filter(id=>ids.has(id)).length:0),0);
    return {checks,target:goal.target||null,percent:goal.target?Math.min(100,Math.round(checks/goal.target*100)):null};
  };
  const formatMinutes = mins => `${Math.floor(mins/60)}h ${String(mins%60).padStart(2,'0')}m`;
  // Count elapsed focus seconds, not the number of sessions, and never count breaks.
  const totalFocusSeconds = sessions => sessions.reduce((n,s)=>n+(Math.max(0,Number(s.durationSec)||0)),0);
  const focusStats=(state,key=dayKey())=> {
    const sess=state.sessions.filter(s=>dayKey(new Date(s.completedAt))===key);
    const seconds=totalFocusSeconds(sess);
    return {count:sess.length,completed:sess.filter(s=>!s.endedEarly).length,seconds,minutes:Math.round(seconds/60)};
  };
  const timerDuration=(mode,settings)=>clampMinutes(settings[mode==='focus'?'focusMinutes':mode==='short'?'shortMinutes':'longMinutes'],25,1,180)*60;
  const focusRemaining = (t,now=Date.now()) => t.status==='running' && t.phase!=='auto-break' && t.mode==='focus' && Number.isFinite(t.segmentEndRemainingSec) && t.endAt
    ? Math.max(0,t.segmentEndRemainingSec+Math.ceil((t.endAt-now)/1000))
    : t.status==='running' && t.endAt && t.mode==='focus' && t.phase!=='auto-break'
      ? Math.max(0,Math.ceil((t.endAt-now)/1000)) : Math.max(0,t.remainingSec||0);
  const secondsLeft = (t,now=Date.now()) => t.mode==='focus' && t.phase==='auto-break'
    ? t.status==='running'?Math.max(0,Math.ceil((t.endAt-now)/1000)):Math.max(0,t.breakRemainingSec||0)
    : t.mode==='focus'?focusRemaining(t,now)
    : t.status==='running'?Math.max(0,Math.ceil((t.endAt-now)/1000)):Math.max(0,t.remainingSec||0);
  const timerPhaseLabel=t=>t.mode==='focus'&&t.phase==='auto-break'?'Automatic short break':t.mode==='focus'?'Focus time':t.mode==='short'?'Short break':'Long break';
  function freshTimer(mode,settings,contextHabitId=null){
    const sec=timerDuration(mode,settings);
    return {...defaultTimer(settings),mode,durationSec:sec,remainingSec:sec,contextHabitId};
  }
  function setFocusSegment(t,base){
    const elapsed=t.durationSec-t.remainingSec;
    let chunk=t.remainingSec;
    if(t.autoBreaks && t.breakIntervalSec>0 && t.nextBreakAtSec<t.durationSec){
      const untilBreak=t.nextBreakAtSec-elapsed;
      if(untilBreak>0)chunk=Math.min(chunk,untilBreak);
    }
    t.segmentEndRemainingSec=t.remainingSec-chunk;
    t.endAt=base+chunk*1000;
  }
  function startOrPauseTimer(state,now=Date.now()){
    finishIfDue(state,now);
    const t=state.timer;
    if(t.status==='running'){
      if(t.mode==='focus'&&t.phase==='auto-break')t.breakRemainingSec=secondsLeft(t,now);
      else t.remainingSec=secondsLeft(t,now);
      t.status='paused';t.endAt=null;
      return 'paused';
    }
    const fresh=t.status==='idle'||t.status==='completed';
    if(fresh){
      const context=t.contextHabitId;
      state.timer=freshTimer(t.mode,state.settings,context);
      const n=state.timer;
      n.startedAt=now;n.sessionId=uuid();
      n.autoBreaks=n.mode==='focus'&&state.settings.autoBreaks===true;
      n.breakIntervalSec=clampMinutes(state.settings.autoBreakEvery,25,10,90)*60;
      n.breakLengthSec=clampMinutes(state.settings.autoBreakMinutes,5,2,30)*60;
      n.nextBreakAtSec=n.breakIntervalSec;
    }
    const n=state.timer;
    if(n.remainingSec<=0&&n.phase!=='auto-break')return 'completed';
    n.status='running';
    if(n.mode==='focus'&&n.phase==='auto-break')n.endAt=now+n.breakRemainingSec*1000;
    else if(n.mode==='focus')setFocusSegment(n,now);
    else n.endAt=now+n.remainingSec*1000;
    return fresh?'started':'resumed';
  }
  function endFocusSession(state,now=Date.now()){
    finishIfDue(state,now);
    const t=state.timer;
    if(t.mode!=='focus'||!['paused','running'].includes(t.status))return 0;
    const elapsed=Math.max(0,Math.min(t.durationSec,Math.round(t.durationSec-focusRemaining(t,now))));
    if(elapsed>0&&t.sessionId&&!state.sessions.some(s=>s.id===t.sessionId)){
      state.sessions.push({id:t.sessionId,startedAt:t.startedAt||now-elapsed*1000,completedAt:now,durationSec:elapsed,habitId:t.contextHabitId||null,endedEarly:true,plannedDurationSec:t.durationSec});
    }
    state.timer={...freshTimer('focus',state.settings,t.contextHabitId),status:'completed',remainingSec:0,endedEarly:true};
    return elapsed;
  }
  function finishIfDue(state,now=Date.now()){
    let changed=false;
    for(let loops=0;loops<250;loops++){
      const t=state.timer;
      if(t.status!=='running'||!t.endAt||t.endAt>now)break;
      const segmentEnd=t.endAt;
      changed=true;
      if(t.mode==='focus'&&t.phase==='focus'&&Number.isFinite(t.segmentEndRemainingSec)){
        t.remainingSec=t.segmentEndRemainingSec;
        if(t.remainingSec>0){
          // Break time is explicitly excluded from the accumulated focus total.
          t.phase='auto-break';t.breakRemainingSec=t.breakLengthSec||300;
          t.nextBreakAtSec=(t.nextBreakAtSec||0)+(t.breakIntervalSec||1500);
          t.endAt=segmentEnd+t.breakRemainingSec*1000;
          continue;
        }
      }else if(t.mode==='focus'&&t.phase==='auto-break'){
        t.phase='focus';t.breakRemainingSec=0;
        setFocusSegment(t,segmentEnd);
        continue;
      }else t.remainingSec=0;
      if(t.mode==='focus'&&t.sessionId&&!state.sessions.some(s=>s.id===t.sessionId)){
        state.sessions.push({id:t.sessionId,startedAt:t.startedAt||segmentEnd-t.durationSec*1000,completedAt:segmentEnd,durationSec:t.durationSec,habitId:t.contextHabitId||null,endedEarly:false});
      }
      state.timer={...t,status:'completed',remainingSec:0,endAt:null,phase:'focus'};
      break;
    }
    return changed;
  }
  const escapeHtml = s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const dateLabel = date=>date.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  const initials = text=>String(text||'').slice(0,1).toUpperCase();
  const weekdayShort = ['S','M','T','W','T','F','S'];
  return {KEY,TRACK_KEY,getAttempts,clearAttempts,uuid,dayKey,parseDate,shiftDay,weekday,quoteFor,initialState,load,save,update,extensionStorage,initialStateSettings,defaultTimer,applyTheme,safeCustomTheme,contrast,nextTheme,syncBlocklist,setFocusMode,isScheduled,due,isDone,dayStats,rangeStats,streak,goalProgress,formatMinutes,focusStats,totalFocusSeconds,secondsLeft,focusRemaining,timerPhaseLabel,timerDuration,freshTimer,startOrPauseTimer,endFocusSession,finishIfDue,escapeHtml,dateLabel,weekdayShort};
})();
