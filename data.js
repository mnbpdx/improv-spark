const KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

const PROGRESSIONS = {
  simple: [
    ['I', 'IV', 'V'],
    ['I', 'V', 'vi', 'IV'],
    ['I', 'IV', 'I', 'V'],
    ['I', 'vi', 'IV', 'V'],
    ['I', 'III', 'IV', 'V'],
    ['I', 'IV', 'V', 'IV'],
    ['I', 'V', 'IV', 'I'],
    ['I', 'ii', 'IV', 'V'],
    ['I', 'vi', 'V', 'IV'],
    ['IV', 'V', 'I', 'vi'],
    ['I', 'IV', 'vi', 'V'],
    ['I', 'iii', 'IV', 'V'],
  ],
  medium: [
    ['ii', 'V', 'I'],
    ['I', 'vi', 'ii', 'V'],
    ['I', 'IV', 'ii', 'V'],
    ['IV', 'I', 'V', 'vi'],
    ['I', 'bVII', 'IV', 'I'],
    ['I', 'IV', 'V', 'bVII'],
    ['I', 'ii', 'V', 'I'],
    ['vi', 'ii', 'V', 'I'],
    ['I', 'IV', 'bVII', 'IV'],
    ['I', 'bVII', 'bVI', 'bVII'],
    ['I', 'iii', 'vi', 'V'],
    ['I', 'IV', 'iv', 'I'],
  ],
  complex: [
    ['I', 'III', 'IV', 'iv'],
    ['I', 'bVII', 'bVI', 'V'],
    ['ii', 'bII', 'I'],
    ['I', 'V', 'bVII', 'IV', 'I'],
    ['I', 'ii', 'iii', 'IV', 'V'],
    ['I', 'bIII', 'IV', 'bVII', 'I'],
    ['I', 'bVI', 'bVII', 'I'],
    ['ii', 'V', 'I', 'bVI', 'bII', 'V'],
    ['I', 'iii', 'bVI', 'bVII', 'I'],
    ['I', 'IV', 'bII', 'V'],
  ],
};

// Semitone offset from root for each scale degree
const DEGREE_SEMITONE = {
  'I':    0,
  'bII':  1,
  'II':   2,
  'ii':   2,
  'bIII': 3,
  'III':  4,
  'iii':  4,
  'IV':   5,
  'iv':   5,
  '#IV':  6,
  'bV':   6,
  'V':    7,
  'bVI':  8,
  'VI':   9,
  'vi':   9,
  'bVII': 10,
  'VII':  11,
  'vii':  11,
};

// Default quality per degree in a major key context
const DEGREE_QUALITY = {
  'I':    'maj',
  'bII':  'maj',
  'II':   'dom',
  'ii':   'min',
  'bIII': 'maj',
  'III':  'maj',
  'iii':  'min',
  'IV':   'maj',
  'iv':   'min',
  '#IV':  'dim',
  'bV':   'dim',
  'V':    'dom',
  'bVI':  'maj',
  'VI':   'dom',
  'vi':   'min',
  'bVII': 'maj',
  'VII':  'dom',
  'vii':  'dim',
};

// Chord suffix by quality and extension tier
const CHORD_SUFFIX = {
  maj: { basic: '',     extended: 'maj7',  rich: 'maj9'     },
  min: { basic: 'm',    extended: 'm7',    rich: 'm9'       },
  dom: { basic: '7',    extended: '7',     rich: '9'        },
  dim: { basic: 'dim',  extended: 'm7b5',  rich: 'm11b5'    },
};

// Special overrides for specific degrees at rich tier
const RICH_OVERRIDES = {
  'IV':   'maj9#11',
  'V':    '7alt',
  'vii':  'm11b5',
  'iii':  'm11',
};

const DEGREE_FUNCTION = {
  'I':    'tonic',
  'iii':  'tonic',
  'vi':   'tonic',
  'III':  'tonic',
  'ii':   'subdom',
  'IV':   'subdom',
  'iv':   'subdom',
  'II':   'subdom',
  'bVII': 'subdom',
  'V':    'dominant',
  'VII':  'dominant',
  'vii':  'dominant',
  'bII':  'chromatic',
  'bIII': 'chromatic',
  'bVI':  'chromatic',
  'bV':   'chromatic',
  '#IV':  'chromatic',
};

const WORDS = [
  'Fog', 'Rust', 'Tender', 'Velocity', 'Ancient', 'Shatter', 'Bloom', 'Neon',
  'Hollow', 'Surrender', 'Drift', 'Ember', 'Strange', 'Gravity', 'Silk', 'Fracture',
  'Longing', 'Echo', 'Vivid', 'Dusk', 'Bitter', 'Cascade', 'Wander', 'Phosphor',
  'Soft', 'Voltage', 'Archive', 'Humid', 'Flicker', 'Obsidian', 'Roam', 'Splice',
  'Narrow', 'Radiant', 'Collapse', 'Thread', 'Lush', 'Static', 'Amber', 'Feral',
  'Vanish', 'Chrome', 'Bruise', 'Ascend', 'Murky', 'Tension', 'Solace', 'Jagged',
  'Pale', 'Rush', 'Ceremony', 'Dissolve', 'Stark', 'Warmth', 'Orbit', 'Debris',
  'Fragile', 'Surge', 'Mossy', 'Detach', 'Luminous', 'Breach', 'Forgotten', 'Haze',
  'Brace', 'Fluid', 'Crimson', 'Scatter', 'Yearning', 'Pulse', 'Vacant', 'Steep',
  'Mellow', 'Ignite', 'Shore', 'Restless', 'Opaque', 'Tremor', 'Gilded', 'Exhale',
];
