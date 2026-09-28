// Audio track selection strategy based on stream characteristics.
// Determines whether to use native HTML5 audio tracks or force a better path
// (DASH native or hls.js) for multi-audio streams where native selection is unreliable.

import type { ManifestAudio } from '../types';

export interface AudioSelectionStrategy {
  useNativeAudioTracks: boolean;
  reason: string;
}

/**
 * Determines if native HTML5 audioTracks API is safe to use for this stream.
 *
 * Native webOS implementation collapses multiple audio renditions of the same
 * language into a single track, making selection unreliable. This function
 * recommends avoiding native selection when such conditions are detected.
 */
export function getAudioSelectionStrategy(
  manifestAudio: ManifestAudio[],
  isHls: boolean,
  isDash: boolean,
): AudioSelectionStrategy {
  // Single audio track: native is safe
  if (manifestAudio.length <= 1) {
    return {
      useNativeAudioTracks: true,
      reason: 'Single audio track',
    };
  }

  // Count same-language renditions (collapse risk)
  const languageCounts = new Map<string, number>();
  for (const audio of manifestAudio) {
    const lang = audio.lang || 'unknown';
    languageCounts.set(lang, (languageCounts.get(lang) ?? 0) + 1);
  }

  const hasCollapsedLanguages = Array.from(languageCounts.values()).some(
    (count) => count > 1,
  );

  // Multiple renditions of the same language: native will collapse them
  if (hasCollapsedLanguages && isHls) {
    return {
      useNativeAudioTracks: false,
      reason:
        'HLS with multiple audio renditions per language; native collapses them (use hls.js or DASH)',
    };
  }

  // DASH with multi-language: native is generally safer
  if (isDash) {
    return {
      useNativeAudioTracks: true,
      reason: 'DASH native has better audio demultiplexing',
    };
  }

  // Default: safe to use native
  return {
    useNativeAudioTracks: true,
    reason: 'Multi-language HLS without same-language duplication',
  };
}
