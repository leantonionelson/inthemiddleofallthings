import { QuoteCard } from './quoteExtractor';

// Capture an existing DOM element exactly as rendered on screen
export async function downloadElementAsImage(
  element: HTMLElement,
  filename: string
): Promise<void> {
  try {
    const html2canvas = (await import('html2canvas')).default;

    // Measure current element
    const rect = element.getBoundingClientRect();

    // Create offscreen container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-99999px';
    container.style.top = '0';
    container.style.width = `${Math.ceil(rect.width)}px`;
    container.style.height = `${Math.ceil(rect.height)}px`;
    container.style.background = 'transparent';
    container.style.overflow = 'visible';

    // Clone the element to avoid capturing transforms/rounded corners
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Recursively remove border-radius and overflow-hidden from all elements
    const removeClipping = (el: HTMLElement, isRoot = false) => {
      el.style.borderRadius = '0';
      el.style.overflow = 'visible';
      // Also check class-based overflow
      if (el.classList.contains('overflow-hidden')) {
        el.classList.remove('overflow-hidden');
      }
      if (el.classList.contains('rounded-3xl')) {
        el.classList.remove('rounded-3xl');
      }
      
      // Boost watermark opacity for better visibility in export
      const text = el.textContent?.trim();
      if (text === '@middleofallthings') {
        el.style.opacity = '0.8';
        // Make the text darker/more visible
        const color = window.getComputedStyle(el).color;
        if (color.includes('rgba') || color.includes('rgb')) {
          el.style.color = 'rgba(0, 0, 0, 0.6)';
        }
      }
      
      // Add top margin to the main content container (not the root)
      // This is the flex-col container with the icon, quote, and source info
      if (!isRoot && el.classList.contains('flex-col') && el.classList.contains('justify-between')) {
        el.style.marginTop = '20px';
        el.style.marginBottom = '8px';
      }
      
      // Recurse through children
      Array.from(el.children).forEach(child => {
        if (child instanceof HTMLElement) {
          removeClipping(child, false);
        }
      });
    };
    
    // Apply to clone
    removeClipping(clone, true);
    
    // Neutralize any transforms from animations
    clone.style.transform = 'none';
    clone.style.willChange = 'auto';
    // Ensure the clone uses explicit size
    clone.style.width = `${Math.ceil(rect.width)}px`;
    clone.style.height = `${Math.ceil(rect.height)}px`;

    container.appendChild(clone);
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      backgroundColor: null,
      scale: 2,
      logging: false,
      useCORS: true,
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height)
    });

    // Cleanup offscreen elements
    document.body.removeChild(container);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    console.error('Error downloading element:', error);
    alert('Failed to download card. Please try again.');
  }
}

export async function downloadCardAsImage(
  card: QuoteCard
): Promise<void> {
  try {
    // Dynamically import html2canvas
    const html2canvas = (await import('html2canvas')).default;
    
    // Create a temporary container for the download version
    const downloadContainer = document.createElement('div');
    downloadContainer.style.position = 'fixed';
    downloadContainer.style.left = '-9999px';
    downloadContainer.style.top = '0';
    downloadContainer.style.width = '1080px'; // Instagram square size
    downloadContainer.style.height = '1080px';
    document.body.appendChild(downloadContainer);
    
    // Get source icon based on type
    const getSourceIcon = () => {
      switch (card.source.type) {
        case 'book': return '📖';
        case 'meditation': return '⚖️';
        case 'story': return '📜';
        default: return '📄';
      }
    };
    
    const getSourceLabel = () => {
      if (card.source.type === 'book') {
        return `${card.source.part} • ${card.source.chapter}`;
      }
      return card.source.type === 'meditation' ? 'Meditation' : 'Story';
    };
    
    // Create the download version with basic HTML/CSS for html2canvas compatibility
    downloadContainer.innerHTML = `
      <table style="
        width: 1080px;
        height: 1080px;
        background: ${card.gradient};
        font-family: Georgia, serif;
        border-collapse: collapse;
        table-layout: fixed;
      ">
        <tr>
          <td style="padding: 0; margin: 0; vertical-align: top;">
            <div style="
              width: 100%;
              height: 1080px;
              padding: 60px;
              text-align: center;
            ">
              <!-- Header -->
              <div style="margin-bottom: 40px;">
                <span style="
                  color: rgba(255, 255, 255, 0.8);
                  font-size: 14px;
                  text-transform: uppercase;
                  letter-spacing: 2px;
                  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
                ">${getSourceIcon()} ${card.source.type}</span>
              </div>
              
              <!-- Spacer for vertical centering -->
              <div style="height: 240px;"></div>
              
              <!-- Quote -->
              <div style="
                padding: 0 60px;
                margin-bottom: 100px;
              ">
                <div style="
                  color: white;
                  font-size: 36px;
                  text-align: center;
                  line-height: 1.6;
                  max-width: 900px;
                  margin: 0 auto;
                  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                ">${card.quote}</div>
              </div>
              
              <!-- Source Info -->
              <div style="
                text-align: center;
                color: rgba(255, 255, 255, 0.9);
                margin-bottom: 30px;
              ">
                <div style="
                  font-size: 24px;
                  font-weight: 600;
                  margin-bottom: 8px;
                  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
                ">${card.source.title}</div>
                ${card.source.subtitle ? `
                  <div style="
                    font-size: 18px;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 12px;
                    text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
                  ">${card.source.subtitle}</div>
                ` : ''}
                <div style="
                  font-size: 16px;
                  color: rgba(255, 255, 255, 0.6);
                  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
                ">${getSourceLabel()}</div>
              </div>
              
              <!-- Watermark -->
              <div style="
                color: rgba(255, 255, 255, 0.5);
                font-size: 16px;
                text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
              ">@middleofallthings</div>
            </div>
          </td>
        </tr>
      </table>
    `;
    
    // Capture the download version
    const canvas = await html2canvas(downloadContainer, {
      backgroundColor: null,
      scale: 2, // Higher quality
      logging: false,
      useCORS: true,
      width: 1080,
      height: 1080
    });
    
    // Remove temporary container
    document.body.removeChild(downloadContainer);
    
    // Convert to blob and download
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `middle-quote-${card.source.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  } catch (error) {
    console.error('Error downloading card:', error);
    alert('Failed to download card. Please try again.');
  }
}

