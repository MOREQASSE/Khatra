# Coffee Shop Website

A modern, responsive coffee shop website featuring 3D graphics, smooth animations, and mobile-optimized navigation.

## Features

- **Responsive Design**: Adapts to all screen sizes from mobile to desktop
- **3D Coffee Model**: Interactive 3D coffee cup animation using Three.js
- **Smooth Animations**: Subtle animations and transitions throughout the site
- **Mobile-Optimized Navigation**: Bottom navigation bar for mobile devices with home, menu, and gallery sections
- **Accessibility**: Built with accessibility best practices
- **Performance Optimized**: Efficient loading of assets and animations
- **Contact Form**: Functional contact form with validation
- **Social Media Links**: Integrated social media connectivity
- **Embedded Map**: Shows coffee shop location
- **Menu Display**: Beautifully presented menu items

## Project Structure

```
├── index.html          # Main HTML structure
├── style.css           # Styling and responsive design
├── script.js           # JavaScript functionality including 3D scene
├── scene.glb           # 3D coffee cup model
└── images/             # Image assets
    ├── logo.webp       # Coffee shop logo
    ├── hero image desktop.png   # Desktop hero image
    ├── hero image mobile.png    # Mobile hero image
    └── gallerie/       # Gallery images
        ├── gallery0.webp
        ├── gallery1.webp
        ├── gallery2.webp
        └── gallery3.webp
```

## Technical Implementation

### 3D Graphics
- Uses Three.js library for rendering
- Loads GLTF model for realistic coffee cup display
- Implements subtle rotation and bobbing animations
- Includes fallback primitive models if GLTF fails to load

### Responsive Design
- Mobile-first approach with media queries
- Desktop navigation converts to bottom navigation on mobile
- Flexible grid layouts for menus and galleries
- Fluid typography and spacing

### Animations
- CSS animations for hover effects and transitions
- JavaScript-driven 3D model animations
- Scroll-triggered element animations
- Subtle loading and interaction feedback

### Accessibility Features
- Semantic HTML structure
- ARIA labels where appropriate
- Sufficient color contrast
- Keyboard navigable interface
- Responsive touch targets

## Browser Compatibility
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Android Chrome)

## Performance Optimizations
- Efficient asset loading
- Optimized image formats (WebP where available)
- Lazy loading considerations
- Minimized DOM manipulation
- Efficient 3D rendering loop

## Setup & Usage
1. Clone or download the repository
2. Open `index.html` in a modern web browser
3. No build process or dependencies required beyond Three.js (loaded via CDN)

## Customization
- Update logo and images in the `images/` folder
- Modify menu items in `index.html`
- Adjust colors and styling in `style.css`
- Replace or modify the 3D model in `scene.glb`
- Update contact form processing as needed (currently frontend-only)

## Future Enhancements
- Backend integration for contact form
- Online ordering system
- Reservation functionality
- Loyalty program integration
- Enhanced 3D interactions (zoom, pan, rotate controls)
- Dark mode toggle
- Multi-language support