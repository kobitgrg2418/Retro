// Menu imagery. The 12 food photos were sliced from a single white-background
// grid and live in /public/menu. Each dish maps to its closest crop. Drinks
// (not present in the grid) fall back to a clean white-background icon so the
// whole menu stays visually consistent.

const BASE = '/menu/';

// dish name (exact, as seeded) -> image file slug in /public/menu
const PHOTOS: Record<string, string> = {
  'Momo (Steamed)': 'momo',
  'Momo (Fried)': 'dumpling',
  'Chatamari': 'chatamari',
  'Sekuwa Skewers': 'sekuwa',
  'Aloo Sadeko': 'choila',
  'Choila': 'choila',
  'Dal Bhat Tarkari': 'thali',
  'Thakali Set': 'thakali',
  'Gorkhali Lamb Curry': 'curry',
  'Newari Khaja Set': 'newari',
  'Butter Chicken': 'curry',
  'Chicken Biryani': 'thali',
  'Paneer Tikka Masala': 'curry',
  'Fish Curry': 'curry',
  'Juju Dhau': 'yogurt',
  'Sel Roti': 'rings',
  'Kheer': 'yogurt',
  'Yomari': 'dumpling',
  'Lassi (Mango)': 'yogurt',
  'Tongba (Millet Beer)': 'quati',
};

// drinks with no photo in the grid -> white-plate icon
const EMOJIS: Record<string, string> = {
  'Masala Tea': '🍵',
  'Fresh Lime Soda': '🥤',
  'Everest Beer': '🍺',
  'Khukri Rum': '🥃',
  'Red Wine': '🍷',
  'Single Malt Whiskey': '🥃',
};

// category fallback (food categories -> a representative crop)
const BY_CATEGORY: Record<string, string> = {
  appetizer: 'momo',
  main_course: 'curry',
  dessert: 'yogurt',
};

const CATEGORY_EMOJI: Record<string, string> = {
  beverage: '🥤',
  premium_beverage: '🍷',
};

// Hero centerpiece — the steamed-momo crop on a white background.
export const HERO_IMAGE = `${BASE}momo.jpg`;

interface ImageableItem {
  name?: string;
  category?: string;
  image_url?: string;
}

function plate(emoji: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'>` +
    `<rect width='240' height='240' fill='#ffffff'/>` +
    `<circle cx='120' cy='120' r='96' fill='#f4f5f7'/>` +
    `<circle cx='120' cy='120' r='96' fill='none' stroke='#e7e9ec' stroke-width='2'/>` +
    `<text x='120' y='122' font-size='118' text-anchor='middle' dominant-baseline='central'>${emoji}</text>` +
    `</svg>`;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/** Returns the image URL for a menu item (real photo or white-plate icon). */
export function getFoodImage(item: ImageableItem | string, _size = 600): string {
  const name = typeof item === 'string' ? item : item.name;
  const category = typeof item === 'string' ? undefined : item.category;
  const uploaded = typeof item === 'string' ? undefined : item.image_url;

  // An admin-uploaded image always wins.
  if (uploaded) return uploaded;

  if (name && PHOTOS[name]) return `${BASE}${PHOTOS[name]}.jpg`;
  if (name && EMOJIS[name]) return plate(EMOJIS[name]);
  if (category && BY_CATEGORY[category]) return `${BASE}${BY_CATEGORY[category]}.jpg`;
  if (category && CATEGORY_EMOJI[category]) return plate(CATEGORY_EMOJI[category]);
  return plate('🍽️');
}
