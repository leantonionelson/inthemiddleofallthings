/**
 * Video Preloader Service
 * Preloads background videos early in the app lifecycle for instant playback
 */

class VideoPreloaderService {
  private preloadedVideos: Map<string, HTMLVideoElement> = new Map();
  private isPreloading = false;

  /**
   * Preload background videos
   */
  async preloadVideos(): Promise<void> {
    if (this.isPreloading) {
      return;
    }

    this.isPreloading = true;

    const videoUrls = ['/media/bg.mp4', '/media/bg-desktop.mp4'];

    try {
      // Preload via service worker cache first
      if ('caches' in window) {
        const cache = await caches.open('middle-video-v2');
        await Promise.all(
          videoUrls.map(async (url) => {
            try {
              const cached = await cache.match(url);
              if (!cached) {
                // Fetch and cache if not already cached
                const response = await fetch(url);
                if (response.ok) {
                  await cache.put(url, response.clone());
                }
              }
            } catch (error) {
              console.warn('Failed to cache video:', url, error);
            }
          })
        );
      }

      // Also preload in browser for immediate playback
      await Promise.all(
        videoUrls.map(async (url) => {
          try {
            const video = document.createElement('video');
            video.preload = 'auto';
            video.muted = true;
            video.playsInline = true;
            video.src = url;
            
            // Load the video
            await new Promise<void>((resolve, reject) => {
              video.addEventListener('loadeddata', () => {
                this.preloadedVideos.set(url, video);
                resolve();
              });
              video.addEventListener('error', reject);
              video.load();
            });
          } catch (error) {
            console.warn('Failed to preload video:', url, error);
          }
        })
      );

      console.log('✅ Background videos preloaded');
    } catch (error) {
      console.error('Video preloading failed:', error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Get a preloaded video element (cloned for reuse)
   */
  getPreloadedVideo(url: string): HTMLVideoElement | null {
    const video = this.preloadedVideos.get(url);
    if (video) {
      // Clone the video element for reuse
      const cloned = video.cloneNode(true) as HTMLVideoElement;
      cloned.currentTime = 0;
      return cloned;
    }
    return null;
  }

  /**
   * Check if a video is preloaded
   */
  isVideoPreloaded(url: string): boolean {
    return this.preloadedVideos.has(url);
  }
}

export const videoPreloader = new VideoPreloaderService();

