// Apply the preference before CSS loads to avoid a light flash on dark visits.
(()=>{
 const key='aidocready-theme';
 const system=window.matchMedia('(prefers-color-scheme: dark)');
 let preference=null;
 try{const saved=localStorage.getItem(key);if(saved==='light'||saved==='dark')preference=saved;}catch{}
 function apply(){
  const dark=preference?preference==='dark':system.matches;
  document.documentElement.dataset.theme=dark?'dark':'light';
  const button=document.querySelector('[data-theme-toggle]');
  if(button){button.hidden=false;button.setAttribute('aria-label',dark?'라이트 테마로 전환':'다크 테마로 전환');button.title=dark?'라이트 테마로 전환':'다크 테마로 전환';button.querySelector('[data-theme-label]').textContent=dark?'라이트 모드':'다크 모드';button.querySelector('[data-theme-icon]').textContent=dark?'☀':'☾';}
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#111d2b':'#ffffff');
 }
 apply();
 document.addEventListener('DOMContentLoaded',()=>{
  apply();
  document.querySelector('[data-theme-toggle]')?.addEventListener('click',()=>{
   preference=document.documentElement.dataset.theme==='dark'?'light':'dark';
   try{localStorage.setItem(key,preference);}catch{}
   apply();
  });
 });
 system.addEventListener('change',()=>{if(!preference)apply();});
 window.addEventListener('storage',event=>{if(event.key===key||event.key===null){preference=event.newValue==='dark'||event.newValue==='light'?event.newValue:null;apply();}});
})();
