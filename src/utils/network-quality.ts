// Network quality detection for adaptive buffer sizing.
// Measures initial download speed and classifies network as poor/normal/good.

export interface NetworkQualityMetrics {
  downloadSpeedMbps: number;
  classification: 'poor' | 'normal' | 'good';
  bufferLengthSeconds: number;
}

export class NetworkQualityDetector {
  private bytesDownloaded = 0;
  private startTime = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private resolved = false;

  // Thresholds for network classification (Mbps)
  private readonly POOR_THRESHOLD = 5;
  private readonly GOOD_THRESHOLD = 20;

  // Buffer presets (seconds)
  private readonly BUFFER_POOR = 60;
  private readonly BUFFER_NORMAL = 30;
  private readonly BUFFER_GOOD = 15;

  // Measurement window (ms)
  private readonly MEASURE_WINDOW = 3000;

  start(): void {
    this.bytesDownloaded = 0;
    this.startTime = Date.now();
    this.resolved = false;
  }

  recordBytes(bytes: number): void {
    if (this.resolved) return;
    this.bytesDownloaded += bytes;
  }

  async getMetrics(): Promise<NetworkQualityMetrics> {
    if (this.resolved) {
      return this.calculateMetrics();
    }

    // Wait up to MEASURE_WINDOW for speed to stabilize
    return new Promise((resolve) => {
      this.timer = setTimeout(() => {
        this.resolved = true;
        resolve(this.calculateMetrics());
      }, this.MEASURE_WINDOW);
    });
  }

  private calculateMetrics(): NetworkQualityMetrics {
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    const downloadSpeedMbps =
      elapsedSeconds > 0
        ? (this.bytesDownloaded * 8) / elapsedSeconds / 1_000_000
        : 0;

    const classification =
      downloadSpeedMbps < this.POOR_THRESHOLD
        ? 'poor'
        : downloadSpeedMbps > this.GOOD_THRESHOLD
          ? 'good'
          : 'normal';

    const bufferLengthSeconds =
      classification === 'poor'
        ? this.BUFFER_POOR
        : classification === 'good'
          ? this.BUFFER_GOOD
          : this.BUFFER_NORMAL;

    return {
      downloadSpeedMbps,
      classification,
      bufferLengthSeconds,
    };
  }

  destroy(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
