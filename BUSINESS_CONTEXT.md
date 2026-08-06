# Neuvesca — Business Context

> Reference document for marketing, sales, and content tools. Everything below is
> sourced from the live site code unless marked `TODO` (owner input needed).

---

## 1. Company snapshot

| | |
|---|---|
| **Brand** | Neuvesca |
| **Category** | Cosmetics / skincare — body serum candles |
| **Founded** | 2025 |
| **Team** | 3 co-founders (friends), all based in Egypt |
| **Base** | Cairo, Egypt |
| **Market** | Egypt (nationwide delivery, all governorates) |
| **Website** | https://www.neuvesca.com |
| **Model** | Direct-to-consumer e-commerce, made-to-order (poured on order) |
| **Stage** | Early-stage, small batch, not mass-produced |

### Contact & channels
- **Email:** neuvescacosmetics@gmail.com
- **WhatsApp:** +20 120 026 5774 (https://wa.me/201200265774)
- **Instagram:** https://www.instagram.com/neuvesca
- **TikTok:** https://www.tiktok.com/@neuvesca
- **Newsletter:** "Join the ritual" — email capture in the site footer

---

## 2. What we sell

**The core product: a body serum candle.** It is lit like a candle, melts into a
warm nourishing body oil/serum, and is massaged into the skin. Excess re-solidifies
in the vessel for future use. It sits at the intersection of skincare and ritual —
not a home fragrance candle.

**The ritual (our 3-step usage story):**
1. **Light** — light the wick, let the serum melt for a few moments.
2. **Melt** — the serum melts into an even, warm pool.
3. **Massage** — apply warm serum to the body; excess solidifies for next time.

### Catalogue structure
Three storefront categories:
- **Candles** — hand-poured body serum candles, each offered in several scents
- **Bundles** — curated sets, paired pours and small saves
- **Accessories** — wick trimmers, snuffers, small candle objects

### Product line (six numbered pours, ~220 g, ~42–50 hr burn)
| Product | Family | Positioning line |
|---|---|---|
| No. 01 White Tea | Fresh | Pale and open — bedrooms, reading corners, slow mornings |
| No. 02 Amber Veil | Warm | Soft amber and resin — low lamps, late dinners |
| No. 03 Sage Linen | Herbal | Green, sun-bleached — cleared desks, quiet afternoons |
| No. 04 Neroli Stone | Citrus | Cool citrus, rain-washed musk — kitchens, open windows |
| No. 05 Velvet Fig | Fruit | Plush fig and violet — soft music, candlelight |
| No. 06 Cedar Smoke | Woody | Smoked cedar, warm spice — studios, libraries, cold nights |

### Scent options (offered across products)
**Pomegranate**, **Coconut**, **Vanilla**, **Honey** — the four buyable primary
scents. (A wider library of composition notes exists behind the scenes: amber
resin, cedar, fig leaf, neroli, saffron, smoked vanilla, tonka, vetiver, white
tea, etc.)

### Ingredient story (skin-facing)
Avocado oil (deep moisture) · Argan oil (fine lines) · Beeswax (protects the
skin) · Rose hip (antioxidant protection) · Coconut oil (barrier + shine) ·
Jojoba oil (hydrates dry skin) · Olive oil (locks in hydration) · Sweet almond
(soothes and softens). Base materials: shea butter and botanical oils, beeswax,
soy & coconut wax, lead-free unbleached cotton wicks, IFRA-compliant
phthalate-free fragrance, reusable glass vessels.

---

## 3. Positioning & brand voice

**One-line positioning:** A body serum candle made specifically for your skin.

**Core promise:** "A candle that becomes a ritual for your skin." Neuvesca turns
candlelight into a warm body serum — crafted for slow evenings, soft skin, and
scents that feel personal.

**Brand philosophy:** Skincare should be experienced, not rushed. Scents should be
felt, not just sensed.

**Three stated principles:**
1. **Focus** — one note, done well. Each candle centres on a single note for
   consistency, depth, and quiet presence.
2. **Slow craft** — poured by hand in small batches, upon order, to preserve
   freshness.
3. **Quiet materials** — beeswax, cotton wicks, real glass.

**Tone of voice:** quiet luxury. Understated, sensorial, unhurried. Short
declarative lines. Lowercase-feeling calm rather than exclamation-driven hype.
Words we use: *ritual, slow, quiet, poured, warm, nourishing, intentional,
considered, softened*. Words we avoid: discount-shouting, urgency spam, clinical
jargon, "mass-produced".

**Visual identity:** cream and ink palette, Cormorant Garamond serif + Inter sans,
wide letter-spaced uppercase eyebrows, generous whitespace, editorial photography.

**Signature phrases in use:**
- "Light. Melt. Nourish."
- "Poured by hand · Shipped slowly"
- "We answer slowly, and always."
- "Join the ritual"

---

## 4. Customer & audience

- **Primary geography:** Egypt — Cairo first, then other governorates.
- **Profile:** skincare-interested consumers who buy into ritual and
  self-care, gifting buyers, and premium-beauty shoppers who want something
  that isn't mass-produced.
- **Occasions:** evening wind-down routines, gifting, self-care treats.
- **Social proof on-site** currently uses aspirational international voices
  (Copenhagen, Lisbon, Brooklyn) — signals an international-luxury aesthetic even
  though sales are domestic.

`TODO (owner input):` age range, income bracket, Arabic vs. English preference of
the core buyer, and whether gifting or personal use dominates orders.

---

## 5. Commerce operations

**Currency:** EGP (Egyptian Pound).

**Payment methods:** Cash on delivery, Paymob (card, hosted iframe checkout),
Fawry. Guest checkout is supported alongside registered accounts (Google sign-in
available).

**Shipping (Egypt only):**
- Cairo — EGP 100
- All other governorates — EGP 130
- **Free shipping over EGP 1,500**
- Standard delivery 5–10 working days (excl. weekends/holidays)
- Next-day / business delivery on request by email

**Returns & exchanges:**
- 14 days from delivery, unused/unlit, original packaging, seals intact
- Cosmetic/hygiene rules: broken safety seals cannot be returned
- Damaged, melted, or incorrect orders: report within 48 hours by email

**Promotions:** percentage-based promo codes with start/end dates, max-use caps,
and usage tracking — usable for campaign-specific discount codes.

**Admin capability:** in-house admin dashboard for orders, order-status workflow,
products, stock levels, scents, promo codes, and users.

---

## 6. Tech stack (for context on what marketing can plug into)

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · Supabase
(Postgres, auth, storage, RLS, edge functions) · Paymob + Fawry payments ·
Nodemailer for transactional email · deployed on Vercel.

Implication: we control the storefront end to end — landing pages, promo codes,
email capture, and product content can all be shipped in-house quickly.

---

## 7. Marketing status & priorities

**Currently active:** Instagram, TikTok, WhatsApp (direct sales/support), email
newsletter capture, the site itself.

**Assets that exist:** brand story, ingredient education content (ingredients
explorer page), ritual/how-to-use content, product photography, six-scent line.

**Strategic angles worth leaning on:**
- Product is a *category-crosser* (candle × skincare) — the "wait, it melts into
  serum?" demo is highly video-native for TikTok/Reels.
- Made-to-order and small-batch supports scarcity and premium pricing without
  discounting.
- Free shipping at EGP 1,500 is a natural AOV lever (bundles).
- Gifting seasons in Egypt: Ramadan/Eid, Mother's Day (21 March), Valentine's,
  wedding/engagement gifting.

`TODO (owner input to complete this section):`
- Founder names and role split across the 3 of us (product / ops / marketing)
- Monthly revenue, order volume, and AOV today
- Retail price points per SKU in EGP
- Current best-selling scent and best-selling product
- Paid ad spend, if any, and on which platform
- Growth target for the next 6–12 months
- Named competitors in the Egyptian premium candle/skincare market
- Whether we do wholesale, corporate gifting, or pop-ups
