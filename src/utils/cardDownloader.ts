// Capture an existing DOM element at fixed 1080x1080 dimensions
export async function downloadElementAsImage(
  element: HTMLElement,
  filename: string
): Promise<void> {
  try {
    const html2canvas = (await import('html2canvas')).default;

    // Use fixed dimensions for consistent output
    const targetWidth = 1080;
    const targetHeight = 1080;

    // Measure original element to calculate scale factor
    const rect = element.getBoundingClientRect();
    const originalWidth = rect.width;
    const originalHeight = rect.height;
    
    // Calculate scale factor - use average for balanced scaling
    const scaleX = targetWidth / originalWidth;
    const scaleY = targetHeight / originalHeight;
    const scaleFactor = Math.min(scaleX, scaleY); // Use min to maintain aspect ratio, but we'll scale fonts more aggressively

    // Create offscreen container with fixed dimensions
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-99999px';
    container.style.top = '0';
    container.style.width = `${targetWidth}px`;
    container.style.height = `${targetHeight}px`;
    container.style.background = 'transparent';
    container.style.overflow = 'visible';

    // Clone the element to avoid capturing transforms/rounded corners
    const clone = element.cloneNode(true) as HTMLElement;
    
    // More aggressive font scaling factor for better readability
    const fontScaleFactor = Math.max(scaleFactor * 1.5, 2.5); // At least 2.5x, or 1.5x the scale factor
    
    // Recursively clean up styling and scale fonts aggressively
    const cleanAndScaleElement = (el: HTMLElement) => {
      el.style.borderRadius = '0';
      el.style.overflow = 'visible';
      // Also check class-based overflow
      if (el.classList.contains('overflow-hidden')) {
        el.classList.remove('overflow-hidden');
      }
      if (el.classList.contains('rounded-3xl')) {
        el.classList.remove('rounded-3xl');
      }
      
      // Scale font sizes aggressively
      const computedStyle = window.getComputedStyle(el);
      const fontSize = computedStyle.fontSize;
      if (fontSize && fontSize !== '0px') {
        const fontSizeNum = parseFloat(fontSize);
        if (!isNaN(fontSizeNum) && fontSizeNum > 0) {
          // Use aggressive font scaling
          el.style.fontSize = `${fontSizeNum * fontScaleFactor}px`;
        }
      }
      
      // Check if this is the quote blockquote element and make it responsive to length
      if (el.tagName === 'BLOCKQUOTE' || (el.classList.contains('font-serif') && el.textContent && el.textContent.length > 20)) {
        const quoteText = el.textContent || '';
        const quoteLength = quoteText.length;
        let targetQuoteSize: number;
        
        // Adjust font size based on quote length
        if (quoteLength <= 100) {
          // Short quotes - larger text
          targetQuoteSize = 60;
        } else if (quoteLength <= 200) {
          // Medium quotes
          targetQuoteSize = 52;
        } else if (quoteLength <= 300) {
          // Longer quotes
          targetQuoteSize = 44;
        } else if (quoteLength <= 400) {
          // Very long quotes
          targetQuoteSize = 38;
        } else {
          // Extremely long quotes - smallest
          targetQuoteSize = 32;
        }
        
        const currentFontSize = parseFloat(computedStyle.fontSize || '0');
        // Use the responsive size, but don't make it smaller than what was scaled
        if (currentFontSize > targetQuoteSize) {
          el.style.fontSize = `${targetQuoteSize}px`;
        } else if (currentFontSize < targetQuoteSize * 0.8) {
          // Only increase if it's significantly smaller
          el.style.fontSize = `${targetQuoteSize}px`;
        }
      }
      
      const textContent = el.textContent?.trim() || '';
      
      // Category container - move down slightly
      if (el.classList.contains('flex') && el.classList.contains('items-center') && 
          Array.from(el.children).some((child: Node) => 
            child instanceof HTMLElement && 
            (child.classList.contains('uppercase') || child.tagName === 'svg')
          )) {
        // This is the container with icon and category
        const currentMarginTop = parseFloat(computedStyle.marginTop || '0');
        el.style.marginTop = `${Math.max(currentMarginTop * scaleFactor, 40 * scaleFactor)}px`;
      }
      
      // Increase font size for category/type (uppercase tracking-wider)
      if (el.classList.contains('uppercase') && el.classList.contains('tracking-wider')) {
        const currentFontSize = parseFloat(computedStyle.fontSize || '0');
        const minCategorySize = 24; // Category text size
        if (currentFontSize < minCategorySize) {
          el.style.fontSize = `${minCategorySize}px`;
        }
      }
      
      // Scale icon sizes - make them bigger than category text
      if (el.tagName === 'svg') {
        const iconSize = 32; // Bigger than category text (24px)
        el.setAttribute('width', `${iconSize}`);
        el.setAttribute('height', `${iconSize}`);
        el.style.width = `${iconSize}px`;
        el.style.height = `${iconSize}px`;
      }
      
      // Reduce title size (H3 or font-semibold)
      if (el.tagName === 'H3' || (el.classList.contains('font-semibold') && textContent && textContent.length < 100 && !textContent.includes('•'))) {
        const currentFontSize = parseFloat(computedStyle.fontSize || '0');
        const maxTitleSize = 32; // Smaller title text
        if (currentFontSize > maxTitleSize) {
          el.style.fontSize = `${maxTitleSize}px`;
        } else if (currentFontSize < maxTitleSize) {
          el.style.fontSize = `${maxTitleSize}px`;
        }
      }
      
      // Increase subtitle size (Meditation/Story text under title)
      // This is the P tag that comes after H3 and contains just "Meditation", "Story", etc.
      if (el.tagName === 'P' && textContent && !textContent.includes('•') &&
          (textContent.toLowerCase() === 'meditation' || textContent.toLowerCase() === 'story' || 
           textContent.toLowerCase() === 'book' || textContent.length < 20)) {
        // Check if previous sibling is H3 (title)
        const prevSibling = el.previousElementSibling;
        if (prevSibling && (prevSibling.tagName === 'H3' || prevSibling.classList.contains('font-semibold'))) {
          const currentFontSize = parseFloat(computedStyle.fontSize || '0');
          const minSubtitleSize = 26; // Bigger subtitle text
          if (currentFontSize < minSubtitleSize) {
            el.style.fontSize = `${minSubtitleSize}px`;
          }
        }
      }
      
      // Increase font size for watermark
      if (textContent === '@middleofallthings') {
        const currentFontSize = parseFloat(computedStyle.fontSize || '0');
        const minWatermarkSize = 20; // Larger watermark text
        if (currentFontSize < minWatermarkSize) {
          el.style.fontSize = `${minWatermarkSize}px`;
        }
        el.style.opacity = '0.8';
        // Make the text darker/more visible
        const color = computedStyle.color;
        if (color.includes('rgba') || color.includes('rgb')) {
          el.style.color = 'rgba(0, 0, 0, 0.6)';
        }
      }
      
      // Scale padding and margins proportionally
      const spacingProps = ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 
       'marginTop', 'marginRight', 'marginBottom', 'marginLeft'] as const;
      spacingProps.forEach(prop => {
        const value = computedStyle.getPropertyValue(prop);
        if (value && value !== '0px' && value !== 'auto') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue > 0) {
            el.style[prop] = `${numValue * scaleFactor}px`;
          }
        }
      });
      
      // Scale gap
      const gap = computedStyle.gap;
      if (gap && gap !== '0px' && gap !== 'normal') {
        const gapNum = parseFloat(gap);
        if (!isNaN(gapNum)) {
          el.style.gap = `${gapNum * scaleFactor}px`;
        }
      }
      
      // NOW apply specific spacing adjustments AFTER general scaling
      
      // Source info container - move up by reducing bottom margin/padding
      if (el.classList.contains('flex-col') && el.classList.contains('justify-center') && 
          Array.from(el.children).some((child: Node) => 
            child instanceof HTMLElement && child.tagName === 'H3'
          )) {
        // This is the source info container with title, subtitle, location
        // Reduce bottom spacing to move container up
        el.style.marginBottom = `${10 * scaleFactor}px`;
        el.style.paddingBottom = `${5 * scaleFactor}px`;
      }
      
      // Add spacing between title and subtitle (after scaling)
      if (el.tagName === 'P' && textContent && !textContent.includes('•') &&
          (textContent.toLowerCase() === 'meditation' || textContent.toLowerCase() === 'story' || 
           textContent.toLowerCase() === 'book' || textContent.length < 20)) {
        const prevSibling = el.previousElementSibling;
        if (prevSibling && (prevSibling.tagName === 'H3' || prevSibling.classList.contains('font-semibold'))) {
          // Add spacing between title and subtitle
          el.style.marginTop = `${16 * scaleFactor}px`;
        }
      }
      
      // Increase font size and add spacing for location/part-chapter info
      if (textContent.includes('•') && (el.tagName === 'P' || el.tagName === 'SPAN')) {
        const currentFontSize = parseFloat(computedStyle.fontSize || '0');
        const minLocationSize = 22; // Location text
        if (currentFontSize < minLocationSize) {
          el.style.fontSize = `${minLocationSize}px`;
        }
        // Add spacing between title/subtitle and location
        el.style.marginTop = `${20 * scaleFactor}px`;
      }
      
      // Watermark container - add spacing from location and reduce bottom padding
      if (el.classList.contains('flex') && el.classList.contains('items-center') && 
          el.classList.contains('justify-center') &&
          Array.from(el.children).some((child: Node) => 
            child instanceof HTMLElement && child.textContent?.trim() === '@middleofallthings'
          )) {
        // This is the watermark container
        // Add spacing from location above (padding-top)
        el.style.paddingTop = `${24 * scaleFactor}px`;
        // Reduce bottom padding to move everything up and create more space at bottom
        el.style.paddingBottom = `${10 * scaleFactor}px`;
      }
      
      // Recurse through children
      Array.from(el.children).forEach(child => {
        if (child instanceof HTMLElement) {
          cleanAndScaleElement(child);
        }
      });
    };
    
    // Apply cleaning and scaling to clone
    cleanAndScaleElement(clone);
    
    // Set clone to target dimensions directly (no transform)
    clone.style.width = `${targetWidth}px`;
    clone.style.height = `${targetHeight}px`;
    clone.style.transform = 'none';
    clone.style.willChange = 'auto';

    container.appendChild(clone);
    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      backgroundColor: null,
      scale: 2,
      logging: false,
      useCORS: true,
      width: targetWidth,
      height: targetHeight
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

