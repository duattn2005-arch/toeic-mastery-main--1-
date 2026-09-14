-- Lets a Passage (Part 3/4/6/7 shared-stimulus group) carry up to 3 images
-- instead of just 1. `image_url` stays in place (mirrored to imageUrls[0]
-- on every write going forward) since several read-only surfaces still only
-- ever show one preview image and have no reason to handle the full array.
ALTER TABLE "passages" ADD COLUMN "image_urls" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill: every existing passage's single image becomes its first (and
-- for now only) entry in the new array, so nothing already-published
-- suddenly renders with no image.
UPDATE "passages" SET "image_urls" = ARRAY["image_url"] WHERE "image_url" IS NOT NULL;
