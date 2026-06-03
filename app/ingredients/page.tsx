import type { Metadata } from "next";
import IngredientsGallery from "./IngredientsExplorer";

export const metadata: Metadata = {
  title: "Ingredients | Neuvesca",
  description:
    "What goes into every Neuvesca pour — wax, wick, fragrance, and the small things that matter.",
};

export default function IngredientsPage() {
  return (
    <>
      <section className="pageIntro pageIntroCentered">
        <p className="eyebrow">Within every pour</p>
        <h1>The ingredients</h1>
      </section>

      <section className="section">
        <IngredientsGallery />
      </section>
    </>
  );
}
