import { symbolGlossary } from '../data/bookContent';

export interface SymbolMetadata {
  name: string;
  description: string;
  meaning: string;
  evolvedFrom?: string;
  context?: string;
  tags: string[];
  morphHistory: string[];
}

export interface GeneratedSymbol {
  svgPath: string;
  metadata: SymbolMetadata;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

class SymbolGenerator {
  private symbolPool: Array<{id: string, description: string}> = [];

  constructor() {
    // Convert glossary to symbol pool
    this.symbolPool = Object.entries(symbolGlossary).map(([id, description]) => ({
      id,
      description
    }));
  }

  generateSymbol(context?: string, userResponses?: string[]): GeneratedSymbol {
    // Select appropriate symbol based on context
    const selectedSymbol = this.selectSymbolByContext(context, userResponses);
    
    // Generate SVG based on the description
    const svgPath = this.createSVGFromDescription(selectedSymbol.description, selectedSymbol.id);
    
    // Create metadata
    const metadata: SymbolMetadata = {
      name: this.formatSymbolName(selectedSymbol.id),
      description: selectedSymbol.description,
      meaning: this.inferMeaning(selectedSymbol.id, context),
      context: context || 'onboarding',
      tags: this.generateTags(selectedSymbol.id, userResponses),
      morphHistory: [selectedSymbol.id]
    };

    // Generate color scheme based on the symbol type
    const colorScheme = this.generateColorScheme(selectedSymbol.id);

    return {
      svgPath,
      metadata,
      colorScheme
    };
  }

  private selectSymbolByContext(context?: string, userResponses?: string[]): {id: string, description: string} {
    let candidates = this.symbolPool;

    // Filter by context if provided
    if (context === 'onboarding') {
      // For onboarding, prefer foundational symbols
      const foundationalSymbols = [
        'compass-void', 'true-center', 'becoming-lens', 'breath-sequence',
        'sacred-radiance', 'spiral-anchor'
      ];
      candidates = this.symbolPool.filter(s => foundationalSymbols.includes(s.id));
    } else if (context === 'chapter-1') {
      // Chapter 1 symbols
      const ch1Symbols = [
        'true-center', 'inheritance-web', 'field-body', 'consecrated-step',
        'heaven-root', 'becoming-lens', 'turning-hand'
      ];
      candidates = this.symbolPool.filter(s => ch1Symbols.includes(s.id));
    } else if (context === 'chapter-2') {
      // Chapter 2 symbols
      const ch2Symbols = [
        'revealed-shape', 'resonant-core', 'echo-hunger', 'gravity-pull',
        'voice-mirror', 'soul-north', 'shed-skin'
      ];
      candidates = this.symbolPool.filter(s => ch2Symbols.includes(s.id));
    }

    // Select based on user responses if available
    if (userResponses && userResponses.length > 0) {
      const responseText = userResponses.join(' ').toLowerCase();
      
      if (responseText.includes('center') || responseText.includes('balance')) {
        const centerSymbol = candidates.find(s => s.id === 'true-center');
        if (centerSymbol) return centerSymbol;
      }
      
      if (responseText.includes('direction') || responseText.includes('compass')) {
        const compassSymbol = candidates.find(s => s.id === 'compass-void' || s.id === 'soul-north');
        if (compassSymbol) return compassSymbol;
      }
      
      if (responseText.includes('becoming') || responseText.includes('change')) {
        const becomingSymbol = candidates.find(s => s.id === 'becoming-lens');
        if (becomingSymbol) return becomingSymbol;
      }
    }

    // Random selection from candidates
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  private createSVGFromDescription(description: string, symbolId: string): string {
    const baseSize = 100;
    const center = baseSize / 2;
    
    // Create SVG based on symbol type
    switch (symbolId) {
      case 'compass-void':
        return `<circle cx="${center}" cy="${center}" r="30" fill="none" stroke="currentColor" stroke-width="2"/>
                <g stroke="currentColor" stroke-width="1">
                  <line x1="${center}" y1="10" x2="${center}" y2="35" />
                  <line x1="${center}" y1="65" x2="${center}" y2="90" />
                  <line x1="10" y1="${center}" x2="35" y2="${center}" />
                  <line x1="65" y1="${center}" x2="90" y2="${center}" />
                  <line x1="25" y1="25" x2="37" y2="37" />
                  <line x1="63" y1="63" x2="75" y2="75" />
                  <line x1="75" y1="25" x2="63" y2="37" />
                  <line x1="37" y1="63" x2="25" y2="75" />
                </g>`;

      case 'true-center':
        return `<circle cx="${center}" cy="${center}" r="4" fill="currentColor"/>
                <circle cx="${center}" cy="${center}" r="20" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
                <circle cx="${center}" cy="${center}" r="35" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"/>`;

      case 'spiral-anchor':
        const spiralPath = this.generateSpiral(center, center, 3, 25, 4);
        return `<path d="${spiralPath}" fill="none" stroke="currentColor" stroke-width="2"/>
                <circle cx="${center}" cy="${center}" r="3" fill="currentColor"/>`;

      case 'becoming-lens':
        return `<circle cx="${center}" cy="${center}" r="25" fill="none" stroke="currentColor" stroke-width="2"/>
                <path d="M 30 50 Q 50 30 70 50 Q 50 70 30 50" fill="currentColor" opacity="0.3"/>`;

      case 'heaven-root':
        return `<line x1="${center}" y1="10" x2="${center}" y2="90" stroke="currentColor" stroke-width="2"/>
                <polygon points="50,10 45,20 55,20" fill="currentColor"/>
                <polygon points="50,15 42,25 58,25" fill="currentColor" opacity="0.6"/>
                <path d="M 50 85 L 45 90 M 50 85 L 55 90 M 50 80 L 40 88 M 50 80 L 60 88" stroke="currentColor" stroke-width="1"/>`;

      case 'resonant-core':
        return `<circle cx="${center}" cy="${center}" r="6" fill="currentColor"/>
                <circle cx="${center}" cy="${center}" r="15" fill="none" stroke="currentColor" stroke-width="1" opacity="0.8"/>
                <circle cx="${center}" cy="${center}" r="24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.6"/>
                <circle cx="${center}" cy="${center}" r="33" fill="none" stroke="currentColor" stroke-width="1" opacity="0.4"/>`;

      case 'gravity-pull':
        return `<circle cx="${center}" cy="${center}" r="8" fill="currentColor"/>
                <path d="M 20 30 Q 40 40 30 50" fill="none" stroke="currentColor" stroke-width="1" marker-end="url(#arrowhead)"/>
                <path d="M 80 30 Q 60 40 70 50" fill="none" stroke="currentColor" stroke-width="1" marker-end="url(#arrowhead)"/>
                <path d="M 30 20 Q 40 40 50 30" fill="none" stroke="currentColor" stroke-width="1" marker-end="url(#arrowhead)"/>
                <path d="M 70 80 Q 60 60 50 70" fill="none" stroke="currentColor" stroke-width="1" marker-end="url(#arrowhead)"/>
                <defs><marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><polygon points="0 0, 6 3, 0 6" fill="currentColor"/></marker></defs>`;

      case 'sacred-radiance':
        return `<circle cx="${center}" cy="${center}" r="3" fill="currentColor"/>
                <g stroke="currentColor" stroke-width="1" opacity="0.7">
                  <line x1="${center}" y1="15" x2="${center}" y2="25" />
                  <line x1="${center}" y1="75" x2="${center}" y2="85" />
                  <line x1="15" y1="${center}" x2="25" y2="${center}" />
                  <line x1="75" y1="${center}" x2="85" y2="${center}" />
                  <line x1="27" y1="27" x2="35" y2="35" />
                  <line x1="65" y1="65" x2="73" y2="73" />
                  <line x1="73" y1="27" x2="65" y2="35" />
                  <line x1="35" y1="65" x2="27" y2="73" />
                </g>`;

      default:
        // Generic symbol based on description keywords
        if (description.includes('circle')) {
          return `<circle cx="${center}" cy="${center}" r="25" fill="none" stroke="currentColor" stroke-width="2"/>`;
        } else if (description.includes('spiral')) {
          const defaultSpiral = this.generateSpiral(center, center, 3, 20, 3);
          return `<path d="${defaultSpiral}" fill="none" stroke="currentColor" stroke-width="2"/>`;
        } else {
          return `<circle cx="${center}" cy="${center}" r="20" fill="none" stroke="currentColor" stroke-width="2"/>
                  <circle cx="${center}" cy="${center}" r="3" fill="currentColor"/>`;
        }
    }
  }

  private generateSpiral(centerX: number, centerY: number, turns: number, maxRadius: number, steps: number): string {
    let path = `M ${centerX} ${centerY}`;
    const totalSteps = turns * steps;
    
    for (let i = 1; i <= totalSteps; i++) {
      const angle = (i / steps) * 2 * Math.PI;
      const radius = (i / totalSteps) * maxRadius;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      path += ` L ${x} ${y}`;
    }
    
    return path;
  }

  private formatSymbolName(symbolId: string): string {
    return symbolId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private inferMeaning(symbolId: string, context?: string): string {
    const meanings: Record<string, string> = {
      'compass-void': 'Guidance that comes from embracing uncertainty and remaining open to all directions.',
      'true-center': 'The recognition that you are always at the center of your own experience and potential.',
      'becoming-lens': 'The lens through which you can see your own process of transformation.',
      'spiral-anchor': 'The movement that returns to itself while growing deeper and more stable.',
      'heaven-root': 'The connection between spiritual aspiration and earthly grounding.',
      'resonant-core': 'The vibration of authentic desire that aligns with your deepest self.',
      'gravity-pull': 'The natural attraction toward what truly serves your becoming.',
      'sacred-radiance': 'The light that emanates from any moment when you are fully present.'
    };

    return meanings[symbolId] || 'A symbol of your unique journey in the middle of all things.';
  }

  private generateTags(symbolId: string, userResponses?: string[]): string[] {
    const baseTags: Record<string, string[]> = {
      'compass-void': ['guidance', 'openness', 'direction', 'uncertainty'],
      'true-center': ['presence', 'awareness', 'potential', 'centeredness'],
      'becoming-lens': ['transformation', 'clarity', 'process', 'seeing'],
      'spiral-anchor': ['return', 'growth', 'stability', 'rhythm'],
      'heaven-root': ['connection', 'grounding', 'aspiration', 'balance'],
      'resonant-core': ['authenticity', 'desire', 'alignment', 'truth'],
      'gravity-pull': ['attraction', 'magnetism', 'calling', 'flow'],
      'sacred-radiance': ['presence', 'light', 'awareness', 'sacred']
    };

    let tags = baseTags[symbolId] || ['symbol', 'meaning', 'reflection'];

    // Add contextual tags based on user responses
    if (userResponses) {
      const responseText = userResponses.join(' ').toLowerCase();
      if (responseText.includes('uncertain')) tags.push('uncertainty');
      if (responseText.includes('center') || responseText.includes('balance')) tags.push('balance');
      if (responseText.includes('grow') || responseText.includes('change')) tags.push('growth');
      if (responseText.includes('reflect')) tags.push('reflection');
    }

    return tags;
  }

  private generateColorScheme(symbolId: string): {primary: string, secondary: string, accent: string} {
    // Color schemes that match the paper/ink aesthetic
    const schemes: Record<string, any> = {
      'compass-void': {
        primary: '#374151',    // Gray-700
        secondary: '#9CA3AF',  // Gray-400  
        accent: '#6B7280'      // Gray-500
      },
      'true-center': {
        primary: '#1F2937',    // Gray-800
        secondary: '#D1D5DB',  // Gray-300
        accent: '#374151'      // Gray-700
      },
      'becoming-lens': {
        primary: '#4B5563',    // Gray-600
        secondary: '#F3F4F6',  // Gray-100
        accent: '#6B7280'      // Gray-500
      },
      'sacred-radiance': {
        primary: '#374151',    // Gray-700
        secondary: '#E5E7EB',  // Gray-200
        accent: '#9CA3AF'      // Gray-400
      }
    };

    return schemes[symbolId] || schemes['true-center'];
  }

  evolveSymbol(currentSymbol: GeneratedSymbol, context: string): GeneratedSymbol {
    // Create an evolved version of the symbol
    const newSymbolId = this.selectRelatedSymbol(currentSymbol.metadata.name, context);
    const newSymbol = this.generateSymbol(context);
    
    // Merge histories
    newSymbol.metadata.evolvedFrom = currentSymbol.metadata.name;
    newSymbol.metadata.morphHistory = [...currentSymbol.metadata.morphHistory, newSymbolId];
    
    return newSymbol;
  }

  private selectRelatedSymbol(currentName: string, context: string): string {
    // Logic to select a related symbol for evolution
    const evolutions: Record<string, string[]> = {
      'compass-void': ['true-center', 'becoming-lens'],
      'true-center': ['resonant-core', 'sacred-radiance'],
      'becoming-lens': ['gravity-pull', 'spiral-anchor'],
      'spiral-anchor': ['heaven-root', 'true-center']
    };

    const currentId = currentName.toLowerCase().replace(' ', '-');
    const options = evolutions[currentId] || ['true-center'];
    return options[Math.floor(Math.random() * options.length)];
  }
}

// Export a function that creates and uses the generator
export function generateSymbol(context?: string, userResponses?: string[]): GeneratedSymbol {
  const generator = new SymbolGenerator();
  return generator.generateSymbol(context, userResponses);
} 