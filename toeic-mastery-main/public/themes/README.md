# Dashboard live theme assets

Theme metadata lives in `src/lib/constants/dashboard-themes.ts`. Each
non-default theme currently ships a hand-drawn placeholder SVG at
`public/themes/<theme-id>/background.svg` — same file used for the gallery
thumbnail, the hero background, and (for video themes) the `<video poster>`.

## Replacing a placeholder with a real photo or video

1. Export your asset (jpg/webp for a photo, mp4 for a loop).
2. Drop it in `public/themes/<theme-id>/` under any name you like.
3. Update that theme's `imageSrc` (and `previewSrc`) — or `videoSrc` for a
   video theme — in `src/lib/constants/dashboard-themes.ts` to point at the
   new file.

If a referenced file is ever missing, the hero/gallery quietly falls back to
that theme's `swatchFrom`/`swatchTo` gradient instead of a broken-image icon
— there's no crash risk either way.

Guidelines for new photo/video exports:

- **Background photo** — full-bleed, ~1920×960 (2:1-ish, the hero is a short
  wide banner), export as `.jpg`/`.webp`, keep under ~400KB.
- **Gallery/poster preview** — a smaller crop is fine, ~600×400.
- **Video loop** — muted, silent-safe (it always plays with `muted`), H.264
  mp4, ideally under ~4–6MB and a few seconds long so it loops seamlessly.
  Keep the busiest motion away from the top-left, since dashboard text sits
  on top of it.

`aurora` (the default theme) has no file — it's the existing CSS animated
gradient and always works.
