import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';

// ⬇️ adjust the path if your service is elsewhere. From src/app/qr/* to src/app/services/*
import { CustomerSelectionService } from '../../services/customer-selection.service';;

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="qr-wrap">
      <video id="qr-video" class="qr-video" autoplay muted playsinline></video>
      <div class="qr-overlay">
        <div class="frame"></div>
        <div class="hint">Point a QR with a CUSTOMER_ID</div>
      </div>
    </div>
  `,
  styles: [`
    .qr-wrap{position:relative;display:flex;align-items:center;justify-content:center;background:#0b1220;flex:1}
    .qr-video{width:100%;height:100%;object-fit:cover;max-height:calc(100vh - 180px)}
    .qr-overlay{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:none}
    .frame{width:260px;height:260px;border:3px solid rgba(255,255,255,.9);border-radius:16px;box-shadow:0 0 0 9999px rgba(0,0,0,.35) inset}
    .hint{margin-top:14px;color:#fff;font-weight:600;background:rgba(0,0,0,.35);padding:6px 10px;border-radius:8px}
  `]
})
export class QrScannerComponent implements OnInit, OnDestroy {
  @Output() found = new EventEmitter<string>();

  private zxing = new BrowserMultiFormatReader();
  private controls?: IScannerControls;
  private stopRequested = false;

  constructor(
    private zone: NgZone,
    private customerSelection: CustomerSelectionService
  ) {}

  async ngOnInit() {
    try {
      // Enumerate devices and choose a back/environment camera if possible
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const dev = this.pickBestDevice(devices);
      console.log('[QR] using device:', dev.label || dev.deviceId || 'default');

      // Ask for a decent resolution to help the detector
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: dev.deviceId ? { exact: dev.deviceId } : undefined,
          // handle missing label safely
          facingMode: (dev.label || '').toLowerCase().includes('back')
            ? 'environment'
            : { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      const video = document.getElementById('qr-video') as HTMLVideoElement;
      video.srcObject = stream;
      await video.play();

      // Prefer the native BarcodeDetector when available (better perf on many browsers)
      if ('BarcodeDetector' in window) {
        // @ts-ignore
        const detector = new BarcodeDetector({ formats: ['qr_code'] });
        console.log('[QR] using BarcodeDetector');
        this.pollNative(detector, video);
      } else {
        // Fallback to ZXing continuous mode
        console.log('[QR] using ZXing');
        this.controls = await this.zxing.decodeFromVideoElement(
          video,
          (result, err, controls) => {
            if (this.stopRequested) return;
            if (result) {
              const text = (result.getText() || '').trim();
              console.log(text)
              if (!text) return;

              // ⚠️ Re-enter Angular for change detection + app state updates
              this.zone.run(() => {
                console.log('[QR] decoded (ZXing):', text);
                this.stopRequested = true;
                controls.stop();

                // Emit to parent (pos-screen) and publish to the shared service
                this.found.emit(text);
                this.customerSelection.set(text.toUpperCase());
              });
            }
          }
        );
      }
    } catch (e) {
      console.error('[QR] init error:', e);
      alert('Could not access camera. Please allow camera permission and try again.');
    }
  }

  ngOnDestroy(): void {
    this.stopRequested = true;
    try { this.controls?.stop(); } catch {}
    const video = document.getElementById('qr-video') as HTMLVideoElement | null;
    const stream = video?.srcObject as MediaStream | undefined;
    stream?.getTracks().forEach(t => t.stop());
  }

  // ===== helpers =====
  private pickBestDevice(devices: MediaDeviceInfo[]) {
    const by = (s: string) => devices.find(d => (d.label || '').toLowerCase().includes(s));
    return by('back') || by('rear') || by('environment') || devices[0] || { deviceId: undefined, label: '' } as any;
  }

  private async pollNative(detector: any, video: HTMLVideoElement) {
    const loop = async () => {
      if (this.stopRequested) return;
      try {
        const barcodes = await detector.detect(video);
        if (barcodes && barcodes.length) {
          const text = (barcodes[0].rawValue || '').trim();
          if (text) {
            // ⚠️ Re-enter Angular here as well
            this.zone.run(() => {
              console.log('[QR] decoded (Native):', text);
              this.stopRequested = true;
              this.found.emit(text);
              this.customerSelection.set(text.toUpperCase());
            });
            return;
          }
        }
      } catch {
        // ignore transient decode errors
      }
      requestAnimationFrame(loop);
    };
    loop();
  }
}
