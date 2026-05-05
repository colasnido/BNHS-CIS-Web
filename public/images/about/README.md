# About page images

Drop your facility photos here. Until they're added, the About page renders the layout with empty slate-100 placeholder boxes — the page works fine, the images just aren't there yet.

## Required files

The Facilities section (`src/features/about/components/Facilities.tsx`) references these paths:

| Filename | Used for |
|----------|----------|
| `classrooms.jpg` | A representative classroom |
| `science-lab.jpg` | The science laboratory |
| `library.jpg` | The school library |
| `computer-lab.jpg` | The ICT / computer laboratory |
| `sports.jpg` | The covered court or sports field |
| `hall.jpg` | The multi-purpose hall |

## Recommended dimensions

- **Aspect ratio**: 4:3 (the layout enforces this — non-4:3 photos will be cropped to fit)
- **Resolution**: at least **1200 × 900 pixels** for crisp display on desktops and high-DPI mobile screens
- **Format**: JPG for photos, WebP if you can produce it (Next/Image will serve modern formats automatically when you supply a fallback)
- **File size**: under 500 KB per image after compression. Use [Squoosh](https://squoosh.app) or [TinyPNG](https://tinypng.com) if needed.

## How to add fewer photos

If you only have, say, four photos right now, edit `src/features/about/components/Facilities.tsx` and remove the entries from the `FACILITIES` array that you don't have photos for. The grid handles 1–6 items correctly.

## Hero / leadership / faculty photos

These sections currently render without photos by design. To add them later:

- **Hero background image**: edit `AboutHero.tsx` and replace the radial-gradient div with a `next/image` element. Use a wide landscape shot of the school grounds.
- **Leadership headshots**: edit `Leadership.tsx` and add `imageSrc` and `imageAlt` fields to the `Leader` interface and corresponding markup. Square 1:1 crops work best.
- **Faculty group photo**: same pattern in `FacultyOverview.tsx`.

## Alt text

The current alt text in `Facilities.tsx` is generic ("A typical classroom..."). Once you add real photos, update the `imageAlt` field on each entry to describe what's actually in the photo. Good alt text helps screen readers and Google.
