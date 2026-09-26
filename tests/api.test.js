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

test('public content has no full article body', async () => {
  const response = await fetch(`http://127.0.0.1:${port}/api/content`);
  const content = await response.json();
  assert.equal(response.status, 200);
  assert.ok(content.profile.name);
  assert.equal('content' in content.posts[0], false);
});

test('article route returns its full body and missing article is 404', async () => {
  const content = await (await fetch(`http://127.0.0.1:${port}/api/content`)).json();
  const post = await (await fetch(`http://127.0.0.1:${port}/api/posts/${content.posts[0].id}`)).json();
  assert.ok(post.content);
  const missing = await fetch(`http://127.0.0.1:${port}/api/posts/not-real`);
  assert.equal(missing.status, 404);
});

test('admin content route protects unpublished article bodies', async () => {
  const blocked = await fetch(`http://127.0.0.1:${port}/api/admin/content`);
  assert.equal(blocked.status, 401);
  const allowed = await fetch(`http://127.0.0.1:${port}/api/admin/content`, { headers: { 'x-admin-token': 'test-secret' } });
  assert.equal(allowed.status, 200);
  assert.ok((await allowed.json()).posts[0].content);
});
