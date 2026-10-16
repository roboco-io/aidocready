import {validateProseExample} from './prose-example-lib.mjs';
import {createHash} from 'node:crypto';
import {renderConversionMarkdown,validateConversionCase,selectConversionExample} from './conversion-case-lib.mjs';
import {execFileSync} from 'node:child_process';
import {readFile,writeFile,mkdir,rm,cp,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {validateSite} from './site-lib.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));const source=join(root,'site');const output=join(root,'_site');
const product=JSON.parse(await readFile(join(source,'product.json'),'utf8'));
if(!/^\d+\.\d+\.\d+$/.test(product.version))throw new Error('Invalid site release version');
if(!/^[a-f0-9]{40}$/.test(product.releaseRef))throw new Error('Invalid release reference');
const releaseFile=path=>execFileSync('git',['show',`${product.releaseRef}:${path}`],{cwd:root});
if(JSON.parse(releaseFile('package.json').toString('utf8')).version!==product.version)throw new Error('Site version does not match release reference');
const demo=JSON.parse(await readFile(join(source,'assets/demo.json'),'utf8'));if(demo.version!==product.version)throw new Error('Demo and site release versions differ');
const social=JSON.parse(await readFile(join(source,'social.json'),'utf8'));
if(!/^assets\/social\/[a-z0-9-]+\.png$/.test(social.file))throw new Error('Invalid social image path');
const socialImage=await readFile(join(source,social.file));
if(socialImage.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||socialImage.readUInt32BE(16)!==social.width||socialImage.readUInt32BE(20)!==social.height)throw new Error('Social image dimensions do not match metadata');
const socialUrl=new URL(social.file,product.siteUrl).href;
const faq=JSON.parse(await readFile(join(source,'faq.json'),'utf8'));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
if(!/^\d{4}-\d{2}-\d{2}$/.test(product.releaseDate))throw new Error('Invalid release date');
const [year,month,day]=product.releaseDate.split('-').map(Number);
const writingInstructions=releaseFile('templates/REPORT-WRITING.md').toString('utf8').trim();
const tokens={WRITING_INSTRUCTIONS:esc(writingInstructions),VERSION:product.version,REPO_URL:product.repoUrl,SITE_URL:product.siteUrl,TESTS:product.tests,CORPUS_CASES:product.corpusCases,RELEASE_DATE:`${year}년 ${month}월 ${day}일`};
const caseRoot=join(source,'assets','conversion');
const caseMeta=JSON.parse(await readFile(join(caseRoot,'provenance.json'),'utf8'));
const caseMarkdown=await readFile(join(caseRoot,'converted.md'),'utf8');
const caseReportText=await readFile(join(caseRoot,'lint.json'),'utf8');
const caseReport=JSON.parse(caseReportText);
const hash=s=>createHash('sha256').update(s).digest('hex');
validateConversionCase(caseMeta,caseReport,product.version,hash(caseMarkdown),hash(caseReportText));
if(hash(await readFile(join(caseRoot,'original.hwpx')))!==caseMeta.sourceSha256)throw new Error('Conversion source hash mismatch');
const ruleCounts=Object.entries(caseReport.findings.reduce((a,f)=>(a[f.ruleId]=(a[f.ruleId]??0)+1,a),{}));
Object.assign(tokens,{
 CASE_WARNINGS:caseReport.summary.Warning,CASE_REF:esc(caseMeta.converterRef),CASE_SOURCE:caseMeta.converterRepo+'/blob/'+caseMeta.converterRef+'/'+encodeURIComponent(caseMeta.sourcePath).replaceAll('%2F','/'),
 CASE_MARKDOWN:renderConversionMarkdown(caseMarkdown),CASE_RAW:esc(caseMarkdown),
 CASE_SUMMARY:`<strong>Warning ${caseReport.summary.Warning}개</strong><span>${ruleCounts.map(([rule,count])=>esc(rule)+' '+count+'개').join(' · ')}</span>`,
 CASE_FINDINGS:caseReport.findings.map((f,i)=>`<details class="finding"><summary><span>${i+1}. ${esc(f.severity)} · ${esc(f.location.line)}번째 줄</span><strong>${esc(f.ruleId)}</strong></summary><div><p>${esc(f.message)}</p><pre>${esc(f.excerpt)}</pre><a href="${esc(f.helpUrl)}">규칙의 근거와 인식 문법</a></div></details>`).join(''),
 CASE_COVERAGE:esc(JSON.stringify({coverage:caseReport.coverage,checks:caseReport.checks},null,2))
});
const selectedCases=JSON.parse(await readFile(join(caseRoot,'selected-cases.json'),'utf8'));
tokens.CASE_SELECTED=selectedCases.map(c=>{
 const example=selectConversionExample(caseMarkdown,caseReport,c);
 const diagnoses=example.findings.map(f=>`<div class="selected-diagnostic"><b>${esc(f.severity)} · ${esc(f.ruleId)} · ${f.location.line}번째 줄</b><p>${esc(f.message)}</p></div>`).join('');
 return `<section class="selected-case" id="${esc(c.id)}"><h2>${esc(c.title)}</h2><p>${esc(c.description)}</p><div class="selected-comparison"><article><h3>원본 해당 부분</h3><a href="assets/conversion/${esc(c.id)}.png"><img src="assets/conversion/${esc(c.id)}.png" alt="${esc(c.title)}의 원본 표 발췌" loading="lazy"></a><p class="micro">참고 PDF ${c.pdfPage}번째 페이지에서 발췌 · 이미지를 누르면 크게 볼 수 있습니다.</p></article><article><h3>실제 자동 변환 결과</h3><div class="selected-markdown">${renderConversionMarkdown(example.markdown)}</div><details class="raw-output"><summary>Markdown 원문 보기 · ${c.startLine}–${c.endLine}번째 줄</summary><pre>${esc(example.markdown)}</pre></details></article></div><div class="selected-review"><h3>검사 결과와 사람이 확인할 부분</h3>${diagnoses||'<p>이 발췌 구간의 정적 진단: 없음</p>'}${example.limitations.length?'<p class="micro">이 구간에 HTML 구조 미지원 안내가 있습니다. 전체 검사에서 해당 구조는 검증하지 못했습니다.</p>':''}<p>${esc(c.review)}</p></div><a href="conversion-full.html#findings">전체 결과에서 진단과 검사 한계 확인</a></section>`;
}).join('');
const proseRoot=join(source,'assets','prose');
const proseMeta=JSON.parse(await readFile(join(proseRoot,'provenance.json'),'utf8'));
if(proseMeta.version!==product.version||proseMeta.sourceMarkdownSha256!==hash(caseMarkdown)||proseMeta.skillSha256!==hash(releaseFile('skills/aidocready/SKILL.md')))throw new Error('Prose example release, source or skill mismatch');
for(const example of proseMeta.examples){
 const texts={};const reports={};
 for(const phase of ['before','after']){
  for(const suffix of ['.md','-lint.json']){
   const file=example.id+'-'+phase+suffix;const content=await readFile(join(proseRoot,file),'utf8');
   if(hash(content)!==example.artifacts[file])throw new Error('Prose example artifact hash mismatch: '+file);
   if(suffix==='.md')texts[phase]=content;else reports[phase]=JSON.parse(content);
  }
 }
 validateProseExample(example,texts.before,texts.after,caseMarkdown);
 for(const report of Object.values(reports))for(const severity of ['Error','Warning','Suggestion'])if(report.findings.filter(f=>f.severity===severity).length!==report.summary[severity])throw new Error('Prose report summary mismatch');
 const key=example.id.toUpperCase();
 tokens['PROSE_'+key+'_BEFORE']=renderConversionMarkdown(texts.before);
 tokens['PROSE_'+key+'_AFTER']=renderConversionMarkdown(example.id==='table'?texts.after.split(/\n\s*\n/).find(p=>p.startsWith('종무(천주교) 분야')):texts.after);
 tokens['PROSE_'+key+'_REPORT']=`<p class="prose-check">구조 검사: 재구성 전 Warning ${reports.before.summary.Warning}개 → 재구성 후 Warning ${reports.after.summary.Warning}개</p><p class="micro">정적 입력 검사 범위(coverage.complete): ${reports.before.coverage.complete} → ${reports.after.coverage.complete}. 사실 보존이나 AI 이해도를 판정한 결과가 아닙니다.</p>`;
}
const writingRoot=join(source,'assets','writing');
const writingMeta=JSON.parse(await readFile(join(writingRoot,'provenance.json'),'utf8'));
if(writingMeta.version!==product.version||writingMeta.sourceFactsSha256!==hash(await readFile(join(writingRoot,'source-facts.json')))||writingMeta.skillSha256!==hash(releaseFile('skills/aidocready/SKILL.md')))throw new Error('Writing comparison source or release mismatch');
for(const mode of ['without','with']){
 const markdown=await readFile(join(writingRoot,mode+'.md'),'utf8');
 const reportText=await readFile(join(writingRoot,mode+'-lint.json'),'utf8');
 for(const [name,content] of [[mode+'.md',markdown],[mode+'-lint.json',reportText]])if(hash(content)!==writingMeta.artifacts[name])throw new Error('Writing comparison hash mismatch');
 for(const fact of writingMeta.sharedFacts)if(!markdown.includes(fact))throw new Error('Writing comparison missing shared fact: '+fact);
 const report=JSON.parse(reportText);
 for(const severity of ['Error','Warning','Suggestion'])if(report.findings.filter(f=>f.severity===severity).length!==report.summary[severity])throw new Error('Writing report summary mismatch');
 tokens['WRITING_'+mode.toUpperCase()]=renderConversionMarkdown(markdown);
 tokens['WRITING_'+mode.toUpperCase()+'_WARNINGS']=report.summary.Warning;
}
const formatRoot=join(source,'assets','table-list');
const formatMeta=JSON.parse(await readFile(join(formatRoot,'provenance.json'),'utf8'));
const itemText=await readFile(join(formatRoot,'items.json'),'utf8');
const formatItems=JSON.parse(itemText);
if(formatMeta.version!==product.version||formatMeta.sourceFactsSha256!==hash(await readFile(join(writingRoot,'source-facts.json')))||formatMeta.itemsSha256!==hash(itemText))throw new Error('Table/list source mismatch');
for(const mode of ['table','list']){
 const markdown=await readFile(join(formatRoot,mode+'.md'),'utf8');const reportText=await readFile(join(formatRoot,mode+'-lint.json'),'utf8');
 for(const [name,content] of [[mode+'.md',markdown],[mode+'-lint.json',reportText]])if(hash(content)!==formatMeta.artifacts[name])throw new Error('Table/list artifact mismatch');
 for(const item of formatItems)if(!markdown.includes(item.label)||!markdown.includes(item.text))throw new Error('Table/list item missing');
 const report=JSON.parse(reportText);
 for(const severity of ['Error','Warning','Suggestion'])if(report.findings.filter(f=>f.severity===severity).length!==report.summary[severity])throw new Error('Table/list report summary mismatch');
 tokens['FORMAT_'+mode.toUpperCase()]=renderConversionMarkdown(markdown);
 tokens['FORMAT_'+mode.toUpperCase()+'_WARNINGS']=report.summary.Warning;
}
const replace=s=>s.replace(/\{\{([A-Z_]+)\}\}/g,(m,key)=>key in tokens?String(tokens[key]):m);
const pages={'conversion-full.html':{title:'전체 변환·검사 결과 — AI Doc Ready',description:'공개 샘플의 전체 Markdown, 원본 PDF, 진단과 검사 한계 확인.'},'conversion.html':{title:'실제 문서 변환·검사 비교 — AI Doc Ready',description:'복잡한 표 세 사례의 원본, 실제 자동 변환과 검사 한계를 비교하세요.'},'index.html':{title:'AI Doc Ready — 보고서를 AI 요약·발표·검색의 기반으로',description:'행안부 AI 친화적 보고서 원칙을 에이전트 작성 지침과 구조 검사로 적용하세요. 같은 문서의 작성 비교와 사용 매뉴얼.'},'manual.html':{title:'사용 매뉴얼 — AI Doc Ready',description:`AI Doc Ready ${product.version} 명령어 없는 ChatGPT·Claude 작성 지침, 문서 검사, JSON, 프로파일과 에이전트 연결 방법.`},'faq.html':{title:'제품 FAQ — AI Doc Ready',description:'고객의 질문에서 출발하는 AI Doc Ready PR/FAQ. 지원 범위, 가격, 검증 방법과 제품 전략.'},'press-release.html':{title:`보도자료 — AI Doc Ready ${product.version} 공개`,description:`ChatGPT·Claude 작성 지침과 Markdown·HWPX 구조 검사를 제공하는 AI Doc Ready ${product.version} 보도자료.`}};
const logo='<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 4h21l9 9v30H9z" fill="#225bd6"/><path d="M29 5v10h9" fill="none" stroke="#adc7ff" stroke-width="3"/><path d="m17 27 6 6 11-13" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const menu=[['index.html','소개'],['conversion.html','실제 사례'],['manual.html','사용 매뉴얼'],['faq.html','FAQ'],['press-release.html','보도자료']];
const footer=`<footer class="footer"><div class="wrap footer-row"><div><strong>AI Doc Ready</strong> · v${esc(product.version)}<br>© 2026 roboco-io · MIT 오픈소스</div><div class="footer-links"><a href="${product.repoUrl}">GitHub</a><a href="https://www.npmjs.com/package/aidocready/v/${product.version}">npm</a><a href="https://github.com/chrisryugj/kordoc">Kordoc</a><a href="${product.repoUrl}/issues">문의·제보</a></div></div></footer>`;
await rm(output,{recursive:true,force:true});await mkdir(output,{recursive:true});await cp(join(source,'assets'),join(output,'assets'),{recursive:true});
for(const [from,to] of [['examples/report.md','report.md'],['examples/report.hwpx','report.hwpx'],['examples/profile.json','profile.json'],['skills/aidocready/SKILL.md','SKILL.md'],['templates/AGENTS.md','AGENTS.md'],['templates/CLAUDE.md','CLAUDE.md'],['templates/REPORT-WRITING.md','REPORT-WRITING.md']])await writeFile(join(output,'assets',to),releaseFile(from));
for(const [file,meta] of Object.entries(pages)){
 const canonical=product.siteUrl+(file==='index.html'?'':file);
 const head=`<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(meta.title)}</title><meta name="description" content="${esc(meta.description)}"><meta name="theme-color" content="#225bd6"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${esc(meta.title)}"><meta property="og:description" content="${esc(meta.description)}"><meta property="og:url" content="${canonical}"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="AI Doc Ready"><meta property="og:image" content="${esc(socialUrl)}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="${social.width}"><meta property="og:image:height" content="${social.height}"><meta property="og:image:alt" content="${esc(social.alt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(meta.title)}"><meta name="twitter:description" content="${esc(meta.description)}"><meta name="twitter:image" content="${esc(socialUrl)}"><meta name="twitter:image:alt" content="${esc(social.alt)}"><link rel="icon" href="assets/icon.svg" type="image/svg+xml"><script src="assets/theme.js"></script><script async src="https://www.googletagmanager.com/gtag/js?id=G-9G1SGM9SZQ"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-9G1SGM9SZQ');</script><link rel="stylesheet" href="assets/style.css?v=${product.version}">`;
 const header=`<a class="skip" href="#main">본문으로 이동</a><header class="header"><div class="wrap header-row"><a class="brand" href="index.html" aria-label="AI Doc Ready 홈">${logo}<span>AI Doc Ready</span></a><button class="nav-toggle" type="button" aria-controls="primary-nav" aria-expanded="false">메뉴</button><nav class="nav" id="primary-nav" aria-label="주요 메뉴">${menu.map(([href,label])=>`<a href="${href}"${file===href||(file==='conversion-full.html'&&href==='conversion.html')?' aria-current="page"':''}>${label}</a>`).join('')}<a class="repo" href="${product.repoUrl}">GitHub</a></nav><button class="theme-toggle" type="button" data-theme-toggle hidden aria-label="다크 테마로 전환"><span data-theme-icon aria-hidden="true">☾</span><span data-theme-label>다크 모드</span></button></div></header>`;
 const detail=(items,prefix)=>items.map((item,index)=>`<details class="faq-item" id="${prefix}-${index+1}"><summary>${esc(item.question)}</summary><div class="faq-answer">${replace(item.answer)}</div></details>`).join('\n');
 let html=await readFile(join(source,file),'utf8');html=html.replace('{{HEAD}}',head).replace('{{HEADER}}',header).replace('{{FOOTER}}',footer).replace('{{FAQ_CUSTOMER}}',detail(faq.customer,'customer')).replace('{{FAQ_STRATEGY}}',detail(faq.strategy,'strategy'));html=replace(html).replaceAll('src="assets/app.js"',`src="assets/app.js?v=${product.version}"`);
 await writeFile(join(output,file),html);
}
const plain=s=>replace(s).replace(/<\/(?:p|li|h[1-6])>/g,'\n\n').replace(/<br\s*\/?>/g,'\n').replace(/<[^>]+>/g,'').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').trim();
await writeFile(join(output,'faq.txt'),`AI Doc Ready ${product.version} 제품 FAQ\n\n`+[['사용자 질문',faq.customer],['제품 전략 질문',faq.strategy]].map(([label,items])=>label+'\n\n'+items.map(item=>item.question+'\n'+plain(item.answer)).join('\n\n')).join('\n\n')+'\n\n사용 매뉴얼: '+product.siteUrl+'manual.html\n소스: '+product.repoUrl+'\nKordoc: https://github.com/chrisryugj/kordoc\n공식 발표: https://mois.go.kr/frt/bbs/type010/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000008&nttId=128940\nPR/FAQ 형식 참고: https://www.aboutamazon.com/news/workplace/an-insider-look-at-amazons-culture-and-processes\n');
const press=await readFile(join(output,'press-release.html'),'utf8');const body=press.match(/<div class="press-body" data-press-body>([\s\S]*?)<\/div>/)[1];
await writeFile(join(output,'press-release.txt'),`AI Doc Ready ${product.version} 공개, ChatGPT·Claude 작성 지침과 보고서 구조 검사 제공\n\n${tokens.RELEASE_DATE} · roboco-io\n\n`+plain(body)+'\n\n제품: '+product.siteUrl+'\n소스: '+product.repoUrl+'\nnpm: https://www.npmjs.com/package/aidocready/v/'+product.version+'\n공식 근거: https://mois.go.kr/frt/bbs/type010/commonSelectBoardArticle.do?bbsId=BBSMSTR_000000000008&nttId=128940\n');
await writeFile(join(output,'.nojekyll'),'');await writeFile(join(output,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${product.siteUrl}sitemap.xml\n`);
await writeFile(join(output,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+Object.keys(pages).map(file=>`<url><loc>${product.siteUrl+(file==='index.html'?'':file)}</loc></url>`).join('')+'</urlset>');
const checked=await validateSite(output);console.log(`Static site built and checked: ${checked.join(', ')}`);
