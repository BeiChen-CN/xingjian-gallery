/* 展厅冒烟测试：用本机 Edge/Chrome 的 CDP 跑真实 WebGL 页面，不依赖 npm。
   运行：node 检查展厅.cjs
   覆盖：启动、4 个标签、滚轮优先选中指针下的星球、缺少作品数据时的错误提示。 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');

const ROOT = __dirname;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function findBrowser() {
  const candidates = [
    process.env.EDGE_PATH,
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
  ].filter(Boolean);
  return candidates.find(file => fs.existsSync(file)) || null;
}

class CDP {
  constructor(url) {
    this.ws = new WebSocket(url);
    this.nextId = 0;
    this.pending = new Map();
    this.events = [];
  }
  async open() {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP 连接超时')), 15000);
      this.ws.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      this.ws.addEventListener('error', event => { clearTimeout(timer); reject(event.error || new Error('CDP 连接失败')); }, { once: true });
    });
    this.ws.addEventListener('message', event => {
      const message = JSON.parse(String(event.data));
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
      } else if (message.method) this.events.push(message);
    });
    this.ws.addEventListener('close', () => {
      for (const { reject } of this.pending.values()) reject(new Error('CDP 连接已关闭'));
      this.pending.clear();
    });
  }
  send(method, params = {}) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || '页面脚本异常');
    return result.result.value;
  }
  close() { try { this.ws.close(); } catch {} }
}

async function waitFor(check, timeout, label) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await check()) return;
    await sleep(100);
  }
  throw new Error('等待超时：' + label);
}

async function launch() {
  const browser = findBrowser();
  if (!browser) throw new Error('未找到 Edge/Chrome；设置 EDGE_PATH 或 CHROME_PATH 后重试。');
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'gallery-cdp-'));
  const child = spawn(browser, [
    '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--disable-background-networking', '--disable-sync', '--window-size=1440,900',
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    'about:blank'
  ], { stdio: 'ignore' });
  const portFile = path.join(profile, 'DevToolsActivePort');
  await waitFor(() => fs.existsSync(portFile), 15000, '浏览器 DevTools 端口');
  const port = fs.readFileSync(portFile, 'utf8').split(/\r?\n/)[0];
  let page;
  for (let attempt = 0; attempt < 50 && !page; attempt++) {
    try {
      const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      page = list.find(item => item.type === 'page');
    } catch {}
    if (!page) await sleep(100);
  }
  if (!page) throw new Error('未找到浏览器页面');
  return { child, profile, wsUrl: page.webSocketDebuggerUrl };
}

async function main() {
  let launched;
  const cleanup = [];
  try {
    launched = await launch();
    cleanup.push(() => fs.rmSync(launched.profile, { recursive: true, force: true }), () => { try { launched.child.kill(); } catch {} });
    const cdp = new CDP(launched.wsUrl);
    cleanup.push(() => cdp.close());
    await cdp.open();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Log.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

    const galleryUrl = pathToFileURL(path.join(ROOT, '学员AI作品展.html')).href;
    await cdp.send('Page.navigate', { url: galleryUrl });
    await waitFor(async () => {
      try { return await cdp.evaluate(`document.body.classList.contains('scene-ready')`); } catch { return false; }
    }, 30000, '展厅启动');
    const labels = await cdp.evaluate(`[...document.querySelectorAll('.label strong')].map(node => node.textContent)`);
    if (labels.length !== 4) throw new Error('标签数量应为 4，实际 ' + labels.length);
    console.log('启动与标签：通过 (' + labels.join(' / ') + ')');

    const pickPoint = async name => cdp.evaluate(`(() => {
      const canvas = document.querySelector('#scene canvas');
      const label = [...document.querySelectorAll('.label')].find(node => node.querySelector('strong').textContent === ${JSON.stringify(name)});
      if (!label) return null;
      const rect = label.getBoundingClientRect(), x = Math.round(rect.left + rect.width / 2), top = Math.round(rect.top);
      canvas.style.cursor = 'grab';
      for (let y = top - 2; y > top - 240; y -= 2) {
        canvas.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, pointerType: 'mouse', bubbles: true }));
        if (canvas.style.cursor === 'pointer') return { x, y };
      }
      return null;
    })()`);
    const wheel = (point, delta) => cdp.evaluate(`(() => {
      const canvas = document.querySelector('#scene canvas');
      canvas.dispatchEvent(new WheelEvent('wheel', { deltaY: ${delta}, clientX: ${point.x}, clientY: ${point.y}, deltaMode: 0, bubbles: true, cancelable: true }));
      return true;
    })()`);

    const first = await pickPoint(labels[0]);
    if (!first) throw new Error('未找到第一颗星球的屏幕位置');
    await wheel(first, -120);
    await waitFor(async () => {
      const state = await cdp.evaluate(`({ text: document.querySelector('#focus strong').textContent, selected: document.getElementById('focus').classList.contains('selected') })`);
      return state.text.startsWith(labels[0]) && state.selected;
    }, 4000, '选中第一颗星球');
    const second = await pickPoint(labels[1]);
    if (!second) throw new Error('未找到第二颗星球的屏幕位置');
    const preview = await cdp.evaluate(`({ text: document.querySelector('#focus strong').textContent, selected: document.getElementById('focus').classList.contains('selected') })`);
    if (!preview.text.startsWith(labels[1]) || preview.selected) throw new Error('选中后悬停没有切换下方信息条');
    await wheel(second, -120);
    await waitFor(async () => {
      const state = await cdp.evaluate(`(() => {
        const focus = document.getElementById('focus');
        return { text: focus.querySelector('strong').textContent, selected: focus.classList.contains('selected'), detail: focus.querySelector('.focus-detail').textContent };
      })()`);
      return state.text.startsWith(labels[1]) && state.selected;
    }, 5000, '滚轮切换到指针下的星球');
    await waitFor(async () => cdp.evaluate(`(() => {
      const label = [...document.querySelectorAll('.label')].find(node => node.querySelector('strong').textContent === ${JSON.stringify(labels[1])});
      return label.style.visibility === 'hidden';
    })()`), 2500, '选中星球的场景标签隐藏');
    console.log('滚轮选中指针下的星球：通过');

    const broken = fs.mkdtempSync(path.join(os.tmpdir(), 'gallery-broken-'));
    cleanup.push(() => fs.rmSync(broken, { recursive: true, force: true }));
    for (const file of ['学员AI作品展.html', 'three.min.js', '宇宙展厅.js']) fs.copyFileSync(path.join(ROOT, file), path.join(broken, file));
    await cdp.send('Page.navigate', { url: pathToFileURL(path.join(broken, '学员AI作品展.html')).href });
    await waitFor(async () => {
      try { return await cdp.evaluate(`getComputedStyle(document.getElementById('error')).display === 'block'`); } catch { return false; }
    }, 8000, '缺少作品数据时的错误提示');
    const errorText = await cdp.evaluate(`document.getElementById('error').textContent`);
    if (!errorText.includes('作品数据未加载')) throw new Error('错误提示未说明作品数据缺失：' + errorText);
    console.log('缺少作品数据提示：通过');

    const noLib = fs.mkdtempSync(path.join(os.tmpdir(), 'gallery-nolib-'));
    cleanup.push(() => fs.rmSync(noLib, { recursive: true, force: true }));
    for (const file of ['学员AI作品展.html', '作品数据.js', '宇宙展厅.js']) fs.copyFileSync(path.join(ROOT, file), path.join(noLib, file));
    await cdp.send('Page.navigate', { url: pathToFileURL(path.join(noLib, '学员AI作品展.html')).href });
    await waitFor(async () => {
      try { return await cdp.evaluate(`getComputedStyle(document.getElementById('error')).display === 'block'`); } catch { return false; }
    }, 8000, '缺少三维库时的错误提示');
    const libError = await cdp.evaluate(`document.getElementById('error').textContent`);
    if (!libError.includes('三维库未加载')) throw new Error('错误提示未说明三维库缺失：' + libError);
    console.log('缺少三维库提示：通过');

    const pageErrors = cdp.events.filter(event => event.method === 'Runtime.exceptionThrown');
    if (pageErrors.length) throw new Error('页面出现未捕获异常：' + pageErrors.map(event => event.params.exceptionDetails.text).join('; '));
    console.log('检查展厅：全部通过');
  } finally {
    for (const fn of cleanup.reverse()) { try { fn(); } catch {} }
  }
}

main().catch(error => { console.error('检查展厅失败：' + error.message); process.exitCode = 1; });
