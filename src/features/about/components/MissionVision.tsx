/**
 * About page — Section 2: Mission and Vision
 *
 * Side-by-side cards on desktop, stacked on mobile. Mission is grounded in
 * the present ("we provide..."), Vision is aspirational ("we will be...").
 * Visually distinguished by a small label color: slate for Mission, gold
 * accent for Vision.
 */
export function MissionVision() {
  return (
    <section
      aria-labelledby="mission-vision-heading"
      className="border-b border-slate-200 bg-white py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2
          id="mission-vision-heading"
          className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl"
        >
          Mission &amp; Vision
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
          <article className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
              Mission
            </p>
            <p className="mt-3 font-serif text-lg leading-relaxed text-slate-900 sm:text-xl">
              We provide quality secondary education that develops competent,
              values-driven, and globally-minded learners ready to contribute
              to their community.
            </p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#c8a85c]">
              Vision
            </p>
            <p className="mt-3 font-serif text-lg leading-relaxed text-slate-900 sm:text-xl">
              To be a leading public secondary school recognized for academic
              excellence, character formation, and meaningful engagement with
              the community we serve.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
