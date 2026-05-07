import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/constants/routes';
import { countUsersByRole } from '@/services/user.service';
import { AnimatedCount } from './AnimatedCount';

/**
 * HeroSection — public homepage hero with school name, intro, and stats.
 *
 * Update notes:
 *   - Stat values now wrapped in <AnimatedCount> for the count-up effect.
 *     Server still fetches the numeric target; the small client island
 *     handles the animation.
 *   - Everything else unchanged from the data-fetch update.
 *
 * Layout/colors carried over from previous version unchanged.
 */
function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}

export async function HeroSection() {
  const [studentCount, facultyCount] = await Promise.all([
    countUsersByRole('student'),
    countUsersByRole('faculty'),
  ]);

  const stats = [
    { value: formatCount(studentCount), label: 'Students enrolled' },
    { value: formatCount(facultyCount), label: 'Faculty & staff' },
    { value: '82%', label: 'College acceptance' },
    { value: '20+', label: 'Clubs & programs' },
  ];

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-[#0a1428] via-[#0f1f3a] to-[#14233f] text-white"
      aria-labelledby="hero-heading"
    >
      {/* Backdrop photo of the school grounds. Decorative — the section is
          labelled by the hero heading, so empty alt is correct. priority
          tells next/image to skip lazy-loading since this is above-the-fold. */}
      <Image
        src="/images/bnhs-cover.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      {/* Dark overlay, heavier on the left where the headline + body text
          sits, fading to ~45% on the right so the photo reads behind the
          frosted-glass stats panel. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,20,40,0.92)_0%,rgba(10,20,40,0.78)_45%,rgba(10,20,40,0.45)_100%)]"
      />
      {/* Subtle bottom darken so the section transitions cleanly into
          QuickLinks without a hard color seam. */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a1428]/70 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(200,168,92,0.18),transparent)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8a85c]/40 to-transparent"
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-16 lg:px-8 lg:py-28">
        <div className="lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#c8a85c]">
            Welcome to
          </p>
          <h1
            id="hero-heading"
            className="mt-4 font-serif text-4xl leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl"
          >
            Badiang National
            <br />
            High School
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            A public secondary institution serving the community of Badiang
            since 1969. Where curiosity meets character — preparing students for
            college, career, and lifelong learning.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link
              href={ROUTES.ABOUT}
              className="inline-flex items-center gap-2 bg-gradient-to-b from-[#d4b674] via-[#c8a85c] to-[#a8893d] px-6 py-3 text-sm font-semibold text-[#0f1f3a] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-all hover:from-[#dcc084] hover:via-[#d4b674] hover:to-[#b89a4a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              About the School
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              href={ROUTES.EVENTS}
              className="inline-flex items-center gap-2 border border-slate-600 bg-transparent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8a85c]"
            >
              View Events
            </Link>
          </div>
        </div>

        <aside
          className="lg:col-span-5 lg:pl-8"
          aria-label="School at a glance"
        >
          <div className="relative border border-[#c8a85c]/25 bg-white/[0.06] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent"
            />
            <h2 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#c8a85c]">
              At a glance
            </h2>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <dt className="text-xs uppercase tracking-wider text-slate-400">
                    {stat.label}
                  </dt>
                  <dd className="mt-1 font-serif text-3xl font-semibold text-white">
                    {/* AnimatedCount runs on the client; the server-rendered
                        markup contains the final value as well, so users
                        without JS still see the correct number. */}
                    <AnimatedCount formatted={stat.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </section>
  );
}
