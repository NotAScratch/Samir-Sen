/* Specimens: NVIDIA SimReady objects listed in assets/simready/manifest.json
   (see tools/simready/README.md). The section stays hidden until the manifest
   lists at least one valid specimen; nothing here invents one. */

const MODEL_PATH = /^assets\/simready\/[\w.-]+\.glb$/;
const POSTER_PATH = /^assets\/simready\/[\w.-]+\.(webp|png)$/;

/** Keeps only complete entries whose model lives in assets/simready/. */
export function validSpecimens(manifest) {
  const list = Array.isArray(manifest?.specimens) ? manifest.specimens : [];
  return list.filter((item) => item
    && ['name', 'category', 'model', 'credit'].every((key) => typeof item[key] === 'string' && item[key].trim())
    && MODEL_PATH.test(item.model))
    .map((item) => ({ ...item, poster: POSTER_PATH.test(item.poster ?? '') ? item.poster : '' }));
}

export async function initSpecimens(root = document, { url = 'assets/simready/manifest.json', fetcher = fetch } = {}) {
  const section = root.getElementById('specimens');
  if (!section) return [];
  let specimens = [];
  try {
    const response = await fetcher(url, { cache: 'no-cache' });
    if (response.ok) specimens = validSpecimens(await response.json());
  } catch {
    // No manifest, or a broken one: the section simply stays hidden.
  }
  if (!specimens.length) return [];

  const stage = section.querySelector('[data-robot="specimen"]');
  const list = section.querySelector('.specimen-list');
  const name = section.querySelector('.specimen-name');
  const credit = section.querySelector('.specimen-credit');
  const buttons = specimens.map((item) => {
    const li = root.createElement('li');
    const button = root.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    const label = root.createElement('span');
    label.textContent = item.name;
    const category = root.createElement('span');
    category.textContent = item.category;
    button.append(label, ' ', category);
    li.append(button);
    list.append(li);
    return button;
  });

  const select = (index) => {
    const item = specimens[index];
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    name.textContent = `Fig. 05 — ${item.name}`;
    credit.textContent = item.credit;
    if (stage.dataset.model === item.model) return;
    // A still for visitors without live 3D (reduced motion, data saver, no WebGL).
    stage.querySelector('.robot-poster')?.remove();
    if (item.poster) {
      const img = root.createElement('img');
      img.className = 'robot-poster';
      img.src = item.poster;
      img.alt = '';
      stage.prepend(img);
    }
    stage.dataset.model = item.model;
    stage.dispatchEvent(new CustomEvent('robot:reload'));
  };
  buttons.forEach((button, i) => button.addEventListener('click', () => select(i)));
  select(0);
  section.hidden = false;
  return specimens;
}
