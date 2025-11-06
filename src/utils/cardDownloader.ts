import { QuoteCard } from './quoteExtractor';

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
    
    // Create the download version with no rounded corners or padding
    downloadContainer.innerHTML = `
      <div style="
        width: 100%;
        height: 100%;
        background: ${card.gradient};
        display: flex;
        flex-direction: column;
        font-family: ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif;
        position: relative;
      ">
        <!-- Artistic background elements -->
        <div style="
          position: absolute;
          inset: 0;
          opacity: 0.1;
          pointer-events: none;
        ">
          <div style="
            position: absolute;
            inset: 0;
            background-image: url('data:image/svg+xml,%3Csvg viewBox=\\'0 0 400 400\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cfilter id=\\'noiseFilter\\'%3E%3CfeTurbulence type=\\'fractalNoise\\' baseFrequency=\\'0.9\\' numOctaves=\\'4\\' stitchTiles=\\'stitch\\'/%3E%3C/filter%3E%3Crect width=\\'100%25\\' height=\\'100%25\\' filter=\\'url(%23noiseFilter)\\'/%3E%3C/svg%3E');
            background-size: 200px 200px;
          "></div>
        </div>
        
        <div style="
          position: absolute;
          inset: 0;
          opacity: 0.05;
          pointer-events: none;
          overflow: hidden;
        ">
          <div style="position: absolute; top: -80px; right: -80px; width: 320px; height: 320px; border-radius: 50%; background: rgba(255,255,255,0.2); filter: blur(60px);"></div>
          <div style="position: absolute; bottom: -80px; left: -80px; width: 400px; height: 400px; border-radius: 50%; background: rgba(0,0,0,0.1); filter: blur(60px);"></div>
          <div style="position: absolute; top: 33%; right: 25%; width: 200px; height: 200px; transform: rotate(45deg); background: rgba(255,255,255,0.1); filter: blur(40px);"></div>
        </div>
        
        <div style="
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
        "></div>
        <div style="
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          padding: 60px;
          position: relative;
          z-index: 10;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            color: rgba(255, 255, 255, 0.8);
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 2px;
            text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
          ">
            <span style="font-size: 20px;">${getSourceIcon()}</span>
            <span>${card.source.type}</span>
          </div>
          
          <div style="
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            margin: 40px 0;
          ">
            <blockquote style="
              color: white;
              font-size: 36px;
              text-align: center;
              line-height: 1.6;
              max-width: 900px;
              white-space: pre-line;
              margin: 0;
              text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            ">${card.quote}</blockquote>
          </div>
          
          <div style="
            text-align: center;
            color: rgba(255, 255, 255, 0.9);
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
          ">
            <h3 style="
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 8px;
              line-height: 1.3;
            ">${card.source.title}</h3>
            ${card.source.subtitle ? `
              <p style="
                font-size: 18px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 12px;
              ">${card.source.subtitle}</p>
            ` : ''}
            <p style="
              font-size: 16px;
              color: rgba(255, 255, 255, 0.6);
            ">${getSourceLabel()}</p>
          </div>
        </div>
        
        <div style="
          padding: 24px;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 72px;
        ">
          <p style="
            color: rgba(255, 255, 255, 0.5);
            font-size: 16px;
            margin: 0;
            text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
          ">@middleofallthings</p>
        </div>
      </div>
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

