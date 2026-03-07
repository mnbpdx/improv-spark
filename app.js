const state = {
  progressionComplexity: 'simple',
  chordComplexity: 'basic',
  wordPrompt: false,
  lockedKey: 'random',
  highlight: 'chord',
  mode: 'performance',
};

let currentGenerated = null;
let favorites = JSON.parse(localStorage.getItem('improv-spark-favs') || '[]');

function favId(item) {
  return item.key + ':' + item.degrees.join(',');
}

function isFavorited() {
  if (!currentGenerated) return false;
  const id = favId(currentGenerated);
  return favorites.some(f => favId(f) === id);
}

function toggleFavorite() {
  if (!currentGenerated) return;
  const id = favId(currentGenerated);
  if (isFavorited()) {
    favorites = favorites.filter(f => favId(f) !== id);
  } else {
    favorites.unshift({ ...currentGenerated });
  }
  localStorage.setItem('improv-spark-favs', JSON.stringify(favorites));
  renderFavBtn();
  renderFavoritesList();
}

function renderFavBtn() {
  const btn = document.getElementById('fav-btn');
  btn.textContent = isFavorited() ? '\u2605' : '\u2606';
  btn.classList.toggle('fav-active', isFavorited());
}

function renderFavoritesList() {
  const panel = document.getElementById('favorites-panel');
  const list = document.getElementById('favorites-list');
  list.innerHTML = '';
  if (favorites.length === 0) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  favorites.forEach((fav, i) => {
    const li = document.createElement('li');
    li.className = 'fav-item';
    const label = document.createElement('span');
    label.className = 'fav-label';
    label.textContent = `${fav.key}  ${fav.chords.map(c => c.name).join('  ')}`;
    label.addEventListener('click', () => loadFavorite(fav));
    const remove = document.createElement('button');
    remove.className = 'fav-remove';
    remove.textContent = '\u00d7';
    remove.addEventListener('click', () => {
      favorites.splice(i, 1);
      localStorage.setItem('improv-spark-favs', JSON.stringify(favorites));
      renderFavBtn();
      renderFavoritesList();
    });
    li.appendChild(label);
    li.appendChild(remove);
    list.appendChild(li);
  });
}

function loadFavorite(fav) {
  currentGenerated = fav;
  renderProgression(fav.key, fav.chords);
  renderFavBtn();
}

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveChord(degree, keyRoot, chordComplexity) {
  const chromatic = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const rootIdx = chromatic.indexOf(keyRoot);
  const semitones = DEGREE_SEMITONE[degree];
  if (semitones === undefined) return degree; // fallback

  const noteIdx = (rootIdx + semitones) % 12;
  const note = chromatic[noteIdx];
  const quality = DEGREE_QUALITY[degree] || 'maj';

  let suffix;
  if (chordComplexity === 'rich' && RICH_OVERRIDES[degree]) {
    suffix = RICH_OVERRIDES[degree];
  } else {
    suffix = CHORD_SUFFIX[quality]?.[chordComplexity] ?? '';
  }

  // For dominant chords at basic tier, just show the note (no "7" for pure triads)
  // Actually keep the 7 since dominant triads are valid — but strip it for basic
  if (chordComplexity === 'basic' && quality === 'dom') {
    suffix = ''; // major triad as dominant stand-in
  }

  return note + suffix;
}

function renderProgression(key, chords) {
  document.getElementById('key-label').textContent = `KEY OF ${key}`;
  const chordsEl = document.getElementById('chords');
  chordsEl.innerHTML = '';
  chords.forEach(({ name, degree }) => {
    const span = document.createElement('span');
    const funcClass = DEGREE_FUNCTION[degree] ? ` func-${DEGREE_FUNCTION[degree]}` : '';
    span.className = `chord-pill${funcClass}`;
    span.innerHTML = `<span class="chord-name">${name}</span><span class="chord-degree">${degree}</span>`;
    chordsEl.appendChild(span);
  });
  if (state.highlight === 'roman') chordsEl.classList.add('show-roman');
}

function generate() {
  const key = state.lockedKey === 'random' ? rand(KEYS) : state.lockedKey;
  const degrees = rand(PROGRESSIONS[state.progressionComplexity]);
  const chords = degrees.map(deg => ({
    name: resolveChord(deg, key, state.chordComplexity),
    degree: deg,
  }));

  currentGenerated = { key, degrees, chords };
  renderProgression(key, chords);
  renderFavBtn();

  // Word prompt
  const wordEl = document.getElementById('word-prompt');
  if (state.wordPrompt) {
    wordEl.textContent = rand(WORDS);
    wordEl.hidden = false;
  } else {
    wordEl.hidden = true;
  }
}

function setToggle(group, value) {
  document.querySelectorAll(`[data-group="${group}"]`).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === value);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const app = document.querySelector('.app');
  const modeBtn = document.getElementById('mode-btn');

  // Mode toggle
  modeBtn.addEventListener('click', () => {
    state.mode = state.mode === 'performance' ? 'setup' : 'performance';
    app.dataset.mode = state.mode;
    modeBtn.textContent = state.mode === 'performance' ? '⚙ Settings' : '← Done';
  });

  // Toggle buttons
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const { group, value } = btn.dataset;
      if (group === 'progression') state.progressionComplexity = value;
      if (group === 'chord') state.chordComplexity = value;
      if (group === 'highlight') {
        state.highlight = value;
        document.getElementById('chords').classList.toggle('show-roman', value === 'roman');
        return;
      }
      if (group === 'word') {
        state.wordPrompt = value === 'on';
        generate();
      }
      setToggle(group, value);
    });
  });

  // Key select
  const keySelect = document.getElementById('key-select');
  KEYS.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    keySelect.appendChild(opt);
  });
  keySelect.addEventListener('change', () => {
    state.lockedKey = keySelect.value;
  });

  // Generate button
  document.getElementById('generate-btn').addEventListener('click', generate);

  // Favorite button
  document.getElementById('fav-btn').addEventListener('click', toggleFavorite);

  // Spacebar
  document.addEventListener('keydown', e => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      generate();
    }
  });

  // Set initial toggle states
  setToggle('progression', state.progressionComplexity);
  setToggle('chord', state.chordComplexity);
  setToggle('highlight', state.highlight);
  setToggle('word', 'off');

  // Initial generation
  generate();
  renderFavoritesList();
});
