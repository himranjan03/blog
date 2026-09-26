const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const express = require('express');

const app = express();
const port = Number(process.env.PORT || 3000);
const dataFile = path.join(__dirname, 'data', 'content.json');

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'], maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0 }));

async function readContent() {
  return JSON.parse(await fs.readFile(dataFile, 'utf8'));
}

async function writeContent(content) {
  const temporary = `${dataFile}.${process.pid}.tmp`;
  await fs.writeFile(temporary, `${JSON.stringify(content, null, 2)}\n`, 'utf8');
  await fs.rename(temporary, dataFile);
}

function publicContent(content) {
  const posts = content.posts.map(({ content: body, ...post }) => post);
  return { ...content, posts };
}

function validId(value) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function requiresAdmin(req, res, next) {
  const configuredToken = process.env.ADMIN_TOKEN;
  const token = req.get('x-admin-token');
  if (!configuredToken) return res.status(503).json({ error: 'Admin writes are disabled. Configure ADMIN_TOKEN first.' });
  const expected = Buffer.from(configuredToken);
  const received = Buffer.from(token || '');
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
    return res.status(401).json({ error: 'Invalid admin token.' });
  }
  next();
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'personal-hub', timestamp: new Date().toISOString() }));

app.get('/api/content', async (_req, res, next) => {
  try { res.json(publicContent(await readContent())); } catch (error) { next(error); }
});

app.get('/api/posts/:id', async (req, res, next) => {
  try {
    const post = (await readContent()).posts.find((item) => item.id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found.' });
    res.json(post);
  } catch (error) { next(error); }
});

// A small content API makes this site manageable without rebuilding it. Use the
// token in .env/your process manager for all writes.
app.get('/api/admin/content', requiresAdmin, async (_req, res, next) => {
  try { res.json(await readContent()); } catch (error) { next(error); }
});

app.put('/api/admin/content', requiresAdmin, async (req, res, next) => {
  try {
    const value = req.body;
    if (!value || typeof value !== 'object' || !value.profile || !Array.isArray(value.posts) || !Array.isArray(value.software)) {
      return res.status(400).json({ error: 'Content must include profile, posts, and software.' });
    }
    if (value.posts.some((post) => !validId(post.id))) return res.status(400).json({ error: 'Every post needs a lowercase hyphenated id.' });
    await writeContent(value);
    res.json({ status: 'saved' });
  } catch (error) { next(error); }
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));
app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

app.listen(port, () => console.log(`Personal Hub is running at http://localhost:${port}`));
