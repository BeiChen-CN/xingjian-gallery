from docx import Document
from pathlib import Path
p = Path(r'C:\Users\jiang\Documents\xwechat_files\wxid_jpyzg67tbsxa22_f52d\msg\file\2026-11\1-26新生培训策划案-261110.docx')
doc = Document(p)
for block in doc.iter_inner_content():
    if hasattr(block, 'rows'):
        print('\n[TABLE]')
        for row in block.rows:
            print(' | '.join(cell.text.replace('\n', ' / ') for cell in row.cells))
    else:
        text = block.text.strip()
        if text: print(text)
