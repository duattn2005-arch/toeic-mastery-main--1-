"use client";

import * as React from "react";
import { createRoot } from "react-dom/client";
import { driver, type Driver, type DriveStep, type Side, type Alignment } from "driver.js";
import { useTourStep } from "@/hooks/use-tour-step";
import { TOUR_STEP_COUNT, type TourId } from "@/lib/constants/tour";

const SKIP_BTN_TEXT = "Bỏ qua";

export interface TourStepInput {
  /** CSS selector for the element to spotlight — omit for a centered
   * "welcome" popover (driver.js falls back to a screen-centered dummy
   * element when no `element` is given). */
  element?: string;
  title: string;
  description: string;
  /** Optional rich content shown instead of `description`'s plain text —
   * mounted into driver.js's popover.description DOM node via a React root
   * (driver.js's own `description` field is HTML-string-only, and this
   * step's content needs real icon components + theme thumbnails, not a
   * hand-built HTML string). `description` is still required as the
   * accessible-name/no-JS fallback text. */
  descriptionNode?: React.ReactNode;
  /** Exact button label for this step — every tour's copy is user-specified
   * per step (e.g. "Tiếp tục", "Đã hiểu, chọn đề ngay", "Hoàn tất"), never a
   * single generic default. */
  nextBtnText: string;
  /** Called when the "next" button (this step's literal `nextBtnText`) is
   * clicked. On every step except the tour's true final one this should
   * both persist the next step (`advance`) and move the shared driver
   * instance forward (`moveNext`); on the true final step it should mark
   * the whole tour done (`skip`) and close the popover (`destroy`). */
  onNext: () => void;
  /** Called from the "Bỏ qua" button — always means "turn this tour off for
   * good", regardless of which step it's clicked from. */
  onSkip: () => void;
  side?: Side;
  align?: Alignment;
  /** Literal "Bước i/N" text — omit on welcome/intro steps, which never show
   * a progress badge across any of the tours (matches the copy spec, where
   * only the numbered spotlight steps carry an "i/N" label). */
  progressText?: string;
}

/** One `driver.js` step with the shared onboarding-tour chrome baked in:
 * "Bỏ qua" always sits in the previous-button slot (so every step shows the
 * exact "Bỏ qua" | "<nextBtnText>" button pair the copy spec requires), and
 * that button is never auto-disabled by driver.js's own first-step logic. */
export function buildTourStep(input: TourStepInput): DriveStep {
  return {
    element: input.element,
    popover: {
      title: input.title,
      description: input.description,
      side: input.side,
      align: input.align,
      showButtons: ["next", "previous"],
      disableButtons: [],
      showProgress: !!input.progressText,
      progressText: input.progressText ?? "",
      nextBtnText: input.nextBtnText,
      prevBtnText: SKIP_BTN_TEXT,
      onNextClick: input.onNext,
      onPrevClick: input.onSkip,
      // driver.js rebuilds the popover DOM fresh on every step, so this root
      // is never explicitly unmounted — the node it's attached to is
      // discarded along with it. Harmless for a one-shot onboarding step.
      onPopoverRender: input.descriptionNode
        ? (popover) => createRoot(popover.description).render(input.descriptionNode)
        : undefined,
    },
  };
}

/**
 * Wrapper around `driver()` shared by every tour component. Each call to the
 * returned `runTour` replaces any previous instance and starts a fresh one —
 * tours are one-shot, so there's never more than one active at a time.
 * Destroyed automatically on unmount so navigating away mid-tour never
 * leaves a detached overlay behind.
 */
export function useTourDriver() {
  const driverRef = React.useRef<Driver | null>(null);

  React.useEffect(
    () => () => {
      driverRef.current?.destroy();
      driverRef.current = null;
    },
    []
  );

  const runTour = React.useCallback((steps: DriveStep[], startIndex = 0) => {
    driverRef.current?.destroy();
    const instance = driver({
      // false, not the default true: with it on, driver.js treats ANY click
      // outside its own popover/stage as "close the tour" — including a
      // click on an unrelated overlay like the cookie-consent banner (see
      // layout.tsx), which sits above everything and made the tour vanish
      // the moment someone answered the cookie prompt. The only way to
      // leave a tour now is its own "Bỏ qua" button.
      allowClose: false,
      overlayOpacity: 0.6,
      stagePadding: 6,
      stageRadius: 12,
      popoverClass: "toeic-tour-popover",
      popoverOffset: 12,
      smoothScroll: true,
      steps,
    });
    driverRef.current = instance;
    instance.drive(startIndex);
    return instance;
  }, []);

  return { runTour, driverRef };
}

export interface SequentialStepConfig {
  element?: string;
  title: string;
  description: string;
  /** See TourStepInput.descriptionNode. */
  descriptionNode?: React.ReactNode;
  nextBtnText: string;
  side?: Side;
  align?: Alignment;
  /** Omit the "Bước i/N" badge for this step — used for welcome/intro
   * screens, which never carry a progress badge in the copy spec. */
  noProgress?: boolean;
}

/**
 * Drives one contiguous slice of a (possibly cross-page) tour: `configs[0]`
 * corresponds to global step `startAt`, `configs[1]` to `startAt + 1`, etc.
 * On mount it resumes from whichever of those global steps is next-unseen
 * (so a reload mid-tour picks up where it left off instead of restarting),
 * and does nothing once none of them are still pending. The step that is
 * last in `configs` is treated as this slice's end: if it's also the tour's
 * true final step (`isFinalStep`, default true) finishing it marks the
 * whole tour done; otherwise it just persists progress and closes, letting
 * the next page's own tour component pick up from there.
 *
 * "Bước i/N" numbering: `N` defaults to `TOUR_STEP_COUNT[tourId]`. For `i`,
 * every tour except Dashboard's counts its welcome step as an (unlabeled)
 * slot 1 — e.g. Listening's copy literally labels its 2nd/3rd steps
 * "Bước 2/3"/"3/3", so its one non-welcome step before them still needs to
 * "use up" slot 1. Dashboard's copy instead calls its welcome "Bước 0" and
 * starts the real 1..5 count only at the first spotlight step, so its
 * welcome step must NOT consume a numbering slot (`welcomeCountsAsStep:
 * false`).
 */
export function useSequentialTour(
  tourId: TourId | string,
  configs: SequentialStepConfig[],
  options?: { startAt?: number; isFinalStep?: boolean; totalSteps?: number; welcomeCountsAsStep?: boolean }
) {
  const startAt = options?.startAt ?? 0;
  const isFinalStep = options?.isFinalStep ?? true;
  const totalSteps = options?.totalSteps ?? TOUR_STEP_COUNT[tourId as TourId] ?? configs.length;
  const welcomeCountsAsStep = options?.welcomeCountsAsStep ?? true;
  const { isActive, advance, skip } = useTourStep(tourId);
  const { runTour, driverRef } = useTourDriver();

  React.useEffect(() => {
    const startIndex = configs.findIndex((_, i) => isActive(startAt + i));
    if (startIndex === -1) return;

    const steps = configs.map((c, i) => {
      const position = welcomeCountsAsStep
        ? startAt + i + 1
        : configs.slice(0, i + 1).filter((step) => !step.noProgress).length;
      const progressText = c.noProgress ? undefined : `Bước ${position}/${totalSteps}`;
      const isLastOfSlice = i === configs.length - 1;
      return buildTourStep({
        element: c.element,
        title: c.title,
        description: c.description,
        descriptionNode: c.descriptionNode,
        nextBtnText: c.nextBtnText,
        side: c.side,
        align: c.align,
        progressText,
        onNext: () => {
          if (!isLastOfSlice) {
            // Still inside this page's own local step array — driver.js
            // tracks that index itself, so nothing needs persisting here;
            // doing so anyway would "advance" past a step nothing ever
            // checks isActive() for again, silently orphaning the tour.
            driverRef.current?.moveNext();
            return;
          }
          if (isFinalStep) skip();
          else advance(startAt + i + 1);
          driverRef.current?.destroy();
        },
        onSkip: () => {
          skip();
          driverRef.current?.destroy();
        },
      });
    });

    runTour(steps, startIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, startAt, isFinalStep, totalSteps, welcomeCountsAsStep]);
}
