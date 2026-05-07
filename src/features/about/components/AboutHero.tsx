import Image from 'next/image';

/**
 * About page — Section 1: School Overview (Hero)
 *
 * Same cover photo as the homepage hero, but with a uniform (not left-heavy)
 * dark overlay so it reads as documentary context for the page rather than
 * a welcome banner. The overlay is heavier than the home hero overall — the
 * About page is text-dense, and we don't need the photo competing.
 */
export function AboutHero() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-[#0a1428] via-[#0f1f3a] to-[#14233f] text-white"
      aria-labelledby="about-hero-heading"
    >
      <Image
        src="/images/bnhs-cover.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#0a1428]/82"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a1428]/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(200,168,92,0.15),transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8a85c]/40 to-transparent"
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
