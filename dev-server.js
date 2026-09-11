const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.PORT || 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg'
};

// Resuelve URLs limpias como lo hace GitHub Pages:
//   /            -> /index.html
//   /fieb/       -> /fieb/index.html
//   /fieb        -> /fieb/index.html (o /fieb.html si existe)
function resolveFile(urlPath) {
  const base = path.normalize(path.join(root, urlPath));
  if (!base.startsWith(root)) return null;
  const candidates = [];
  if (urlPath.endsWith('/')) {
    candidates.push(path.join(base, 'index.html'));
  } else if (!path.extname(urlPath)) {
    candidates.push(path.join(base, 'index.html'), base + '.html');
  }
  candidates.push(base);
  return candidates.find(f => fs.existsSync(f) && fs.statSync(f).isFile()) || null;
}

http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const file = resolveFile(urlPath);
  if (!file) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream'
    });
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => {
  console.log(`Servidor local: http://127.0.0.1:${port}`);
});
