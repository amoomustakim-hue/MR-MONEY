const base = import.meta.env.BASE_URL
export const img = (name: string) => `${base}img/${name}.webp`
export const media = (name: string) => `${base}media/${name}`

/** Streaming search links: always resolve, never point at a guessed album id. */
const listen = (q: string) => `https://open.spotify.com/search/${encodeURIComponent(`Asake ${q}`)}`

export type Era = {
  id: string
  title: string
  year: string
  released: string
  note: string
  cover: string
  /** Room colour and the colour of text on it. */
  bg: string
  fg: string
  tracks: string[]
  listen: string
}

export const ERAS: Era[] = [
  {
    id: 'mmwtv',
    title: 'Mr. Money With The Vibe',
    year: '2022',
    released: 'September 2022',
    note: 'The debut. Fuji chants over amapiano log drums — the sound Lagos was already humming.',
    cover: img('cover-mmwtv'),
    bg: '#8e1b17',
    fg: '#f6ede2',
    tracks: [
      'Dull',
      'Organise',
      'Joha',
      'Terminator',
      'Nzaza',
      'Peace Be Unto You (PBUY)',
      'Muse',
      'Reason',
      'Sunmomi',
      'Dupe',
      'Omo Ope (feat. Olamide)',
      'Sungba (Remix) (feat. Burna Boy)',
    ],
    listen: listen('Mr. Money With The Vibe'),
  },
  {
    id: 'work-of-art',
    title: 'Work of Art',
    year: '2023',
    released: 'June 2023',
    note: 'Paint, pinstripes and a gallery wall. The second album treats every song like a canvas.',
    cover: img('cover-work-of-art'),
    bg: '#f4f1ea',
    fg: '#14223f',
    tracks: [
      'Olorun',
      'Awodi',
      '2:30',
      'Sunshine',
      'Mogbe',
      'Basquiat',
      'Amapiano',
      "What's Up My G",
      'I Believe',
      'Introduction',
      'Remember',
      'Lonely At The Top',
      'Great Guy',
      'Yoga',
    ],
    listen: listen('Work of Art'),
  },
  {
    id: 'lungu-boy',
    title: 'Lungu Boy',
    year: '2024',
    released: '2024',
    note: 'Back to the streets that raised him — with Wizkid, Stormzy and Travis Scott along for the ride.',
    cover: img('cover-lungu-boy'),
    bg: '#d9d8d3',
    fg: '#151515',
    tracks: [
      'Start',
      'MMS (feat. Wizkid)',
      'Mood',
      'My Heart',
      'Worldwide',
      'Suru (feat. Stormzy)',
      'Skating',
      'Mentally',
      'Uhh Yeahh',
      'I Swear',
      'Ligali',
      'Whine',
      'Fuji Vibe',
      'Active (feat. Travis Scott)',
    ],
    listen: listen('Lungu Boy'),
  },
  {
    id: 'real',
    title: 'REAL, Vol. 1',
    year: '2026',
    released: '23 January 2026',
    note: 'Wizkid & Asake. Four songs, two leather jackets, one silver-toned frame.',
    cover: img('cover-real-vol1'),
    bg: '#15171c',
    fg: '#e7e3da',
    tracks: ['Turbulence', 'Jogodo', 'Iskolodo', 'Alaye'],
    listen: listen('Wizkid REAL'),
  },
  {
    id: 'money',
    title: 'M$NEY',
    year: '2026',
    released: '1 May 2026',
    note: 'Carved in marble. The man as monument — and the tour that followed it.',
    cover: img('cover-money'),
    bg: '#e8e7e3',
    fg: '#111',
    tracks: [],
    listen: listen('M$NEY'),
  },
]

/** Floating cards around the statue: position (% of the stage), size (vw), depth. */
export const FLOATERS = [
  { src: img('flame-lagos'), alt: 'Asake on stage with a flame cannon, Lagos Island street signs behind', x: 9, y: 16, w: 13, depth: 1.4, r: -4 },
  { src: img('torero'), alt: 'Asake in a crystal torero jacket in front of a red panel in a sand arena', x: 78, y: 12, w: 12, depth: 0.8, r: 3 },
  { src: img('closeup'), alt: 'Black-and-white close-up in sunglasses and a knit cap', x: 84, y: 58, w: 10, depth: 1.8, r: -2 },
  { src: img('cap'), alt: 'Portrait in a two-tone cap and gold grillz', x: 5, y: 62, w: 9, depth: 1.1, r: 5 },
  { src: img('flame-usa'), alt: 'Asake firing a flame cannon, a bill in his mouth', x: 70, y: 76, w: 8, depth: 2.2, r: 6 },
]

export const PHOTOS = {
  whiteTee: img('white-tee'),
  street: img('street'),
  crowd: img('crowd'),
  giran: img('giran'),
  torero: img('torero'),
  flameLagos: img('flame-lagos'),
  flameUsa: img('flame-usa'),
  closeup: img('closeup'),
  cap: img('cap'),
}

export const CREDIT = 'Unofficial fan concept. Not affiliated with Asake, YBNL, Giran Republic or EMPIRE. All imagery and music © their owners.'
export const AUTHOR = { name: 'Mustakheem Amoo', alias: 'Olacodes' }
