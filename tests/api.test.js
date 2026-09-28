const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

const port = 3199;
let server;

async function waitForServer() {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/api/health`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error('Test server did not start within 5 seconds.');
}

before(async () => {
  server = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), ADMIN_TOKEN: 'test-secret' }, stdio: 'ignore' });
  await waitForServer();
});

after(() => server.kill());

test('health endpoint responds', async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/health`);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'ok');
});

test('public content is available without private article bodies', async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/content`);
  const content = await response.json();
  assert.equal(response.status, 200);
  assert.equal(content.profile.name, 'Himanshu Ranjan');
  assert.ok(Array.isArray(content.posts));
  assert.ok(content.posts.every((post) => !('content' in post)));
});

test('profile portrait is served as a local JPEG asset', async () => {
  const response = await fetch(`http://127.0.0.1:${port}/images/himanshu-ranjan.jpg`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') || '', /^image\/jpeg/);
  assert.ok((await response.arrayBuffer()).byteLength > 1000);
});

test('missing article is reported as a 404', async () => {
  const missing = await fetch(`http://127.0.0.1:${port}/api/posts/not-real`);
  assert.equal(missing.status, 404);
});

test('admin content route protects unpublished article bodies', async () => {
  const blocked = await fetch(`http://127.0.0.1:${port}/api/admin/content`);
  assert.equal(blocked.status, 401);
  const allowed = await fetch(`http://127.0.0.1:${port}/api/admin/content`, { headers: { 'x-admin-token': 'test-secret' } });
  assert.equal(allowed.status, 200);
  assert.equal((await allowed.json()).profile.email, 'himanshuranjan3@gmail.com');
});
