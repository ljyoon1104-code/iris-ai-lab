import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { ERROR_RECORD_FIELD_MAP, getOriginalGroundTruth } from '../../src/utils/irisHelpers';

const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
class Browser {
  socket!: WebSocket;
  serial = 0;
  pending = new Map<number, { resolve: (v: any) => void; reject: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  errors: string[] = [];
  async connect(url: string) {
    this.socket = new WebSocket(url);
    await new Promise<void>((resolve, reject) => {
      this.socket.onopen = () => resolve();
      this.socket.onerror = () => reject(new Error('Browser connection failed'));
    });
    this.socket.onmessage = event => {
      const message = JSON.parse(String(event.data));
      if (message.method === 'Runtime.exceptionThrown') this.errors.push(JSON.stringify(message.params.exceptionDetails));
      const pending = this.pending.get(message.id);
      if (!pending) return;
      clearTimeout(pending.timer); this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
      else pending.resolve(message.result);
    };
  }
  send(method: string, params: object = {}): Promise<any> {
    const id = ++this.serial;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 15000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }
  async evaluate(expression: string) {
    const result = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert.ok(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  }
  async until(expression: string) {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (await this.evaluate(expression)) return;
      await pause(100);
    }
    throw new Error(`UI did not reach expected state: ${expression}`);
  }
  async click(text: string, exact = true) {
    assert.equal(await this.evaluate(`(() => {
      const button = [...document.querySelectorAll('button')].find(b => ${exact ? 'b.textContent.trim() ===' : 'b.textContent.includes('} ${JSON.stringify(text)}${exact ? '' : ')'});
      if (!button || button.disabled) return false;
      button.click(); return true;
    })()`), true, `Missing or disabled button: ${text}`);
    await pause(80);
  }
}

export async function runBrowserRegression(viewports: Array<number | { width: number; height: number }> = [390, 1280]) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  const dist = path.join(root, 'dist');
  assert.ok(fs.existsSync(path.join(dist, 'index.html')), 'Run npm run build first');
  const executable = process.env.IRIS_BROWSER_PATH || [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ].find(candidate => fs.existsSync(candidate));
  assert.ok(executable, 'Set IRIS_BROWSER_PATH to a Chromium browser executable');
  const server = http.createServer((request, response) => {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname;
    const relative = decodeURIComponent(pathname).replace(/^\/iris-ai-lab\/?/, '').replace(/^\/+/, '') || 'index.html';
    const target = path.resolve(dist, relative);
    if (!target.startsWith(dist + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) {
      response.writeHead(404); response.end('Not found'); return;
    }
    const mime: Record<string,string> = { '.html':'text/html; charset=utf-8', '.js':'application/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.csv':'text/csv' };
    response.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream' });
    fs.createReadStream(target).pipe(response);
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/iris-ai-lab/`;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'iris-qa-'));
  const child = spawn(executable, ['--headless=new','--remote-debugging-port=0',`--user-data-dir=${profile}`,'--no-first-run','--disable-background-networking', base], { windowsHide:true, stdio:'ignore' });
  let launchError: Error | undefined;
  child.on('error', error => { launchError = error; });
  const browser = new Browser();
  try {
    const portFile = path.join(profile, 'DevToolsActivePort');
    for (let i=0; i<100 && !fs.existsSync(portFile); i++) { if (launchError) throw launchError; await pause(100); }
    assert.ok(fs.existsSync(portFile), 'Browser did not start');
    const debugPort = fs.readFileSync(portFile,'utf8').split(/\r?\n/)[0];
    const targets = await fetch(`http://127.0.0.1:${debugPort}/json/list`).then(r=>r.json()) as any[];
    const target = targets.find(t=>t.type==='page' && t.url.startsWith(base));
    assert.ok(target, 'Isolated test page not found');
    await browser.connect(target.webSocketDebuggerUrl);
    await browser.send('Runtime.enable'); await browser.send('Page.enable');
    await browser.until(`document.querySelector('#root')?.textContent.includes('Iris AI Lab')`);
    let navigation = 0;
    const load = async (module: number, seed: Record<string,string> = {}) => {
      await browser.evaluate(`localStorage.clear(); Object.entries(${JSON.stringify(seed)}).forEach(([k,v])=>localStorage.setItem(k,v));`);
      await browser.send('Page.navigate', { url: `${base}?qa=${++navigation}#module-${module}` });
      await browser.until(`document.querySelector('h1')?.textContent === ${JSON.stringify(['','AI 활용법','기계학습 시작','데이터 준비','데이터 전처리','학습 방법 알아보기','알고리즘 실험실','모델 만들기','모델 평가·개선'][module])}`);
    };
    const steps = [6,5,7,9,7,6,5,5];
    for (const viewport of viewports) {
      const {width,height} = typeof viewport === 'number' ? {width:viewport,height:900} : viewport;
      await browser.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor:1, mobile:width<768 });
      for (let module=1; module<=8; module++) {
        await load(module);
        for(let step=1; step<steps[module-1]; step++) {
          await browser.click('다음 활동');
          assert.ok(await browser.evaluate(`document.querySelector('#root').textContent.length > 100`), `Blank page: ${module}/${step}`);
          assert.ok(await browser.evaluate('document.documentElement.scrollWidth <= window.innerWidth + 1'), `Overflow: ${width}/${module}/${step}`);
        }
        assert.equal(await browser.evaluate(`!![...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='다음 활동')`), false, `Wrong step count: module ${module}`);
        if(module<8) {
          await browser.click('다음 영역');
          await browser.until(`location.hash === '#module-${module+1}'`);
        }
      }
      console.log(`PASS: ${width}px, all 8 modules navigated without activity input`);
    }
    await load(6);
    await browser.click('k-means',false);
    await browser.click('자동 초기 중심점');
    await browser.click('K = 4개');
    assert.ok(await browser.evaluate(`document.body.textContent.includes('시뮬레이션 진행 단계')`), 'Automatic k-means result disappeared after K change');
    await browser.evaluate(`(() => { const s=document.querySelectorAll('main select')[0]; s.value='sepalLength'; s.dispatchEvent(new Event('change',{bubbles:true})); })()`);
    await pause(100);
    assert.ok(await browser.evaluate(`document.body.textContent.includes('시뮬레이션 진행 단계')`), 'Automatic k-means result disappeared after axis change');
    await browser.click('내가 중심점 직접 찍기');
    assert.ok(await browser.evaluate(`document.body.textContent.includes('현재 선택: 0 / 4개')`), 'Manual mode did not reset');
    console.log('PASS: automatic k-means K/axis changes and manual reset');

    await load(6);
    await browser.click('선형 회귀',false);
    const before = await browser.evaluate(`document.body.innerText.match(/현재 직선의 R²: [-0-9.]+/)?.[0]`);
    await browser.click('수동 기울기 조정',false);
    const after = await browser.evaluate(`document.body.innerText.match(/현재 직선의 R²: [-0-9.]+/)?.[0]`);
    assert.ok(before && after); assert.notEqual(before,after,'Manual R² did not change');
    console.log('PASS: manual regression updates R²');

    const edits = Object.entries(ERROR_RECORD_FIELD_MAP).map(([id,field])=>({recordId:Number(id),field,after:getOriginalGroundTruth(Number(id),field)}));
    for (const module of [6,7,8]) {
      await load(module, {'iris_ai_lab_module04_edits':JSON.stringify(edits), 'unrelated_progress':'keep'});
      assert.ok(await browser.evaluate(`document.body.innerText.includes('12 / 12')`), `Missing prepared fixture: ${module}`);
      assert.ok(await browser.evaluate(`(() => {const b=document.querySelector('button[aria-label*="초기화"]'); if(!b)return false;b.click();return true;})()`));
      await pause(80);
      await browser.click('모두 초기화',false);
      await browser.until(`!document.body.innerText.includes('12 / 12')`);
      assert.equal(await browser.evaluate(`localStorage.getItem('unrelated_progress')`),'keep');
      assert.equal(await browser.evaluate(`localStorage.getItem('iris_ai_lab_module04_edits')`),null);
    }
    console.log('PASS: resetting mounted modules 06/07/08 refreshes data and preserves unrelated storage');
    assert.deepEqual(browser.errors, [], 'Uncaught browser exceptions');
    console.log('ALL BROWSER REGRESSION CHECKS PASSED');
  } finally {
    browser.socket?.close();
    child.kill();
    await new Promise<void>(resolve => server.close(()=>resolve()));
    // Only remove this test's unique profile, never the user's browser profile.
    if (path.dirname(profile) === os.tmpdir() && path.basename(profile).startsWith('iris-qa-')) {
      for(let i=0;i<20;i++) {
        try { fs.rmSync(profile,{recursive:true,force:true}); break; } catch { await pause(100); }
      }
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runBrowserRegression().catch(error=>{console.error(error);process.exitCode=1;});
}
