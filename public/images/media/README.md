# Media page images

Drop your photos here following the structure below. Until they're added, the Media page renders the layout with empty slate-100 placeholder boxes — the page works fine, the images just aren't there yet.

## Folder structure

```
public/images/media/
├── events/                  20 photos
├── classrooms/              20 photos
├── facilities/              20 photos
├── extracurriculars/        20 photos
└── event-highlights/         6 photos (3 for foundation, 2 for buwan-ng-wika, 1 for sci-math)
```

## Filenames — gallery

The Photo Gallery section expects filenames in this exact pattern:

```
events/events-01.jpg, events-02.jpg, ..., events-20.jpg
classrooms/classrooms-01.jpg, ..., classrooms-20.jpg
facilities/facilities-01.jpg, ..., facilities-20.jpg
extracurriculars/extracurriculars-01.jpg, ..., extracurriculars-20.jpg
```

Two-digit numbering with leading zeros. If you only have, say, 12 photos for one category, edit `src/features/media/components/PhotoGallery.tsx` and change the `makePhotos('events', 20, ...)` call to `makePhotos('events', 12, ...)`. The grid handles any count from 1 upward.

## Filenames — event highlights

The Event Highlights section expects these specific filenames:

```
event-highlights/foundation-01.jpg, foundation-02.jpg, foundation-03.jpg
event-highlights/buwan-ng-wika-01.jpg, buwan-ng-wika-02.jpg
event-highlights/sci-math-01.jpg
```

To change events, edit the `EVENTS` array in `src/features/media/components/EventHighlights.tsx`.

## Recommended dimensions

| Where | Aspect ratio | Min resolution | Format |
|-------|--------------|----------------|--------|
| Gallery (any category) | square (1:1) | 800 × 800 | JPG |
| Event highlights | 16:9 or 4:3 | 1200 × 900 | JPG |

Keep each file under **500 KB** after compression. Use [Squoosh](https://squoosh.app) or [TinyPNG](https://tinypng.com) if needed.

## Why these sizes

The gallery is a 5-column desktop grid. At a max page width of ~1280px with gaps, each image renders at about 240px. On retina displays Next/Image serves a 480px variant. So 800×800 source gives clean output without bloat.

Event highlight images render up to ~800px wide on desktop, so 1200×900 source covers retina.

## Featured video

The Featured Video uses YouTube's auto-generated thumbnail — you don't need to provide one. Just supply a valid `videoId` in `src/app/(public)/media/page.tsx`.

To use a video ID, take a YouTube URL like:
```
https://www.youtube.com/watch?v=ABCD1234efg
                              ^^^^^^^^^^^
                              this is the videoId
```

## Alt text

Default alt text in the gallery is generic ("School event — photo 1"). When you add real photos, update the `altBase` in `PhotoGallery.tsx` or — better — replace `makePhotos()` with a hand-written array where each photo has descriptive alt text. Good alt text helps both screen readers and Google image search.
