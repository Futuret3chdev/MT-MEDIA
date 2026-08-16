export type StudioTemplate = 'tap' | 'dodge' | 'collector';

export type StudioSpec = {
  template: StudioTemplate;
  name: string;
  blurb: string;
  bg: string;
  accent: string;
  player: string;
  speed: number;
  spawn: number;
  goal: number;
  lives: number;
};

export const TEMPLATES: { id: StudioTemplate; title: string; blurb: string }[] = [
  { id: 'tap', title: 'Tap Hunt', blurb: 'Tap the orbs. Miss and they vanish. Hit the goal.' },
  { id: 'dodge', title: 'Dodge Fall', blurb: 'Move to dodge falling blocks. Last as long as you can.' },
  { id: 'collector', title: 'Coin Run', blurb: 'Move and grab coins. Avoid the red ones.' },
];

export function defaultSpec(template: StudioTemplate): StudioSpec {
  const base = {
    name: TEMPLATES.find((t) => t.id === template)?.title || 'My game',
    blurb: TEMPLATES.find((t) => t.id === template)?.blurb || '',
    bg: '#0a0a0a',
    accent: '#00ff99',
    player: '#6ea8ff',
    speed: 5,
    spawn: 5,
    goal: 20,
    lives: 3,
  };
  return { template, ...base };
}
