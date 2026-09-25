const positions = POSITION_MAP.positions;
const links = POSITION_MAP.links;
const byId = new Map(positions.map((position) => [position.id, position]));
const els = {
  list: document.querySelector('#position-list'),
  search: document.querySelector('#position-search'),
  family: document.querySelector('#family-filter'),
  selected: document.querySelector('#selected-position'),
  branches: document.querySelector('#mindmap'),
  incoming: document.querySelector('#incoming'),
  empty: document.querySelector('#empty-branches'),
  breadcrumbs: document.querySelector('#breadcrumbs'),
  count: document.querySelector('#branch-count'),
  indexCount: document.querySelector('#index-count'),
};
let path = [{ id: 'closed-guard', role: 'bottom', via: null }];

function roleName(position, role) {
  return position.role_labels?.[role] || `${role} player`;
}

function colorKey(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function branchColor(type) {
  const key = String(type).toLowerCase();
  if (/submission|choke|armbar|triangle|kimura|attack/.test(key)) return 'submission';
  if (/pass|takedown|advance/.test(key)) return 'pass';
  if (/sweep|reversal|wrestle/.test(key)) return 'sweep';
  if (/escape|defen|recovery/.test(key)) return 'defense';
  if (/back take/.test(key)) return 'backtake';
  return 'transition';
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function current() {
  return path[path.length - 1];
}

function photoSearchTerm(position) {
  const name = String(position.photo_search || position.name)
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s+\/\s+.*$/, '')
    .replace(/\b(submission outcome|finish|hub|general)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return `${name || position.name} BJJ`;
}

function commonsSearchURL(term) {
  return `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(term)}&title=Special:MediaSearch&type=image`;
}

function setLocation(id, role = current().role, via = null, continuePath = false) {
  if (!byId.has(id)) return;
  path = continuePath
    ? [...path, { id, role, via }]
    : [{ id, role, via: null }];
  render();
  if (continuePath && window.matchMedia('(max-width: 640px)').matches) {
    document.querySelector('.path-panel').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderIndex() {
  const query = els.search.value.trim().toLocaleLowerCase();
  const familyFilter = els.family.value;
  const visible = positions.filter((position) =>
    (!query || `${position.name} ${position.family} ${position.stage}`.toLocaleLowerCase().includes(query))
    && (!familyFilter || position.family === familyFilter));
  els.indexCount.textContent = `${visible.length} / ${positions.length}`;
  const groups = new Map();
  for (const position of visible) {
    if (!groups.has(position.family)) groups.set(position.family, []);
    groups.get(position.family).push(position);
  }
  els.list.innerHTML = [...groups.entries()].map(([family, group]) =>
    `<div class="position-group-label family-${colorKey(family)}">${escapeHTML(family.toUpperCase())}</div>${group.map((position) => `
      <button class="position-choice ${position.id === current().id ? 'active' : ''}" data-position="${escapeHTML(position.id)}">
        <span class="p-dot family-${colorKey(position.family)}"></span><span>${escapeHTML(position.name)}</span><span class="p-role">${escapeHTML(roleName(position, current().role))}</span>
      </button>`).join('')}`
  ).join('');
  els.list.querySelectorAll('[data-position]').forEach((button) => {
    button.addEventListener('click', () => setLocation(button.dataset.position));
  });
}

function renderBreadcrumbs() {
  els.breadcrumbs.innerHTML = path.map((step, index) => {
    const position = byId.get(step.id);
    const roleText = roleName(position, step.role);
    const name = `${position.name} · ${roleText}`;
    const crumb = `<button class="crumb family-${colorKey(position.family)} ${index === path.length - 1 ? 'current' : ''}" data-crumb="${index}" ${index === path.length - 1 ? 'aria-current="step"' : ''}>${escapeHTML(name)}</button>`;
    const arrow = index ? '<span class="crumb-arrow">→</span>' : '';
    return arrow + crumb;
  }).join('');
  els.breadcrumbs.querySelectorAll('[data-crumb]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.crumb);
      path = path.slice(0, index + 1);
      render();
    });
  });
  document.querySelector('#back-button').disabled = path.length < 2;
}

function renderPosition() {
  const step = current();
  const position = byId.get(step.id);
  const roleText = roleName(position, step.role).toUpperCase();
  const description = position[step.role] || position.bottom;
  els.selected.className = `selected-position family-${colorKey(position.family)} role-${step.role}`;
  const photoTerm = photoSearchTerm(position);
  const photoSearch = commonsSearchURL(photoTerm);
  let photo = `<div class="position-photo no-photo"><a href="${photoSearch}" target="_blank" rel="noopener noreferrer" aria-label="Open Commons photo search for ${escapeHTML(position.name)}">⌕<span class="photo-caption">OPEN POSITION PHOTO SEARCH ↗</span></a></div>`;
  if (position.ref) {
    const imageURL = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(position.ref.file)}?width=900`;
    photo = `<div class="position-photo"><img src="${imageURL}" alt="Photo reference: ${escapeHTML(position.name)}" loading="lazy" onerror="this.parentElement.classList.add('no-photo');this.style.display='none'"><span class="photo-caption">POSITION PHOTO · WIKIMEDIA COMMONS</span></div>`;
  }
  const attribution = position.ref
    ? `<div class="photo-credit"><a href="${escapeHTML(position.ref.page)}" target="_blank" rel="noopener noreferrer">Photo source &amp; license</a> · ${escapeHTML(position.ref.credit)}</div>`
    : '<div class="photo-credit">Browse community reference photos on Wikimedia Commons.</div>';
  els.selected.innerHTML = `${photo}<div class="position-copy">
    <div class="position-tags"><span class="family-tag">${escapeHTML(position.family)}</span><span class="stage-tag">${escapeHTML(position.stage)}</span></div>
    <h2>${escapeHTML(position.name)}</h2><div class="role-title">${roleText} VIEW</div><p>${escapeHTML(description)}</p>
    <div class="reference-links"><a href="${photoSearch}" target="_blank" rel="noopener noreferrer">Find more position photos ↗</a>${position.ref ? `<a href="${escapeHTML(position.ref.page)}" target="_blank" rel="noopener noreferrer">Image details ↗</a>` : ''}</div>
    ${attribution}</div>`;
}

function branchInsight(type) {
  const key = String(type).toLowerCase();
  if (key.includes('sweep') || key.includes('reversal')) return [
    'Can reverse who is on top and open a route to stable control.',
    'Timing matters; a missed attempt can expose you to a pass or pin.',
  ];
  if (key.includes('submission') || key.includes('attack')) return [
    'Creates a finish threat and may open linked attacks if the defence reacts.',
    'Needs control and isolation; rushing can lose position or hurt a partner.',
  ];
  if (key.includes('pass') || key.includes('advance') || key.includes('takedown')) return [
    'Moves toward top control and stronger scoring or submission positions.',
    'Frames, hooks, or a counter can stop the advance and expose a scramble.',
  ];
  if (key.includes('escape') || key.includes('defence') || key.includes('recovery')) return [
    'Addresses immediate pressure and creates room to rebuild a safer position.',
    'Often returns to a contested guard or scramble rather than ending the exchange.',
  ];
  if (key.includes('back take')) return [
    'Reaches a highly controlling angle with follow-up choke threats.',
    'Losing chest or hip connection can let the partner turn and face you.',
  ];
  if (key.includes('entry') || key.includes('clinch')) return [
    'Builds a connected starting point for the next attack or transition.',
    'The opponent can counter, disengage, or win inside position during the entry.',
  ];
  return [
    'Connects this position to another option and keeps the sequence moving.',
    'The best follow-up depends on your partner’s reaction, grips, and balance.',
  ];
}

function renderBranches() {
  const step = current();
  const position = byId.get(step.id);
  const outgoing = links.filter((link) => link.from === step.id && link.from_role === step.role);
  els.count.textContent = `${outgoing.length} branches`;
  els.empty.hidden = outgoing.length !== 0;
  els.branches.innerHTML = outgoing.map((link) => {
    const destination = byId.get(link.to);
    const type = link.type || 'transition';
    const videoURL = link.video || `https://www.youtube.com/results?search_query=${encodeURIComponent(`Brazilian Jiu-Jitsu ${link.technique}`)}`;
    const video = `<div class="branch-video"><a href="${escapeHTML(videoURL)}" target="_blank" rel="noopener noreferrer">${link.video ? 'Watch related breakdown' : 'Find a video breakdown'} ↗</a></div>`;
    const note = link.note ? `<div class="branch-note">Coach note · ${escapeHTML(link.note)}</div>` : '';
    const [upside, tradeoff] = branchInsight(type);
    return `<article class="branch type-${branchColor(type)}">
      <div class="branch-current family-${colorKey(position.family)}"><span class="overline">FROM HERE</span><strong>${escapeHTML(position.name)}</strong></div>
      <span class="branch-arrow" aria-hidden="true">→</span>
      <div class="branch-technique"><span class="branch-type">${escapeHTML(type)}</span><strong>${escapeHTML(link.technique)}</strong><small>${escapeHTML(link.belt || 'All levels')}</small></div>
      <span class="branch-arrow" aria-hidden="true">→</span>
      <button class="branch-target family-${colorKey(destination.family)}" data-go="${escapeHTML(link.to)}" data-role="${escapeHTML(link.to_role)}"><span class="overline">NEXT POSITION</span><strong>${escapeHTML(destination.name)}</strong><small>${escapeHTML(roleName(destination, link.to_role))} view</small><span class="go">↗</span></button>
      <div class="branch-insight"><span><b>UPSIDE</b>${escapeHTML(upside)}</span><span><b>TRADE-OFF</b>${escapeHTML(tradeoff)}</span></div>
      ${note}${video}
    </article>`;
  }).join('');
  els.branches.querySelectorAll('[data-go]').forEach((button) => {
    button.addEventListener('click', () => setLocation(button.dataset.go, button.dataset.role, outgoing.find((link) => link.to === button.dataset.go && link.to_role === button.dataset.role), true));
  });
}

function renderIncoming() {
  const step = current();
  const incoming = links.filter((link) => link.to === step.id && link.to_role === step.role && link.from !== step.id);
  const content = incoming.slice(0, 9).map((link) => {
    const source = byId.get(link.from);
    return `<span class="incoming-item"><button data-incoming="${escapeHTML(link.from)}" data-role="${escapeHTML(link.from_role)}" title="Go back to ${escapeHTML(source.name)}">${escapeHTML(source.name)}</button> → ${escapeHTML(link.technique)}</span>`;
  }).join('');
  els.incoming.innerHTML = `<p class="incoming-title">WAYS INTO THIS POSITION</p>${content ? `<div class="incoming-list">${content}</div>` : '<span class="incoming-empty">Choose a connection to build a route into this position.</span>'}`;
  els.incoming.querySelectorAll('[data-incoming]').forEach((button) => {
    button.addEventListener('click', () => setLocation(button.dataset.incoming, button.dataset.role));
  });
}

function render() {
  renderIndex();
  renderBreadcrumbs();
  renderPosition();
  renderBranches();
  renderIncoming();
  document.querySelectorAll('.view-toggle button').forEach((button) => {
    button.classList.toggle('active', button.dataset.role === current().role);
    button.setAttribute('aria-pressed', String(button.dataset.role === current().role));
    button.textContent = roleName(byId.get(current().id), button.dataset.role);
  });
}

document.querySelectorAll('.view-toggle button').forEach((button) => {
  button.addEventListener('click', () => {
    current().role = button.dataset.role;
    current().via = null;
    render();
  });
});
els.search.addEventListener('input', renderIndex);
els.family.addEventListener('change', renderIndex);
document.querySelector('#back-button').addEventListener('click', () => {
  if (path.length > 1) path = path.slice(0, -1);
  render();
});
document.querySelector('#reset-map').addEventListener('click', () => {
  path = [{ id: 'closed-guard', role: 'bottom', via: null }];
  els.search.value = '';
  els.family.value = '';
  render();
});
document.querySelector('#position-total').textContent = positions.length;
document.querySelector('#link-total').textContent = links.length;
render();
