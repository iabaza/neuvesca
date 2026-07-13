import Image from "next/image";
import { INGREDIENT_ITEMS } from "@/lib/ingredients-data";

export default function IngredientsGallery() {
  return (
    <div className="ingredientGallery">
      {INGREDIENT_ITEMS.map((item, idx) => (
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
