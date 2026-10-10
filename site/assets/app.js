const navButton=document.querySelector('.nav-toggle');
navButton?.addEventListener('click',()=>{const open=navButton.getAttribute('aria-expanded')!=='true';navButton.setAttribute('aria-expanded',String(open));document.querySelector('#primary-nav').classList.toggle('open',open);});
let copyTimer;
function status(text){let region=document.querySelector('.copy-status');if(!region){region=document.createElement('div');region.className='copy-status';region.setAttribute('role','status');region.setAttribute('aria-live','polite');document.body.append(region);}region.textContent=text;clearTimeout(copyTimer);copyTimer=setTimeout(()=>{region.textContent='';},3000);}
document.querySelectorAll('[data-copy]').forEach(button=>button.addEventListener('click',async()=>{const code=button.parentElement.querySelector('code');try{await navigator.clipboard.writeText(code.textContent.trim());status('명령을 복사했습니다.');}catch{const range=document.createRange();range.selectNodeContents(code);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);status('명령을 선택했습니다. 복사 단축키를 사용하세요.');}}));
document.querySelectorAll('[data-print]').forEach(button=>button.addEventListener('click',()=>window.print()));
const faqButton=document.querySelector('[data-expand-faq]');
faqButton?.addEventListener('click',()=>{const open=faqButton.getAttribute('aria-expanded')!=='true';faqButton.setAttribute('aria-expanded',String(open));faqButton.textContent=open?'모두 접기':'모두 펼치기';document.querySelectorAll('.faq-item').forEach(item=>{item.open=open;});});
let printStates=[];
window.addEventListener('beforeprint',()=>{printStates=[...document.querySelectorAll('.faq-item')].map(item=>item.open);document.querySelectorAll('.faq-item').forEach(item=>{item.open=true;});});
window.addEventListener('afterprint',()=>{document.querySelectorAll('.faq-item').forEach((item,index)=>{item.open=printStates[index]??false;});});
if(document.querySelector('[data-demo]')){
 fetch('assets/demo.json').then(response=>{if(!response.ok)throw new Error('demo');return response.json();}).then(data=>{
  function select(name){const r=data[name];const finding=r.findings[0];document.querySelector('[data-caption]').hidden=name==='before';document.querySelector('[data-result]').classList.toggle('good',!finding);document.querySelector('[data-result-title]').textContent=finding?finding.severity:'이 구조에서 진단 0개';document.querySelector('[data-result-location]').textContent=finding?`${finding.location.line}번째 줄`:'';document.querySelector('[data-result-detail]').textContent=finding?finding.message:'표 제목과 순서 표시를 인식했습니다. 원문 검토는 별도로 진행하세요.';document.querySelectorAll('[data-demo]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.demo===name)));}
  document.querySelectorAll('[data-demo]').forEach(button=>{button.disabled=false;button.addEventListener('click',()=>select(button.dataset.demo));});select('before');
 }).catch(()=>{document.querySelector('[data-result-detail]').textContent='예시 결과를 불러오지 못했습니다. 사용 매뉴얼에서 CLI를 실행해 보세요.';document.querySelectorAll('[data-demo]').forEach(button=>{button.disabled=true;});});
}

const writingControls=document.querySelector('[data-writing-controls]');
if(writingControls){
 writingControls.hidden=false;
 const grid=document.querySelector('[data-writing-grid]');grid.dataset.writingView='without';
 writingControls.querySelectorAll('[data-writing-mode]').forEach(button=>button.addEventListener('click',()=>{
  grid.dataset.writingView=button.dataset.writingMode;
  writingControls.querySelectorAll('[data-writing-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 }));
}
