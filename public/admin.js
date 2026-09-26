const tokenInput = document.querySelector('#token');
const login = document.querySelector('#login');
const workspace = document.querySelector('#workspace');
const contentInput = document.querySelector('#content');
let token = sessionStorage.getItem('personal-hub-admin-token') || '';

function message(target, text, isError = false) { target.textContent = text; target.classList.toggle('error', isError); }
async function load() {
  const loginMessage = document.querySelector('#login-message');
  token = tokenInput.value.trim() || token;
  if (!token) return message(loginMessage, 'Enter your admin token.', true);
  try {
    const response = await fetch('/api/admin/content', { headers: { 'x-admin-token': token } });
    if (!response.ok) throw new Error(response.status === 401 ? 'That token was not accepted.' : 'The editor is not available. Check ADMIN_TOKEN on the server.');
    contentInput.value = JSON.stringify(await response.json(), null, 2);
    sessionStorage.setItem('personal-hub-admin-token', token);
    login.classList.add('hidden'); workspace.classList.remove('hidden');
  } catch (error) { message(loginMessage, error.message, true); }
}
document.querySelector('#load').addEventListener('click', load);
tokenInput.addEventListener('keydown', (event) => { if (event.key === 'Enter') load(); });
document.querySelector('#format').addEventListener('click', () => {
  const saveMessage = document.querySelector('#save-message');
  try { contentInput.value = JSON.stringify(JSON.parse(contentInput.value), null, 2); message(saveMessage, 'JSON formatted.'); }
  catch { message(saveMessage, 'JSON has a syntax error. Fix it before saving.', true); }
});
document.querySelector('#save').addEventListener('click', async () => {
  const saveMessage = document.querySelector('#save-message');
  let content;
  try { content = JSON.parse(contentInput.value); } catch { return message(saveMessage, 'JSON has a syntax error. Fix it before saving.', true); }
  try {
    const response = await fetch('/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json', 'x-admin-token': token }, body: JSON.stringify(content) });
    if (!response.ok) throw new Error((await response.json()).error || 'Save failed.');
    message(saveMessage, 'Saved. Your public site is updated.');
  } catch (error) { message(saveMessage, error.message, true); }
});
document.querySelector('#lock').addEventListener('click', () => { token = ''; tokenInput.value = ''; sessionStorage.removeItem('personal-hub-admin-token'); workspace.classList.add('hidden'); login.classList.remove('hidden'); });
