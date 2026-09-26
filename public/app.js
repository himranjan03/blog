const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
const formatDate = (value) => new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T00:00:00`));

function icon(name, size = 15) {
  return window.lucide?.icons?.[name]?.toSvg({ width: size, height: size, 'stroke-width': 1.8 }) || '↗';
}

function renderExperience(items) {
  $('#experience-list').innerHTML = items.map((job) => `
    <article class="job">
      <span class="job-period">${escapeHTML(job.period)}</span>
      <div><h3>${escapeHTML(job.role)}</h3><span class="job-company">${escapeHTML(job.company)}</span></div>
      <div><p>${escapeHTML(job.description)}</p><div>${job.tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}</div></div>
    </article>`).join('');
}

function postCard(post) {
  return `<button class="post" data-post-id="${escapeHTML(post.id)}" type="button">
    <span class="post-date">${formatDate(post.date)}</span>
    <span><h3>${escapeHTML(post.title)}</h3><p>${escapeHTML(post.excerpt)}</p></span>
    <span class="post-tags">${post.tags.map(escapeHTML).join(' · ')}</span><span class="post-arrow">↗</span>
  </button>`;
}

function renderSoftware(items) {
  $('#software-list').innerHTML = items.map((item) => `
    <article class="software-card">
      <header><div><h3>${escapeHTML(item.name)}</h3><span class="version">${escapeHTML(item.version)}</span></div><span class="status">${escapeHTML(item.status)}</span></header>
      <p>${escapeHTML(item.description)}</p><ul class="changes">${item.changes.map((change) => `<li>${escapeHTML(change)}</li>`).join('')}</ul>
      <div class="software-links">${item.links.website ? `<a href="${escapeHTML(item.links.website)}" target="_blank" rel="noreferrer">Website ↗</a>` : ''}${item.links.github ? `<a href="${escapeHTML(item.links.github)}" target="_blank" rel="noreferrer">GitHub ↗</a>` : ''}</div>
    </article>`).join('');
}

function renderSocials(items) {
  $('#social-links').innerHTML = items.map((item) => `<a href="${escapeHTML(item.url)}" target="_blank" rel="noreferrer" aria-label="${escapeHTML(item.label)}">${icon(item.icon)} ${escapeHTML(item.label)}</a>`).join('');
}

async function openArticle(id) {
  const modal = $('#article-modal');
  const article = $('#article');
  article.innerHTML = '<p class="article-meta">Loading article…</p>';
  modal.showModal();
  try {
    const response = await fetch(`/api/posts/${encodeURIComponent(id)}`);
    if (!response.ok) throw new Error('Could not load article');
    const post = await response.json();
    article.innerHTML = `<p class="article-meta">${formatDate(post.date)} · ${escapeHTML(post.readTime)} · ${post.tags.map(escapeHTML).join(', ')}</p><h2>${escapeHTML(post.title)}</h2><div class="article-body">${escapeHTML(post.content)}</div>`;
  } catch {
    article.innerHTML = '<p class="article-meta">Sorry, the article could not be loaded.</p>';
  }
}

async function initialize() {
  try {
    const response = await fetch('/api/content');
    if (!response.ok) throw new Error('Content request failed');
    const content = await response.json();
    const { profile } = content;
    document.title = `${profile.name} — ${profile.role}`;
    $('#availability').textContent = profile.availability;
    $('#hero-bio').textContent = profile.bio;
    $('#role').textContent = profile.role;
    $('#location').textContent = profile.location;
    $('#about-text').textContent = profile.about;
    $('#footer-name').textContent = profile.name;
    $('#year').textContent = new Date().getFullYear();
    $('#email-link').href = `mailto:${profile.email}`;
    $('#email-link').innerHTML = `${escapeHTML(profile.email)} <span>↗</span>`;
    $('#stats').innerHTML = profile.stats.map((stat) => `<div class="stat"><strong>${escapeHTML(stat.value)}</strong><span>${escapeHTML(stat.label)}</span></div>`).join('');
    renderExperience(content.experience);
    const posts = [...content.posts].sort((a, b) => new Date(b.date) - new Date(a.date));
    const shownPosts = posts.slice(0, 3);
    $('#post-count').textContent = `${posts.length} notes`;
    $('#post-list').innerHTML = shownPosts.map(postCard).join('');
    $('#show-all-posts').hidden = posts.length <= 3;
    $('#show-all-posts').addEventListener('click', (event) => {
      event.currentTarget.hidden = true;
      $('#post-list').innerHTML = posts.map(postCard).join('');
    });
    $('#post-list').addEventListener('click', (event) => {
      const button = event.target.closest('[data-post-id]');
      if (button) openArticle(button.dataset.postId);
    });
    renderSoftware(content.software);
    renderSocials(content.socials);
  } catch (error) {
    console.error(error);
    document.body.insertAdjacentHTML('afterbegin', '<div style="padding:12px;background:#ff7968;color:#16211d;text-align:center;font:12px sans-serif">Unable to load site content. Please try again shortly.</div>');
  }
}

$('#article-modal').addEventListener('click', (event) => { if (event.target === event.currentTarget) event.currentTarget.close(); });
$('.modal-close').addEventListener('click', () => $('#article-modal').close());
initialize();
