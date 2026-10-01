// Serveur autonome pour votre propre machine ou hébergeur (Node.js 18 ou plus récent, aucune dépendance).
// Lancement : node server.js   puis ouvrir http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');
const { pvgis } = require('./api/pvgis');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/pvgis') {
    const { status, body } = await pvgis(Object.fromEntries(url.searchParams));
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(body));
  }
  if (url.pathname === '/' || url.pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return fs.createReadStream(INDEX).pipe(res);
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Introuvable');
}).listen(PORT, () => console.log(`Calepinage FRH : http://localhost:${PORT}`));
