async function loadIndex() {
  // Prefer co-located JSON if present (for GitHub Pages deploy to docs/site)
  const local = 'lp-index.json';
  const fallback = '../docs/lp-index.json';
  try {
    return await (await fetch(local, { cache: 'no-store' })).json();
  } catch (e) {
    return await (await fetch(fallback, { cache: 'no-store' })).json();
  }
}

function normalize(s) { return (s || '').toString().toLowerCase(); }

function applyFilters(data) {
  const q = normalize(document.getElementById('q').value);
  const t = document.getElementById('typeFilter').value;
  const c = document.getElementById('categoryFilter').value;
  const s = document.getElementById('statusFilter').value;
  const sortBy = document.getElementById('sortBy').value;

  let list = data.lps.filter(item => {
    const hay = `${normalize(item.title)} ${normalize(item.author)} ${normalize(item.description)} ${normalize(item.number)}`;
    const matchQ = q ? hay.includes(q) : true;
    const matchT = t ? item.type === t : true;
    const matchC = c ? item.category === c : true;
    const matchS = s ? item.status === s : true;
    return matchQ && matchT && matchC && matchS;
  });

  list.sort((a, b) => {
    if (sortBy === 'number') return a.number - b.number;
    return normalize(a[sortBy]).localeCompare(normalize(b[sortBy]));
  });

  return list;
}

function render(list) {
  const ul = document.getElementById('list');
  const rowT = document.getElementById('row');
  ul.innerHTML = '';
  for (const item of list) {
    const li = rowT.content.firstElementChild.cloneNode(true);
    li.querySelector('.num').textContent = `LP-${item.number}`;
    li.querySelector('.status').textContent = item.status || '—';
    li.querySelector('.type').textContent = item.type || '—';
    li.querySelector('.category').textContent = item.category || '—';
    li.querySelector('.title').textContent = item.title || 'Untitled';
    li.querySelector('.desc').textContent = item.description || '';
    li.querySelector('.view').href = item.github_view;
    li.querySelector('.edit').href = item.github_edit;
    li.querySelector('.file').href = `../${item.file}`;
    const disc = li.querySelector('.discussion');
    if (item.discussions_to) {
      disc.href = item.discussions_to;
    } else {
      disc.remove();
    }
    ul.appendChild(li);
  }
  document.getElementById('summary').textContent = `${list.length} result(s)`;
}

function bindControls(data) {
  const ids = ['q', 'typeFilter', 'categoryFilter', 'statusFilter', 'sortBy'];
  const onChange = () => render(applyFilters(data));
  ids.forEach(id => document.getElementById(id).addEventListener('input', onChange));
  ids.forEach(id => document.getElementById(id).addEventListener('change', onChange));
}

(async function init() {
  const data = await loadIndex();
  bindControls(data);
  render(applyFilters(data));
})();

