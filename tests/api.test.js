const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');

const port = 3199;
let server;

before(async () => {
  server = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT: String(port), ADMIN_TOKEN: 'test-secret' }, stdio: 'ignore' });
  await new Promise((resolve) => setTimeout(resolve, 600));
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
