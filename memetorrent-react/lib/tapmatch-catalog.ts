export const TAPMATCH_SKILLS = [
  'Barista',
  'Bartending',
  'Waitstaff',
  'Kitchen Hand',
  'Chef / Cook',
  'Sous Chef',
  'Front of House',
  'Back of House',
  'Host / Greeter',
  'Barback',
  'Dishwasher',
  'Cashier',
  'Delivery Driver',
  'Cleaner',
  'Manager / Supervisor',
  'Event Staff',
  'Catering Assistant',
  'Food Runner',
  'Hotel Reception',
  'Housekeeping',
  'Room Attendant',
  'Security / Door Staff',
];

export const TAPMATCH_CITIES = ['Melbourne', 'Sydney', 'Brisbane', 'Adelaide', 'Perth'];

export const WORKER_CATEGORIES = [
  { key: 'Hospitality', title: 'Hospitality', subtitle: 'Restaurants · Cafes · Bars · Hotels' },
  { key: 'Fitness', title: 'Fitness', subtitle: 'Gyms · Studios · Yoga' },
  { key: 'Beauty', title: 'Beauty', subtitle: 'Hair · Makeup · Nails' },
  { key: 'Retail', title: 'Retail', subtitle: 'Shops · Stores' },
  { key: 'Services', title: 'Services', subtitle: 'Delivery · Cleaning · Trades' },
];

export const BUSINESS_PREF_SECTIONS = [
  {
    key: 'Staffing',
    items: ['Hiring staff', 'Staff management', 'Staff retention'],
  },
  {
    key: 'Marketing',
    items: ['Social media', 'Promotions', 'Advertising', 'Brand identity'],
  },
  {
    key: 'Operations',
    items: ['Scheduling', 'Costing', 'Product and service refinement'],
  },
  {
    key: 'Training',
    items: ['Staff onboarding', 'Leadership', 'Managerial coaching'],
  },
  {
    key: 'BusinessDevelopment',
    items: ['Growth planning', 'Expansion planning', 'New revenue strategies'],
  },
];

const BADGES = [
  { n: 'New Recruit', r: 0 },
  { n: 'Rookie Worker', r: 1 },
  { n: 'Reliable Helper', r: 3 },
  { n: 'Active Contributor', r: 5 },
  { n: 'Dedicated Doer', r: 7 },
  { n: 'Hard Worker', r: 10 },
  { n: 'Trusted Worker', r: 20 },
  { n: 'Pro Specialist', r: 25 },
  { n: 'Elite Talent', r: 30 },
  { n: 'Top Performer', r: 50 },
  { n: 'Premium Partner', r: 100 },
];

export function tapMatchBadge(reviews: number) {
  const current = BADGES.filter((x) => reviews >= x.r);
  const latest = current[current.length - 1] || BADGES[0];
  const next = BADGES.find((x) => x.r > reviews);
  return { latestBadge: latest.n, nextBadge: next?.n || null, nextTarget: next?.r || reviews };
}
