import { gradients, hues } from './data.js';

const state = {
  hue: 'all',
  colorCount: 'all',
  sort: 'popularity',
  infinite: false,
  material: 'all',
  popularityFilter: 'all',
};

const galleryEl = document.getElementById('gallery');
const template = document.getElementById('gradientCardTemplate');
const hueChips = document.getElementById('hueChips');
const materialChips = document.getElementById('materialChips');
const popularityChips = document.getElementById('popularityChips');
const colorCountOptions = document.getElementById('colorCountOptions');
const sortSelect = document.getElementById('sortSelect');
const infiniteToggle = document.getElementById('infiniteToggle');
const loadMoreBtn = document.getElementById('loadMore');

let filteredGradients = [...gradients];
let visibleCount = 6;
let infiniteObserverAttached = false;

const materials = ['all', ...new Set(gradients.map((gradient) => gradient.material))];
const popularityFilters = [
  { id: 'all', label: 'All' },
  { id: 'trending', label: 'Trending 90+' },
  { id: 'favorites', label: 'Fan favorites 80+' },
  { id: 'emerging', label: 'Emerging <80' },
];

const statusEl = document.createElement('div');
statusEl.className = 'sr-status';
statusEl.setAttribute('aria-live', 'polite');
statusEl.setAttribute('aria-atomic', 'true');
document.body.append(statusEl);

function announce(message) {
  statusEl.textContent = message;
}

function renderHueChips() {
  hues.forEach((hue) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (hue === state.hue ? ' active' : '');
    chip.textContent = hue === 'all' ? 'All hues' : hue.charAt(0).toUpperCase() + hue.slice(1);
    chip.dataset.hue = hue;
    chip.addEventListener('click', () => {
      state.hue = hue;
      updateActiveChip();
      applyFilters();
      announce(`Filtered by ${chip.textContent}`);
    });
    hueChips.append(chip);
  });
}

function updateActiveChip() {
  hueChips.querySelectorAll('.chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.hue === state.hue);
  });
}

function renderMaterialChips() {
  materials.forEach((material) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (material === state.material ? ' active' : '');
    chip.textContent = material === 'all' ? 'All materials' : material.charAt(0).toUpperCase() + material.slice(1);
    chip.dataset.material = material;
    chip.addEventListener('click', () => {
      state.material = material;
      updateMaterialChips();
      applyFilters();
      announce(`Filtered by ${chip.textContent}`);
    });
    materialChips.append(chip);
  });
}

function updateMaterialChips() {
  materialChips.querySelectorAll('.chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.material === state.material);
  });
}

function renderPopularityChips() {
  popularityFilters.forEach((filter) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip' + (filter.id === state.popularityFilter ? ' active' : '');
    chip.textContent = filter.label;
    chip.dataset.filter = filter.id;
    chip.addEventListener('click', () => {
      state.popularityFilter = filter.id;
      updatePopularityChips();
      applyFilters();
      announce(`Popularity filter set to ${filter.label}`);
    });
    popularityChips.append(chip);
  });
}

function updatePopularityChips() {
  popularityChips.querySelectorAll('.chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.filter === state.popularityFilter);
  });
}

function renderColorCountOptions() {
  colorCountOptions.querySelectorAll('.segmented__option').forEach((option) => {
    option.addEventListener('click', () => {
      colorCountOptions
        .querySelectorAll('.segmented__option')
        .forEach((opt) => opt.classList.remove('active'));
      option.classList.add('active');
      state.colorCount = option.dataset.count;
      applyFilters();
      announce(`Filtered by ${option.textContent} colors`);
    });
  });
}

function attachEventHandlers() {
  sortSelect.addEventListener('change', () => {
    state.sort = sortSelect.value;
    applyFilters();
  });

  infiniteToggle.addEventListener('change', () => {
    state.infinite = infiniteToggle.checked;
    visibleCount = 6;
    applyFilters();
    if (state.infinite) {
      loadMoreBtn.hidden = true;
      attachInfiniteScroll();
    } else {
      detachInfiniteScroll();
      loadMoreBtn.hidden = false;
    }
  });

  loadMoreBtn.addEventListener('click', () => {
    visibleCount += 6;
    renderGallery();
  });
}

function attachInfiniteScroll() {
  if (infiniteObserverAttached) return;
  window.addEventListener('scroll', handleInfiniteScroll);
  infiniteObserverAttached = true;
}

function detachInfiniteScroll() {
  if (!infiniteObserverAttached) return;
  window.removeEventListener('scroll', handleInfiniteScroll);
  infiniteObserverAttached = false;
}

function handleInfiniteScroll() {
  const { scrollY, innerHeight } = window;
  const { offsetHeight } = document.body;
  if (scrollY + innerHeight >= offsetHeight - 400) {
    const moreAvailable = visibleCount < filteredGradients.length;
    if (moreAvailable) {
      visibleCount += 6;
      renderGallery();
    }
  }
}

function applyFilters() {
  filteredGradients = gradients
    .filter((gradient) => {
      const hueMatch = state.hue === 'all' || gradient.primaryHue === state.hue;
      const colorMatch =
        state.colorCount === 'all' || gradient.colorCount === Number(state.colorCount);
      const materialMatch = state.material === 'all' || gradient.material === state.material;
      const popularityMatch = getPopularityMatch(gradient.popularity);
      return hueMatch && colorMatch && materialMatch && popularityMatch;
    })
    .sort((a, b) => {
      switch (state.sort) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'material':
          return a.material.localeCompare(b.material);
        default:
          return b.popularity - a.popularity;
      }
    });

  visibleCount = state.infinite ? Math.min(visibleCount, filteredGradients.length) : 6;
  renderGallery();
}

function getPopularityMatch(score) {
  switch (state.popularityFilter) {
    case 'trending':
      return score >= 90;
    case 'favorites':
      return score >= 80 && score < 90;
    case 'emerging':
      return score < 80;
    default:
      return true;
  }
}

function renderGallery() {
  galleryEl.innerHTML = '';
  const items = filteredGradients.slice(0, visibleCount);
  items.forEach((gradient) => {
    const card = createGradientCard(gradient);
    galleryEl.append(card);
  });

  if (!state.infinite) {
    const hasMore = visibleCount < filteredGradients.length;
    loadMoreBtn.hidden = !hasMore;
  }

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No gradients match your filters yet. Try a different combination.';
    galleryEl.append(empty);
  }
}

function createGradientCard(gradient) {
  const node = template.content.firstElementChild.cloneNode(true);
  const preview = node.querySelector('.gradient-card__preview');
  const title = node.querySelector('.gradient-card__title');
  const tags = node.querySelector('.gradient-card__tags');
  const popularityValue = node.querySelector('.gradient-card__popularity-value');
  const popularityBar = node.querySelector('.gradient-card__popularity-bar');
  const actions = node.querySelectorAll('.gradient-card__actions .icon-btn');

  const gradientCss = `linear-gradient(135deg, ${gradient.colors.join(', ')})`;
  preview.style.background = gradientCss;
  title.textContent = gradient.name;
  tags.textContent = `${gradient.material} · ${gradient.tags.join(' · ')}`;
  popularityValue.textContent = `${gradient.popularity}/100`;
  popularityBar.style.setProperty('--popularity', gradient.popularity / 100);

  actions.forEach((action) => {
    action.addEventListener('click', (event) => {
      event.stopPropagation();
      const type = action.dataset.action;
      if (type === 'copy-css') {
        copyCss(gradientCss);
      } else if (type === 'view') {
        window.location.href = `gradient.html?id=${gradient.id}`;
      } else if (type === 'figma') {
        addToFigma(gradient);
      }
    });
  });

  node.addEventListener('click', () => {
    window.location.href = `gradient.html?id=${gradient.id}`;
  });

  node.setAttribute('tabindex', '0');
  node.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      window.location.href = `gradient.html?id=${gradient.id}`;
    }
  });

  return node;
}

function copyCss(css) {
  navigator.clipboard?.writeText(`background: ${css};`).then(() => {
    announce('Gradient CSS copied to clipboard');
  });
}

function addToFigma(gradient) {
  const note = `${gradient.name} — ${gradient.colors.join(', ')}`;
  navigator.clipboard?.writeText(note).then(() => {
    announce(`${gradient.name} copied. Paste inside Figma to re-create the gradient.`);
  });
}

renderHueChips();
renderMaterialChips();
renderPopularityChips();
renderColorCountOptions();
attachEventHandlers();
applyFilters();
