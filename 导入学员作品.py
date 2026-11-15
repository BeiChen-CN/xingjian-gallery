"""将学员 HTML 或 ZIP 导入作品宇宙；运行：python 导入学员作品.py。"""
import json
import math
import os
import re
import shutil
import stat
import tempfile
import uuid
import zipfile
import threading
import time
from contextlib import contextmanager
from html.parser import HTMLParser
from pathlib import Path
from tkinter import Tk, filedialog, messagebox, simpledialog
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
DATA = ROOT / '作品数据.js'
DEST = ROOT / '作品'
COLORS = ['#c4a77b', '#72a99c', '#9993ad', '#be927c', '#91a6b5', '#b0b18d']
MAX_UNPACKED = 200 * 1024 * 1024
MAX_MEMBERS = 4096
TITLE_BYTES = 200000
_COMMIT_LOCK = threading.Lock()


@contextmanager
def commit_lock():
    # OS file locks are released on process exit; the thread lock also serializes local callers.
    with _COMMIT_LOCK, DATA.with_suffix('.lock').open('a+b') as lock:
        deadline = time.monotonic() + 15
        while True:
            lock.seek(0)
            try:
                if os.name == 'nt':
                    import msvcrt
                    msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
                else:
                    import fcntl
                    fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
                break
            except OSError:
                if time.monotonic() >= deadline:
                    raise TimeoutError('另一项导入正在提交，请稍后重试。')
                time.sleep(.05)
        try:
            yield
        finally:
            lock.seek(0)
            if os.name == 'nt':
                msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(lock.fileno(), fcntl.LOCK_UN)

class TitleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.inside = False
        self.title = ''
    def handle_starttag(self, tag, attrs):
        if tag.lower() == 'title':
            self.inside = True
    def handle_endtag(self, tag):
        if tag.lower() == 'title':
            self.inside = False
    def handle_data(self, data):
        if self.inside:
            self.title += data

def read_title(path):
    with path.open('rb') as source:
        raw = source.read(TITLE_BYTES)
    declared = re.search(br'charset\s*=\s*[\x22\x27]?\s*([\w-]+)', raw[:4096], re.I)
    encoding = declared.group(1).decode('ascii') if declared else 'utf-8-sig'
    if raw.startswith((b'\xff\xfe', b'\xfe\xff')):
        encoding = 'utf-16'
    try:
        text = raw.decode(encoding)
    except (UnicodeError, LookupError):
        text = raw.decode('gb18030', errors='replace')
    parser = TitleParser()
    parser.feed(text)
    return ' '.join(parser.title.split()) or path.stem

def read_works():
    content = DATA.read_text(encoding='utf-8')
    match = re.search(r'window\.WORKS\s*=\s*(\[.*\])\s*;', content, re.S)
    if not match:
        raise ValueError('作品数据.js 格式错误，未找到作品列表。')
    value = json.loads(match.group(1))
    if not isinstance(value, list):
        raise ValueError('作品列表格式错误。')
    for index, work in enumerate(value, 1):
        if not isinstance(work, dict) or any(not isinstance(work.get(key), str) or not work[key].strip() for key in ('title', 'author', 'url', 'color')):
            raise ValueError(f'第 {index} 条作品缺少有效的名称、姓名、地址或颜色。')
        if type(work.get('bytes')) is not int or work['bytes'] < 0:
            raise ValueError(f'第 {index} 条作品的 HTML 字节数无效。')
        if not re.fullmatch(r'#[0-9a-fA-F]{6}', work['color']):
            raise ValueError(f'第 {index} 条作品的颜色无效。')
        pos = work.get('pos')
        if not isinstance(pos, list) or len(pos) != 3 or any(type(n) not in (int, float) or not math.isfinite(n) for n in pos):
            raise ValueError(f'第 {index} 条作品的三维位置无效。')
        if not work['url'].startswith('./作品/') or '\\' in work['url'] or any(part == '..' for part in work['url'].split('/')):
            raise ValueError(f'第 {index} 条作品的入口须位于作品目录中。')
    return value

def extract_zip(archive, directory):
    with zipfile.ZipFile(archive) as z:
        entries = z.infolist()
        if len(entries) > MAX_MEMBERS:
            raise ValueError('压缩包文件和目录数量超过 4096。')
        if sum(e.file_size for e in entries) > MAX_UNPACKED:
            raise ValueError('压缩包解压后超过 200 MiB。')
        root = directory.resolve()
        explicit, tree, targets = set(), {}, []
        for e in entries:
            name = e.filename.replace('\\', '/')
            parts = name.rstrip('/').split('/')
            if name.startswith('/') or ':' in name or any(not part or part in ('.', '..') or part.endswith((' ', '.')) or re.fullmatch(r'(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?', part, re.I) for part in parts):
                raise ValueError('压缩包包含不安全或不兼容的文件路径。')
            target = root.joinpath(*parts)
            if root not in target.resolve().parents:
                raise ValueError('压缩包包含不安全的文件路径。')
            if stat.S_ISLNK(e.external_attr >> 16):
                raise ValueError('压缩包包含符号链接。')
            key = tuple(part.casefold() for part in parts)
            if key in explicit:
                raise ValueError('压缩包包含重复或仅大小写不同的路径。')
            explicit.add(key)
            for length in range(1, len(key) + 1):
                prefix = key[:length]
                kind = 'dir' if length < len(key) or e.is_dir() else 'file'
                if prefix in tree and (tree[prefix][0] != kind or tree[prefix][1] != tuple(parts[:length])):
                    raise ValueError('压缩包存在文件、目录或大小写别名冲突。')
                tree[prefix] = (kind, tuple(parts[:length]))
            targets.append((e, target))
        for entry, target in targets:
            if entry.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with z.open(entry) as source, target.open('wb') as output:
                    shutil.copyfileobj(source, output)

def choose_entry(directory):
    pages = sorted(p for p in directory.rglob('*') if p.is_file() and p.suffix.lower() in ('.html', '.htm'))
    if not pages:
        raise ValueError('没有找到 HTML 页面。')
    preferred = [p for p in pages if p.name.lower() in ('index.html', 'index.htm')]
    if len(preferred) == 1:
        return preferred[0]
    if len(pages) == 1:
        return pages[0]
    selected = filedialog.askopenfilename(title='请选择作品的入口 HTML 文件', initialdir=str(directory), filetypes=[('网页', '*.html *.htm')])
    if not selected:
        return None
    result = Path(selected).resolve()
    if directory.resolve() not in result.parents or result not in pages:
        raise ValueError('请选择压缩包中的 HTML 文件。')
    return result

def import_work(source, parent):
    DEST.mkdir(exist_ok=True)
    staging = Path(tempfile.mkdtemp(prefix='.导入-', dir=DEST))
    final = None
    committed = False
    try:
        if source.suffix.lower() == '.zip':
            extract_zip(source, staging)
        elif source.suffix.lower() in ('.html', '.htm'):
            if source.stat().st_size > MAX_UNPACKED:
                raise ValueError('单个 HTML 超过 200 MiB。')
            shutil.copy2(source, staging / source.name)
        else:
            raise ValueError('请选择 HTML 或 ZIP 文件。')
        entry = choose_entry(staging)
        if entry is None:
            return False
        title = simpledialog.askstring('新增作品', '作品名称（每次导入均新增，旧作品保留）：', initialvalue=read_title(entry), parent=parent)
        if title is None:
            return False
        author = simpledialog.askstring('学员姓名', '学员姓名：', parent=parent)
        if author is None:
            return False
        title, author = title.strip(), author.strip()
        if not title or not author:
            raise ValueError('作品名称和学员姓名需要填写。')
        relative = entry.relative_to(staging)
        size = entry.stat().st_size
        with commit_lock():
            works = read_works()
            destination = DEST / ('work-' + uuid.uuid4().hex[:12])
            if destination.exists():
                raise FileExistsError('作品目录已存在，请重新导入。')
            staging.rename(destination)
            final = destination
            angle = len(works) * 2.399963
            distance = 7 + (len(works) // 8) * 3
            y = 3.5 * math.sin(len(works) * 1.7)
            position = [round(distance * math.cos(angle), 2), round(y, 2), round(distance * math.sin(angle), 2)]
            url = './作品/' + quote(final.name) + '/' + '/'.join(quote(part) for part in relative.parts)
            works.append({'title': title, 'author': author, 'url': url, 'bytes': size, 'color': COLORS[len(works) % len(COLORS)], 'pos': position})
            content = '// 本文件由作品导入工具维护；bytes 是 HTML 文件的字节数。\nwindow.WORKS = ' + json.dumps(works, ensure_ascii=False, indent=2) + ';\n'
            temporary = DATA.with_name(DATA.name + '.tmp-' + uuid.uuid4().hex)
            try:
                temporary.write_text(content, encoding='utf-8')
                os.replace(temporary, DATA)
            finally:
                if temporary.exists():
                    temporary.unlink()
            committed = True
        return True
    finally:
        if staging.exists():
            shutil.rmtree(staging)
        if final is not None and final.exists() and not committed:
            shutil.rmtree(final)

def main():
    root = Tk()
    root.withdraw()
    try:
        source = filedialog.askopenfilename(title='新增学员作品（保留已有版本）', filetypes=[('网页或压缩包', '*.html *.htm *.zip'), ('所有文件', '*.*')])
        if source and import_work(Path(source), root):
            messagebox.showinfo('新增完成', '已新增一件作品，已有作品和条目保持保留。请刷新展厅页面。')
    except Exception as exc:
        messagebox.showerror('导入失败', str(exc))
    finally:
        root.destroy()

if __name__ == '__main__':
    main()
