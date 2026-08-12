export const topics = [
  {
    id: 'bias',
    number: 1,
    name: 'Bias',
    icon: '⚖️',
    color: '#ff6b3d',
    tagline: 'Recognize the mental traps that distort decisions',
    description:
      'Cognitive and emotional biases quietly shape every decision you make. This module trains you to spot them in real time — before they cost you.',
    videos: [
      { title: 'Class 1', youtubeId: 'QLBHGFPXkA8' },
      { title: 'Class 2', youtubeId: 'pj8C2ologBE' },
    ],
    lessons: [
      {
        title: 'Confirmation Bias',
        description: 'Why you notice signals that agree with you and ignore the ones that don’t.',
      },
      {
        title: 'Loss Aversion',
        description: 'How the fear of losing distorts your sense of risk and reward.',
      },
      {
        title: 'Recency Bias',
        description: 'Why the last outcome feels more important than the pattern behind it.',
      },
      {
        title: 'Overconfidence',
        description: 'Spotting the point where conviction turns into a blind spot.',
      },
    ],
  },
  {
    id: 'levels',
    number: 2,
    name: 'Levels',
    icon: '📊',
    color: '#ffb03d',
    tagline: 'Read the map before you move',
    description:
      'Every market, system, or situation has structure. This module teaches you to identify the key levels that define where the real decisions happen.',
    videos: [
      { title: 'Class 3', youtubeId: 'Clxo_5gF15o' },
      { title: 'Class 4', youtubeId: 'MMdqcInzyBQ' },
    ],
    lessons: [
      {
        title: 'Support & Resistance',
        description: 'Finding the zones where pressure consistently builds and breaks.',
      },
      {
        title: 'Key Reference Levels',
        description: 'Which levels actually matter, and which are just noise.',
      },
      {
        title: 'Level Confluence',
        description: 'Why levels are strongest when multiple signals line up.',
      },
    ],
  },
  {
    id: 'opportunity',
    number: 3,
    name: 'Opportunity',
    icon: '🔑',
    color: '#3ddc97',
    tagline: 'Learn to see what others miss',
    description:
      'Opportunity recognition is a trainable skill. This module builds your eye for asymmetric setups worth acting on.',
    videos: [
      { title: 'Class 5', youtubeId: 'khFZXotaV1I' },
      { title: 'Class 6', youtubeId: 'tys3e8E6AIM' },
    ],
    lessons: [
      {
        title: 'Spotting Asymmetry',
        description: 'Finding setups where the upside meaningfully outweighs the downside.',
      },
      {
        title: 'Patience vs. Hesitation',
        description: 'Telling the difference between waiting well and waiting too long.',
      },
      {
        title: 'Building a Watchlist',
        description: 'A simple system for tracking opportunities before they mature.',
      },
    ],
  },
  {
    id: 'execution',
    number: 4,
    name: 'Execution',
    icon: '🎯',
    color: '#3d9dff',
    tagline: 'A great plan means nothing without disciplined action',
    description:
      'This module closes the gap between knowing what to do and actually doing it — cleanly, consistently, and without hesitation.',
    videos: [
      { title: 'Class 7', youtubeId: '8HKMKvkxSi4' },
      { title: 'Class 8', youtubeId: 'VHVmlRcywws' },
    ],
    lessons: [
      {
        title: 'Entry Discipline',
        description: 'Committing to your plan instead of improvising in the moment.',
      },
      {
        title: 'Exit Planning',
        description: 'Deciding how you leave before you decide to enter.',
      },
      {
        title: 'Handling Slippage & Friction',
        description: 'Executing well even when conditions aren’t perfect.',
      },
    ],
  },
  {
    id: 'management',
    number: 5,
    name: 'Management',
    icon: '🧭',
    color: '#b07dff',
    tagline: 'Protect what you’ve built while you grow it',
    description:
      'Risk and self-management separate people who last from people who burn out. This module covers the systems that keep you in the game.',
    videos: [
      { title: 'Class 9', youtubeId: '7cY8_SdcBq0' },
      { title: 'Class 10', youtubeId: '9I5ZQDWs9n4' },
    ],
    lessons: [
      {
        title: 'Position Sizing',
        description: 'How much is too much? Sizing decisions relative to your account and edge.',
      },
      {
        title: 'Risk Per Decision',
        description: 'Setting a consistent ceiling on what any single decision can cost you.',
      },
      {
        title: 'Reviewing & Journaling',
        description: 'Turning outcomes into lessons instead of just wins and losses.',
      },
    ],
  },
];

export const getTopicById = (id) => topics.find((t) => t.id === id);
