from docx import Document
from pathlib import Path
p=Path(r'C:\Users\jiang\Documents\xwechat_files\wxid_jpyzg67tbsxa22_f52d\msg\file\2026-11\1-26新生培训策划案-261110.docx')
doc=Document(p)
for i,t in enumerate(doc.tables):
    for j,row in enumerate(t.rows):
        text=' | '.join(c.text.replace('\n',' / ') for c in row.cells)
        if '第十周' in text or '第10周' in text or 'Vibe Coding' in text or 'AIGC' in text:
            print(f'表{i+1} 行{j+1}: {text}')
for i,p in enumerate(doc.paragraphs):
    if any(k in p.text for k in ['第十周','第10周','Vibe Coding','AIGC']):print(f'段{i+1}: {p.text}')
