import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const DIST_DIR = path.resolve(process.cwd(), 'dist');

function startStaticServer(port: number = 4310): Promise<http.Server> {
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

async function debugLandscape() {
  const staticServer = await startStaticServer(4310);

  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edgeProc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9266',
    '--disable-gpu',
    '--no-sandbox',
    '--window-size=844,390',
    'http://127.0.0.1:4310/',
  ]);

  try {
    let wsUrl = '';
    for (let i = 0; i < 25; i++) {
      try {
        const listRes = await fetch('http://127.0.0.1:9266/json/list');
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

    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 844,
      height: 390,
      deviceScaleFactor: 1,
      mobile: true,
    });

    await cdp.send('Page.navigate', { url: 'http://127.0.0.1:4310/' });
    await new Promise((r) => setTimeout(r, 800));

    const debugInfo = await cdp.eval(`(() => {
      const clientWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;

      const overflowing = [];
      const all = document.querySelectorAll('*');
      all.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.right > clientWidth + 1 || rect.width > clientWidth + 1) {
          overflowing.push({
            tag: el.tagName,
            className: (el.className || '').slice(0, 80),
            rect: {
              left: Math.round(rect.left),
              right: Math.round(rect.right),
              width: Math.round(rect.width)
            },
            text: (el.textContent || '').slice(0, 40)
          });
        }
      });

      return {
        clientWidth,
        scrollWidth,
        overflowingCount: overflowing.length,
        overflowing
      };
    })()`);

    console.log('=== 844x390 Landscape Debug Results ===');
    console.log(JSON.stringify(debugInfo, null, 2));

    cdp.close();
  } finally {
    edgeProc.kill();
    staticServer.close();
  }
}

debugLandscape().catch((err) => {
  console.error(err);
  process.exit(1);
});
