export type IngredientItem = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
};

export const INGREDIENT_ITEMS: IngredientItem[] = [
  { slug: "avocado",     name: "Avocado Oil",    tagline: "Deep Moisture",                  image: "/images/ingredients/avocado.jpeg" },
  { slug: "argan-oil",   name: "Argan Oil",       tagline: "Reduce Fine Lines",              image: "/images/ingredients/leaves.jpeg" },
  { slug: "beeswax",     name: "Beeswax",         tagline: "Protects The Skin",              image: "/images/ingredients/bees.jpeg" },
  { slug: "rose-hip",    name: "Rose Hip",         tagline: "Antioxidant Protection",         image: "/images/ingredients/beetroot.jpeg" },
  { slug: "coconut-oil", name: "Coconut Oil",      tagline: "Restore Barrier And Add Shine",  image: "/images/ingredients/cocunut.jpeg" },
  { slug: "jojoba-oil",  name: "Jojoba Oil",       tagline: "Hydrate Dry Skin",               image: "/images/ingredients/dates.jpeg" },
  { slug: "olive-oil",   name: "Olive Oil",        tagline: "Help Lock In Hydration",         image: "/images/ingredients/olive-oil.jpeg" },
  { slug: "sweet-almond",name: "Sweet Almond",     tagline: "Soothes And Softens Skin",       image: "/images/ingredients/almonds.jpeg" },
];

const bySlug = new Map(INGREDIENT_ITEMS.map((i) => [i.slug, i]));
export function getIngredientItem(slug: string): IngredientItem | undefined {
  return bySlug.get(slug);
}
