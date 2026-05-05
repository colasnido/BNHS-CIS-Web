import Link from "next/link";
import { ROUTES } from "@/constants/routes";

const stats = [
  { value: "381", label: "Students enrolled" },
  { value: "19", label: "Faculty & staff" },
  { value: "82%", label: "College acceptance" },
  { value: "20+", label: "Clubs & programs" },
];

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-[#0f1f3a] text-white"
      aria-labelledby="hero-heading"
    >
      {/* Decorative gradient — pure CSS, no images, no JS */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(200,168,92,0.15),transparent)]"
      />

      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-12 lg:gap-16 lg:px-8 lg:py-28">
        {/* Left: messaging */}
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
              className="inline-flex items-center gap-2 bg-[#c8a85c] px-6 py-3 text-sm font-semibold text-[#0f1f3a] transition-colors hover:bg-[#d4b76b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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

        {/* Right: stats panel — institutional fact card instead of generic decoration */}
        <aside
          className="lg:col-span-5 lg:pl-8"
          aria-label="School at a glance"
        >
          <div className="border border-white/10 bg-white/[0.03] p-8 backdrop-blur-[2px]">
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
                    {stat.value}
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
