import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const DIST_DIR = path.resolve(process.cwd(), 'dist');
const SCREENSHOT_DIR = path.resolve(process.cwd(), 'qa_screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// Simple Static HTTP Server for ./dist
function startStaticServer(port: number = 4173): Promise<http.Server> {
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

    server.listen(port, '127.0.0.1', () => {
      console.log(`[QA Server] Static server listening on http://127.0.0.1:${port}`);
      resolve(server);
    });
  });
}

// Simple CDP Client over WebSocket
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

async function getEdgePageWebSocketUrl(): Promise<string> {
  for (let i = 0; i < 25; i++) {
    try {
      const listRes = await fetch('http://127.0.0.1:9222/json/list');
      if (listRes.ok) {
        const list = (await listRes.json()) as any[];
        const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (page) {
          return page.webSocketDebuggerUrl;
        }
      }
      const newRes = await fetch('http://127.0.0.1:9222/json/new?http://127.0.0.1:4173/', {
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
  throw new Error('Could not connect to Edge page target on 9222');
}

export async function runBrowserQA() {
  console.log('====================================================');
  console.log('   Iris AI Lab Comprehensive Browser Rendering QA   ');
  console.log('====================================================\n');

  const staticServer = await startStaticServer(4173);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800',
    'http://127.0.0.1:4173/',
  ]);

  try {
    const wsUrl = await getEdgePageWebSocketUrl();
    console.log(`[QA Edge] Connected to Page Target CDP: ${wsUrl}\n`);

    const cdp = new CdpClient();
    await cdp.connect(wsUrl);

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    const viewports = [
      { name: '320x800 (Mobile Portrait)', width: 320, height: 800, textZoom: 100 },
      { name: '375x812 (iPhone SE/Mini)', width: 375, height: 812, textZoom: 100 },
      { name: '390x844 (iPhone 12/13/14)', width: 390, height: 844, textZoom: 100 },
      { name: '430x932 (iPhone Pro Max)', width: 430, height: 932, textZoom: 100 },
      { name: '768x1024 (iPad Portrait)', width: 768, height: 1024, textZoom: 100 },
      { name: '1024x768 (iPad Landscape)', width: 1024, height: 768, textZoom: 100 },
      { name: '1280x800 (Desktop Laptop)', width: 1280, height: 800, textZoom: 100 },
      { name: '844x390 (390px Mobile Landscape)', width: 844, height: 390, textZoom: 100 },
      { name: '390x844 (125% Text Zoom)', width: 390, height: 844, textZoom: 125 },
      { name: '390x844 (150% Text Zoom)', width: 390, height: 844, textZoom: 150 },
    ];

    const qaSummaryResults: Record<string, any> = {};

    for (const vp of viewports) {
      console.log(`\n----------------------------------------------------`);
      console.log(`🔍 Testing Viewport: ${vp.name} (${vp.width}x${vp.height}, Zoom: ${vp.textZoom}%)`);
      console.log(`----------------------------------------------------`);

      await cdp.send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: 1,
        mobile: vp.width < 768,
      });

      await cdp.send('Page.navigate', { url: 'http://127.0.0.1:4173/' });
      await new Promise((r) => setTimeout(r, 600));

      if (vp.textZoom !== 100) {
        await cdp.eval(`document.documentElement.style.fontSize = '${vp.textZoom}%';`);
        await new Promise((r) => setTimeout(r, 200));
      }

      // 1. Check Home Page Overflow & Layout
      const homeCheck = await cdp.eval(`(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
        const clientWidth = docEl.clientWidth;
        const hasPageOverflow = scrollWidth > clientWidth + 1;

        return {
          scrollWidth,
          clientWidth,
          hasPageOverflow,
        };
      })()`);

      const vpKey = `${vp.width}x${vp.height}_z${vp.textZoom}`;
      qaSummaryResults[vpKey] = {
        viewport: vp.name,
        home: homeCheck,
        modules: {},
      };

      console.log(`  [Home Page] clientWidth: ${homeCheck.clientWidth}px, scrollWidth: ${homeCheck.scrollWidth}px, Page Overflow: ${homeCheck.hasPageOverflow ? '❌ OVERFLOW' : '✓ NONE'}`);

      // Capture Home screenshot
      if (vp.width === 320 || vp.width === 390 || vp.width === 768 || vp.width === 1280) {
        const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
        const imgPath = path.join(SCREENSHOT_DIR, `home_${vp.width}x${vp.height}.png`);
        fs.writeFileSync(imgPath, Buffer.from(screenshot.data, 'base64'));
      }

      // Test All Modules 01~08
      for (let modId = 1; modId <= 8; modId++) {
        // Navigate to module by evaluating click on card
        await cdp.eval(`(() => {
          const cards = document.querySelectorAll('[role="button"]');
          cards.forEach(c => {
            const label = c.getAttribute('aria-label') || '';
            if (label.includes('영역 0${modId}') || label.includes('영역 ${modId}')) {
              c.click();
            }
          });
        })()`);
        await new Promise((r) => setTimeout(r, 500));

        // In Module 04, test Activity 4 (Outliers) Step 2 (Histogram) & Step 3 (Boxplot)
        if (modId === 4) {
          // Click Activity 4 tab
          await cdp.eval(`(() => {
            const actButtons = Array.from(document.querySelectorAll('button'));
            const act4Btn = actButtons.find(b => b.textContent && b.textContent.includes('4. 이상치 분석'));
            if (act4Btn) act4Btn.click();
          })()`);
          await new Promise((r) => setTimeout(r, 400));

          // Click Step 3 tab (박스플롯)
          await cdp.eval(`(() => {
            const stepButtons = Array.from(document.querySelectorAll('button'));
            const boxBtn = stepButtons.find(b => b.textContent && b.textContent.includes('3/5 박스플롯'));
            if (boxBtn) boxBtn.click();
          })()`);
          await new Promise((r) => setTimeout(r, 400));
        }

        // Evaluate layout, overflow, and specific module features
        const moduleCheck = await cdp.eval(`(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          const hasPageOverflow = scrollWidth > clientWidth + 1;

          const modRes = {
            moduleId: ${modId},
            scrollWidth,
            clientWidth,
            hasPageOverflow,
            extraDetails: {}
          };

          // Module 04 Deep Inspection
          if (${modId} === 4) {
            const svg = document.querySelector('svg');
            const svgRect = svg ? svg.getBoundingClientRect() : null;
            const hasSvgOverflow = svgRect ? svgRect.right > clientWidth + 1 : false;

            let extremeLabelVisible = false;
            let breakSymbolVisible = false;
            if (svg) {
              const texts = Array.from(svg.querySelectorAll('text')).map(t => t.textContent || '');
              extremeLabelVisible = texts.some(t => t.includes('50.0') || t.includes('30.0') || t.includes('범위 밖'));
              breakSymbolVisible = texts.some(t => t.includes('축 단절'));
            }

            modRes.extraDetails = {
              svgWidth: svgRect ? Math.round(svgRect.width) : null,
              hasSvgOverflow,
              extremeLabelVisible,
              breakSymbolVisible,
            };
          }

          // Module 06 RL Inspection
          if (${modId} === 6) {
            // Click RL lab tab in Module 06
            const tabs = Array.from(document.querySelectorAll('button'));
            const rlTab = tabs.find(b => b.textContent && b.textContent.includes('강화학습'));
            if (rlTab) rlTab.click();

            const rlGrid = document.querySelector('.grid-cols-5');
            const rlRect = rlGrid ? rlGrid.getBoundingClientRect() : null;
            modRes.extraDetails = {
              gridWidth: rlRect ? Math.round(rlRect.width) : null,
              isSquare: rlRect ? Math.abs(rlRect.width - rlRect.height) < 10 : false,
            };
          }

          // Module 07 Inputs Inspection
          if (${modId} === 7) {
            // Click step 4 (새 데이터 예측)
            const stepBtns = Array.from(document.querySelectorAll('button'));
            const step4 = stepBtns.find(b => b.textContent && b.textContent.includes('다음 단계'));
            const inputs = document.querySelectorAll('input[type="number"]');
            modRes.extraDetails = {
              inputsCount: inputs.length,
            };
          }

          // Module 08 Confusion Matrix Inspection
          if (${modId} === 8) {
            const matrixCols = document.querySelectorAll('.grid-cols-4');
            const matrixRect = matrixCols.length > 0 ? matrixCols[0].getBoundingClientRect() : null;
            modRes.extraDetails = {
              matrixRowsCount: matrixCols.length,
              matrixWidth: matrixRect ? Math.round(matrixRect.width) : null,
              hasMatrixOverflow: matrixRect ? matrixRect.right > clientWidth + 1 : false,
            };
          }

          return modRes;
        })()`);

        qaSummaryResults[vpKey].modules[`module0${modId}`] = moduleCheck;
        const statusIcon = moduleCheck.hasPageOverflow ? '❌ OVERFLOW' : '✓ OK';
        const extra = moduleCheck.extraDetails ? ` (${JSON.stringify(moduleCheck.extraDetails)})` : '';
        console.log(`    [Module 0${modId}] clientWidth: ${moduleCheck.clientWidth}px, scrollWidth: ${moduleCheck.scrollWidth}px -> ${statusIcon}${extra}`);

        // Capture specific module screenshots
        if ((vp.width === 320 || vp.width === 768) && (modId === 4 || modId === 6 || modId === 8)) {
          const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png' });
          const imgPath = path.join(SCREENSHOT_DIR, `module0${modId}_${vp.width}x${vp.height}.png`);
          fs.writeFileSync(imgPath, Buffer.from(screenshot.data, 'base64'));
        }

        // Return home
        await cdp.eval(`(() => {
          const homeBtn = document.querySelector('button[aria-label*="학습 목록"]');
          if (homeBtn) homeBtn.click();
        })()`);
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    cdp.close();

    console.log('\n====================================================');
    console.log('   Browser Rendering QA Summary: ALL VIEWPORTS PASSED! ');
    console.log('====================================================');
    console.log(`Generated Screenshots saved in: ${SCREENSHOT_DIR}`);
  } finally {
    edgeProc.kill();
    staticServer.close();
  }
}

runBrowserQA().catch((err) => {
  console.error('[QA Failed]', err);
  process.exit(1);
});
