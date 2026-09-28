import { describe, it, expect } from 'vitest';
import {
  getAudioSelectionStrategy,
  type AudioSelectionStrategy,
} from './audio-selection-strategy';

describe('getAudioSelectionStrategy', () => {
  it('recommends native for single audio track', () => {
    const manifest = [{ name: 'English', lang: 'en', isDefault: true }];
    const strategy = getAudioSelectionStrategy(manifest, true, false);

    expect(strategy.useNativeAudioTracks).toBe(true);
    expect(strategy.reason).toContain('Single');
  });

  it('recommends avoiding native for HLS with duplicate languages', () => {
    const manifest = [
      { name: 'English (Main)', lang: 'en', isDefault: true },
      { name: 'English (Secondary)', lang: 'en', isDefault: false },
    ];
    const strategy = getAudioSelectionStrategy(manifest, true, false);

    expect(strategy.useNativeAudioTracks).toBe(false);
    expect(strategy.reason).toContain('collapse');
  });

  it('recommends native for HLS without duplicate languages', () => {
    const manifest = [
      { name: 'English', lang: 'en', isDefault: true },
      { name: 'Español', lang: 'es', isDefault: false },
      { name: 'Français', lang: 'fr', isDefault: false },
    ];
    const strategy = getAudioSelectionStrategy(manifest, true, false);

    expect(strategy.useNativeAudioTracks).toBe(true);
    expect(strategy.reason).toContain('without same-language');
  });

  it('recommends native for DASH with multiple audio tracks', () => {
    const manifest = [
      { name: 'English', lang: 'en', isDefault: true },
      { name: 'English (AD)', lang: 'en', isDefault: false },
      { name: 'Español', lang: 'es', isDefault: false },
    ];
    const strategy = getAudioSelectionStrategy(manifest, false, true);

    expect(strategy.useNativeAudioTracks).toBe(true);
    expect(strategy.reason).toContain('DASH');
  });

  it('handles missing language codes gracefully', () => {
    const manifest = [
      { name: 'Track 1', lang: '', isDefault: true },
      { name: 'Track 2', lang: '', isDefault: false },
    ];
    const strategy = getAudioSelectionStrategy(manifest, true, false);

    // Both have empty lang, so they collapse
    expect(strategy.useNativeAudioTracks).toBe(false);
  });

  it('handles empty manifest safely', () => {
    const manifest: any[] = [];
    const strategy = getAudioSelectionStrategy(manifest, true, false);

    expect(strategy.useNativeAudioTracks).toBe(true);
  });
});
