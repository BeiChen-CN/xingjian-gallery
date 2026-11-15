from pathlib import Path
import re
root=Path(r'D:\培训')
s=(root/'第十周AI小组培训-网站展示版.html').read_text(encoding='utf-8')
f=(root/'小鸟教学片段.txt').read_text(encoding='utf-8')
style=re.search(r'<style>[\s\S]*?</style>',f).group(0)
script=re.search(r'<script data-bird>[\s\S]*?</script>',f).group(0)
slides=f.replace(style,'').replace(script,'').strip()
assert len(re.findall(r'<section\s+class="slide\s+bird-slide',slides))==3
assert s.count('</head>')==1
s=s.replace('</head>',style+'\n</head>',1)
marker='<section class="slide"><div class="top"><span>WEB / 浏览器</span><span>09</span></div>'
assert s.count(marker)==1
s=s.replace(marker,slides+'\n'+marker,1)
def renumber(m):
 n=int(m.group(2)); return m.group(1)+f'{n+3 if n>=9 else n:02}'+m.group(3)
s=re.sub(r'(<div class="top"><span>[^<]*</span><span>)(\d{2})(</span></div>)',renumber,s)
assert s.count('</body>')==1
s=s.replace('</body>',script+'\n</body>',1)
out=root/'第十周AI小组培训-小鸟演示版.html'
out.write_text(s,encoding='utf-8')
print('Output written. Slide count:',len(re.findall(r'<section class="slide(?:\s|\")',s)))
