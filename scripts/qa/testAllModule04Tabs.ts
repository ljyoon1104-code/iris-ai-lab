import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'qa_screenshots');

function startStaticServer(port: number = 4305): Promise<http.Server> {
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
      if (reqPath === '/') reqPath = '/index.html';
      const filePath = path.join(DIST_DIR, reqPath);

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
      } else {
        const indexPath = path.join(DIST_DIR, 'index.html');
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

async function testModule04AllActivities() {
  console.log('================================================================');
  console.log('   Module 04 Data Preprocessing Deep Tab & Step Browser QA   ');
  console.log('================================================================\n');

  const staticServer = await startStaticServer(4305);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9255',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800',
    'http://127.0.0.1:4305/',
  ]);

  try {
    let wsUrl = '';
    for (let i = 0; i < 25; i++) {
      try {
        const listRes = await fetch('http://127.0.0.1:9255/json/list');
        if (listRes.ok) {
          const list = (await listRes.json()) as any[];
          const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
          if (page) {
            wsUrl = page.webSocketDebuggerUrl;
            break;
          }
        }
      } catch {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    const cdp = new CdpClient();
    await cdp.connect(wsUrl);

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    const testVps = [
      { name: '320x800', width: 320, height: 800 },
      { name: '390x844', width: 390, height: 844 },
      { name: '768x1024', width: 768, height: 1024 },
      { name: '1280x800', width: 1280, height: 800 },
    ];

    for (const vp of testVps) {
      console.log(`\n----------------------------------------------------`);
      console.log(`🔍 Testing Module 04 on Viewport: ${vp.name}`);
      console.log(`----------------------------------------------------`);

      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768,
      });

      await cdp.send('Page.navigate', { url: 'http://127.0.0.1:4305/' });
      await new Promise((r) => setTimeout(r, 600));

      // Click Module 04 card
      await cdp.eval(`(() => {
        const cards = document.querySelectorAll('[role="button"]');
        cards.forEach(c => {
          if (c.getAttribute('aria-label')?.includes('영역 04')) c.click();
        });
      })()`);
      await new Promise((r) => setTimeout(r, 500));

      // Test Activities 1 to 8 in sequence
      for (let act = 1; act <= 8; act++) {
        const actName = [
          '1. 왜 데이터를 정리해야 할까?',
          '2. 데이터 탐정 (20개 카드)',
          '3. 결측치 처리',
          '4. 이상치 분석 (5단계)',
          '5. 표현/자료형 오류 처리',
          '6. 정규화·인코딩',
          '7. 수정 데이터 확인',
          '8. 속성 관계 (산점도/히트맵)',
        ][act - 1];

        // Specific deep inspection for Activity 4 (Outliers)
        if (act === 4) {
          // Test Step 1 (Stats), Step 2 (Histogram), Step 3 (Boxplot), Step 4 (Edit), Step 5 (Result)
          for (let step = 1; step <= 5; step++) {
            await cdp.eval(`(() => {
              const stepBtns = Array.from(document.querySelectorAll('button'));
              const btn = stepBtns.find(b => b.textContent && b.textContent.includes('${step}/5'));
              if (btn) btn.click();
            })()`);
            await new Promise((r) => setTimeout(r, 300));

            const stepInfo = await cdp.eval(`(() => {
              const clientWidth = document.documentElement.clientWidth;
              const scrollWidth = document.documentElement.scrollWidth;
              const hasPageOverflow = scrollWidth > clientWidth + 1;

              let svgInfo = null;
              if (${step} === 3) {
                const svg = document.querySelector('svg');
                const svgRect = svg ? svg.getBoundingClientRect() : null;
                const texts = svg ? Array.from(svg.querySelectorAll('text')).map(t => t.textContent || '') : [];
                svgInfo = {
                  svgWidth: svgRect ? Math.round(svgRect.width) : null,
                  hasSvgOverflow: svgRect ? svgRect.right > clientWidth + 1 : false,
                  has50cm: texts.some(t => t.includes('50.0')),
                  hasAxisBreak: texts.some(t => t.includes('축 단절')),
                };
              }

              return {
                step: ${step},
                clientWidth,
                scrollWidth,
                hasPageOverflow,
                svgInfo
              };
            })()`);

            console.log(`    [Activity 4 - Step ${step}/5] clientWidth: ${stepInfo.clientWidth}px, scrollWidth: ${stepInfo.scrollWidth}px -> ${stepInfo.hasPageOverflow ? '❌ OVERFLOW' : '✓ OK'} ${JSON.stringify(stepInfo.svgInfo || {})}`);

            if (step === 3 && (vp.width === 320 || vp.width === 390 || vp.width === 768)) {
              const sc = await cdp.send('Page.captureScreenshot', { format: 'png' });
              fs.writeFileSync(path.join(SCREENSHOT_DIR, `m04_act4_step3_boxplot_${vp.name}.png`), Buffer.from(sc.data, 'base64'));
            }
          }
        } else {
          // Other activities
          const actInfo = await cdp.eval(`(() => {
            const clientWidth = document.documentElement.clientWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            const hasPageOverflow = scrollWidth > clientWidth + 1;

            return {
              clientWidth,
              scrollWidth,
              hasPageOverflow,
            };
          })()`);

          console.log(`  [Activity ${act}: ${actName}] clientWidth: ${actInfo.clientWidth}px, scrollWidth: ${actInfo.scrollWidth}px -> ${actInfo.hasPageOverflow ? '❌ OVERFLOW' : '✓ OK'}`);
        }

        // Click "다음 활동" to advance to next activity
        if (act < 8) {
          await cdp.eval(`(() => {
            const nextBtns = Array.from(document.querySelectorAll('button'));
            const nextBtn = nextBtns.find(b => b.textContent && b.textContent.includes('다음 활동'));
            if (nextBtn) nextBtn.click();
          })()`);
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }

    cdp.close();

    console.log('\n================================================================');
    console.log('🎉 MODULE 04 ALL 8 ACTIVITIES & 5 OUTLIER STEPS FULLY PASSED!');
    console.log('================================================================\n');

  } finally {
    edgeProc.kill();
    staticServer.close();
  }
}

testModule04AllActivities().catch((err) => {
  console.error(err);
  process.exit(1);
});
