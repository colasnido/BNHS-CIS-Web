/**
 * About page — Section 1: School Overview (Hero)
 *
 * Inherits the navy/gold palette from the home page hero so the About page
 * feels like the same institution. No image used per design decision —
 * pure CSS gradient is faster to load and cannot break.
 */
export function AboutHero() {
  return (
    <section
      className="relative overflow-hidden bg-[#0f1f3a] text-white"
      aria-labelledby="about-hero-heading"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(200,168,92,0.15),transparent)]"
      />
      <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a85c]">
          About our school
        </p>
        <h1
          id="about-hero-heading"
          className="mt-4 font-serif text-4xl leading-[1.1] tracking-tight sm:text-5xl"
        >
          Badiang National High School
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
          A public secondary school in Badiang, serving Grades 7 through 12.
          We prepare students for college, career, and citizenship — grounded
          in academic rigor and the values of our community.
        </p>
      </div>
    </section>
  );
}
