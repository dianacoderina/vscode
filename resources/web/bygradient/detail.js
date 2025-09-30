import { gradients } from './data.js';

const params = new URLSearchParams(window.location.search);
const requestedId = params.get('id');

const previewEl = document.getElementById('gradientPreview');
const nameEl = document.getElementById('gradientName');
const descriptionEl = document.getElementById('gradientDescription');
const hexListEl = document.getElementById('hexList');
const tagListEl = document.getElementById('tagList');
const colorStopsEl = document.getElementById('colorStops');
const addStopBtn = document.getElementById('addStop');
const angleSlider = document.getElementById('angleSlider');
const angleValue = document.getElementById('angleValue');
const toggleButtons = document.querySelectorAll('.toggle-group__button');
const contrastValueEl = document.getElementById('contrastValue');
const relatedListEl = document.getElementById('relatedGradients');
const randomBtn = document.getElementById('randomGradient');
const addToFigmaHeader = document.getElementById('addToFigmaHeader');
const detailAddToFigmaBtn = document.getElementById('detailAddToFigma');

const statusEl = document.createElement('div');
statusEl.className = 'sr-status';
statusEl.setAttribute('aria-live', 'polite');
statusEl.setAttribute('aria-atomic', 'true');
document.body.append(statusEl);

function announce(message) {
  statusEl.textContent = message;
}

const state = {
  gradient: gradients.find((g) => g.id === requestedId) || gradients[0],
  type: 'linear',
  angle: Number(angleSlider.value) || 45,
  colors: [],
};

function init() {
  if (!state.gradient) {
    window.location.href = './';
    return;
  }
  angleSlider.value = state.angle;
  angleValue.textContent = `${state.angle}°`;
  loadGradient(state.gradient);
  bindEvents();
}

function loadGradient(gradient) {
  state.gradient = gradient;
  state.colors = [...gradient.colors];
  state.angle = 45;
  angleSlider.value = state.angle;
  angleValue.textContent = `${state.angle}°`;
  state.type = 'linear';
  toggleButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.type === state.type));
  updatePreview();
  renderMeta();
  renderColorStops();
  renderRelated();
  updateContrast();
}

function updatePreview() {
  const gradientCss =
    state.type === 'linear'
      ? `linear-gradient(${state.angle}deg, ${state.colors.join(', ')})`
      : `radial-gradient(circle at center, ${state.colors.join(', ')})`;

  previewEl.style.setProperty('background', gradientCss);
}

function renderMeta() {
  const gradient = state.gradient;
  nameEl.textContent = gradient.name;
  descriptionEl.textContent = gradient.description;

  hexListEl.innerHTML = '';
  state.colors.forEach((color) => {
    const li = document.createElement('li');
    li.textContent = color.toUpperCase();
    hexListEl.append(li);
  });

  tagListEl.innerHTML = '';
  gradient.tags.forEach((tag) => {
    const span = document.createElement('span');
    span.textContent = tag;
    tagListEl.append(span);
  });
}

function renderColorStops() {
  colorStopsEl.innerHTML = '';
  state.colors.forEach((color, index) => {
    const row = document.createElement('div');
    row.className = 'color-stop';

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = normalizeColor(color);
    colorInput.addEventListener('input', () => {
      updateColor(index, colorInput.value);
    });

    const textInput = document.createElement('input');
    textInput.type = 'text';
    textInput.value = color.toUpperCase();
    textInput.maxLength = 7;
    textInput.addEventListener('change', () => {
      const valid = validateHex(textInput.value);
      if (valid) {
        updateColor(index, valid);
      } else {
        textInput.value = state.colors[index];
      }
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.disabled = state.colors.length <= 2;
    removeBtn.addEventListener('click', () => {
      if (state.colors.length > 2) {
        state.colors.splice(index, 1);
        renderColorStops();
        updatePreview();
        renderMeta();
        updateContrast();
      }
    });

    row.append(colorInput, textInput, removeBtn);
    colorStopsEl.append(row);
  });
}

function renderRelated() {
  relatedListEl.innerHTML = '';
  const related = state.gradient.related
    .map((id) => gradients.find((g) => g.id === id))
    .filter(Boolean);

  related.forEach((gradient) => {
    const item = document.createElement('a');
    item.href = `gradient.html?id=${gradient.id}`;
    item.className = 'related-item';

    const preview = document.createElement('span');
    preview.className = 'related-item__preview';
    preview.style.background = `linear-gradient(135deg, ${gradient.colors.join(', ')})`;

    const name = document.createElement('span');
    name.textContent = gradient.name;

    item.append(name, preview);
    relatedListEl.append(item);
  });
}

function updateColor(index, value) {
  state.colors[index] = value.toUpperCase();
  renderColorStops();
  renderMeta();
  updatePreview();
  updateContrast();
}

function validateHex(value) {
  const hex = value.trim().replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `#${hex.toUpperCase()}`;
  }
  return null;
}

function normalizeColor(color) {
  if (!color.startsWith('#')) {
    return '#000000';
  }
  if (color.length === 7) {
    return color;
  }
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  return '#000000';
}

function bindEvents() {
  addStopBtn.addEventListener('click', () => {
    state.colors.push('#FFFFFF');
    renderColorStops();
    renderMeta();
    updatePreview();
    updateContrast();
  });

  angleSlider.addEventListener('input', () => {
    state.angle = Number(angleSlider.value);
    angleValue.textContent = `${state.angle}°`;
    updatePreview();
  });

  toggleButtons.forEach((button) => {
    button.addEventListener('click', () => {
      toggleButtons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');
      state.type = button.dataset.type;
      updatePreview();
    });
  });

  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', () => {
      const type = button.dataset.copy;
      const css =
        state.type === 'linear'
          ? `linear-gradient(${state.angle}deg, ${state.colors.join(', ')})`
          : `radial-gradient(circle at center, ${state.colors.join(', ')})`;

      let payload = '';
      if (type === 'css') {
        payload = `background: ${css};`;
      } else if (type === 'tailwind') {
        payload = `bg-[${css}]`;
      } else if (type === 'svg') {
        payload = `<svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" gradientTransform="rotate(${state.angle})">${state.colors
          .map(
            (color, index) =>
              `<stop offset="${Math.round((index / Math.max(1, state.colors.length - 1)) * 100)}%" stop-color="${color}" />`
          )
          .join('')}</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)" /></svg>`;
      }

      navigator.clipboard?.writeText(payload).then(() => {
        announce(`${type.toUpperCase()} copied to clipboard`);
      });
    });
  });

  function copyFigmaNote() {
    const note = `${state.gradient.name} — ${state.colors.join(', ')}`;
    navigator.clipboard?.writeText(note).then(() => {
      announce(`${state.gradient.name} copied. Paste inside Figma to apply the gradient.`);
    });
  }

  addToFigmaHeader.addEventListener('click', copyFigmaNote);
  detailAddToFigmaBtn.addEventListener('click', copyFigmaNote);

  randomBtn.addEventListener('click', () => {
    const pool = gradients.filter((g) => g.id !== state.gradient.id);
    const random = pool[Math.floor(Math.random() * pool.length)] || state.gradient;
    loadGradient(random);
    history.replaceState(null, '', `?id=${random.id}`);
    announce(`${random.name} loaded`);
  });
}

function updateContrast() {
  const textColor = '#FFFFFF';
  const luminanceValues = state.colors.map((color) => getLuminance(hexToRgb(color)));
  const averageLuminance = luminanceValues.reduce((acc, val) => acc + val, 0) / luminanceValues.length;
  const textLuminance = getLuminance(hexToRgb(textColor));
  const [lighter, darker] = averageLuminance > textLuminance ? [averageLuminance, textLuminance] : [textLuminance, averageLuminance];
  const contrast = ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
  let rating = 'Needs work';
  const ratio = Number(contrast);
  if (ratio >= 7) {
    rating = 'AAA';
  } else if (ratio >= 4.5) {
    rating = 'AA';
  }
  contrastValueEl.textContent = `${contrast}:1 (${rating})`;
}

function hexToRgb(hex) {
  const parsed = hex.replace('#', '');
  const bigint = parseInt(parsed, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function getLuminance({ r, g, b }) {
  const srgb = [r, g, b].map((value) => {
    const channel = value / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

init();
