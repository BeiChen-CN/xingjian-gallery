from pathlib import Path
import re
root=Path(r'D:\培训')
source=(root/'第十周AI小组培训-详细版.html').read_text(encoding='utf-8')
fragment=(root/'网站展示片段.txt').read_text(encoding='utf-8')
style, slides = fragment.split('</style>',1)
style += '</style>'
assert source.count('</style></head>') == 1
source=source.replace('</style></head>', '</style>\n'+style+'\n</head>',1)
marker='<section class="slide"><div class="top"><span>WEB / 基础结构</span><span>05</span></div>'
assert source.count(marker)==1
source=source.replace(marker, slides.strip()+'\n'+marker, 1)
def number(m):
    n=int(m.group(2))
    return m.group(1)+str(n+3 if n>=5 else n).zfill(2)+m.group(3)
source=re.sub(r'(<div class="top"><span>[^<]*</span><span>)(\d{2})(</span></div>)',number,source)
output=root/'第十周AI小组培训-网站展示版.html'
output.write_text(source,encoding='utf-8')
print(output)
print('slides:', len(re.findall(r'<section class="slide(?:\s|\")',source)))
