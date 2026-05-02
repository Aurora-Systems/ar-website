const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Load .env if present (Node 20.6+ built-in)
try { require('node:fs').readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(line => { const [k, ...v] = line.split('='); if (k && k.trim() && !k.trim().startsWith('#')) process.env[k.trim()] ??= v.join('=').trim().replace(/^"|"$/g, ''); }); } catch {}

const root = __dirname;
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

function createResponse(res) {
  return {
    setHeader(name, value) {
      res.setHeader(name, value);
    },
    status(code) {
      res.statusCode = code;
      return this;
    },
    json(payload) {
      if (!res.hasHeader('Content-Type')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      }
      res.end(JSON.stringify(payload));
      return this;
    },
    end(payload) {
      res.end(payload);
      return this;
    },
  };
}

async function readRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const body = Buffer.concat(chunks).toString('utf8');
  if (!body) return undefined;

  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }

  return body;
}

async function handleApi(req, res, pathname) {
  const apiName = pathname.replace(/^\/api\//, '');
  const apiPath = path.join(root, 'api', `${apiName}.js`);
  const mod = require(apiPath);

  req.body = await readRequestBody(req);
  await mod(req, createResponse(res));
}

async function serveStatic(req, res, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const safePath = path.normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(root, safePath);

  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const file = await fs.readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  res.end(file);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url.pathname);
      return;
    }

    await serveStatic(req, res, url.pathname);
  } catch (error) {
    const status = error && error.code === 'ENOENT' ? 404 : 500;
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(status === 404 ? 'Not found' : 'Server error');
    if (status === 500) console.error(error);
  }
});

server.listen(port, () => {
  console.log(`Aurora site running at http://localhost:${port}`);
  console.log(`Blog page: http://localhost:${port}/blog.html`);
  console.log(`Serving from ${pathToFileURL(root)}`);
});
