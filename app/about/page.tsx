import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio | Neuvesca",
  description:
    "The studio behind Neuvesca — a small atelier pouring scented candles for considered, unhurried rooms.",
};

const principles = [
  {
    label: "Focus",
    title: "One note, done well.",
    body: "Each Neuvesca candle centers on a single note, crafted with precision to ensure consistency, depth, and a quiet, lasting presence.",
  },
  {
    label: "Slow craft",
    title: "Poured by hand in small batches.",
    body: "Every Neuvesca candle is poured upon order, preserving the freshness and integrity of each scent.",
  },
  {
    label: "Quiet materials",
    title: "Beeswax, cotton wicks, and real glass.",
    body: "Carefully chosen materials, each selected for their quality, purity, and the way they elevate every pour.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="pageIntro pageIntroCentered">
        <p className="eyebrow">Our story</p>
        <h1>A skin-focused brand for slow rituals.</h1>
        <p className="lede">
          Neuvesca was born from the idea that scents should be felt, not just
          sensed. Each candle is carefully poured to melt into a warm,
          nourishing body serum, blending skincare with ritual. When the light
          is low, the pace softens, and care becomes intentional.
        </p>
      </section>

      <section className="aboutHero">
        <div className="aboutHeroImage" />
      </section>

      <section className="story aboutStory">
        <div className="storyCopy">
          <p className="eyebrow">A note from the owner</p>
          <h2>Crafted slowly, perfected for skin.</h2>
          <p>
            Neuvesca began in 2025, shaped through time and careful
            experimentation as we tested countless blends to find the perfect
            balance for our body serum candle. Every ingredient was chosen with
            intention, refined again and again until the texture, warmth, and
            absorption felt effortless on the skin. We are not mass-produced,
            each pour is created slowly to maintain consistency and care. The
            result is a candle that melts into a nourishing oil, transforming
            everyday routines into sensorial, intentional rituals that feel
            personal and quietly indulgent.
          </p>
        </div>
        <div className="storyImage aboutStoryImage" />
      </section>

      <section className="section principles">
        <div className="sectionHeader sectionHeaderCentered">
          <div>
            <p className="eyebrow">Our process</p>
            <h2>Three principles we stand by</h2>
          </div>
        </div>
        <div className="principlesGrid">
          {principles.map((p) => (
            <article key={p.label}>
              <span>{p.label}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="aboutCta">
        <div>
          <p className="eyebrow">The candles</p>
          <h2>Six scents, poured slowly.</h2>
          <p>
            The full collection is available now, each scent is designed
            personally for you.
          </p>
        </div>
      </section>
    </>
  );
}
