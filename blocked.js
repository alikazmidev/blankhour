// Lightweight bridge: a blocked navigation should end on a *native* New Tab,
// not leave the user on chrome-extension://.../blocked.html.
const statusEl = document.getElementById('status');
async function returnToNewTab(showNotice = true) {
  const response = await chrome.runtime.sendMessage({type:'OPEN_FOCUS_NEW_TAB',showNotice});
  if (!response?.ok) throw Error(response?.error || 'Unable to open a new tab.');
}
(async()=>{
  try {
    const state=await Momentum.load();
    Momentum.applyTheme(state.settings);
    document.getElementById('motive').textContent=(state.settings.focusReason||'').trim() || 'I want to protect my time for the things that matter.';
    const context=await chrome.runtime.sendMessage({type:'GET_BLOCK_CONTEXT'}).catch(()=>null);
    if(context?.domain)document.getElementById('blocked-domain').textContent=context.domain.toUpperCase()+' · PAUSED FOR NOW';
    await returnToNewTab(true);
  } catch (error) {
    // Show the existing blocked screen as a safe fallback if Chrome refuses
    // tab creation. A direct newtab.html link would reproduce the old bug.
    document.body.classList.remove('block-redirecting');
    statusEl.textContent='Could not open a New Tab automatically: '+error.message;
  }
})();
document.getElementById('back-to-tab').addEventListener('click',async()=>{
  try {await returnToNewTab(true)}catch(error){statusEl.textContent=error.message}
});
document.getElementById('disable').addEventListener('click',async()=>{
  const button=document.getElementById('disable');button.disabled=true;
  statusEl.textContent='Ending Focus Mode…';
  try {await Momentum.setFocusMode(false);await returnToNewTab(false)}
  catch(error){statusEl.textContent='Could not end Focus Mode: '+error.message;button.disabled=false}
});
