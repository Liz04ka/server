import http from 'http';
import fs from 'fs/promises';
import { URL } from 'url';

const port = 3000;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const filePath = `.${url.pathname}`;

  try {
    switch (req.method) {
      case 'GET':
        if (url.pathname === '/') {
          const files = await fs.readdir('.');
          const responseText = files.join('\n');
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Content-Length', Buffer.byteLength(responseText));
          res.end(responseText);
        } else {
          const fileContent = await fs.readFile(filePath, 'utf-8');
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.setHeader('Content-Length', Buffer.byteLength(fileContent));
          res.end(fileContent);
        }
        break;
      case 'HEAD':
        const fileStat = await fs.stat(filePath);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Length', fileStat.size);
        res.end();
        break;
      case 'PUT':
        await fs.writeFile(filePath, '');
        req.pipe(fs.createWriteStream(filePath, { flags: 'w' }));
        req.on('end', () => {
          res.statusCode = 200;
          res.end();
        });
        break;
      case 'PATCH':
        req.pipe(fs.createWriteStream(filePath, { flags: 'a' }));
        req.on('end', () => {
          res.statusCode = 200;
          res.end();
        });
        break;
      case 'DELETE':
        await fs.unlink(filePath);
        res.statusCode = 200;
        res.end();
        break;
      default:
        res.statusCode = 400;
        res.end('Bad request');
        break;
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.statusCode = 404;
      res.end('File not found');
    } else {
      res.statusCode = 500;
      res.end(`Server error: ${err.message}`);
    }
  }
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});