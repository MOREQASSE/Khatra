/**
 * Khatra Coffee Shop - Main JavaScript
 * Features: Three.js 3D Scene, GSAP Animations, Menu Data Loading, Form Validation
 */

// Global state
let scene, camera, renderer, coffeeModel, controls;
let scrollTriggerInstance = null;
let menuData = null;

// 3D Model Configuration - Adjust these values to change size and position
const CONFIG = {
    // Model scale: higher = bigger model
    size: {
        mobile: 1.8,      // Mobile scale factor
        desktop: 2.8    // Desktop scale factor
    },
    // Vertical position: negative = lower, positive = higher
    height: {
        mobile: -0.5,      // Mobile Y position
        desktop: -1.2      // Desktop Y position
    },
    // Camera distance: lower = closer to model
    camera: {
        mobile: 3.5,    // Mobile camera Z position - closer for bigger view
        desktop: 5      // Desktop camera Z position
    },
    // Camera vertical offset: adjust to center model in view
    cameraY: {
        mobile: 0.5,    // Raise camera slightly on mobile
        desktop: 0
    }
};

// DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

/**
 * Initialize Application
 */
function initializeApp() {
    // Delay Three.js init to ensure GLTFLoader is ready
    setTimeout(() => {
        initThreeJS();
    }, 100);
    
    initGSAPAnimations();
    initNavigation();
    initContactForm();
    
    // Initialize menu if on menu page
    if (document.getElementById('menu-container')) {
        loadMenuData();
    }
}

// ============================================================================
// THREE.JS 3D SCENE
// ============================================================================

function initThreeJS() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    const container = document.getElementById('hero-3d');
    const loadingOverlay = document.getElementById('loading-overlay');

    try {
        // Scene setup
        scene = new THREE.Scene();
        
        // Camera setup
        const aspect = container.clientWidth / container.clientHeight;
        camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        camera.position.set(0, 1, 5);

        // Renderer setup
        renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true, 
            alpha: true 
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        // Lighting setup - warm coffee shop ambiance
        const ambientLight = new THREE.AmbientLight(0xffecd2, 0.4);
        scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffd700, 1.5);
        mainLight.position.set(5, 10, 7);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        scene.add(mainLight);

        const fillLight = new THREE.PointLight(0xffa500, 0.8);
        fillLight.position.set(-5, 3, 3);
        scene.add(fillLight);

        const rimLight = new THREE.SpotLight(0xc9a227, 1);
        rimLight.position.set(0, 5, -5);
        rimLight.lookAt(0, 0, 0);
        scene.add(rimLight);

        // Check if running locally (file:// protocol)
        const isLocalFile = window.location.protocol === 'file:';
        if (isLocalFile) {
            console.warn('Running from local file. GLTF loading may fail due to browser CORS policy.');
            console.warn('Please use a local server: python -m http.server 8000');
            
            // Show warning in loading overlay
            if (loadingOverlay) {
                const loadingText = loadingOverlay.querySelector('p');
                if (loadingText) {
                    loadingText.innerHTML = 'Cannot load 3D model from local file.<br>Use a local server to see your model.';
                    loadingText.style.color = '#f87171';
                    loadingText.style.fontSize = '0.85rem';
                }
            }
            
            // Still try to load, but will likely fail
        }
        
        // Load GLTF Model
        if (typeof THREE.GLTFLoader === 'undefined') {
            console.warn('GLTFLoader not available, using fallback model');
            createFallbackModel();
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
            return;
        }
        
        const loader = new THREE.GLTFLoader();
        
        // Use correct path
        const modelPath = 'scene.glb';
        
        console.log('Loading GLTF from:', modelPath, 'Protocol:', window.location.protocol);
        
        loader.load(
            modelPath,
            (gltf) => {
                coffeeModel = gltf.scene;
                
                // Center and scale the model
                const box = new THREE.Box3().setFromObject(coffeeModel);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                
                const maxDim = Math.max(size.x, size.y, size.z);
                
                // Detect mobile for responsive sizing
                const isMobile = window.innerWidth <= 768;
                
                // Use CONFIG.size for scale - adjust in global CONFIG above
                const baseScale = isMobile ? CONFIG.size.mobile : CONFIG.size.desktop;
                const scale = baseScale / maxDim;
                
                coffeeModel.userData.originalScale = scale;
                coffeeModel.userData.isMobile = isMobile;
                coffeeModel.scale.setScalar(scale);
                
                // Use CONFIG.height for vertical position
                const yPosition = isMobile ? CONFIG.height.mobile : CONFIG.height.desktop;
                coffeeModel.position.set(0, yPosition, 0);
                
                // Use CONFIG.camera for camera distance and position
                if (camera) {
                    camera.position.z = isMobile ? CONFIG.camera.mobile : CONFIG.camera.desktop;
                    camera.position.y = isMobile ? CONFIG.cameraY.mobile : CONFIG.cameraY.desktop;
                }
                
                // Enable shadows
                coffeeModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        // Enhance materials
                        if (child.material) {
                            child.material.roughness = Math.max(0.3, child.material.roughness);
                            child.material.metalness = Math.min(0.8, child.material.metalness + 0.1);
                        }
                    }
                });

                scene.add(coffeeModel);

                // Hide loading overlay
                if (loadingOverlay) {
                    gsap.to(loadingOverlay, {
                        opacity: 0,
                        duration: 0.5,
                        onComplete: () => {
                            loadingOverlay.style.display = 'none';
                        }
                    });
                }

                // Initial animation
                gsap.from(coffeeModel.rotation, {
                    y: Math.PI * 2,
                    duration: 2,
                    ease: 'power2.out'
                });

                gsap.from(coffeeModel.scale, {
                    x: 0,
                    y: 0,
                    z: 0,
                    duration: 1.5,
                    ease: 'elastic.out(1, 0.5)'
                });

                // Initialize GSAP scroll animation
                initScrollRotation();
            },
            (progress) => {
                // Loading progress
                console.log('Loading 3D model:', (progress.loaded / progress.total * 100) + '%');
            },
            (error) => {
                console.error('GLTF Load Error:', error);
                console.error('Error type:', error.type || 'unknown');
                console.error('Error message:', error.message || error);
                
                // Show error in loading overlay briefly before fallback
                if (loadingOverlay) {
                    const loadingText = loadingOverlay.querySelector('p');
                    if (loadingText) {
                        loadingText.textContent = 'Could not load 3D model. Using fallback...';
                        loadingText.style.color = '#f87171';
                    }
                    
                    setTimeout(() => {
                        createFallbackModel();
                        loadingOverlay.style.display = 'none';
                    }, 1500);
                } else {
                    createFallbackModel();
                }
            }
        );

        // Handle resize
        window.addEventListener('resize', onWindowResize, { passive: true });

        // Start render loop
        animate();

    } catch (error) {
        console.error('Three.js initialization error:', error);
        createFallbackModel();
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

/**
 * Create fallback primitive model if GLTF fails
 */
function createFallbackModel() {
    const group = new THREE.Group();

    // Coffee cup body
    const cupGeometry = new THREE.CylinderGeometry(0.8, 0.6, 1.5, 32);
    const cupMaterial = new THREE.MeshStandardMaterial({
        color: 0x2c1810,
        roughness: 0.3,
        metalness: 0.1
    });
    const cup = new THREE.Mesh(cupGeometry, cupMaterial);
    cup.position.y = 0.75;
    cup.castShadow = true;
    group.add(cup);

    // Coffee liquid
    const liquidGeometry = new THREE.CircleGeometry(0.7, 32);
    const liquidMaterial = new THREE.MeshStandardMaterial({
        color: 0x3d2317,
        roughness: 0.1,
        metalness: 0.3
    });
    const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
    liquid.rotation.x = -Math.PI / 2;
    liquid.position.y = 1.3;
    group.add(liquid);

    // Handle
    const handleGeometry = new THREE.TorusGeometry(0.5, 0.1, 16, 32, Math.PI);
    const handleMaterial = new THREE.MeshStandardMaterial({
        color: 0x2c1810,
        roughness: 0.3
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0.8, 0.75, 0);
    handle.rotation.z = -Math.PI / 2;
    group.add(handle);

    // Saucer
    const saucerGeometry = new THREE.CylinderGeometry(1.2, 1, 0.1, 32);
    const saucerMaterial = new THREE.MeshStandardMaterial({
        color: 0x2c1810,
        roughness: 0.3
    });
    const saucer = new THREE.Mesh(saucerGeometry, saucerMaterial);
    saucer.position.y = 0;
    group.add(saucer);

    coffeeModel = group;
    
    // Use CONFIG for fallback model sizing
    const isMobile = window.innerWidth <= 768;
    const scale = isMobile ? CONFIG.size.mobile : CONFIG.size.desktop;
    const yPosition = isMobile ? CONFIG.height.mobile : CONFIG.height.desktop;
    
    coffeeModel.scale.setScalar(scale);
    coffeeModel.userData.originalScale = scale;
    coffeeModel.userData.isMobile = isMobile;
    coffeeModel.position.set(0, yPosition, 0);
    
    scene.add(coffeeModel);

    // Use CONFIG for camera position
    if (camera) {
        camera.position.z = isMobile ? CONFIG.camera.mobile : CONFIG.camera.desktop;
        camera.position.y = isMobile ? CONFIG.cameraY.mobile : CONFIG.cameraY.desktop;
    }

    initScrollRotation();
}

/**
 * GSAP Scroll-driven animation - Refined for smooth in-view motion
 * Model rotates and has subtle floating motion, stays within hero bounds
 */
function initScrollRotation() {
    if (!coffeeModel) return;

    // Kill existing ScrollTrigger if any
    if (scrollTriggerInstance) {
        scrollTriggerInstance.kill();
    }

    const isMobile = window.innerWidth <= 768;
    
    // Get original scale and position from CONFIG
    const originalScale = coffeeModel.userData.originalScale || (isMobile ? CONFIG.size.mobile : CONFIG.size.desktop);
    const baseYPosition = isMobile ? CONFIG.height.mobile : CONFIG.height.desktop;
    
    // Set initial state - use CONFIG values
    coffeeModel.position.set(0, baseYPosition, 0);
    coffeeModel.rotation.set(0, 0, 0);
    coffeeModel.scale.setScalar(originalScale);

    // Create scroll-driven animation that stays in view
    scrollTriggerInstance = gsap.timeline({
        scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 0.8, // Smoother scrub
        }
    });

    if (isMobile) {
        // Mobile: Custom wave/S-curve path following scroll
        ScrollTrigger.create({
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: 1,
            onUpdate: (self) => {
                if (!coffeeModel) return;
                const progress = self.progress;
                
                // S-curve X motion: starts center, curves right, then left
                // Using sine wave with phase shift for smooth S-curve
                const xOffset = Math.sin(progress * Math.PI * 2) * 1.2;
                
                // Y motion: overall downward drift with wave
                const yOffset = baseYPosition - (progress * 1.5) + (Math.sin(progress * Math.PI * 4) * 0.2);
                
                // Z motion: subtle depth change
                const zOffset = Math.cos(progress * Math.PI * 2) * 0.5;
                
                coffeeModel.position.x = xOffset;
                coffeeModel.position.y = yOffset;
                coffeeModel.position.z = zOffset;
                
                // Rotation: spin + tilt following the curve
                coffeeModel.rotation.y = progress * Math.PI * 3;
                coffeeModel.rotation.z = -xOffset * 0.3; // Bank into the turn
                coffeeModel.rotation.x = -0.1 - (progress * 0.2);
            }
        });
    } else {
        // Desktop: Simple subtle animation
        scrollTriggerInstance.to(coffeeModel.position, {
            y: baseYPosition - 0.5,
            ease: 'none'
        }, 0);
        
        scrollTriggerInstance.to(coffeeModel.rotation, {
            y: Math.PI * 2,
            ease: 'none'
        }, 0);
        
        scrollTriggerInstance.to(coffeeModel.rotation, {
            x: -0.2,
            ease: 'none'
        }, 0);
    }

    // Idle rotation continues when not scrolling
    ScrollTrigger.create({
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        onLeave: () => {
            // When leaving hero, gently rotate
            if (coffeeModel) {
                gsap.to(coffeeModel.rotation, {
                    y: coffeeModel.rotation.y + Math.PI * 0.5,
                    duration: 2,
                    ease: 'power2.out'
                });
            }
        }
    });
}

/**
 * Render loop
 */
function animate() {
    requestAnimationFrame(animate);

    // Only idle animation when hero is in view and not scrolling
    if (coffeeModel && !ScrollTrigger.isScrolling()) {
        const heroTrigger = ScrollTrigger.getById && ScrollTrigger.getAll().find(st => st.vars.trigger === '#hero');
        const isInHero = heroTrigger ? heroTrigger.isActive : true;
        
        if (isInHero) {
            // Very subtle idle bobbing
            coffeeModel.position.y += Math.sin(Date.now() * 0.001) * 0.0005;
        }
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

/**
 * Handle window resize
 */
function onWindowResize() {
    const container = document.getElementById('hero-3d');
    if (!container || !camera || !renderer) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    const isMobile = window.innerWidth <= 768;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    
    // Use CONFIG for camera position on resize
    camera.position.z = isMobile ? CONFIG.camera.mobile : CONFIG.camera.desktop;
    camera.position.y = isMobile ? CONFIG.cameraY.mobile : CONFIG.cameraY.desktop;
    
    // Re-initialize scroll animation with new mobile state
    if (coffeeModel) {
        initScrollRotation();
    }
}

// ============================================================================
// GSAP ANIMATIONS
// ============================================================================

function initGSAPAnimations() {
    gsap.registerPlugin(ScrollTrigger);

    // Hero text animation
    const heroText = document.querySelector('.hero-text');
    if (heroText) {
        gsap.from(heroText.children, {
            y: 50,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power2.out',
            delay: 0.3
        });
    }

    // Section animations
    const sections = document.querySelectorAll('.about, .features, .gallery-preview, .cta-section');
    
    sections.forEach(section => {
        gsap.from(section.querySelectorAll('.section-title, p, .btn, .feature-card, .gallery-item, .cta-content'), {
            scrollTrigger: {
                trigger: section,
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            },
            y: 40,
            opacity: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out'
        });
    });

    // Feature cards hover effect
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            gsap.to(card, {
                scale: 1.02,
                duration: 0.3,
                ease: 'power2.out'
            });
            gsap.to(card.querySelector('.feature-icon i'), {
                rotation: 360,
                duration: 0.5,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', () => {
            gsap.to(card, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
            gsap.to(card.querySelector('.feature-icon i'), {
                rotation: 0,
                duration: 0.5,
                ease: 'power2.out'
            });
        });
    });

    // Gallery items parallax
    const galleryItems = document.querySelectorAll('.gallery-item');
    galleryItems.forEach((item, index) => {
        const speed = (index % 2 === 0) ? 30 : -30;
        gsap.to(item, {
            y: speed,
            ease: 'none',
            scrollTrigger: {
                trigger: item,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1
            }
        });
    });

    // Navigation background on scroll
    const desktopNav = document.querySelector('.desktop-nav');
    if (desktopNav) {
        ScrollTrigger.create({
            start: 'top -100',
            onUpdate: (self) => {
                if (self.progress > 0) {
                    desktopNav.style.background = 'rgba(26, 18, 11, 0.98)';
                } else {
                    desktopNav.style.background = 'linear-gradient(180deg, rgba(26, 18, 11, 0.95), rgba(26, 18, 11, 0.8))';
                }
            }
        });
    }
}

// ============================================================================
// NAVIGATION
// ============================================================================

function initNavigation() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = document.querySelector('.desktop-nav')?.offsetHeight || 0;
                const mobileNavHeight = document.querySelector('.mobile-bottom-nav')?.offsetHeight || 0;
                const offset = window.innerWidth <= 768 ? mobileNavHeight : navHeight;
                
                gsap.to(window, {
                    duration: 1,
                    scrollTo: {
                        y: target,
                        offsetY: offset
                    },
                    ease: 'power2.inOut'
                });
            }
        });
    });

    // Mobile nav active state based on scroll
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.mobile-bottom-nav .nav-item');

    if (sections.length > 0 && navItems.length > 0) {
        window.addEventListener('scroll', () => {
            let current = '';
            const scrollPosition = window.scrollY + 200;

            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                if (scrollPosition >= sectionTop) {
                    current = section.getAttribute('id');
                }
            });

            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('href')?.includes(current)) {
                    item.classList.add('active');
                }
            });
        }, { passive: true });
    }
}

// ============================================================================
// MENU DATA LOADING
// ============================================================================

async function loadMenuData() {
    const loadingEl = document.getElementById('menu-loading');
    const errorEl = document.getElementById('menu-error');
    const containerEl = document.getElementById('menu-container');
    const tabsEl = document.getElementById('category-tabs');
    const featuredEl = document.getElementById('featured-grid');

    try {
        const response = await fetch('data/menu-data.json');
        if (!response.ok) throw new Error('Failed to load menu data');
        
        menuData = await response.json();

        // Hide loading
        if (loadingEl) loadingEl.style.display = 'none';
        if (containerEl) containerEl.style.display = 'block';

        // Render categories tabs
        renderCategoryTabs(tabsEl, menuData.categories);

        // Render menu items
        renderMenuItems(containerEl, menuData);

        // Render featured items
        if (featuredEl) {
            renderFeaturedItems(featuredEl, menuData.featured);
        }

    } catch (error) {
        console.error('Error loading menu:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        if (errorEl) {
            errorEl.style.display = 'block';
            const retryBtn = document.getElementById('retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', loadMenuData);
            }
        }
    }
}

function renderCategoryTabs(container, categories) {
    if (!container || !categories) return;

    container.innerHTML = categories.map((cat, index) => `
        <button class="category-tab ${index === 0 ? 'active' : ''}" data-category="${cat.id}">
            ${cat.name}
        </button>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.category-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            container.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const categoryId = tab.dataset.category;
            scrollToCategory(categoryId);
        });
    });
}

function renderMenuItems(container, data) {
    if (!container || !data) return;

    container.innerHTML = data.categories.map(category => {
        const items = data.items.filter(item => item.category === category.id);
        
        return `
            <div class="menu-category" id="category-${category.id}">
                <h2 class="menu-category-title">${category.name}</h2>
                <div class="menu-grid">
                    ${items.map(item => `
                        <div class="menu-item">
                            <div class="menu-item-header">
                                <h3 class="menu-item-name">${item.name}</h3>
                                <span class="menu-item-price">$${item.price.toFixed(2)}</span>
                            </div>
                            <p class="menu-item-description">${item.description}</p>
                            <div class="menu-item-tags">
                                ${item.tags.map(tag => `<span class="menu-tag">${tag}</span>`).join('')}
                                ${item.featured ? '<span class="menu-tag featured">Featured</span>' : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    // Animate items in
    gsap.from('.menu-item', {
        scrollTrigger: {
            trigger: container,
            start: 'top 80%'
        },
        y: 30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.05,
        ease: 'power2.out'
    });
}

function renderFeaturedItems(container, featured) {
    if (!container || !featured) return;

    container.innerHTML = featured.map(item => `
        <div class="featured-item">
            <div class="featured-item-image">
                <img src="${item.image || 'images/gallerie/gallery0.webp'}" alt="${item.name}" loading="lazy">
            </div>
            <div class="featured-item-content">
                <h3 class="featured-item-name">${item.name}</h3>
                <span class="featured-item-price">$${item.price.toFixed(2)}</span>
            </div>
        </div>
    `).join('');
}

function scrollToCategory(categoryId) {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
        const offset = 140; // Account for sticky header
        const elementPosition = element.getBoundingClientRect().top + window.scrollY;
        
        window.scrollTo({
            top: elementPosition - offset,
            behavior: 'smooth'
        });
    }
}

// ============================================================================
// CONTACT FORM
// ============================================================================

function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.addEventListener('submit', handleFormSubmit);

    // Real-time validation
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => clearError(input));
    });
}

function validateField(field) {
    const errorEl = document.getElementById(`${field.id}-error`);
    let error = '';

    if (!field.value.trim()) {
        error = 'This field is required';
    } else if (field.type === 'email' && !isValidEmail(field.value)) {
        error = 'Please enter a valid email address';
    }

    if (error && errorEl) {
        errorEl.textContent = error;
        field.style.borderColor = 'var(--color-error)';
        return false;
    }

    return true;
}

function clearError(field) {
    const errorEl = document.getElementById(`${field.id}-error`);
    if (errorEl) errorEl.textContent = '';
    field.style.borderColor = '';
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const successEl = document.getElementById('form-success');

    // Validate all fields
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });

    if (!isValid) return;

    // Simulate form submission
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="btn-text">Sending...</span><i class="ph ph-spinner ph-spin"></i>';

    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Show success
        form.reset();
        if (successEl) {
            successEl.style.display = 'block';
            gsap.from(successEl, {
                y: -20,
                opacity: 0,
                duration: 0.5,
                ease: 'power2.out'
            });

            // Hide after 5 seconds
            setTimeout(() => {
                gsap.to(successEl, {
                    opacity: 0,
                    y: -20,
                    duration: 0.3,
                    onComplete: () => {
                        successEl.style.display = 'none';
                        successEl.style.opacity = 1;
                        successEl.style.transform = 'none';
                    }
                });
            }, 5000);
        }

    } catch (error) {
        console.error('Form submission error:', error);
        alert('There was an error sending your message. Please try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-text">Send Message</span><i class="ph ph-paper-plane-right"></i>';
    }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Intersection Observer for lazy animations
const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
        }
    });
}, observerOptions);

// Observe elements with data-animate attribute
document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
