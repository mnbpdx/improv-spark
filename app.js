const state = {
  progressionComplexity: 'simple',
  chordComplexity: 'basic',
  wordPrompt: false,
  lockedKey: 'C',
  highlight: 'chord',
  mode: 'performance',
  audioTone: 'soft',
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
  const list = document.getElementById('favorites-list');
  const empty = document.getElementById('fav-empty');
  list.innerHTML = '';
  empty.hidden = favorites.length > 0;
  favorites.forEach((fav, i) => {
    const li = document.createElement('li');
    li.className = 'fav-item';
    const label = document.createElement('span');
    label.className = 'fav-label';
    const tokens = state.highlight === 'roman' ? fav.degrees : fav.chords.map(c => c.name);
    label.textContent = `${fav.key}  ${tokens.join('  ')}`;
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
  if (semitones === undefined) return { name: degree, rootIdx: 0, intervals: [0, 4, 7] }; // fallback

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

  return {
    name: note + suffix,
    rootIdx: noteIdx,
    intervals: CHORD_INTERVALS[suffix] || [0, 4, 7],
  };
}

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playChordSoft(rootIdx, intervals) {
  const ctx = getAudioCtx();
  const baseFreq = 130.81 * Math.pow(2, rootIdx / 12); // C3

  intervals.forEach((interval, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.value = baseFreq * Math.pow(2, interval / 12);

    const t = ctx.currentTime + i * 0.02;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18 / intervals.length, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

    osc.start(t);
    osc.stop(t + 1.6);
  });
}

function playChordPiano(rootIdx, intervals) {
  const ctx = getAudioCtx();
  const baseFreq = 261.63 * Math.pow(2, rootIdx / 12); // C4

  // Real piano strings are slightly inharmonic — overtones stretch sharp
  const B = 0.0003;
  const harmonics = [1, 2, 3, 4];
  const hGains    = [0.55, 0.18, 0.07, 0.025];

  intervals.forEach((interval, i) => {
    const noteFreq = baseFreq * Math.pow(2, interval / 12);
    const t = ctx.currentTime + i * 0.022;

    harmonics.forEach((n, hi) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      // Inharmonic stretch: fn = f1 · n · √(1 + B·n²)
      osc.frequency.value = noteFreq * n * Math.sqrt(1 + B * n * n);

      const peak    = hGains[hi] / intervals.length;
      const sustain = peak * 0.28;
      const tail    = t + 2.2 - hi * 0.4; // overtones die faster

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peak, t + 0.010);    // soft hammer
      gain.gain.exponentialRampToValueAtTime(sustain, t + 0.09); // initial drop
      gain.gain.exponentialRampToValueAtTime(0.001, tail);   // slow tail

      osc.start(t);
      osc.stop(tail + 0.05);
    });
  });
}

function playChord(rootIdx, intervals) {
  if (isNaN(rootIdx) || !intervals || !intervals.length) return;
  if (state.audioTone === 'piano') playChordPiano(rootIdx, intervals);
  else playChordSoft(rootIdx, intervals);
}

function renderProgression(key, chords) {
  document.getElementById('key-label').textContent = `KEY OF ${key}`;
  const chordsEl = document.getElementById('chords');
  chordsEl.innerHTML = '';
  chords.forEach(({ name, degree, rootIdx, intervals }) => {
    const span = document.createElement('span');
    const funcClass = DEGREE_FUNCTION[degree] ? ` func-${DEGREE_FUNCTION[degree]}` : '';
    span.className = `chord-pill${funcClass}`;
    span.dataset.root = rootIdx;
    span.dataset.intervals = (intervals || [0, 4, 7]).join(',');
    span.innerHTML = `<span class="chord-name">${name}</span><span class="chord-degree">${degree}</span>`;
    span.addEventListener('click', () => {
      playChord(parseInt(span.dataset.root), span.dataset.intervals.split(',').map(Number));
      span.classList.add('playing');
      setTimeout(() => span.classList.remove('playing'), 600);
    });
    chordsEl.appendChild(span);
  });
  chordsEl.classList.toggle('chords-compact', chords.length > 6);
  if (state.highlight === 'roman') chordsEl.classList.add('show-roman');
}

function generate() {
  const key = state.lockedKey === 'random' ? rand(KEYS) : state.lockedKey;
  const degrees = rand(PROGRESSIONS[state.progressionComplexity]);
  const chords = degrees.map(deg => ({
    ...resolveChord(deg, key, state.chordComplexity),
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

  const favOpenBtn = document.getElementById('fav-open-btn');
  const backBtn = document.getElementById('back-btn');
  const appTitle = document.getElementById('app-title');

  const titles = { performance: 'Improv Spark', setup: 'Settings', favorites: 'Favorites' };

  function setMode(mode) {
    state.mode = mode;
    app.dataset.mode = mode;
    appTitle.textContent = titles[mode];
    if (mode === 'favorites') renderFavoritesList();
  }

  modeBtn.addEventListener('click', () => setMode('setup'));
  favOpenBtn.addEventListener('click', () => setMode('favorites'));
  backBtn.addEventListener('click', () => setMode('performance'));

  // Toggle buttons
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const { group, value } = btn.dataset;
      if (group === 'progression') state.progressionComplexity = value;
      if (group === 'chord') state.chordComplexity = value;
      if (group === 'highlight') {
        state.highlight = value;
        document.getElementById('chords').classList.toggle('show-roman', value === 'roman');
      }
      if (group === 'word') {
        state.wordPrompt = value === 'on';
        generate();
      }
      if (group === 'tone') state.audioTone = value;
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
  keySelect.value = state.lockedKey;
  keySelect.addEventListener('change', () => {
    state.lockedKey = keySelect.value;
  });

  // Generate button
  document.getElementById('generate-btn').addEventListener('click', generate);

  document.getElementById('fav-btn').addEventListener('click', toggleFavorite);

  // Help overlay
  const helpOverlay = document.getElementById('help-overlay');
  function toggleHelp() {
    helpOverlay.hidden = !helpOverlay.hidden;
  }
  document.getElementById('help-btn').addEventListener('click', toggleHelp);
  document.getElementById('help-close').addEventListener('click', toggleHelp);
  helpOverlay.addEventListener('click', e => {
    if (e.target === helpOverlay) toggleHelp();
  });

  // Hotkeys
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (state.mode !== 'performance') setMode('performance');
        generate();
        break;
      case 'KeyF':
        toggleFavorite();
        break;
      case 'KeyH': {
        const next = state.highlight === 'chord' ? 'roman' : 'chord';
        state.highlight = next;
        document.getElementById('chords').classList.toggle('show-roman', next === 'roman');
        setToggle('highlight', next);
        break;
      }
      case 'KeyW':
        state.wordPrompt = !state.wordPrompt;
        setToggle('word', state.wordPrompt ? 'on' : 'off');
        generate();
        break;
      case 'KeyS':
        setMode(state.mode === 'setup' ? 'performance' : 'setup');
        break;
      case 'KeyV':
        setMode(state.mode === 'favorites' ? 'performance' : 'favorites');
        break;
      case 'Escape':
        if (!helpOverlay.hidden) { toggleHelp(); break; }
        if (state.mode !== 'performance') setMode('performance');
        break;
      case 'Digit1':
        state.progressionComplexity = 'simple';
        setToggle('progression', 'simple');
        break;
      case 'Digit2':
        state.progressionComplexity = 'medium';
        setToggle('progression', 'medium');
        break;
      case 'Digit3':
        state.progressionComplexity = 'complex';
        setToggle('progression', 'complex');
        break;
      case 'Digit4':
        state.chordComplexity = 'basic';
        setToggle('chord', 'basic');
        break;
      case 'Digit5':
        state.chordComplexity = 'extended';
        setToggle('chord', 'extended');
        break;
      case 'Digit6':
        state.chordComplexity = 'rich';
        setToggle('chord', 'rich');
        break;
      case 'Slash':
        if (e.shiftKey) { e.preventDefault(); toggleHelp(); }
        break;
    }
  });

  // Set initial toggle states
  setToggle('progression', state.progressionComplexity);
  setToggle('chord', state.chordComplexity);
  setToggle('highlight', state.highlight);
  setToggle('word', 'off');
  setToggle('tone', state.audioTone);

  // Initial generation
  generate();
});
