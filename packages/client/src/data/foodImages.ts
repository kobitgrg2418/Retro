// Curated Unsplash photo IDs mapped to each seeded menu item.
// All IDs verified to resolve (HTTP 200). A category fallback covers any
// item that isn't explicitly mapped, and there's a final generic fallback.

const UNSPLASH = 'https://images.unsplash.com/photo-';

// dish name (exact, as seeded) -> Unsplash photo id
const BY_NAME: Record<string, string> = {
  'Momo (Steamed)': '1496116218417-1a781b1c416c',
  'Momo (Fried)': '1563379091339-03b21ab4a4f8',
  'Chatamari': '1565299624946-b28f40a0ae38',
  'Sekuwa Skewers': '1555939594-58d7cb561ad1',
  'Aloo Sadeko': '1512621776951-a57141f2eefd',
  'Choila': '1606491956689-2ea866880c84',
  'Dal Bhat Tarkari': '1567188040759-fb8a883dc6d8',
  'Thakali Set': '1585937421612-70a008356fbe',
  'Gorkhali Lamb Curry': '1631452180519-c014fe946bc7',
  'Newari Khaja Set': '1601050690597-df0568f70950',
  'Butter Chicken': '1588166524941-3bf61a9c41db',
  'Chicken Biryani': '1589302168068-964664d93dc0',
  'Paneer Tikka Masala': '1601050690117-94f5f6fa8bd7',
  'Fish Curry': '1604908176997-125f25cc6f3d',
  'Juju Dhau': '1488477181946-6428a0291777',
  'Sel Roti': '1551024601-bec78aea704b',
  'Kheer': '1605196560547-b2f7281b7355',
  'Yomari': '1505253716362-afaea1d3d1af',
  'Masala Tea': '1571934811356-5cc061b6821f',
  'Fresh Lime Soda': '1437418747212-8d9709afab22',
  'Lassi (Mango)': '1553530666-ba11a7da3888',
  'Tongba (Millet Beer)': '1514361892635-6b07e31e75f9',
  'Everest Beer': '1535958636474-b021ee887b13',
  'Khukri Rum': '1569529465841-dfecdab7503b',
  'Red Wine': '1510812431401-41d2bd2722f3',
  'Single Malt Whiskey': '1527281400683-1aae777175f8',
};

// category -> Unsplash photo id (fallback when a name isn't mapped)
const BY_CATEGORY: Record<string, string> = {
  appetizer: '1555939594-58d7cb561ad1',
  main_course: '1631452180519-c014fe946bc7',
  dessert: '1488477181946-6428a0291777',
  beverage: '1571934811356-5cc061b6821f',
  premium_beverage: '1510812431401-41d2bd2722f3',
};

const GENERIC = '1504674900247-0877df9cc836';

// A nice plated spread used as the hero centerpiece.
export const HERO_IMAGE = `${UNSPLASH}1504674900247-0877df9cc836?w=900&h=900&fit=crop&q=80`;

interface ImageableItem {
  name?: string;
  category?: string;
}

/**
 * Returns a food photo URL for a menu item.
 * @param item   item with name/category (or a plain dish name string)
 * @param size   square edge length in px (default 600)
 */
export function getFoodImage(item: ImageableItem | string, size = 600): string {
  const name = typeof item === 'string' ? item : item.name;
  const category = typeof item === 'string' ? undefined : item.category;

  const id =
    (name && BY_NAME[name]) ||
    (category && BY_CATEGORY[category]) ||
    GENERIC;

  return `${UNSPLASH}${id}?w=${size}&h=${size}&fit=crop&q=80`;
}
