"use client";

import { AudioPlayer } from "@/components/exam/audio-player";
import { TtsAudioPlayer } from "@/components/exam/tts-audio-player";
import { PassageViewer } from "@/components/exam/passage-viewer";
import { ListeningAudioTour } from "@/components/listening/listening-audio-tour";
import type { ExamData } from "@/lib/data/exam";

/**
 * The audio/passage block shared by a group of questions — extracted out of
 * ExamQuestionPanel so it can be mounted ONCE per group (keyed by
 * `passage.id` at the call site) instead of once per question. That's the
 * actual fix for "moving to the next question in the same group replays the
 * audio from 0:00": previously this JSX lived inside a panel keyed by
 * `question.id`, so React tore down and recreated the `<audio>` element on
 * every single-question navigation, even within one shared-stimulus group.
 *
 * Also owns the single `ListeningAudioTour` instance for the group. When a
 * group has N questions, the caller renders N per-question cards
 * simultaneously (see exam-runner.tsx) — if each of those independently
 * rendered a tour instance, N `driver.js` instances would fight over the
 * same spotlighted element at once. Keeping the tour here (one mount per
 * group) avoids that.
 */
export function PassageStimulus({
  passage,
  mode,
  allowReplay,
  showAudioTour,
  className,
  imageSizes,
}: {
  passage: NonNullable<ExamData["passages"][string]>;
  mode: "PRACTICE" | "EXAM";
  allowReplay: boolean;
  showAudioTour: boolean;
  className?: string;
  /** Forwarded to PassageViewer — see its own doc for why this should match
   * how wide the caller's layout actually renders the image. */
  imageSizes?: string;
}) {
  return (
    <div className={className}>
      {passage.audioUrl ? (
        <AudioPlayer src={passage.audioUrl} allowReplay={mode === "PRACTICE" || allowReplay} className="mb-3" tourAnchor={showAudioTour} />
      ) : (
        passage.transcript && (
          <TtsAudioPlayer text={passage.transcript} allowReplay={mode === "PRACTICE" || allowReplay} className="mb-3" tourAnchor={showAudioTour} />
        )
      )}
      <PassageViewer title={passage.title} texts={passage.texts} imageUrls={passage.imageUrls} priority imageSizes={imageSizes} />
      {showAudioTour && <ListeningAudioTour />}
    </div>
  );
}
