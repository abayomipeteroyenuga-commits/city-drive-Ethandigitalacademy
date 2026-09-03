const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
try { fs.unlinkSync(path.join(root, 'server-ready.txt')); } catch {}
try { fs.unlinkSync(path.join(root, 'server-error.txt')); } catch {}
const mime = {
  '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.txt':'text/plain; charset=utf-8', '.png':'image/png',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.svg':'image/svg+xml', '.ico':'image/x-icon', '.webp':'image/webp'
};

function makeServer() {
  return http.createServer((req, res) => {
    let u;
    try { u = new URL(req.url, 'http://127.0.0.1'); } catch { res.writeHead(400); return res.end('Bad request'); }
    let rel;
    try { rel = decodeURIComponent(u.pathname); } catch { res.writeHead(400); return res.end('Bad request'); }
    if (rel === '/') rel = '/index.html';
    const file = path.resolve(root, '.' + rel);
    if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403); return res.end('Forbidden'); }
    fs.stat(file, (e, st) => {
      if (e || !st.isFile()) { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, {'Content-Type': mime[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control':'no-store'});
      fs.createReadStream(file).pipe(res);
    });
  });
}

async function listenFirstAvailable() {
  for (let port = 8765; port <= 8795; port++) {
    const server = makeServer();
    try {
      await new Promise((resolve, reject) => {
        const onError = err => { server.removeListener('listening', onListening); reject(err); };
        const onListening = () => { server.removeListener('error', onError); resolve(); };
        server.once('error', onError);
        server.once('listening', onListening);
        server.listen(port, '127.0.0.1');
      });
      fs.writeFileSync(path.join(root, 'server-ready.txt'), `READY http://127.0.0.1:${port}/`);
      console.log(`CITY DRIVE offline server: http://127.0.0.1:${port}/`);
      const cleanup = () => { try { fs.unlinkSync(path.join(root, 'server-ready.txt')); } catch {} server.close(() => process.exit(0)); };
      process.on('SIGINT', cleanup); process.on('SIGTERM', cleanup);
      return;
    } catch (e) {
      try { server.close(); } catch {}
      if (e && e.code !== 'EADDRINUSE') throw e;
    }
  }
  throw new Error('No free CITY DRIVE port found between 8765 and 8795.');
}

listenFirstAvailable().catch(err => {
  try { fs.writeFileSync(path.join(root, 'server-error.txt'), String(err.stack || err)); } catch {}
  console.error(err);
  process.exitCode = 1;
});
