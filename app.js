// Single Page App Router
class SPARouter {
  constructor() {
    this.routes = {
      'home': 'home-page',
      'vision': 'vision-page',
      'ai': 'ai-page',
      'modernization': 'modernization-page',
      'culture': 'culture-page'
    };

    this.currentRoute = 'home';
    this.init();
    this.initFontLoading();
  }

  initFontLoading() {
    // Check if fonts are already loaded
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        document.body.classList.add('fonts-loaded');
      });
    } else {
      // Fallback for older browsers
      setTimeout(() => {
        document.body.classList.add('fonts-loaded');
      }, 100);
    }
  }

  init() {
    // Handle navigation clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('[data-route]');
      if (link) {
        e.preventDefault();
        const route = link.getAttribute('data-route');
        this.navigateTo(route);
      }
    });

    // Handle browser back/forward buttons
    window.addEventListener('popstate', (e) => {
      const route = e.state?.route || 'home';
      this.showPage(route, false);
    });

    // Initialize with current route from URL or default to home
    const initialRoute = this.getRouteFromURL() || 'home';
    this.showPage(initialRoute, false);
  }

  navigateTo(route) {
    if (this.routes[route]) {
      // Update URL without page reload
      const url = route === 'home' ? '/' : `/${route}`;
      window.history.pushState({ route }, '', url);

      // Show the page with transition
      this.showPage(route, true);

      // Update active navigation state
      this.updateActiveNavigation(route);
    }
  }

  showPage(route, withTransition = true) {
    const targetPage = document.getElementById(this.routes[route]);
    const currentPage = document.querySelector('.page-content.active');

    if (!targetPage) return;

    if (withTransition && currentPage) {
      // Fade out current page
      currentPage.classList.add('fade-out');

      setTimeout(() => {
        currentPage.classList.remove('active', 'fade-out');
        targetPage.classList.add('active');

        // Try multiple approaches to prevent visible scrolling

        // Method 1: Set scrollTop on multiple elements
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Method 2: Also try the main container
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.scrollTop = 0;
        }

        // Method 3: Force scroll position with CSS
        document.body.style.scrollBehavior = 'auto';
        window.scrollTo(0, 0);
        document.body.style.scrollBehavior = '';

        // Initialize page-specific functionality
        this.initializePage(route);
      }, 300);
    } else {
      // Direct page switch (for initial load and browser navigation)
      if (currentPage) {
        currentPage.classList.remove('active');
      }
      targetPage.classList.add('active');

      // Same scroll prevention for direct page switches
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const mainContent = document.getElementById('main-content');
      if (mainContent) {
        mainContent.scrollTop = 0;
      }

      // Initialize page-specific functionality
      this.initializePage(route);
    }

    this.currentRoute = route;
  }

  updateActiveNavigation(route) {
    // Remove active class from all navigation links
    document.querySelectorAll('[data-route]').forEach(link => {
      link.classList.remove('active');
    });

    // Add active class to current route link
    const activeLink = document.querySelector(`[data-route="${route}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }
  }

  initializePage(route) {
    // Initialize image modal functionality for work pages
    if (route !== 'home') {
      this.initializeImageModal();
    }

    // Initialize comparison sliders for modernization page
    if (route === 'modernization') {
      this.initializeComparisonSliders();
    }

    // Update page title
    const titles = {
      'home': 'Christian Reuter',
      'vision': 'Shaping the Iterable Vision - Christian Reuter',
      'ai': 'Designing for AI - Christian Reuter',
      'modernization': 'Modernizing Iterable\'s UX - Christian Reuter',
      'culture': 'Building a culture of trust - Christian Reuter'
    };

    document.title = titles[route] || 'Christian Reuter';
  }

  initializeImageModal() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.querySelector('.modal-close');

    if (!modal || !modalImg || !closeBtn) return;

    // Remove existing event listeners
    const newModal = modal.cloneNode(true);
    modal.parentNode.replaceChild(newModal, modal);

    const newModalImg = newModal.querySelector('.modal-content');
    const newCloseBtn = newModal.querySelector('.modal-close');

    // Add click handlers to project images
    document.querySelectorAll('article.project figure img').forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => {
        newModal.style.display = 'flex';
        newModalImg.src = img.src;
      });
    });

    // Close modal handlers
    newCloseBtn.addEventListener('click', () => newModal.style.display = 'none');
    newModal.addEventListener('click', (e) => {
      if (e.target === newModal) newModal.style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') newModal.style.display = 'none';
    });
  }

  initializeComparisonSliders() {
    const comparisonSliders = document.querySelectorAll('.image-comparison');

    comparisonSliders.forEach(comparison => {
      new ComparisonSlider(comparison);
    });
  }

  getRouteFromURL() {
    const path = window.location.pathname;
    if (path === '/' || path === '') return 'home';

    const route = path.substring(1); // Remove leading slash
    return this.routes[route] ? route : 'home';
  }
}

// Comparison Slider Functionality
class ComparisonSlider {
  constructor(container) {
    this.container = container;
    this.slider = container.querySelector('.comparison-slider');
    this.sliderHandle = container.querySelector('.slider-handle');
    this.oldImage = container.querySelector('.comparison-image-old');
    this.newImage = container.querySelector('.comparison-image-new');

    this.isDragging = false;
    this.startX = 0;
    this.startLeft = 0;

    this.init();
  }

  init() {
    if (!this.slider || !this.sliderHandle || !this.oldImage || !this.newImage) {
      console.warn('Comparison slider elements not found');
      return;
    }

    // Set initial position
    this.updateSliderPosition(50);

    // Add event listeners
    this.sliderHandle.addEventListener('mousedown', this.startDragging.bind(this));
    this.container.addEventListener('mousedown', this.startDragging.bind(this));

    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.stopDragging.bind(this));

    // Touch events for mobile
    this.sliderHandle.addEventListener('touchstart', this.startDragging.bind(this));
    this.container.addEventListener('touchstart', this.startDragging.bind(this));

    document.addEventListener('touchmove', this.drag.bind(this));
    document.addEventListener('touchend', this.stopDragging.bind(this));
  }

  startDragging(e) {
    e.preventDefault();
    this.isDragging = true;

    const clientX = e.type === 'mousedown' ? e.clientX : e.touches[0].clientX;
    this.startX = clientX;
    this.startLeft = parseFloat(this.slider.style.left) || 50;

    this.container.style.userSelect = 'none';
    this.container.style.cursor = 'ew-resize';
  }

  drag(e) {
    if (!this.isDragging) return;

    e.preventDefault();

    const clientX = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
    const deltaX = clientX - this.startX;
    const containerRect = this.container.getBoundingClientRect();
    const deltaPercent = (deltaX / containerRect.width) * 100;

    let newLeft = this.startLeft + deltaPercent;
    newLeft = Math.max(0, Math.min(100, newLeft));

    this.updateSliderPosition(newLeft);
  }

  stopDragging() {
    this.isDragging = false;
    this.container.style.userSelect = '';
    this.container.style.cursor = '';
  }

  updateSliderPosition(percent) {
    // Update slider position
    this.slider.style.left = `${percent}%`;

    // Update image clip paths
    this.oldImage.style.clipPath = `polygon(0 0, ${percent}% 0, ${percent}% 100%, 0 100%)`;
    this.newImage.style.clipPath = `polygon(${percent}% 0, 100% 0, 100% 100%, ${percent}% 100%)`;
  }
}

// Color Picker Widget Functionality

class ColorPickerWidget {
  constructor() {
    this.themeButton = document.getElementById('themeButton');
    this.audioContext = null;

    // Color cycling configuration
    this.colors = [
      { hex: '#5b3a3e', name: 'Cordovan' },
      { hex: '#593d2d', name: 'Cedar Ochre' },
      { hex: '#4e4426', name: 'Field Olive' },
      { hex: '#3b4a2f', name: 'Forest Fir' },
      { hex: '#284d41', name: 'Sea Pine' },
      { hex: '#234b53', name: 'Deep Teal' },
      { hex: '#32465d', name: 'Night Indigo' },
      { hex: '#45405c', name: 'Indigo Slate' },
      { hex: '#543b50', name: 'Mulberry Ash' }
    ];
    this.currentColorIndex = 0;
    this.currentHexColor = this.colors[0].hex; // Track current hex color
    this.totalRotation = 0; // Track total rotation for smooth continuous spinning

    // Predefined accent colors for each base color
    this.predefinedAccentColors = {
      '#5b3a3e': [ // Cordovan — warm burgundy
        '#6c9d7f', // muted sage
        '#699c96', // sea-glass teal
        '#7896aa', // slate blue
        '#a78f72'  // aged khaki
      ],
      '#593d2d': [ // Cedar Ochre — warm brown
        '#599e9f', // steel teal
        '#6e99ac', // dusty cornflower
        '#8c92b0', // periwinkle gray
        '#939673'  // moss khaki
      ],
      '#4e4426': [ // Field Olive — muted olive
        '#699ab9', // soft cornflower
        '#8594b7', // heather blue
        '#a18ea9', // rose taupe
        '#7c9c84'  // muted sea green
      ],
      '#3b4a2f': [ // Forest Fir — deep green
        '#8b93c2', // dusty indigo-violet
        '#a08fb2', // mauve gray
        '#af8c98', // rose smoke
        '#709e9c'  // quiet teal-slate
      ],
      '#284d41': [ // Sea Pine — teal-green
        '#aa8bb6', // muted amethyst
        '#b38b9f', // dusty mauve
        '#b18f84', // warm clay
        '#779baf'  // steel blue
      ],
      '#234b53': [ // Deep Teal — blue-teal
        '#bd8799', // muted coral rose
        '#b78b85', // dusty clay rose
        '#a69377', // stone khaki
        '#8b95b6'  // slate periwinkle
      ],
      '#32465d': [ // Night Indigo — deep blue
        '#bd8878', // muted burnt sienna
        '#ad8f71', // desert khaki
        '#919879', // sage green
        '#a18ead'  // mauve gray
      ],
      '#45405c': [ // Indigo Slate — blue-violet
        '#ac8f62', // warm tan
        '#96956e', // olive drab
        '#7c9c87', // sage stone
        '#ae8998'  // dusty rose
      ],
      '#543b50': [ // Mulberry Ash — deep magenta
        '#8e9766', // sage olive
        '#7b9a7d', // muted jade
        '#719a9a', // teal slate
        '#b18981'  // warm clay
      ]
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

  // Generate accent colors for a given base color
  generateAccentColors(baseColor) {
    // Get predefined accent colors for this base color
    const accentColors = this.predefinedAccentColors[baseColor];

    if (accentColors) {
      // Apply the accent colors
      this.applyAccentColors(accentColors);
    } else {
      console.warn(`No predefined accent colors found for: ${baseColor}`);
    }
  }

  // Apply accent colors to work projects
  applyAccentColors(accentColors) {
    this.updateCSSAccentVariables(accentColors);
  }

  // Update CSS accent color variables
  updateCSSAccentVariables(accentColors) {
    if (accentColors && accentColors.length >= 4) {
      document.documentElement.style.setProperty('--color-accent-0', accentColors[0]);
      document.documentElement.style.setProperty('--color-accent-1', accentColors[1]);
      document.documentElement.style.setProperty('--color-accent-2', accentColors[2]);
      document.documentElement.style.setProperty('--color-accent-3', accentColors[3]);
    }
  }

  // Handle route changes from the SPA router
  handleRouteChange(route) {
    console.log(`Color picker notified of route change to: ${route}`);

    // Update the router's current route
    if (window.spaRouter) {
      window.spaRouter.currentRoute = route;
    }
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



  // New method to cycle through colors
  cycleToNextColor() {
    // Move to next color
    this.currentColorIndex = (this.currentColorIndex + 1) % this.colors.length;
    this.currentHexColor = this.colors[this.currentColorIndex].hex; // Update current hex color

    // Increment total rotation for smooth continuous spinning
    // Positive value makes it rotate clockwise to match the color sequence
    this.totalRotation += 40;

    // Get the new color
    const newColor = this.colors[this.currentColorIndex];

    // Add visual feedback for button press
    this.animateButtonPress(this.themeButton);

    // Play satisfying mechanical click sound
    this.playClackSound();

    // Apply theme color to CSS variable
    document.documentElement.style.setProperty('--color-theme', newColor.hex);

    // Generate and apply accent colors for work projects
    this.generateAccentColors(newColor.hex);

    // Update the color wheel rotation for visual feedback
    this.updateColorWheelRotation();
  }

  // New method to update color wheel rotation for visual feedback
  updateColorWheelRotation() {
    const colorWheel = this.themeButton.querySelector('.color-wheel');
    const spinnerHash = this.themeButton.querySelector('.spinner-hash');

    if (colorWheel) {
      // Simple continuous rotation - each click adds 40 degrees clockwise
      // This makes the wheel always rotate in the same direction
      colorWheel.style.setProperty('transform', `rotate(${this.totalRotation}deg)`, 'important');
    }
  }

  // Method to apply hover rotation to color wheel
  applyHoverRotation(isHovering) {
    const colorWheel = this.themeButton.querySelector('.color-wheel');
    if (colorWheel) {
      const hoverRotation = isHovering ? 20 : 0;
      const totalRotation = this.totalRotation + hoverRotation;
      colorWheel.style.setProperty('transform', `rotate(${totalRotation}deg)`, 'important');
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the SPA router first
  try {
    window.spaRouter = new SPARouter();
  } catch (error) {
    console.error('Error creating SPA router:', error);
  }

  // Verify elements exist for color picker
  const themeButton = document.getElementById('themeButton');

  if (!themeButton) {
    console.error('Missing required elements for color picker widget');
    return;
  }

  const colorPicker = new ColorPickerWidget();

  // Store the color picker instance globally so the router can access it
  window.colorPicker = colorPicker;


});

// Export for potential external use
if (typeof window !== 'undefined') {
  window.ColorPickerWidget = ColorPickerWidget;
  window.SPARouter = SPARouter;
}
