-- Site-wide default "Live theme" wallpaper changed from "aurora" to
-- "lily-pond-cat" (see DEFAULT_SITE_THEME_ID in
-- src/lib/constants/site-themes.ts). Existing rows are untouched — this
-- only changes what a brand-new user_settings row falls back to.
ALTER TABLE "user_settings" ALTER COLUMN "site_theme" SET DEFAULT 'lily-pond-cat';
