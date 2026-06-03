import Image from "next/image";

type GalleryItem = {
  slug: string;
  name: string;
  tagline: string;
  image: string;
};

const items: GalleryItem[] = [
  {
    slug: "avocado",
    name: "Avocado Oil",
    tagline: "Deep Moisture",
    image: "/images/ingredients/avocado.jpeg",
  },
  {
    slug: "argan-oil",
    name: "Argan Oil",
    tagline: "Reduce Fine Lines",
    image: "/images/ingredients/leaves.jpeg",
  },
  {
    slug: "beeswax",
    name: "Beeswax",
    tagline: "Protects The Skin",
    image: "/images/ingredients/bees.jpeg",
  },
  {
    slug: "rose-hip",
    name: "Rose Hip",
    tagline: "Antioxidant Protection",
    image: "/images/ingredients/beetroot.jpeg",
  },
  {
    slug: "coconut-oil",
    name: "Coconut Oil",
    tagline: "Restore Barrier And Add Shine",
    image: "/images/ingredients/cocunut.jpeg",
  },
  {
    slug: "jojoba-oil",
    name: "Jojoba Oil",
    tagline: "Hydrate Dry Skin",
    image: "/images/ingredients/dates.jpeg",
  },
  {
    slug: "olive-oil",
    name: "Olive Oil",
    tagline: "Help Lock In Hydration",
    image: "/images/ingredients/olive-oil.jpeg",
  },
  {
    slug: "sweet-almond",
    name: "Sweet Almond",
    tagline: "Soothes And Softens Skin",
    image: "/images/ingredients/almonds.jpeg",
  },
];

export default function IngredientsGallery() {
  return (
    <div className="ingredientGallery">
      {items.map((item, idx) => (
        <article className="ingredientCard" id={item.slug} key={item.slug}>
          <Image
            alt={item.name}
            className="ingredientCardImage"
            fill
            priority={idx < 4}
            sizes="(max-width: 980px) 50vw, 25vw"
            src={item.image}
          />
          <div className="ingredientCardCopy">
            <h3>{item.name}</h3>
            <span>{item.tagline}</span>
          </div>
        </article>
      ))}
    </div>
  );
}
