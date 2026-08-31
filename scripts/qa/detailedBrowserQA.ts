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
      const listRes = await fetch('http://127.0.0.1:9233/json/list');
      if (listRes.ok) {
        const list = (await listRes.json()) as any[];
        const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
        if (page) {
          return page.webSocketDebuggerUrl;
        }
      }
      const newRes = await fetch('http://127.0.0.1:9233/json/new?http://127.0.0.1:4299/', {
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
  throw new Error('Could not connect to Edge page target on 9233');
}

export async function runDetailedQA() {
  console.log('================================================================');
  console.log('   Iris AI Lab Deep Real Browser Responsive QA & Screenshot Suite   ');
  console.log('================================================================\n');

  const staticServer = await startStaticServer(4299);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9233',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=1280,800',
    'http://127.0.0.1:4299/',
  ]);

  try {
    const wsUrl = await getEdgePageWebSocketUrl();
    const cdp = new CdpClient();
    await cdp.connect(wsUrl);

    await cdp.send('Page.enable');
    await cdp.send('DOM.enable');
    await cdp.send('Runtime.enable');

    const viewports = [
      { name: '320x800 (Mobile)', width: 320, height: 800, textZoom: 100 },
      { name: '375x812 (iPhone SE)', width: 375, height: 812, textZoom: 100 },
      { name: '390x844 (iPhone 12/13/14)', width: 390, height: 844, textZoom: 100 },
      { name: '430x932 (iPhone Pro Max)', width: 430, height: 932, textZoom: 100 },
      { name: '768x1024 (iPad Portrait)', width: 768, height: 1024, textZoom: 100 },
      { name: '1024x768 (iPad Landscape)', width: 1024, height: 768, textZoom: 100 },
      { name: '1280x800 (Desktop Laptop)', width: 1280, height: 800, textZoom: 100 },
      { name: '844x390 (390px Mobile Landscape)', width: 844, height: 390, textZoom: 100 },
      { name: '390x844 (125% Text Zoom)', width: 390, height: 844, textZoom: 125 },
      { name: '390x844 (150% Text Zoom)', width: 390, height: 844, textZoom: 150 },
    ];


    for (const vp of viewports) {
      console.log(`\n================================================================`);
      console.log(`📱 Testing Viewport: ${vp.name} (${vp.width}x${vp.height}, Zoom: ${vp.textZoom}%)`);
      console.log(`================================================================`);

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

      // 1. Check Home Page
      const homeStats = await cdp.eval(`(() => {
        const docEl = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
        const clientWidth = docEl.clientWidth;
        const hasPageOverflow = scrollWidth > clientWidth + 1;

        // Check header, title, and buttons
        const header = document.querySelector('header');
        const headerRect = header ? header.getBoundingClientRect() : null;
        const bottomNav = document.querySelector('nav[aria-label="하단 주 메뉴"]');
        const bottomNavRect = bottomNav ? bottomNav.getBoundingClientRect() : null;

        return {
          scrollWidth,
          clientWidth,
          hasPageOverflow,
          headerHeight: headerRect ? Math.round(headerRect.height) : null,
          bottomNavHeight: bottomNavRect ? Math.round(bottomNavRect.height) : null,
        };
      })()`);

      console.log(`[Home Page] clientWidth: ${homeStats.clientWidth}px, scrollWidth: ${homeStats.scrollWidth}px -> ${homeStats.hasPageOverflow ? '❌ OVERFLOW' : '✓ OK'}`);

      if (vp.width === 320 || vp.width === 390 || vp.width === 768 || vp.width === 1280) {
        const sc = await cdp.send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(path.join(SCREENSHOT_DIR, `home_${vp.width}x${vp.height}_z${vp.textZoom}.png`), Buffer.from(sc.data, 'base64'));
      }

      // Test All Modules 01~08
      for (let modId = 1; modId <= 8; modId++) {
        // Click module card
        await cdp.eval(`(() => {
          const cards = document.querySelectorAll('[role="button"]');
          cards.forEach(c => {
            const label = c.getAttribute('aria-label') || '';
            if (label.includes('영역 0${modId}') || label.includes('영역 ${modId}')) {
              c.click();
            }
          });
        })()`);
        await new Promise((r) => setTimeout(r, 450));

        let deepModuleInfo: any = {};

        // Module 04: Test Activity 4 Outliers (Histogram + Boxplot)
        if (modId === 4) {
          // Navigate to Activity 4: Outliers
          await cdp.eval(`(() => {
            // Click "다음 활동" 3 times to get to Activity 4
            const nextBtns = Array.from(document.querySelectorAll('button'));
            const nextBtn = nextBtns.find(b => b.textContent && b.textContent.includes('다음 활동'));
            if (nextBtn) {
              nextBtn.click(); // to act 2
              setTimeout(() => {
                const b2 = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('다음 활동'));
                if (b2) b2.click(); // to act 3
                setTimeout(() => {
                  const b3 = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('다음 활동'));
                  if (b3) b3.click(); // to act 4
                }, 150);
              }, 150);
            }
          })()`);
          await new Promise((r) => setTimeout(r, 550));

          // In Activity 4, click Step 2 (히스토그램)
          await cdp.eval(`(() => {
            const stepBtns = Array.from(document.querySelectorAll('button'));
            const histBtn = stepBtns.find(b => b.textContent && b.textContent.includes('2/5 히스토그램'));
            if (histBtn) histBtn.click();
          })()`);
          await new Promise((r) => setTimeout(r, 350));

          // Inspect Histogram
          const histInfo = await cdp.eval(`(() => {
            const clientWidth = document.documentElement.clientWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            const hasPageOverflow = scrollWidth > clientWidth + 1;
            const extremeBar = Array.from(document.querySelectorAll('*')).find(el => el.textContent && el.textContent.includes('범위 밖') && el.textContent.includes('50.0cm'));
            return {
              hasPageOverflow,
              hasExtremeBar: !!extremeBar
            };
          })()`);

          if (vp.width === 320 || vp.width === 390 || vp.width === 768) {
            const sc = await cdp.send('Page.captureScreenshot', { format: 'png' });
            fs.writeFileSync(path.join(SCREENSHOT_DIR, `module04_histogram_${vp.width}x${vp.height}_z${vp.textZoom}.png`), Buffer.from(sc.data, 'base64'));
          }

          // Click Step 3 (박스플롯)
          await cdp.eval(`(() => {
            const stepBtns = Array.from(document.querySelectorAll('button'));
            const boxBtn = stepBtns.find(b => b.textContent && b.textContent.includes('3/5 박스플롯'));
            if (boxBtn) boxBtn.click();
          })()`);
          await new Promise((r) => setTimeout(r, 350));

          // Inspect Boxplot SVG
          const boxplotInfo = await cdp.eval(`(() => {
            const clientWidth = document.documentElement.clientWidth;
            const scrollWidth = document.documentElement.scrollWidth;
            const hasPageOverflow = scrollWidth > clientWidth + 1;
            const svg = document.querySelector('svg');
            const svgRect = svg ? svg.getBoundingClientRect() : null;
            const svgTexts = svg ? Array.from(svg.querySelectorAll('text')).map(t => t.textContent || '') : [];
            const has50cmLabel = svgTexts.some(t => t.includes('50.0'));
            const hasAxisBreak = svgTexts.some(t => t.includes('축 단절'));

            return {
              hasPageOverflow,
              svgWidth: svgRect ? Math.round(svgRect.width) : null,
              hasSvgOverflow: svgRect ? svgRect.right > clientWidth + 1 : false,
              has50cmLabel,
              hasAxisBreak,
            };
          })()`);

          deepModuleInfo.histogram = histInfo;
          deepModuleInfo.boxplot = boxplotInfo;

          if (vp.width === 320 || vp.width === 390 || vp.width === 768 || vp.width === 1280) {
            const sc = await cdp.send('Page.captureScreenshot', { format: 'png' });
            fs.writeFileSync(path.join(SCREENSHOT_DIR, `module04_boxplot_${vp.width}x${vp.height}_z${vp.textZoom}.png`), Buffer.from(sc.data, 'base64'));
          }
        }

        // Module 06: Reinforcement Learning 5x5 Grid
        if (modId === 6) {
          await cdp.eval(`(() => {
            const tabs = Array.from(document.querySelectorAll('button'));
            const rlTab = tabs.find(b => b.textContent && b.textContent.includes('강화학습'));
            if (rlTab) rlTab.click();
          })()`);
          await new Promise((r) => setTimeout(r, 350));

          const rlInfo = await cdp.eval(`(() => {
            const clientWidth = document.documentElement.clientWidth;
            const grid = document.querySelector('.grid-cols-5');
            const gridRect = grid ? grid.getBoundingClientRect() : null;
            return {
              gridWidth: gridRect ? Math.round(gridRect.width) : null,
              gridHeight: gridRect ? Math.round(gridRect.height) : null,
              hasGridOverflow: gridRect ? gridRect.right > clientWidth + 1 : false,
            };
          })()`);

          deepModuleInfo.rl = rlInfo;

          if (vp.width === 320 || vp.width === 390 || vp.width === 768) {
            const sc = await cdp.send('Page.captureScreenshot', { format: 'png' });
            fs.writeFileSync(path.join(SCREENSHOT_DIR, `module06_rl_${vp.width}x${vp.height}_z${vp.textZoom}.png`), Buffer.from(sc.data, 'base64'));
          }
        }

        // Module 08: Confusion Matrix
        if (modId === 8) {
          const cmInfo = await cdp.eval(`(() => {
            const clientWidth = document.documentElement.clientWidth;
            const matrixGrid = document.querySelector('.grid-cols-4');
            const matrixRect = matrixGrid ? matrixGrid.getBoundingClientRect() : null;
            return {
              matrixWidth: matrixRect ? Math.round(matrixRect.width) : null,
              hasMatrixOverflow: matrixRect ? matrixRect.right > clientWidth + 1 : false,
            };
          })()`);

          deepModuleInfo.confusionMatrix = cmInfo;

          if (vp.width === 320 || vp.width === 390 || vp.width === 768) {
            const sc = await cdp.send('Page.captureScreenshot', { format: 'png' });
            fs.writeFileSync(path.join(SCREENSHOT_DIR, `module08_cm_${vp.width}x${vp.height}_z${vp.textZoom}.png`), Buffer.from(sc.data, 'base64'));
          }
        }

        const pageOverflowCheck = await cdp.eval(`(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollWidth = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientWidth = docEl.clientWidth;
          return {
            scrollWidth,
            clientWidth,
            hasPageOverflow: scrollWidth > clientWidth + 1,
          };
        })()`);

        console.log(`  [Module 0${modId}] clientWidth: ${pageOverflowCheck.clientWidth}px, scrollWidth: ${pageOverflowCheck.scrollWidth}px -> ${pageOverflowCheck.hasPageOverflow ? '❌ OVERFLOW' : '✓ OK'} ${JSON.stringify(deepModuleInfo)}`);

        // Return Home
        await cdp.eval(`(() => {
          const homeBtn = document.querySelector('button[aria-label*="학습 목록"]');
          if (homeBtn) homeBtn.click();
        })()`);
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    cdp.close();

    console.log('\n================================================================');
    console.log('🎉 COMPREHENSIVE BROWSER RESPONSIVE QA COMPLETED SUCCESSFULLY!');
    console.log(`Saved screenshot artifacts in: ${SCREENSHOT_DIR}`);
    console.log('================================================================\n');

  } finally {
    edgeProc.kill();
    staticServer.close();
  }
}

runDetailedQA().catch((err) => {
  console.error('[QA Failed]', err);
  process.exit(1);
});
