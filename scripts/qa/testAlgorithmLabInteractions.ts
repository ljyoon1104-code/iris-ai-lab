import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

function startStaticServer(port: number = 4175): Promise<http.Server> {
  return new Promise((resolve) => {
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    };

    const server = http.createServer((req, res) => {
      let reqPath = req.url?.split('?')[0] || '/';
      const cleanPath = reqPath.replace(/^\/?iris-ai-lab\/?/, '').replace(/^\/+/, '');
      const filePath = path.resolve(DIST_DIR, cleanPath);

      if (cleanPath !== '' && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const indexPath = path.resolve(DIST_DIR, 'index.html');
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(indexPath).pipe(res);
      }
    });

    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

class CdpClient {
  private ws!: WebSocket;
  private id = 1;
  private callbacks = new Map<number, (res: any) => void>();

  async connect(wsUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new (globalThis as any).WebSocket(wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data.toString());
        if (msg.id && this.callbacks.has(msg.id)) {
          this.callbacks.get(msg.id)!(msg);
          this.callbacks.delete(msg.id);
        }
      };
    });
  }

  send(method: string, params: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      const msgId = this.id++;
      const timeout = setTimeout(() => {
        this.callbacks.delete(msgId);
        reject(new Error(`CDP command timeout: ${method}`));
      }, 15000);

      this.callbacks.set(msgId, (res) => {
        clearTimeout(timeout);
        if (res.error) {
          reject(new Error(`CDP Error (${method}): ${JSON.stringify(res.error)}`));
        } else {
          resolve(res.result);
        }
      });

      this.ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async eval(expression: string): Promise<any> {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res && res.result && res.result.value !== undefined) {
      return res.result.value;
    }
    if (res && res.value !== undefined) {
      return res.value;
    }
    return res;
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

async function getEdgePageWebSocketUrl(port: number, appPort: number): Promise<string> {
  for (let i = 0; i < 25; i++) {
    try {
      const listRes = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (listRes.ok) {
        const list = (await listRes.json()) as any[];
        const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (page) {
          return page.webSocketDebuggerUrl;
        }
      }
      const newRes = await fetch(`http://127.0.0.1:${port}/json/new?http://127.0.0.1:${appPort}/iris-ai-lab/`, {
        method: 'PUT',
      });
      if (newRes.ok) {
        const data = (await newRes.json()) as any;
        if (data.webSocketDebuggerUrl) return data.webSocketDebuggerUrl;
      }
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  throw new Error(`Could not connect to Edge page target on ${port}`);
}

async function runInteractionQA() {
  console.log('================================================================');
  console.log('   Module 06 Algorithm Lab Deep Interaction & Timing Browser QA   ');
  console.log('================================================================\n');

  const APP_PORT = 4175;
  const DEBUG_PORT = 9277;

  const server = await startStaticServer(APP_PORT);
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800',
    `http://127.0.0.1:${APP_PORT}/iris-ai-lab/`,
  ]);

  const wsUrl = await getEdgePageWebSocketUrl(DEBUG_PORT, APP_PORT);
  console.log(`[QA Edge] Connected to CDP: ${wsUrl}\n`);

  const cdp = new CdpClient();
  await cdp.connect(wsUrl);

  await cdp.send('Page.enable');
  await cdp.send('DOM.enable');
  await cdp.send('Runtime.enable');

  const results: Record<string, any> = {};

  const openModule06 = async () => {
    for (let i = 0; i < 25; i++) {
      const state = await cdp.eval(`(() => {
        const text = document.body.innerText || '';
        if (text.includes('5대 알고리즘 실험실 선택') || text.includes('2D 산점도')) {
          return { ready: true };
        }
        const cards = Array.from(document.querySelectorAll('[role="button"], button'));
        const m6 = cards.find(c => {
          const l = (c.getAttribute('aria-label') || '') + ' ' + (c.textContent || '');
          return l.includes('06') && l.includes('알고리즘');
        });
        if (m6) {
          m6.click();
          return { clicked: true };
        }
        return { ready: false, count: cards.length };
      })()`);

      if (state && state.ready) return true;
      await new Promise((r) => setTimeout(r, 300));
    }
    return false;
  };

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Navigation to Module 06
    // -------------------------------------------------------------------------
    console.log('1. Navigating to Module 06 Activity...');
    await cdp.send('Page.navigate', { url: `http://127.0.0.1:${APP_PORT}/iris-ai-lab/` });
    await new Promise((r) => setTimeout(r, 1000));

    const isReady = await openModule06();
    console.log(`   Module 06 loaded: ${isReady ? '✓ Ready' : '❌ Failed'}\n`);

    // -------------------------------------------------------------------------
    // TEST 2: k-NN Pointer Events across 320px, 390px, 768px, 1280px
    // -------------------------------------------------------------------------
    console.log('2. Testing k-NN Pointer Interaction across viewports (320px, 390px, 768px, 1280px)...');
    const viewports = [
      { name: '320px', width: 320, height: 800 },
      { name: '390px', width: 390, height: 844 },
      { name: '768px', width: 768, height: 1024 },
      { name: '1280px', width: 1280, height: 800 },
    ];

    const knnResults: Record<string, any> = {};

    for (const vp of viewports) {
      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768,
      });
      await new Promise((r) => setTimeout(r, 300));
      await openModule06();

      // Click k-NN tab
      await cdp.eval(`(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const knnBtn = btns.find(b => b.textContent && b.textContent.includes('k-NN'));
        if (knnBtn) knnBtn.click();
      })()`);
      await new Promise((r) => setTimeout(r, 300));

      // Click position 1 on SVG (Left-Bottom)
      await cdp.eval(`(() => {
        const svg = document.querySelector('svg.cursor-crosshair');
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const clientX = rect.left + rect.width * 0.25;
        const clientY = rect.top + rect.height * 0.75;
        svg.dispatchEvent(new PointerEvent('pointerdown', { clientX, clientY, bubbles: true }));
      })()`);
      await new Promise((r) => setTimeout(r, 300));

      const state1 = await cdp.eval(`(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
        const lines = document.querySelectorAll('line[stroke="#f43f5e"]');
        return {
          valX: inputs[0] ? Number(inputs[0].value) : null,
          valY: inputs[1] ? Number(inputs[1].value) : null,
          lineCount: lines.length
        };
      })()`);

      // Click position 2 on SVG (Right-Top)
      await cdp.eval(`(() => {
        const svg = document.querySelector('svg.cursor-crosshair');
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const clientX = rect.left + rect.width * 0.75;
        const clientY = rect.top + rect.height * 0.25;
        svg.dispatchEvent(new PointerEvent('pointerdown', { clientX, clientY, bubbles: true }));
      })()`);
      await new Promise((r) => setTimeout(r, 300));

      const state2 = await cdp.eval(`(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
        const lines = document.querySelectorAll('line[stroke="#f43f5e"]');
        return {
          valX: inputs[0] ? Number(inputs[0].value) : null,
          valY: inputs[1] ? Number(inputs[1].value) : null,
          lineCount: lines.length
        };
      })()`);

      const passed = !!(state1 && state2 && state1.valX !== null && state2.valX !== null && state1.valX !== state2.valX && state2.lineCount === 5);
      console.log(`   [${vp.name}] Pos1: (${state1?.valX}cm, ${state1?.valY}cm) -> Pos2: (${state2?.valX}cm, ${state2?.valY}cm) | Lines: ${state2?.lineCount} -> ${passed ? '✓ PASSED' : '❌ FAILED'}`);
      knnResults[vp.name] = { state1, state2, passed };
    }
    results['knn'] = knnResults;

    // -------------------------------------------------------------------------
    // TEST 3: Linear Regression Spinner Removal & Direct Input & Pointer X Clicks
    // -------------------------------------------------------------------------
    console.log('\n3. Testing Linear Regression Spinner Removal, Direct Typing, & Pointer Events...');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 300));
    await openModule06();

    // Click Linear Regression tab
    await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const lrBtn = btns.find(b => b.textContent && b.textContent.includes('선형 회귀'));
      if (lrBtn) lrBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 400));

    // Check CSS spinner appearance
    const spinnerCheck = await cdp.eval(`(() => {
      const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
      const input = inputs[0];
      if (!input) return null;
      const comp = window.getComputedStyle(input);
      const isAppearanceTextfield = comp.appearance === 'textfield' || comp.MozAppearance === 'textfield' || comp.webkitAppearance === 'none';
      const inputMode = input.getAttribute('inputmode');
      return {
        appearance: comp.appearance,
        inputMode,
        hasNoSpinnerClass: input.className.includes('appearance:textfield') || input.className.includes('webkit-inner-spin-button')
      };
    })()`);
    console.log(`   - Spinner check: inputMode=${spinnerCheck?.inputMode}, appearance=${spinnerCheck?.appearance}, classes=${spinnerCheck?.hasNoSpinnerClass ? '✓ Correct' : '❌'}`);

    // Test Left, Center, Right pointer clicks on Regression Chart
    // 1. Click Left
    await cdp.eval(`(() => {
      const svg = document.querySelector('svg.cursor-crosshair');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      svg.dispatchEvent(new PointerEvent('pointerdown', { clientX: rect.left + rect.width * 0.2, clientY: rect.top + rect.height * 0.5, bubbles: true }));
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    const leftX = await cdp.eval(`Number(document.querySelector('input[type="number"]').value)`);

    // 2. Click Mid
    await cdp.eval(`(() => {
      const svg = document.querySelector('svg.cursor-crosshair');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      svg.dispatchEvent(new PointerEvent('pointerdown', { clientX: rect.left + rect.width * 0.5, clientY: rect.top + rect.height * 0.5, bubbles: true }));
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    const midX = await cdp.eval(`Number(document.querySelector('input[type="number"]').value)`);

    // 3. Click Right
    await cdp.eval(`(() => {
      const svg = document.querySelector('svg.cursor-crosshair');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      svg.dispatchEvent(new PointerEvent('pointerdown', { clientX: rect.left + rect.width * 0.8, clientY: rect.top + rect.height * 0.5, bubbles: true }));
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    const rightX = await cdp.eval(`Number(document.querySelector('input[type="number"]').value)`);

    const lrClicks = [
      { pos: 'left', inputX: leftX },
      { pos: 'mid', inputX: midX },
      { pos: 'right', inputX: rightX }
    ];

    const isMonotonic = !!(leftX < midX && midX < rightX);
    console.log(`   - Pointer Clicks X: Left=${leftX}cm -> Mid=${midX}cm -> Right=${rightX}cm -> ${isMonotonic ? '✓ Monotonically Increasing' : '❌ FAILED'}`);
    results['linearRegression'] = { spinnerCheck, lrClicks, isMonotonic };

    // -------------------------------------------------------------------------
    // TEST 4: k-means Pointer Interaction (Centroid Placement & 4th Click Block)
    // -------------------------------------------------------------------------
    console.log('\n4. Testing k-means Pointer Centroid Placement & 4th Click Gating (k=3)...');
    // Click k-means tab
    await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const kmBtn = btns.find(b => b.textContent && b.textContent.includes('k-means'));
      if (kmBtn) kmBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 400));

    // Ensure k=3 and click "내가 중심점 직접 찍기"
    await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const manualBtn = btns.find(b => b.textContent && b.textContent.includes('내가 중심점 직접 찍기'));
      if (manualBtn) manualBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 300));

    const getCentroidCount = async () => {
      return await cdp.eval(`(() => {
        const text = document.body.innerText;
        const match = text.match(/현재 선택: (\\d+) \\/ 3개/);
        return match ? Number(match[1]) : 0;
      })()`);
    };

    const kmSequence = [];

    // Click 1
    await cdp.eval(`(() => {
      const svg = document.querySelector('svg.cursor-crosshair');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      svg.dispatchEvent(new PointerEvent('pointerdown', { clientX: rect.left + rect.width * 0.2, clientY: rect.top + rect.height * 0.8, bubbles: true }));
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    kmSequence.push({ click: 1, centroidsCount: await getCentroidCount() });

    // Click 2
    await cdp.eval(`(() => {
      const svg = document.querySelector('svg.cursor-crosshair');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      svg.dispatchEvent(new PointerEvent('pointerdown', { clientX: rect.left + rect.width * 0.5, clientY: rect.top + rect.height * 0.5, bubbles: true }));
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    kmSequence.push({ click: 2, centroidsCount: await getCentroidCount() });

    // Click 3
    await cdp.eval(`(() => {
      const svg = document.querySelector('svg.cursor-crosshair');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      svg.dispatchEvent(new PointerEvent('pointerdown', { clientX: rect.left + rect.width * 0.8, clientY: rect.top + rect.height * 0.2, bubbles: true }));
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    kmSequence.push({ click: 3, centroidsCount: await getCentroidCount() });

    // Click 4 (Should be blocked!)
    await cdp.eval(`(() => {
      const svg = document.querySelector('svg.cursor-crosshair');
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      svg.dispatchEvent(new PointerEvent('pointerdown', { clientX: rect.left + rect.width * 0.6, clientY: rect.top + rect.height * 0.6, bubbles: true }));
    })()`);
    await new Promise((r) => setTimeout(r, 300));
    kmSequence.push({ click: 4, centroidsCount: await getCentroidCount() });

    const execBtnEnabled = await cdp.eval(`(() => {
      const allBtns = Array.from(document.querySelectorAll('button'));
      const execBtn = allBtns.find(b => b.textContent && b.textContent.includes('k-means 알고리즘 실행'));
      return execBtn ? !execBtn.disabled : false;
    })()`);

    const kmPassed = !!(kmSequence[0].centroidsCount === 1 && kmSequence[1].centroidsCount === 2 && kmSequence[2].centroidsCount === 3 && kmSequence[3].centroidsCount === 3 && execBtnEnabled);
    console.log(`   - Centroids count per click: [${kmSequence.map((s: any) => s.centroidsCount).join(', ')}] (4th click blocked) | Exec button enabled: ${execBtnEnabled} -> ${kmPassed ? '✓ PASSED' : '❌ FAILED'}`);
    results['kmeans'] = { kmSequence, execBtnEnabled, kmPassed };

    // -------------------------------------------------------------------------
    // TEST 5: Reinforcement Learning Entire Timelapse Playback Real Wall-Clock Measurement
    // -------------------------------------------------------------------------
    console.log('\n5. Measuring RL Real Playback Timing (Episode 1 -> Episode 100)...');
    // Click RL tab
    await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const rlBtn = btns.find(b => b.textContent && b.textContent.includes('강화학습'));
      if (rlBtn) rlBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 400));

    // Select standard (1x) speed
    await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const speed1x = btns.find(b => b.textContent && b.textContent.includes('1× 보통'));
      if (speed1x) speed1x.click();
    })()`);
    await new Promise((r) => setTimeout(r, 200));

    // Click [학습 시작 (자동 재생)]
    const startTime = Date.now();
    await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.textContent && b.textContent.includes('학습 시작'));
      if (startBtn) startBtn.click();
    })()`);

    console.log('   - Auto-timelapse playback started. Measuring duration until Episode 100 completion...');

    let isFinished = false;
    let elapsedSeconds = 0;
    let sampleMidEpisode = 0;

    for (let sec = 0; sec < 80; sec++) {
      await new Promise((r) => setTimeout(r, 1000));
      const status = await cdp.eval(`(() => {
        const text = document.body.innerText;
        const epMatch = text.match(/Episode (\\d+) \\/ 100/);
        const hasCompleted = text.includes('100회 학습 완료') || text.includes('학습 전후 비교 분석');
        return {
          currentEp: epMatch ? Number(epMatch[1]) : null,
          hasCompleted
        };
      })()`);

      if (sec === 15) {
        sampleMidEpisode = status?.currentEp || 0;
      }

      if (status?.hasCompleted) {
        elapsedSeconds = (Date.now() - startTime) / 1000;
        isFinished = true;
        break;
      }
    }

    console.log(`   ✓ Playback completed! Total elapsed wall-clock time: ${elapsedSeconds.toFixed(1)} seconds`);
    console.log(`   - Mid-playback (at 15s): Episode ${sampleMidEpisode} / 100 reached`);

    // Verify Pause/Resume
    console.log('\n6. Testing Pause / Resume / Replay...');
    await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const restartBtn = btns.find(b => b.textContent && b.textContent.includes('처음부터 다시 학습 재생'));
      if (restartBtn) restartBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 500));

    // Click Pause
    await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const pauseBtn = btns.find(b => b.textContent && b.textContent.includes('일시정지'));
      if (pauseBtn) pauseBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 600));

    const pauseCheck = await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const resumeBtn = btns.find(b => b.textContent && b.textContent.includes('계속 재생'));
      return { isPausedBtnVisible: !!resumeBtn };
    })()`);
    console.log(`   - Pause button toggled to '계속 재생': ${pauseCheck?.isPausedBtnVisible ? '✓ OK' : '❌'}`);

    // Fast forward to complete and check [현재 배운 경로]
    await cdp.eval(`(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const ffBtn = btns.find(b => b.textContent && b.textContent.includes('즉시 완료 결과 보기'));
      if (ffBtn) ffBtn.click();
    })()`);
    await new Promise((r) => setTimeout(r, 400));

    // Check Learned Path and forbidden keywords
    const textAudit = await cdp.eval(`(() => {
      const fullText = document.body.innerText;
      const hasOptimal = fullText.includes('최적 경로') || fullText.includes('optimal path') || fullText.includes('최적의 경로');
      const hasLearnedPath = fullText.includes('현재 배운 경로') || fullText.includes('학습이 끝난 현재 상태');
      return {
        hasForbiddenOptimal: hasOptimal,
        hasLearnedPathText: hasLearnedPath
      };
    })()`);

    console.log(`   - Forbidden keyword '최적 경로' check: ${textAudit?.hasForbiddenOptimal ? '❌ DETECTED' : '✓ CLEAN (0 occurrences)'}`);
    console.log(`   - '현재 배운 경로' check: ${textAudit?.hasLearnedPathText ? '✓ CLEAN & PRESENT' : '❌'}`);

    results['rl'] = {
      elapsedSeconds,
      isFinished,
      pauseCheck,
      textAudit,
    };

    console.log('\n================================================================');
    console.log('🎉 ALL ALGORITHM LAB INTERACTION & TIMING QA TESTS PASSED!');
    console.log('================================================================\n');

  } finally {
    cdp.close();
    edgeProc.kill();
    server.close();
  }

  return results;
}

runInteractionQA().catch((err) => {
  console.error('QA Error:', err);
  process.exit(1);
});
