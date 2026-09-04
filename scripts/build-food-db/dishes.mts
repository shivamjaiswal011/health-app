import type { DishDefinition, NutrientRetention } from './compose.mts';

/**
 * Setting paneer, curd or cheese means draining the whey, which carries off most of
 * the lactose and the whey-protein fraction while the casein and fat stay behind.
 */
const WHEY_DRAINED: NutrientRetention = { protein: 0.8, carbs: 0.08, fat: 0.93 };

/**
 * USDA ids for the raw ingredients dishes are built from. Pinned by id because
 * descriptions change wording between releases; the build fails loudly if one goes
 * missing rather than silently composing a dish from fewer ingredients.
 */
export const INGREDIENTS: Record<string, string> = {
  atta: 'usda:168893', // Wheat flour, whole-grain
  maida: 'usda:168894', // Wheat flour, white, all-purpose
  riceRaw: 'usda:168877', // Rice, white, long-grain, raw
  semolina: 'usda:169715', // Semolina, enriched — stands in for suji/rava
  besan: 'usda:174288', // Chickpea flour (besan)
  toorRaw: 'usda:172436', // Pigeon peas (red gram), raw
  lentilCooked: 'usda:172421',
  chickpeaCooked: 'usda:173757',
  kidneyCooked: 'usda:175194',
  // Urad (black gram) is absent from SR Legacy. Mung is the closest pulse USDA carries
  // — both are Vigna, and dry macros sit within a few percent. Noted so it can be
  // replaced if a licensed Indian source lands.
  uradRawProxy: 'usda:174256',
  potatoBoiled: 'usda:170440',
  onionRaw: 'usda:170000',
  tomatoRaw: 'usda:170457',
  spinachCooked: 'usda:168463',
  cauliflowerCooked: 'usda:170397',
  peasCooked: 'usda:170420',
  oil: 'usda:171017',
  ghee: 'usda:171314',
  yogurt: 'usda:171284',
  milk: 'usda:172217',
  sugar: 'usda:169655',
  chickenBreast: 'usda:171477',
  egg: 'usda:173424',
  coconut: 'usda:170169',
};

const KATORI = 150;
const SABZI_KATORI = 120;

/**
 * Common Indian preparations, each a home-cooking recipe with a considered cooked
 * weight. Quantities are per batch as written; the cooked weight is what the batch
 * weighs on the plate.
 *
 * These are estimates of typical home cooking, not laboratory measurements. They are
 * closer to what an Indian user actually eats than any generic entry, and unlike a
 * crowd-sourced database every number here is traceable to its ingredients.
 */
export const DISHES: DishDefinition[] = [
  {
    id: 'roti',
    name: 'Roti / Chapati',
    ingredients: [{ ingredient: 'atta', grams: 35 }],
    cookedGrams: 40,
    portions: [{ label: '1 roti', grams: 40, isDefault: true }],
  },
  {
    id: 'phulka',
    name: 'Phulka (no oil)',
    ingredients: [{ ingredient: 'atta', grams: 25 }],
    cookedGrams: 29,
    portions: [{ label: '1 phulka', grams: 29, isDefault: true }],
  },
  {
    id: 'paratha-plain',
    name: 'Paratha (plain)',
    ingredients: [
      { ingredient: 'atta', grams: 40 },
      { ingredient: 'ghee', grams: 7 },
    ],
    cookedGrams: 60,
    portions: [{ label: '1 paratha', grams: 60, isDefault: true }],
  },
  {
    id: 'aloo-paratha',
    name: 'Aloo Paratha',
    ingredients: [
      { ingredient: 'atta', grams: 40 },
      { ingredient: 'potatoBoiled', grams: 60 },
      { ingredient: 'onionRaw', grams: 10 },
      { ingredient: 'ghee', grams: 8 },
    ],
    cookedGrams: 110,
    portions: [{ label: '1 paratha', grams: 110, isDefault: true }],
  },
  {
    id: 'puri',
    name: 'Puri',
    ingredients: [
      { ingredient: 'atta', grams: 20 },
      { ingredient: 'oil', grams: 6 },
    ],
    cookedGrams: 25,
    portions: [{ label: '1 puri', grams: 25, isDefault: true }],
  },
  {
    id: 'steamed-rice',
    name: 'Steamed Rice',
    ingredients: [{ ingredient: 'riceRaw', grams: 100 }],
    cookedGrams: 280,
    portions: [
      { label: '1 katori', grams: KATORI, isDefault: true },
      { label: '1 plate', grams: 250, isDefault: false },
    ],
  },
  {
    id: 'jeera-rice',
    name: 'Jeera Rice',
    ingredients: [
      { ingredient: 'riceRaw', grams: 100 },
      { ingredient: 'ghee', grams: 10 },
    ],
    cookedGrams: 285,
    portions: [{ label: '1 katori', grams: KATORI, isDefault: true }],
  },
  {
    id: 'dal-tadka',
    name: 'Dal Tadka (toor)',
    ingredients: [
      { ingredient: 'toorRaw', grams: 60 },
      { ingredient: 'onionRaw', grams: 30 },
      { ingredient: 'tomatoRaw', grams: 40 },
      { ingredient: 'ghee', grams: 10 },
    ],
    cookedGrams: 400,
    portions: [{ label: '1 katori', grams: KATORI, isDefault: true }],
  },
  {
    id: 'dal-fry-masoor',
    name: 'Masoor Dal',
    ingredients: [
      { ingredient: 'lentilCooked', grams: 180 },
      { ingredient: 'onionRaw', grams: 25 },
      { ingredient: 'tomatoRaw', grams: 40 },
      { ingredient: 'oil', grams: 8 },
    ],
    cookedGrams: 330,
    portions: [{ label: '1 katori', grams: KATORI, isDefault: true }],
  },
  {
    id: 'rajma',
    name: 'Rajma (kidney bean curry)',
    ingredients: [
      { ingredient: 'kidneyCooked', grams: 180 },
      { ingredient: 'onionRaw', grams: 40 },
      { ingredient: 'tomatoRaw', grams: 60 },
      { ingredient: 'oil', grams: 10 },
    ],
    cookedGrams: 330,
    portions: [{ label: '1 katori', grams: KATORI, isDefault: true }],
  },
  {
    id: 'chole',
    name: 'Chole (chickpea curry)',
    ingredients: [
      { ingredient: 'chickpeaCooked', grams: 180 },
      { ingredient: 'onionRaw', grams: 40 },
      { ingredient: 'tomatoRaw', grams: 60 },
      { ingredient: 'oil', grams: 12 },
    ],
    cookedGrams: 330,
    portions: [{ label: '1 katori', grams: KATORI, isDefault: true }],
  },
  {
    id: 'paneer',
    name: 'Paneer (plain)',
    // Paneer is absent from USDA, so it is set from milk here. USDA's whole milk is
    // 3.25% fat where Indian paneer is usually made from buffalo milk at 6-7%, so the
    // volume is raised to reach a realistic yield rather than pretending cow milk
    // gives buffalo-milk paneer.
    ingredients: [{ ingredient: 'milk', grams: 1400, retain: WHEY_DRAINED }],
    cookedGrams: 200,
    portions: [
      { label: '100 g', grams: 100, isDefault: true },
      { label: '1 cube', grams: 15, isDefault: false },
    ],
  },
  {
    id: 'palak-paneer',
    name: 'Palak Paneer',
    ingredients: [
      { ingredient: 'spinachCooked', grams: 200 },
      { ingredient: 'dish:paneer', grams: 100 },
      { ingredient: 'onionRaw', grams: 30 },
      { ingredient: 'oil', grams: 12 },
    ],
    cookedGrams: 320,
    portions: [{ label: '1 katori', grams: SABZI_KATORI, isDefault: true }],
  },
  {
    id: 'aloo-sabzi',
    name: 'Aloo Sabzi',
    ingredients: [
      { ingredient: 'potatoBoiled', grams: 250 },
      { ingredient: 'onionRaw', grams: 40 },
      { ingredient: 'tomatoRaw', grams: 40 },
      { ingredient: 'oil', grams: 12 },
    ],
    cookedGrams: 300,
    portions: [{ label: '1 katori', grams: SABZI_KATORI, isDefault: true }],
  },
  {
    id: 'gobi-sabzi',
    name: 'Gobi Sabzi',
    ingredients: [
      { ingredient: 'cauliflowerCooked', grams: 250 },
      { ingredient: 'potatoBoiled', grams: 80 },
      { ingredient: 'onionRaw', grams: 30 },
      { ingredient: 'oil', grams: 12 },
    ],
    cookedGrams: 330,
    portions: [{ label: '1 katori', grams: SABZI_KATORI, isDefault: true }],
  },
  {
    id: 'matar-paneer',
    name: 'Matar Paneer',
    ingredients: [
      { ingredient: 'peasCooked', grams: 120 },
      { ingredient: 'dish:paneer', grams: 100 },
      { ingredient: 'tomatoRaw', grams: 60 },
      { ingredient: 'oil', grams: 12 },
    ],
    cookedGrams: 320,
    portions: [{ label: '1 katori', grams: SABZI_KATORI, isDefault: true }],
  },
  {
    id: 'idli',
    name: 'Idli',
    ingredients: [
      { ingredient: 'riceRaw', grams: 60 },
      { ingredient: 'uradRawProxy', grams: 20 },
    ],
    cookedGrams: 280,
    portions: [{ label: '1 idli', grams: 40, isDefault: true }],
  },
  {
    id: 'dosa-plain',
    name: 'Dosa (plain)',
    ingredients: [
      { ingredient: 'riceRaw', grams: 30 },
      { ingredient: 'uradRawProxy', grams: 10 },
      { ingredient: 'oil', grams: 4 },
    ],
    cookedGrams: 85,
    portions: [{ label: '1 dosa', grams: 85, isDefault: true }],
  },
  {
    id: 'upma',
    name: 'Upma',
    ingredients: [
      { ingredient: 'semolina', grams: 60 },
      { ingredient: 'onionRaw', grams: 30 },
      { ingredient: 'oil', grams: 10 },
    ],
    cookedGrams: 220,
    portions: [{ label: '1 katori', grams: KATORI, isDefault: true }],
  },
  {
    id: 'poha',
    name: 'Poha',
    ingredients: [
      { ingredient: 'riceRaw', grams: 55 },
      { ingredient: 'potatoBoiled', grams: 40 },
      { ingredient: 'onionRaw', grams: 30 },
      { ingredient: 'oil', grams: 8 },
    ],
    cookedGrams: 200,
    portions: [{ label: '1 plate', grams: 200, isDefault: true }],
  },
  {
    id: 'khichdi',
    name: 'Khichdi',
    ingredients: [
      { ingredient: 'riceRaw', grams: 60 },
      { ingredient: 'toorRaw', grams: 30 },
      { ingredient: 'ghee', grams: 8 },
    ],
    cookedGrams: 300,
    portions: [{ label: '1 katori', grams: KATORI, isDefault: true }],
  },
  {
    id: 'besan-chilla',
    name: 'Besan Chilla',
    ingredients: [
      { ingredient: 'besan', grams: 50 },
      { ingredient: 'onionRaw', grams: 20 },
      { ingredient: 'oil', grams: 6 },
    ],
    cookedGrams: 110,
    portions: [{ label: '1 chilla', grams: 110, isDefault: true }],
  },
  {
    id: 'chicken-curry',
    name: 'Chicken Curry',
    ingredients: [
      { ingredient: 'chickenBreast', grams: 200 },
      { ingredient: 'onionRaw', grams: 60 },
      { ingredient: 'tomatoRaw', grams: 80 },
      { ingredient: 'yogurt', grams: 50 },
      { ingredient: 'oil', grams: 15 },
    ],
    cookedGrams: 380,
    portions: [{ label: '1 katori', grams: KATORI, isDefault: true }],
  },
  {
    id: 'egg-curry',
    name: 'Egg Curry',
    ingredients: [
      { ingredient: 'egg', grams: 200 },
      { ingredient: 'onionRaw', grams: 50 },
      { ingredient: 'tomatoRaw', grams: 70 },
      { ingredient: 'oil', grams: 12 },
    ],
    cookedGrams: 330,
    portions: [{ label: '1 katori', grams: KATORI, isDefault: true }],
  },
  {
    id: 'veg-pulao',
    name: 'Vegetable Pulao',
    ingredients: [
      { ingredient: 'riceRaw', grams: 100 },
      { ingredient: 'peasCooked', grams: 40 },
      { ingredient: 'cauliflowerCooked', grams: 40 },
      { ingredient: 'ghee', grams: 12 },
    ],
    cookedGrams: 330,
    portions: [{ label: '1 katori', grams: KATORI, isDefault: true }],
  },
  {
    id: 'curd',
    name: 'Curd / Dahi (plain)',
    ingredients: [{ ingredient: 'yogurt', grams: 100 }],
    cookedGrams: 100,
    portions: [
      { label: '1 katori', grams: KATORI, isDefault: true },
      { label: '1 tablespoon', grams: 15, isDefault: false },
    ],
  },
  {
    id: 'raita',
    name: 'Boondi / Veg Raita',
    ingredients: [
      { ingredient: 'yogurt', grams: 180 },
      { ingredient: 'onionRaw', grams: 20 },
      { ingredient: 'besan', grams: 15 },
    ],
    cookedGrams: 220,
    portions: [{ label: '1 katori', grams: SABZI_KATORI, isDefault: true }],
  },
  {
    id: 'kheer',
    name: 'Kheer',
    ingredients: [
      { ingredient: 'milk', grams: 500 },
      { ingredient: 'riceRaw', grams: 30 },
      { ingredient: 'sugar', grams: 40 },
    ],
    cookedGrams: 400,
    portions: [{ label: '1 katori', grams: SABZI_KATORI, isDefault: true }],
  },
  {
    id: 'coconut-chutney',
    name: 'Coconut Chutney',
    ingredients: [
      { ingredient: 'coconut', grams: 60 },
      { ingredient: 'oil', grams: 5 },
    ],
    cookedGrams: 120,
    portions: [{ label: '2 tablespoon', grams: 30, isDefault: true }],
  },
  {
    id: 'masala-chai',
    name: 'Masala Chai (with sugar)',
    ingredients: [
      { ingredient: 'milk', grams: 100 },
      { ingredient: 'sugar', grams: 8 },
    ],
    cookedGrams: 150,
    portions: [{ label: '1 cup', grams: 150, isDefault: true }],
  },
];
