/**
 * Media page — Section 2: Testimonials
 *
 * Card grid: 1 col mobile, 2 cols sm, 3 cols lg. Six testimonials covers
 * the brief's three audiences (students, faculty, alumni) with two each.
 *
 * Per design decision: no photos. Each card uses a colored circle with the
 * person's first initial as a stand-in. When you have real headshots,
 * swap the InitialAvatar for an Image without changing the layout.
 *
 * Color rotation: deterministic by index, not random — keeps visual rhythm
 * predictable across server renders (no hydration mismatch). Three accent
 * tones from the existing palette.
 */

interface Testimonial {
  /** Display name. Used to derive the initial. */
  name: string;
  /** Role label shown beneath the name. */
  role: 'Student' | 'Teacher' | 'Alumni' | 'Parent';
  /** Optional class/year for context. */
  detail?: string;
  /** The actual testimonial. Keep to 1–2 sentences. */
  quote: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: '[REPLACE]',
    role: 'Student',
    detail: 'Grade 12, STEM',
    quote:
      'The teachers here actually take the time to make sure you understand. I came in nervous about senior high and now I feel ready for college.',
  },
  {
    name: '[REPLACE]',
    role: 'Student',
    detail: 'Grade 10',
    quote:
      'Joining the science club was the best decision I made. We get to do experiments that aren\u2019t in the textbook and compete in fairs.',
  },
  {
    name: '[REPLACE]',
    role: 'Teacher',
    detail: 'Mathematics Department',
    quote:
      'What I love about teaching here is the support — between teachers, parents, and the community. You\u2019re never alone in helping a student succeed.',
  },
  {
    name: '[REPLACE]',
    role: 'Teacher',
    detail: 'Filipino Department',
    quote:
      'Our students bring the curriculum to life. Each year I learn something from them — and that\u2019s what keeps the work meaningful.',
  },
  {
    name: '[REPLACE]',
    role: 'Alumni',
    detail: 'Class of [REPLACE]',
    quote:
      'Looking back, the foundation I got here — both academic and personal — is what carried me through university. I owe a lot to my teachers.',
  },
  {
    name: '[REPLACE]',
    role: 'Parent',
    detail: 'Parent of Grade 9 student',
    quote:
      'My child has grown so much in confidence and discipline. The school feels like an extension of our family.',
  },
];

/** Three accent colors from the palette, picked deterministically by index. */
const AVATAR_TONES = [
  'bg-[#0f1f3a] text-[#c8a85c]', // navy + gold
  'bg-[#c8a85c] text-[#0f1f3a]', // gold + navy
  'bg-slate-700 text-white', // slate
] as const;

function InitialAvatar({ name, index }: { name: string; index: number }) {
  // Use the first non-bracket character of the name. For "[REPLACE]" inputs
  // this falls back to "?" so the placeholder is obviously a placeholder.
  const cleanName = name.replace(/\[.*?\]/g, '').trim();
  const initial = cleanName.length > 0 ? cleanName.charAt(0).toUpperCase() : '?';
  const tone = AVATAR_TONES[index % AVATAR_TONES.length];

  return (
    <div
      aria-hidden="true"
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-serif text-base font-semibold ${tone}`}
    >
      {initial}
    </div>
  );
}

export function Testimonials() {
  return (
    <section
      aria-labelledby="testimonials-heading"
      className="border-b border-slate-200 bg-white py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2
          id="testimonials-heading"
          className="font-serif text-2xl font-semibold text-slate-900 sm:text-3xl"
        >
          What People Say
        </h2>
        <p className="mt-2 text-base text-slate-600">
          Voices from across our school community.
        </p>

        <ul
          role="list"
          className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {TESTIMONIALS.map((t, i) => (
            <li
              key={`${t.role}-${i}`}
              className="rounded-lg border border-slate-200 bg-white p-6"
            >
              {/* Quote first — the content is what matters, the attribution
                  is supporting. Quote uses serif for institutional weight. */}
              <blockquote className="font-serif text-base leading-relaxed text-slate-800">
                <p>&ldquo;{t.quote}&rdquo;</p>
              </blockquote>

              {/* Attribution row — initial circle + name/role stack. */}
              <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
                <InitialAvatar name={t.name} index={i} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {t.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {t.role}
                    {t.detail && (
                      <>
                        <span aria-hidden="true"> · </span>
                        {t.detail}
                      </>
                    )}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
