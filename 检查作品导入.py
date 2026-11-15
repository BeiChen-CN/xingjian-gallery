import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace
import multiprocessing


def import_in_process(root, title, gate):
    module.ROOT = Path(root)
    module.DATA = module.ROOT / '作品数据.js'
    module.DEST = module.ROOT / '作品'
    answers = iter([title, '测试学员'])
    first = True
    def prompt(*args, **kwargs):
        nonlocal first
        if first:
            first = False
            gate.wait(timeout=15)
        return next(answers)
    with patch.object(module.simpledialog, 'askstring', side_effect=prompt):
        module.import_work(module.ROOT / 'sample.html', None)

spec = importlib.util.spec_from_file_location('importer', Path(__file__).with_name('导入学员作品.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class ImportTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        self.old = module.ROOT, module.DATA, module.DEST
        module.ROOT, module.DATA, module.DEST = root, root / '作品数据.js', root / '作品'
        module.DATA.write_text('window.WORKS = [];\n', encoding='utf-8')
    def tearDown(self):
        module.ROOT, module.DATA, module.DEST = self.old
        self.tmp.cleanup()
    def test_zip_with_assets(self):
        archive = module.ROOT / '作品.zip'
        html = '<html><title>我的作品</title><img src="img/a.png"></html>'
        with zipfile.ZipFile(archive, 'w') as z:
            z.writestr('site/index.html', html)
            z.writestr('site/img/a.png', b'example')
        with patch.object(module.simpledialog, 'askstring', side_effect=['我的作品', '测试学员']):
            self.assertTrue(module.import_work(archive, None))
        works = module.read_works()
        self.assertEqual(works[0]['author'], '测试学员')
        self.assertEqual(works[0]['bytes'], len(html.encode('utf-8')))
        self.assertTrue(list(module.DEST.glob('work-*/site/img/a.png')))
        self.assertIn('/site/index.html', works[0]['url'])
    def test_zip_traversal_rejected(self):
        archive = module.ROOT / 'bad.zip'
        with zipfile.ZipFile(archive, 'w') as z:
            z.writestr('../escape.html', 'bad')
        with self.assertRaises(ValueError):
            module.import_work(archive, None)
        self.assertEqual(module.read_works(), [])
        self.assertFalse((module.ROOT / 'escape.html').exists())

    def test_collision_preserves_existing_work(self):
        source = module.ROOT / 'sample.html'
        source.write_text('<title>样例</title>', encoding='utf-8')
        previous = module.DEST / 'work-aaaaaaaaaaaa'
        previous.mkdir(parents=True)
        sentinel = previous / 'sentinel.txt'
        sentinel.write_text('existing-work', encoding='utf-8')
        with patch.object(module.uuid, 'uuid4', return_value=SimpleNamespace(hex='a' * 32)), patch.object(module.simpledialog, 'askstring', side_effect=['样例', '测试学员']):
            with self.assertRaises(FileExistsError):
                module.import_work(source, None)
        self.assertEqual(sentinel.read_text(encoding='utf-8'), 'existing-work')
        self.assertEqual(module.read_works(), [])
        self.assertEqual(list(module.DEST.glob('.导入-*')), [])

    def test_interleaved_imports_keep_both_records(self):
        source = module.ROOT / 'sample.html'
        source.write_text('<title>样例</title>', encoding='utf-8')
        started = []
        answers = iter(['外层作品', '外层学员'])
        def prompt(*args, **kwargs):
            if not started:
                started.append(True)
                with patch.object(module.simpledialog, 'askstring', side_effect=['内层作品', '内层学员']):
                    self.assertTrue(module.import_work(source, None))
            return next(answers)
        with patch.object(module.simpledialog, 'askstring', side_effect=prompt):
            self.assertTrue(module.import_work(source, None))
        works = module.read_works()
        self.assertEqual([work['title'] for work in works], ['内层作品', '外层作品'])
        for work in works:
            self.assertTrue((module.ROOT / work['url']).is_file())

    def test_parallel_processes_keep_both_records(self):
        (module.ROOT / 'sample.html').write_text('<title>样例</title>', encoding='utf-8')
        context = multiprocessing.get_context('spawn')
        gate = context.Barrier(2)
        workers = [context.Process(target=import_in_process, args=(str(module.ROOT), title, gate)) for title in ('作品甲', '作品乙')]
        try:
            for worker in workers:
                worker.start()
            for worker in workers:
                worker.join(timeout=20)
                self.assertEqual(worker.exitcode, 0)
            self.assertEqual({w['title'] for w in module.read_works()}, {'作品甲', '作品乙'})
            self.assertEqual(len(list(module.DEST.glob('work-*'))), 2)
        finally:
            for worker in workers:
                if worker.is_alive():
                    worker.terminate()
                    worker.join()

    def test_zip_alias_and_structure_conflicts_rejected(self):
        for members in [('index.html', 'INDEX.html'), ('assets', 'assets/a.png'), ('Assets/a.png', 'assets/b.png'), ('index.html', 'index.html')]:
            with self.subTest(members=members):
                archive = module.ROOT / 'conflict.zip'
                with zipfile.ZipFile(archive, 'w') as z:
                    for name in members:
                        z.writestr(name, '<title>样例</title>')
                with self.assertRaises(ValueError):
                    module.import_work(archive, None)
                self.assertEqual(module.read_works(), [])
                self.assertEqual(list(module.DEST.iterdir()), [])

    def test_title_respects_declared_encoding(self):
        source = module.ROOT / 'gbk.html'
        source.write_bytes('<meta charset="gbk"><title>学员作品</title>'.encode('gbk'))
        self.assertEqual(module.read_title(source), '学员作品')

    def test_invalid_record_rejected_before_commit(self):
        module.DATA.write_text('window.WORKS = [{"title":"坏记录"}];', encoding='utf-8')
        source = module.ROOT / 'sample.html'
        source.write_text('<title>样例</title>', encoding='utf-8')
        with patch.object(module.simpledialog, 'askstring', side_effect=['样例', '测试学员']), self.assertRaises(ValueError):
            module.import_work(source, None)
        self.assertEqual(list(module.DEST.iterdir()), [])

    def test_repeat_is_explicitly_additive(self):
        source = module.ROOT / 'sample.html'
        source.write_text('<title>样例</title>', encoding='utf-8')
        with patch.object(module.simpledialog, 'askstring', side_effect=['样例', '测试学员'] * 2):
            self.assertTrue(module.import_work(source, None))
            self.assertTrue(module.import_work(source, None))
        works = module.read_works()
        self.assertEqual(len(works), 2)
        self.assertNotEqual(works[0]['url'], works[1]['url'])

if __name__ == '__main__':
    unittest.main()
