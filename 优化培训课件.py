from pathlib import Path
from html import escape, unescape
import re
src=Path('第十周AI小组培训-小鸟演示版.html')
out=Path('第十周AI小组培训-投影优化版.html')
s=src.read_text(encoding='utf-8')
sections=re.findall(r'<section class="slide(?:\s[^"]*)?"[^>]*>(.*?)</section>',s,re.S)
assert len(sections)==41
names=[]
for i, section in enumerate(sections):
    match=re.search(r'<h[12][^>]*>(.*?)</h[12]>',section,re.S)
    name=unescape(re.sub(r'<[^>]*>',' ',match.group(1))) if match else '课件'
    name=' '.join(name.split())
    names.append(f'<option value="{i}">{i+1:02d} · {escape(name)}</option>')
styles='''<style>
/* 投影优化：包豪斯色彩、清晰层级与可操作状态 */
.slide:not(.wd-showcase)::after{content:"";position:absolute;right:clamp(24px,6vw,96px);top:57px;width:clamp(36px,4vw,58px);height:4px;background:var(--yellow);pointer-events:none}
.slide:not(.wd-showcase) h2{max-width:24em;text-wrap:balance}
.slide:not(.wd-showcase) .card{box-shadow:5px 5px 0 rgba(24,24,24,.13)}
.slide:not(.wd-showcase) .card h3{letter-spacing:.015em}
.footer button:focus-visible,.footer select:focus-visible{outline:3px solid #f4ca33;outline-offset:3px}
.footer select{max-width:min(29vw,300px);min-height:42px;padding:7px 30px 7px 10px;border:2px solid #fff;background:#242424;color:#fff;font:600 14px/1.2 "Microsoft YaHei",sans-serif}
.footer label{display:flex;align-items:center;gap:8px;color:white;font-size:14px;font-weight:700}
@media(max-width:760px){.footer label{font-size:0}.footer select{max-width:32vw;font-size:13px}.slide:not(.wd-showcase)::after{display:none}}
@media(max-height:650px){.slide:not(.wd-showcase)::after{display:none}}
</style>'''
s=s.replace('</head>',styles+'</head>',1)
anchor='<span id="status" class="status" aria-live="polite"></span>'
assert anchor in s
s=s.replace(anchor,anchor+'<label for="jump">跳转<select id="jump" aria-label="跳转到指定页面">'+''.join(names)+'</select></label>',1)
s=s.replace("motion=document.getElementById('motion');let index=0;", "motion=document.getElementById('motion'),jump=document.getElementById('jump');let index=0;",1)
assert "jump=document.getElementById('jump')" in s
s=s.replace("status.textContent=`${String(index+1).padStart(2,'0')} / ${slides.length} · ← → 翻页`;", "status.textContent=`${String(index+1).padStart(2,'0')} / ${slides.length} · ← → 翻页`;jump.value=String(index);",1)
s=s.replace("prev.addEventListener('click',()=>show(index-1));", "jump.addEventListener('change',()=>show(Number(jump.value)));prev.addEventListener('click',()=>show(index-1));",1)
s=s.replace("e.target.matches('input,textarea,select,button')", "e.target.matches('input,textarea,select,button,a,[contenteditable=\"true\"]')",1)
s=s.replace('<title>AI 小组培训 · 详细版</title>','<title>AI 小组培训 · 投影优化版</title>',1)
out.write_text(s,encoding='utf-8')
print(f'{out}: {len(sections)} 页，新增投影视觉和快速跳转')
