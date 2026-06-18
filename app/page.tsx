import Image from "next/image";
import Link from "next/link";
import { listActiveProducts } from "@/lib/queries/products";
import { formatPrice } from "@/lib/format";
import HeroCarousel from "@/components/HeroCarousel";

const reviews = [
  {
    quote: "The scent is soft, and the serum leaves my skin incredibly smooth.",
    name: "Eloise R.",
    place: "Copenhagen",
  },
  {
    quote: "Melts beautifully into a warm oil, perfect for slow, intentional evenings.",
    name: "Marguerite A.",
    place: "Lisbon",
  },
  {
    quote: "Feels luxurious from the first light to the final touch on skin.",
    name: "Theo M.",
    place: "Brooklyn",
  },
];

function Stars() {
  return (
    <span className="stars" aria-label="Five out of five">
      <span>★</span>
      <span>★</span>
      <span>★</span>
      <span>★</span>
      <span>★</span>
    </span>
  );
}

export default async function Home() {
  const products = await listActiveProducts();
  const featured = products.slice(0, 3);

  return (
    <>
      <section className="hero">
        <div className="heroCopy">
          <p className="eyebrow">Body Serum Candle</p>
          <h1>A candle that becomes a ritual for your skin</h1>
          <p className="lede">
            Neuvesca transforms candlelight into a warm body serum, crafted for
            slow evenings, soft skin, and scents that feel personal.
          </p>
        </div>
        <HeroCarousel />
      </section>

      <section className="section" id="shop">
        <div className="sectionHeader">
          <div>
            <h2>The Neuvesca Candles</h2>
          </div>
          <Link className="sectionLink" href="/products">View all scents</Link>
        </div>
        <div className="productGrid">
          {featured.map((product) => (
            <Link
              className="productCard"
              key={product.id}
              href={`/products/${product.slug}`}
            >
              <div className={`productVisual ${product.tone ?? ""}`}>
                <div className="productMeta">
                  <span>{product.family}</span>
                  {product.burn_time_hours ? (
                    <span>{product.burn_time_hours} hr burn</span>
                  ) : null}
                </div>
                {product.image_url ? (
                  <Image
                    alt={product.name}
                    className="object-contain"
                    fill
                    sizes="(min-width: 980px) 30vw, 90vw"
                    src={product.image_url}
                  />
                ) : (
                  <div className="candle">
                    <span>Neuvesca</span>
                  </div>
                )}
              </div>
              <div className="productInfo">
                <div className="productCardHeader">
                  <h3>{product.name}</h3>
                  <span className="productCardPrice">
                    {formatPrice(product.price_cents, product.currency)}
                  </span>
                </div>
                <p>{product.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="ritual" id="ritual">
        <div className="ritualIntro">
          <p className="eyebrow">Ritual</p>
          <h2>Light. Melt. Nourish.</h2>
          <p>
            Our body serum candle is infused with a rich blend of shea butter
            and botanical oils designed to hydrate deeply, soften texture, and
            enhance natural glow.
          </p>
        </div>
        <div className="ritualGrid">
          <article>
            <span>Light</span>
            <h3>Light the wick and allow the serum to melt for a few moments.</h3>
            <p>
              Let the flame settle as you pause, breathe deeply, and enjoy the
              scent.
            </p>
          </article>
          <article>
            <span>Melt</span>
            <h3>Let the warm serum melt into a pool of nourishment.</h3>
            <p>
              As the wick burns, allow the serum to melt slowly and evenly.
            </p>
          </article>
          <article>
            <span>Massage</span>
            <h3>Apply the warm serum to your body, gently massaging it into your skin.</h3>
            <p>
              Apply the warm serum to your body, any excess will gently
              solidify for future use.
            </p>
          </article>
        </div>
      </section>

      <section className="story" id="journal">
        <div className="storyImage" />
        <div className="storyCopy">
          <p className="eyebrow">Our philosophy</p>
          <h2>Skincare should be experienced, not rushed.</h2>
          <p>
            Neuvesca was born from candle rituals and skin science. Every
            product is hand-poured using sustainably sourced botanical
            ingredients, designed to transform your daily routine into a
            moment of intentional nourishment.
          </p>
          <Link className="storyLink" href="/about">Read Our story</Link>
        </div>
      </section>

      <section className="reviews" aria-label="Customer reviews">
        <div className="reviewsHeader">
          <p className="eyebrow">Soft rituals, lasting impressions</p>
          <h2>What it feels like, in their words</h2>
        </div>
        <div className="reviewsGrid">
          {reviews.map((review) => (
            <figure key={review.quote}>
              <Stars />
              <blockquote>&ldquo;{review.quote}&rdquo;</blockquote>
              <figcaption>
                <span>{review.name}</span>
                <span>{review.place}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
