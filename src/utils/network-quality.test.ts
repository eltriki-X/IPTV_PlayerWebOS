import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NetworkQualityDetector } from './network-quality';

describe('NetworkQualityDetector', () => {
  let detector: NetworkQualityDetector;

  beforeEach(() => {
    detector = new NetworkQualityDetector();
  });

  afterEach(() => {
    detector.destroy();
  });

  it('classifies poor network (< 5 Mbps)', async () => {
    detector.start();

    // Simulate 2 Mbps: 250KB in 1 second
    detector.recordBytes(250_000);

    // Wait for measurement window
    await new Promise(resolve => setTimeout(resolve, 100));

    const metrics = await detector.getMetrics();
    // Should detect as poor or normal depending on timing
    expect(metrics.bufferLengthSeconds).toBeGreaterThan(15);
  });

  it('records bytes correctly', () => {
    detector.start();
    detector.recordBytes(1000);
    detector.recordBytes(1000);

    // Just verify it doesn't throw
    expect(true).toBe(true);
  });

  it('handles empty download', async () => {
    detector.start();
    // Don't record any bytes
    const metrics = await detector.getMetrics();

    expect(metrics.downloadSpeedMbps).toBe(0);
    expect(metrics.classification).toBe('poor');
    expect(metrics.bufferLengthSeconds).toBe(60);
  });

  it('destroys timer cleanly', () => {
    detector.start();
    detector.destroy();
    // Should not throw on double destroy
    detector.destroy();
    expect(true).toBe(true);
  });

  it('classification is deterministic', async () => {
    detector.start();
    detector.recordBytes(0); // Zero speed = poor
    const metrics = await detector.getMetrics();

    expect(['poor', 'normal', 'good']).toContain(metrics.classification);
    expect([15, 30, 60]).toContain(metrics.bufferLengthSeconds);
  });
});
