const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const contactHandler = require('./api/contact');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.woff2': 'font/woff2'
};

function send(res, filePath, status = 200) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500);
      res.end('Erreur serveur');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(status, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

function isFile(p) {
  try { return fs.statSync(p).isFile(); } catch { return false; }
}

const server = http.createServer((req, res) => {
  let reqPath;
  try {
    reqPath = decodeURIComponent(req.url.split('?')[0]);
  } catch {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }
  if (reqPath === '/api/contact') return contactHandler(req, res);
  if (reqPath === '/') reqPath = '/index.html';

  const filePath = path.normalize(path.join(PUBLIC_DIR, reqPath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (isFile(filePath)) return send(res, filePath);
  // /contact -> /contact.html
  if (!path.extname(filePath) && isFile(filePath + '.html')) return send(res, filePath + '.html');

  // Vraie erreur 404 (avant : la page d'accueil était renvoyée pour toute adresse inconnue)
  res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end('<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="robots" content="noindex"><title>Page introuvable — Identité Studio</title></head><body style="font-family:system-ui,sans-serif;text-align:center;padding:80px 20px"><h1>Page introuvable</h1><p><a href="/">Retour à l\'accueil</a></p></body></html>');
});

server.listen(PORT, () => {
  console.log(`Identité Studio running on port ${PORT}`);
});
