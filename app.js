// Color Picker Widget Functionality

class ColorPickerWidget {
  constructor() {
    this.themeButton = document.getElementById('themeButton');
    this.audioContext = null;

    // Color cycling configuration
    this.colors = [
      { hex: '#5b3a3e', name: 'Cordovan' },
      { hex: '#5b4c3a', name: 'Cedar Ochre' },
      { hex: '#545b3a', name: 'Field Olive' },
      { hex: '#3e5b3a', name: 'Forest Fir' },
      { hex: '#3a5b4c', name: 'Sea Pine' },
      { hex: '#3a545b', name: 'Steel Teal' },
      { hex: '#3a3e5b', name: 'Night Indigo' },
      { hex: '#4c3a5b', name: 'Eggplant' },
      { hex: '#5b3a54', name: 'Mulberry Ash' }
    ];
    this.currentColorIndex = 0;

    // Color generation configuration - tweak these values!
    this.colorConfig = {
      // Brightness multipliers (higher = lighter colors)
      complementary: { lightness: 1.3, saturation: 1.0 },    // 30% lighter
      analogous: { lightness: 1.25, saturation: 1.2 },       // 25% lighter, 20% more saturated
      triadic: { lightness: 1.35, saturation: 1.15 },        // 35% lighter, 15% more saturated
      monochromatic: { lightness: 1.4, saturation: 0.9 },    // 40% lighter, 10% less saturated

      // Minimum lightness values (0-100)
      minLightness: {
        complementary: 60,
        analogous: 65,
        triadic: 70,
        monochromatic: 75
      },

      // Hue shift amounts (in degrees)
      hueShifts: {
        analogous: 60,    // Was 30, increased for more separation
        triadic: 120     // Standard triadic
      },

      // Contrast settings
      minContrastRatio: 3.0,  // WCAG AA standard
      maxAdjustmentAttempts: 5
    };

    this.init();

  }

  init() {
    // Initialize audio context
    this.initAudio();

    // Event listeners - now cycles colors instead of opening panel
    this.themeButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.cycleToNextColor();
    });

    // Add hover rotation for color wheel
    this.themeButton.addEventListener('mouseenter', () => {
      this.applyHoverRotation(true);
    });

    this.themeButton.addEventListener('mouseleave', () => {
      this.applyHoverRotation(false);
    });
  }

  initAudio() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.log('Audio not supported');
    }
  }

  // Generate 4 pleasing accent colors from a base color
  generateAccentColors(baseColor) {
    const baseHSL = this.hexToHSL(baseColor);
    const accentColors = [];
    const config = this.colorConfig;

    // 1. High contrast complementary (opposite + configurable lightness)
    const complementary = this.adjustHue(baseHSL, 180);
    const lighterComplementary = {
      ...complementary,
      l: Math.min(100, Math.max(config.minLightness.complementary, complementary.l * config.complementary.lightness))
    };
    accentColors.push(this.hslToHex(lighterComplementary));

    // 2. Distinct analogous (configurable shift + configurable lightness/saturation)
    const analogous = this.adjustHue(baseHSL, config.hueShifts.analogous);
    const vibrantAnalogous = {
      ...analogous,
      s: Math.min(100, analogous.s * config.analogous.saturation),
      l: Math.min(100, Math.max(config.minLightness.analogous, analogous.l * config.analogous.lightness))
    };
    accentColors.push(this.hslToHex(vibrantAnalogous));

    // 3. Bright triadic (configurable shift + configurable lightness/saturation)
    const triadic = this.adjustHue(baseHSL, config.hueShifts.triadic);
    const brightTriadic = {
      ...triadic,
      s: Math.min(100, triadic.s * config.triadic.saturation),
      l: Math.min(100, Math.max(config.minLightness.triadic, triadic.l * config.triadic.lightness))
    };
    accentColors.push(this.hslToHex(brightTriadic));

    // 4. Very light monochromatic (same hue + configurable lightness/saturation)
    const lightMonochromatic = {
      ...baseHSL,
      s: Math.max(20, baseHSL.s * config.monochromatic.saturation),
      l: Math.min(100, Math.max(config.minLightness.monochromatic, baseHSL.l * config.monochromatic.lightness))
    };
    accentColors.push(this.hslToHex(lightMonochromatic));

    // Ensure minimum contrast between colors
    const adjustedColors = this.ensureMinimumContrast(accentColors, baseColor);

    // Apply accent colors to work projects
    this.applyAccentColors(adjustedColors);

    // Store accent colors for persistence
    localStorage.setItem('accentColors', JSON.stringify(adjustedColors));

    // Debug: log the generated colors
    console.log('Generated accent colors:', adjustedColors);
  }

  // Ensure minimum contrast between accent colors and base color
  ensureMinimumContrast(accentColors, baseColor) {
    const minContrast = this.colorConfig.minContrastRatio;
    const maxAttempts = this.colorConfig.maxAdjustmentAttempts;
    const adjustedColors = [...accentColors];

    for (let i = 0; i < adjustedColors.length; i++) {
      let attempts = 0;
      let currentColor = adjustedColors[i];

      while (attempts < maxAttempts && this.calculateContrastRatio(baseColor, currentColor) < minContrast) {
        // Make the color lighter and more saturated for better contrast
        const hsl = this.hexToHSL(currentColor);
        hsl.l = Math.min(100, hsl.l + 15);
        hsl.s = Math.min(100, hsl.s + 10);
        currentColor = this.hslToHex(hsl);
        adjustedColors[i] = currentColor;
        attempts++;
      }
    }

    return adjustedColors;
  }

  // Calculate contrast ratio between two colors
  calculateContrastRatio(color1, color2) {
    const luminance1 = this.calculateLuminance(color1);
    const luminance2 = this.calculateLuminance(color2);

    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);

    return (lighter + 0.05) / (darker + 0.05);
  }

  // Calculate luminance of a color
  calculateLuminance(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;

    const [rs, gs, bs] = [r, g, b].map(c => {
      if (c <= 0.03928) return c / 12.92;
      return Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Convert hex to HSL
  hexToHSL(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  // Convert HSL to hex
  hslToHex(hsl) {
    const h = hsl.h / 360;
    const s = hsl.s / 100;
    const l = hsl.l / 100;

    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (c) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Adjust hue while preserving saturation and lightness
  adjustHue(hsl, degrees) {
    let newHue = (hsl.h + degrees) % 360;
    if (newHue < 0) newHue += 360;
    return { ...hsl, h: newHue };
  }

  // Apply accent colors to work projects
  applyAccentColors(accentColors) {
    const workProjects = document.querySelectorAll('.index-project');
    const workPageFigures = document.querySelectorAll('figure.teal, figure.coral, figure.lavender, figure.gold');

    // Apply to home page work projects
    workProjects.forEach((project, index) => {
      if (accentColors[index]) {
        // Apply the accent color as a CSS custom property
        project.style.setProperty('--accent-color', accentColors[index]);

        // Also apply as background color for immediate visual feedback
        project.style.backgroundColor = accentColors[index];

        // Ensure text remains readable
        const textElements = project.querySelectorAll('h3, p');
        textElements.forEach(text => {
          text.style.color = this.getContrastColor(accentColors[index]);
        });
      }
    });

    // Apply to work page project figures - all figures get the same color based on the page
    if (workPageFigures.length > 0) {
      // Determine which accent color to use based on the current page
      const pageColorIndex = this.getWorkPageColorIndex();
      const accentColor = accentColors[pageColorIndex];

      if (accentColor) {
        // Apply the same accent color to ALL figures on the page
        workPageFigures.forEach(figure => {
          figure.style.backgroundColor = accentColor;

          // Ensure any text in the figure remains readable
          const textElements = figure.querySelectorAll('h1, h2, h3, p, span, div');
          textElements.forEach(text => {
            if (text.textContent.trim()) { // Only apply to elements with actual text
              text.style.color = this.getContrastColor(accentColor);
            }
          });
        });
      }
    }
  }

  // Get the color index for the current work page (matches home page link order)
  getWorkPageColorIndex() {
    const currentPage = window.location.pathname.split('/').pop();

    // Map each work page to its corresponding accent color index
    // This matches the order of .index-project links on the home page
    const pageColorMap = {
      'vision.html': 0,        // First accent color (same as first .index-project)
      'ai.html': 1,            // Second accent color (same as second .index-project)
      'modernization.html': 2, // Third accent color (same as third .index-project)
      'culture.html': 3        // Fourth accent color (same as fourth .index-project)
    };

    return pageColorMap[currentPage] || 0; // Default to first color if page not found
  }

  // Get contrasting text color (black or white) for readability
  getContrastColor(hexColor) {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return black for light backgrounds, white for dark backgrounds
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  // Restore previously selected color and accent colors on page load
  restoreColor() {
    const savedColor = localStorage.getItem('selectedThemeColor');
    const savedAccentColors = localStorage.getItem('accentColors');

    if (savedColor) {
      document.body.style.backgroundColor = savedColor;

      // Restore accent colors if they exist
      if (savedAccentColors) {
        try {
          const accentColors = JSON.parse(savedAccentColors);
          this.applyAccentColors(accentColors);
        } catch (e) {
          // If accent colors are corrupted, regenerate them
          this.generateAccentColors(savedColor);
        }
      } else {
        // Generate new accent colors for the saved background color
        this.generateAccentColors(savedColor);
      }
    } else {
      // If no saved color, ensure we respect the CSS variable
      document.body.style.removeProperty('background-color');

      // Clear any existing accent colors
      this.clearAccentColors();
    }
  }

  // Clear accent colors (reset to default)
  clearAccentColors() {
    const workProjects = document.querySelectorAll('.index-project');
    const workPageFigures = document.querySelectorAll('figure.teal, figure.coral, figure.lavender, figure.gold');

    // Clear home page work projects
    workProjects.forEach(project => {
      project.style.removeProperty('--accent-color');
      project.style.removeProperty('background-color');

      // Reset text colors to default
      const textElements = project.querySelectorAll('h3, p');
      textElements.forEach(text => {
        text.style.removeProperty('color');
      });
    });

    // Clear work page project figures
    workPageFigures.forEach(figure => {
      figure.style.removeProperty('background-color');

      // Reset text colors to default
      const textElements = figure.querySelectorAll('h1, h2, h3, p, span, div');
      textElements.forEach(text => {
        text.style.removeProperty('color');
      });
    });
  }

  animateButtonPress(button) {
    // Add a temporary class for visual feedback
    button.classList.add('pressed');

    setTimeout(() => {
      button.classList.remove('pressed');
    }, 150);
  }

  playClackSound() {
    if (!this.audioContext) return;

    // Create a sharp, mechanical click sound
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Sharp, mechanical frequency with quick drop
    oscillator.frequency.setValueAtTime(2000, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.01);

    // Very quick, sharp mechanical envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.05);
  }

  // Update color configuration
  updateColorConfig(newConfig) {
    this.colorConfig = { ...this.colorConfig, ...newConfig };
    console.log('Color config updated:', this.colorConfig);

    // Regenerate colors if there's a current background color
    const currentColor = document.body.style.backgroundColor;
    if (currentColor && currentColor !== '') {
      this.generateAccentColors(currentColor);
    }
  }

  // Preset configurations for different brightness levels
  setBrightnessPreset(preset) {
    const presets = {
      subtle: {
        complementary: { lightness: 1.1, saturation: 0.9 },
        analogous: { lightness: 1.15, saturation: 1.1 },
        triadic: { lightness: 1.2, saturation: 1.05 },
        monochromatic: { lightness: 1.25, saturation: 0.85 },
        minLightness: { complementary: 50, analogous: 55, triadic: 60, monochromatic: 65 }
      },
      balanced: {
        complementary: { lightness: 1.3, saturation: 1.0 },
        analogous: { lightness: 1.25, saturation: 1.2 },
        triadic: { lightness: 1.35, saturation: 1.15 },
        monochromatic: { lightness: 1.4, saturation: 0.9 },
        minLightness: { complementary: 60, analogous: 65, triadic: 70, monochromatic: 75 }
      },
      bright: {
        complementary: { lightness: 1.5, saturation: 1.1 },
        analogous: { lightness: 1.45, saturation: 1.3 },
        triadic: { lightness: 1.55, saturation: 1.25 },
        monochromatic: { lightness: 1.6, saturation: 1.0 },
        minLightness: { complementary: 70, analogous: 75, triadic: 80, monochromatic: 85 }
      },
      vibrant: {
        complementary: { lightness: 1.7, saturation: 1.4 },
        analogous: { lightness: 1.65, saturation: 1.5 },
        triadic: { lightness: 1.75, saturation: 1.45 },
        monochromatic: { lightness: 1.8, saturation: 1.2 },
        minLightness: { complementary: 80, analogous: 85, triadic: 90, monochromatic: 95 }
      }
    };

    if (presets[preset]) {
      this.updateColorConfig(presets[preset]);
      console.log(`Applied ${preset} brightness preset`);
    } else {
      console.log('Available presets:', Object.keys(presets));
    }
  }

  // Quick brightness adjustment
  adjustBrightness(multiplier) {
    const config = { ...this.colorConfig };

    // Adjust all lightness multipliers
    Object.keys(config).forEach(key => {
      if (key !== 'minLightness' && key !== 'hueShifts' && key !== 'minContrastRatio' && key !== 'maxAdjustmentAttempts') {
        config[key].lightness *= multiplier;
      }
    });

    // Adjust minimum lightness values
    Object.keys(config.minLightness).forEach(key => {
      config.minLightness[key] = Math.min(100, Math.max(0, config.minLightness[key] * multiplier));
    });

    this.updateColorConfig(config);
    console.log(`Brightness adjusted by ${multiplier}x`);
  }

  // New method to cycle through colors
  cycleToNextColor() {
    // Move to next color
    this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;

    // Get the new color
    const newColor = this.colors[this.currentColorIndex];

    // Add visual feedback for button press
    this.animateButtonPress(this.themeButton);

    // Play satisfying mechanical click sound
    this.playClackSound();

    // Apply color to body
    document.body.style.backgroundColor = newColor.hex;

    // Generate and apply accent colors for work projects
    this.generateAccentColors(newColor.hex);

    // Store the selected color in localStorage for persistence
    localStorage.setItem('selectedThemeColor', newColor.hex);

    // Update the color wheel rotation for visual feedback
    this.updateColorWheelRotation();

    console.log(`Color changed to: ${newColor.name} (${newColor.hex})`);
  }

  // New method to update color wheel rotation for visual feedback
  updateColorWheelRotation() {
    const colorWheel = this.themeButton.querySelector('.color-wheel');
    const spinnerTriangle = this.themeButton.querySelector('.spinner-triangle');

    if (colorWheel) {
      // Calculate rotation so the current body background color is at the top
      // Since CSS gradient goes clockwise from 0deg, we need to rotate counterclockwise
      // to bring the current color to the top position
      const rotation = (360 - (this.currentColorIndex * 40)) % 360;
      colorWheel.style.setProperty('transform', `rotate(${rotation}deg)`, 'important');
    }

    if (spinnerTriangle) {
      // Keep the spinner triangle pointing upward (no rotation)
      // CSS already handles the centering with transform: translateX(-50%)
      console.log(`Spinner triangle positioned for color index ${this.currentColorIndex}`);
    } else {
      console.warn('Spinner triangle not found');
    }
  }

  // Method to apply hover rotation to color wheel
  applyHoverRotation(isHovering) {
    const colorWheel = this.themeButton.querySelector('.color-wheel');
    if (colorWheel) {
      const baseRotation = (360 - (this.currentColorIndex * 40)) % 360;
      const hoverRotation = isHovering ? 20 : 0;
      const totalRotation = baseRotation + hoverRotation;
      colorWheel.style.setProperty('transform', `rotate(${totalRotation}deg)`, 'important');
    }
  }

  // Restore previously selected color
  restoreColor() {
    const savedColor = localStorage.getItem('selectedThemeColor');
    if (savedColor) {
      // Find the index of the saved color
      const colorIndex = this.colors.findIndex(color => color.hex === savedColor);
      if (colorIndex !== -1) {
        this.currentColorIndex = colorIndex;
        // Apply the color
        document.body.style.backgroundColor = savedColor;
        // Update the rotation
        this.updateColorWheelRotation();
        console.log(`Restored color: ${this.colors[colorIndex].name} (${savedColor})`);
      }
    } else {
      // Set default color if none was saved
      document.body.style.backgroundColor = this.colors[0].hex;
      this.currentColorIndex = 0;
      this.updateColorWheelRotation();
      console.log(`Set default color: ${this.colors[0].name} (${this.colors[0].hex})`);
    }
  }
}

// Initialize the color picker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Verify elements exist
  const themeButton = document.getElementById('themeButton');

  if (!themeButton) {
    console.error('Missing required elements for color picker widget');
    return;
  }

  const colorPicker = new ColorPickerWidget();

  // Restore any previously selected color
  colorPicker.restoreColor();

  // Set the vibrant brightness preset
  colorPicker.setBrightnessPreset('subtle');
});

// Export for potential external use
if (typeof window !== 'undefined') {
  window.ColorPickerWidget = ColorPickerWidget;
}
