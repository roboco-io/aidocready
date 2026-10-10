import {unified} from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
export const escapeHtml=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function renderConversionMarkdown(text){
 const tree=unified().use(remarkParse).use(remarkGfm).parse(text);
 function render(n){
  const children=()=>n.children?.map(render).join('')??'';
  switch(n.type){
   case 'root':return children();
   case 'text':return escapeHtml(n.value);
   case 'html':return n.value.trim().toLowerCase()==='<br>'?'<br>':escapeHtml(n.value);
   case 'paragraph':return `<p>${children()}</p>`;
   case 'heading':return `<h${n.depth}>${children()}</h${n.depth}>`;
   case 'table':return `<div class="table-scroll"><table>${n.children.map((row,i)=>`<${i?'tbody':'thead'}><tr>${row.children.map(c=>`<${i?'td':'th'}>${c.children.map(render).join('')}</${i?'td':'th'}>`).join('')}</tr></${i?'tbody':'thead'}>`).join('')}</table></div>`;
   case 'list':return `<${n.ordered?'ol':'ul'}>${children()}</${n.ordered?'ol':'ul'}>`;
   case 'listItem':return `<li>${children()}</li>`;
   case 'strong':return `<strong>${children()}</strong>`;
   case 'emphasis':return `<em>${children()}</em>`;
   case 'delete':return `<del>${children()}</del>`;
   case 'inlineCode':return `<code>${escapeHtml(n.value)}</code>`;
   case 'code':return `<pre><code>${escapeHtml(n.value)}</code></pre>`;
   case 'break':return '<br>';
   case 'thematicBreak':return '<hr>';
   case 'blockquote':return `<blockquote>${children()}</blockquote>`;
   // Display source URLs as text; no source HTML, image or URL can execute.
   case 'link':return `${children()} (${escapeHtml(n.url)})`;
   case 'image':return `[${escapeHtml(n.alt??'이미지')}: ${escapeHtml(n.url)}]`;
   default:return n.value?escapeHtml(n.value):children();
  }
 }
 return render(tree);
}
export function validateConversionCase(data,report,version,markdownHash,reportHash){
 if(data.version!==version)throw new Error('Conversion case must be regenerated for the public release');
 if(data.markdownSha256!==markdownHash||data.reportSha256!==reportHash)throw new Error('Conversion case artifact hash mismatch');
 for(const severity of ['Error','Warning','Suggestion'])if(report.findings.filter(f=>f.severity===severity).length!==report.summary[severity])throw new Error('Conversion case summary does not match findings');
}
export function selectConversionExample(markdown,report,{startLine,endLine}){
 const lines=markdown.replace(/\n$/,'').split('\n');
 if(!Number.isInteger(startLine)||!Number.isInteger(endLine)||startLine<1||endLine<startLine||endLine>lines.length)throw new Error('Invalid conversion example source range');
 const inside=n=>Number.isInteger(n)&&n>=startLine&&n<=endLine;
 return {markdown:lines.slice(startLine-1,endLine).join('\n')+'\n',findings:report.findings.filter(f=>inside(f.location?.line)),limitations:report.coverage.limitations.filter(s=>inside(Number(s.match(/^line (\d+):/)?.[1])))};
}
