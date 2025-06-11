// Enhanced About modal dialog utility with modern design and animations

let lastFocusedElement = null;
let modalAnimationDuration = 300; // Animation duration in milliseconds

/**
 * Creates the enhanced modal content with modern styling and branding
 * @returns {string} HTML content for the modal
 */
function getAboutModalContent() {
	return `
		<div class="modal-backdrop">
			<div class="modal-content">
				<div class="modal-header">
					<div class="modal-icon">
						<img src="icons/favicon-96x96.png" alt="App Icon" class="app-icon" />
					</div>
					<button id="about-modal-close" class="modal-close" tabindex="0" aria-label="Close About dialog">
						<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
					</button>
				</div>
				<div class="modal-body">
					<h1 class="modal-title">
						<span class="title-gradient">Fit File Viewer</span>
						<span class="version-badge" id="version-badge">v21.1.0</span>
					</h1>
					<p class="modal-subtitle">Advanced FIT file analysis and visualization tool</p>
					<div class="feature-highlights">
						<div class="feature-item">
							<div class="feature-icon">📊</div>
							<span>Data Analysis</span>
						</div>
						<div class="feature-item">
							<div class="feature-icon">🗺️</div>
							<span>GPS Mapping</span>
						</div>
						<div class="feature-item">
							<div class="feature-icon">📈</div>
							<span>Performance Metrics</span>
						</div>
					</div>
					<div class="modal-actions">
						<button id="features-modal-btn" class="features-btn" tabindex="0" aria-label="View detailed features">
							<span class="btn-icon">✨</span>
							<span>Features</span>
						</button>
					</div>
					<div id="about-modal-body" class="modal-content-body"></div>					<div class="modal-footer">
						<div class="tech-stack">
							<a href="https://electronjs.org/" class="tech-badge-link" data-external-link>
								<span class="tech-badge">
									<span class="tech-icon">⚡</span>
									<span>Electron</span>
								</span>
							</a>
							<a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" class="tech-badge-link" data-external-link>
								<span class="tech-badge">
									<span class="tech-icon">📜</span>
									<span>JavaScript</span>
								</span>
							</a>
							<a href="https://github.com/chartjs/Chart.js" class="tech-badge-link" data-external-link>
								<span class="tech-badge">
									<span class="tech-icon">📊</span>
									<span>Chart.js</span>
								</span>
							</a>
							<a href="https://github.com/Leaflet/Leaflet" class="tech-badge-link" data-external-link>
								<span class="tech-badge">
									<span class="tech-icon">🗺️</span>
									<span>Leaflet</span>
								</span>
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	`;
}

/**
 * Enhanced modal initialization with modern styling and smooth animations
 */
function ensureAboutModal() {
	const existingModal = document.getElementById('about-modal');
	if (existingModal) return;

	const modal = document.createElement('div');
	modal.id = 'about-modal';
	modal.className = 'modal fancy-modal';
	modal.style.display = 'none';
	modal.innerHTML = getAboutModalContent();
	document.body.appendChild(modal);

	// Add global event listeners
	document.addEventListener('keydown', handleEscapeKey, true);

	// Inject enhanced styles
	injectModalStyles();
	
	// Load version information dynamically
	loadVersionInfo();
}

/**
 * Injects comprehensive modern styles for the modal
 */
function injectModalStyles() {
	// Prevent duplicate style injection
	if (document.getElementById('about-modal-styles')) return;

	const style = document.createElement('style');
	style.id = 'about-modal-styles';	style.textContent = `
		/* Modal Base Styles */
		.fancy-modal {
			position: fixed !important;
			top: 0 !important;
			left: 0 !important;
			width: 100vw !important;
			height: 100vh !important;
			z-index: 10000 !important;
			display: flex !important;
			align-items: center !important;
			justify-content: center !important;
			backdrop-filter: var(--backdrop-blur) !important;
			background: var(--color-overlay-bg) !important;
			opacity: 0;
			visibility: hidden;
			transition: all ${modalAnimationDuration}ms var(--transition-smooth);
		}

		.fancy-modal.show {
			opacity: 1;
			visibility: visible;
		}

		.fancy-modal .modal-backdrop {
			position: relative;
			max-width: 90vw;
			max-height: 90vh;
			overflow: hidden;
		}
		.fancy-modal .modal-content {
			background: var(--color-glass);
			border-radius: 24px;
			box-shadow: var(--color-box-shadow);
			border: 1px solid var(--color-glass-border);
			backdrop-filter: var(--backdrop-blur);
			overflow: hidden;
			position: relative;
			width: 500px;
			max-width: 90vw;
			color: var(--color-fg);
			transform: scale(0.8) translateY(40px);
			transition: transform ${modalAnimationDuration}ms var(--transition-bounce);
		}

		.fancy-modal.show .modal-content {
			transform: scale(1) translateY(0);
		}

		/* Header Styles */
		.fancy-modal .modal-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 24px 32px 16px;
			position: relative;
		}
		.fancy-modal .modal-icon {
			width: 48px;
			height: 48px;
			background: var(--color-glass);
			border-radius: 12px;
			display: flex;
			align-items: center;
			justify-content: center;
			backdrop-filter: var(--backdrop-blur);
			border: 1px solid var(--color-glass-border);
		}
		.fancy-modal .app-icon {
			width: 24px;
			height: 24px;
			border-radius: 4px;
		}

		/* Features Button */
		.fancy-modal .modal-actions {
			display: flex;
			justify-content: center;
			margin: 24px 0 16px;
		}		.fancy-modal .features-btn {
			background: var(--color-glass);
			border: 1px solid var(--color-glass-border);
			border-radius: 16px;
			padding: 12px 24px;
			color: var(--color-fg);
			font-size: 0.95rem;
			font-weight: 500;
			cursor: pointer;
			transition: var(--transition-smooth);
			backdrop-filter: var(--backdrop-blur);
			display: flex;
			align-items: center;
			gap: 8px;
			outline: none;
		}

		.fancy-modal .features-btn:hover {
			background: var(--color-glass);
			filter: brightness(1.2);
			border-color: var(--color-border-light);
			transform: translateY(-2px);
			box-shadow: var(--color-box-shadow-light);
		}

		.fancy-modal .features-btn:active {
			transform: translateY(0);
		}
		.fancy-modal .features-btn:focus {
			border-color: var(--color-border-light);
			box-shadow: 0 0 0 3px var(--color-glass);
		}

		.fancy-modal .btn-icon {
			font-size: 1.1rem;
		}
		.fancy-modal .modal-close {
			position: relative;
			background: var(--color-glass);
			border: 1px solid var(--color-glass-border);
			border-radius: 12px;
			width: 40px;
			height: 40px;
			display: flex;
			align-items: center;
			justify-content: center;
			cursor: pointer;
			transition: var(--transition-smooth);
			backdrop-filter: var(--backdrop-blur);
		}
		.fancy-modal .modal-close svg {
			width: 18px;
			height: 18px;
			color: var(--color-fg);
			opacity: 0.8;
			transition: all 0.2s ease;
		}

		.fancy-modal .modal-close:hover {
			background: var(--color-glass);
			border-color: var(--color-border-light);
			transform: scale(1.05);
		}

		.fancy-modal .modal-close:hover svg {
			opacity: 1;
		}

		.fancy-modal .modal-close:active {
			transform: scale(0.95);
		}

		/* Body Styles */
		.fancy-modal .modal-body {
			padding: 0 32px 32px;
			text-align: center;
		}

		.fancy-modal .modal-title {
			font-size: 2.5rem;
			font-weight: 700;
			margin: 0 0 8px 0;
			line-height: 1.2;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 16px;
			flex-wrap: wrap;
		}
		.fancy-modal .title-gradient {
			background: var(--color-title);
			background-clip: text;
			-webkit-background-clip: text;
			-webkit-text-fill-color: transparent;
			background-size: 200% 200%;
			animation: gradientShift 3s ease-in-out infinite;
		}

		@keyframes gradientShift {
			0%, 100% { background-position: 0% 50%; }
			50% { background-position: 100% 50%; }
		}
		.fancy-modal .version-badge {
			background: var(--color-glass);
			border: 1px solid var(--color-glass-border);
			border-radius: 20px;
			padding: 6px 16px;
			font-size: 0.9rem;
			font-weight: 500;
			backdrop-filter: var(--backdrop-blur);
			animation: pulse 2s ease-in-out infinite;
		}

		@keyframes pulse {
			0%, 100% { transform: scale(1); opacity: 1; }
			50% { transform: scale(1.05); opacity: 0.9; }
		}		.fancy-modal .modal-subtitle {
			font-size: 1.1rem;
			color: var(--color-fg);
			opacity: 0.8;
			margin: 0 0 32px 0;
			font-weight: 300;
		}

		/* Feature Highlights */
		.fancy-modal .feature-highlights {
			display: flex;
			justify-content: space-around;
			margin: 24px 0 32px;
			gap: 16px;
			flex-wrap: wrap;
		}
		.fancy-modal .feature-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 8px;
			padding: 16px;
			background: var(--color-glass);
			border-radius: 16px;
			border: 1px solid var(--color-glass-border);
			backdrop-filter: var(--backdrop-blur);
			transition: var(--transition-smooth);
			cursor: default;
			flex: 1;
			min-width: 120px;
		}

		.fancy-modal .feature-item:hover {
			transform: translateY(-4px);
			background: var(--color-glass);
			filter: brightness(1.1);
		}

		.fancy-modal .feature-icon {
			font-size: 1.5rem;
			margin-bottom: 4px;
		}		.fancy-modal .feature-item span {
			font-size: 0.9rem;
			font-weight: 500;
			color: var(--color-fg);
			opacity: 0.9;
		}
		/* Content Body */
		.fancy-modal .modal-content-body {
			background: var(--color-glass);
			border-radius: 16px;
			padding: 20px;
			margin: 24px 0;
			border: 1px solid var(--color-glass-border);
			backdrop-filter: var(--backdrop-blur);
			text-align: left;
			max-height: 200px;
			overflow-y: auto;
		}

		.fancy-modal .modal-content-body:empty {
			display: none;
		}
		.fancy-modal .modal-content-body * {
			color: var(--color-fg) !important;
			opacity: 0.9;
		}

		/* Footer */
		.fancy-modal .modal-footer {
			margin-top: 24px;
		}
		.fancy-modal .tech-stack {
			display: flex;
			justify-content: center;
			gap: 8px;
			flex-wrap: wrap;
		}

		.fancy-modal .tech-badge-link {
			text-decoration: none;
			color: inherit;
			transition: transform 0.2s ease;
		}

		.fancy-modal .tech-badge-link:hover {
			transform: translateY(-2px);
		}		.fancy-modal .tech-badge {
			background: var(--color-glass);
			border: 1px solid var(--color-glass-border);
			border-radius: 12px;
			padding: 4px 12px;
			font-size: 0.8rem;
			font-weight: 500;
			color: var(--color-fg);
			opacity: 0.8;
			backdrop-filter: var(--backdrop-blur);
			transition: var(--transition-smooth);
			display: flex;
			align-items: center;
			gap: 6px;
		}

		.fancy-modal .tech-badge:hover {
			background: var(--color-glass);
			filter: brightness(1.1);
			transform: scale(1.05);
			border-color: var(--color-border-light);
			opacity: 1;
		}

		.fancy-modal .tech-icon {
			font-size: 0.9rem;
			line-height: 1;
		}
		/* Scrollbar Styles */
		.fancy-modal .modal-content-body::-webkit-scrollbar {
			width: 6px;
		}

		.fancy-modal .modal-content-body::-webkit-scrollbar-track {
			background: var(--color-glass);
			border-radius: 3px;
		}

		.fancy-modal .modal-content-body::-webkit-scrollbar-thumb {
			background: var(--color-border-light);
			border-radius: 3px;
		}

		.fancy-modal .modal-content-body::-webkit-scrollbar-thumb:hover {
			background: var(--color-accent);
		}

		/* Responsive Design */
		@media (max-width: 600px) {
			.fancy-modal .modal-content {
				width: 95vw;
				margin: 0 16px;
			}
			
			.fancy-modal .modal-body {
				padding: 0 20px 24px;
			}
			
			.fancy-modal .modal-header {
				padding: 20px 20px 12px;
			}
			
			.fancy-modal .modal-title {
				font-size: 2rem;
				flex-direction: column;
				gap: 8px;
			}
			
			.fancy-modal .feature-highlights {
				flex-direction: column;
				gap: 12px;
			}
			
			.fancy-modal .feature-item {
				flex-direction: row;
				justify-content: flex-start;
				text-align: left;
			}
		}

		/* Animation Keyframes */
		@keyframes slideInUp {
			from {
				transform: translateY(100px);
				opacity: 0;
			}
			to {
				transform: translateY(0);
				opacity: 1;
			}
		}

		@keyframes fadeIn {
			from { opacity: 0; }
			to { opacity: 1; }
		}
	`;
	document.head.appendChild(style);
}

/**
 * Loads version information dynamically if available
 */
async function loadVersionInfo() {
	try {
		// Try to get version from electronAPI if available
		if (window.electronAPI && typeof window.electronAPI.getAppVersion === 'function') {
			const version = await window.electronAPI.getAppVersion();
			const versionBadge = document.getElementById('version-badge');
			if (versionBadge && version) {
				versionBadge.textContent = `v${version}`;
			}
		}
	} catch (error) {
		console.warn('[aboutModal] Could not load version information:', error);
	}
}

/**
 * Enhanced modal hide function with smooth animations
 */
function hideAboutModal() {
	const modal = document.getElementById('about-modal');
	if (modal) {
		// Start closing animation
		modal.classList.remove('show');
		
		// Wait for animation to complete before hiding
		setTimeout(() => {
			modal.style.display = 'none';
			
			// Restore focus to last focused element
			if (lastFocusedElement) {
				lastFocusedElement.focus();
				lastFocusedElement = null;
			}
			
			// Clean up event listeners
			document.removeEventListener('keydown', handleEscapeKey, true);
		}, modalAnimationDuration);
	}
}

/**
 * Enhanced escape key handler with better UX
 */
function handleEscapeKey(e) {
	if (e.key === 'Escape') {
		e.preventDefault();
		e.stopPropagation();
		hideAboutModal();
	}
}

/**
 * Shows detailed features list in the modal body
 */
function showFeaturesList() {
	const featuresContent = `
		<h3 style="color: var(--color-fg); opacity: 0.9; margin-top: 0; display: flex; align-items: center; gap: 8px;">
			<span>✨</span> Key Features
		</h3>
		<div style="color: var(--color-fg); opacity: 0.8; text-align: left;">
			<ul style="list-style: none; padding: 0; margin: 0;">
				<li style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 8px;">
					<span style="color: #4ade80;">📊</span>
					<div>
						<strong style="color: var(--color-fg); opacity: 0.95;">Data Analysis</strong>
						<div style="font-size: 0.9em; margin-top: 2px;">View detailed FIT file data in interactive tables with sorting and filtering</div>
					</div>
				</li>
				<li style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 8px;">
					<span style="color: #60a5fa;">🗺️</span>
					<div>
						<strong style="color: var(--color-fg); opacity: 0.95;">GPS Mapping</strong>
						<div style="font-size: 0.9em; margin-top: 2px;">Interactive maps with route visualization, elevation profiles, and GPX export</div>
					</div>
				</li>
				<li style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 8px;">
					<span style="color: #f472b6;">📈</span>
					<div>
						<strong style="color: var(--color-fg); opacity: 0.95;">Performance Metrics</strong>
						<div style="font-size: 0.9em; margin-top: 2px;">Advanced charts and graphs for analyzing performance trends</div>
					</div>
				</li>
				<li style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 8px;">
					<span style="color: #34d399;">💾</span>
					<div>
						<strong style="color: var(--color-fg); opacity: 0.95;">Data Export</strong>
						<div style="font-size: 0.9em; margin-top: 2px;">Export data to CSV, GPX, and other formats for further analysis</div>
					</div>
				</li>
				<li style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 8px;">
					<span style="color: #fbbf24;">🔧</span>
					<div>
						<strong style="color: var(--color-fg); opacity: 0.95;">File Recovery</strong>
						<div style="font-size: 0.9em; margin-top: 2px;">Repair corrupted FIT files for import into Garmin Connect, Strava, etc.</div>
					</div>
				</li>
				<li style="display: flex; align-items: flex-start; gap: 8px;">
					<span style="color: #a78bfa;">⚡</span>
					<div>
						<strong style="color: var(--color-fg); opacity: 0.95;">Cross-Platform</strong>
						<div style="font-size: 0.9em; margin-top: 2px;">Native desktop application for Windows, macOS, and Linux</div>
					</div>
				</li>
			</ul>
		</div>
	`;
	
	const body = document.getElementById('about-modal-body');
	if (body) {
		body.innerHTML = featuresContent;
	}
}

/**
 * Enhanced modal display function with animations and improved accessibility
 * @param {string} html - HTML content to display in the modal body
 */
export function showAboutModal(html = '') {
	ensureAboutModal();
	const modal = document.getElementById('about-modal');
		if (modal) {
		const body = document.getElementById('about-modal-body');
		const closeBtn = document.getElementById('about-modal-close');
		const featuresBtn = document.getElementById('features-modal-btn');
		
		if (body && closeBtn) {
			// Set content
			body.innerHTML = html;
			
			// Save current focus
			lastFocusedElement = document.activeElement;
			
			// Show modal with animation
			modal.style.display = 'flex';
			
			// Trigger animation on next frame
			requestAnimationFrame(() => {
				modal.classList.add('show');
			});
			
			// Set up event listeners
			closeBtn.onclick = (e) => {
				e.preventDefault();
				hideAboutModal();
			};
			
			closeBtn.onkeydown = (e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					hideAboutModal();
				}
			};
					// Features button functionality
			if (featuresBtn) {
				featuresBtn.onclick = (e) => {
					e.preventDefault();
					showFeaturesList();
				};
				
				featuresBtn.onkeydown = (e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						showFeaturesList();
					}
				};
			}
			
			// Handle external links to open in user's default browser
			const externalLinks = modal.querySelectorAll('[data-external-link]');
			externalLinks.forEach(link => {
				link.onclick = (e) => {
					e.preventDefault();
					const url = link.getAttribute('href');
					if (url && window.electronAPI && window.electronAPI.openExternal) {
						window.electronAPI.openExternal(url);
					} else if (url) {
						// Fallback for non-Electron environments
						window.open(url, '_blank', 'noopener,noreferrer');
					}
				};
				
				link.onkeydown = (e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						const url = link.getAttribute('href');
						if (url && window.electronAPI && window.electronAPI.openExternal) {
							window.electronAPI.openExternal(url);
						} else if (url) {
							// Fallback for non-Electron environments
							window.open(url, '_blank', 'noopener,noreferrer');
						}
					}
				};
			});
			
			// Close on backdrop click
			modal.onclick = (e) => {
				if (e.target === modal) {
					hideAboutModal();
				}
			};
			
			// Prevent modal content clicks from closing modal
			const modalContent = modal.querySelector('.modal-content');
			if (modalContent) {
				modalContent.onclick = (e) => {
					e.stopPropagation();
				};
			}
			
			// Focus management - focus close button after animation
			setTimeout(() => {
				closeBtn.focus();
			}, modalAnimationDuration);
					// Sound functionality removed as requested
		}
	}
}

/**
 * Development helpers for testing and debugging
 */
const devHelpers = {
	/**
	 * Show modal with sample content for testing
	 */	showSample: () => {
		const sampleContent = `
			<h3 style="color: var(--color-fg); opacity: 0.9; margin-top: 0;">Sample Content</h3>
			<p style="color: var(--color-fg); opacity: 0.8;">This is a sample modal with some content to demonstrate the enhanced styling and features.</p>
			<ul style="color: var(--color-fg); opacity: 0.8; text-align: left;">
				<li>Enhanced animations and transitions</li>
				<li>Modern glassmorphism design</li>
				<li>Responsive layout</li>
				<li>Improved accessibility</li>
				<li>Dynamic version loading</li>
			</ul>
		`;
		showAboutModal(sampleContent);
	},
	
	/**
	 * Test modal animations
	 */
	testAnimations: () => {
		const modal = document.getElementById('about-modal');
		if (modal) {
			modal.style.transition = 'all 1000ms ease';
			modal.querySelector('.modal-content').style.transition = 'transform 1000ms cubic-bezier(0.34, 1.56, 0.64, 1)';
		}
		devHelpers.showSample();
	},
	
	/**
	 * Reset all styles and recreate modal
	 */
	reset: () => {
		const existingModal = document.getElementById('about-modal');
		const existingStyles = document.getElementById('about-modal-styles');
		
		if (existingModal) existingModal.remove();
		if (existingStyles) existingStyles.remove();
		
		ensureAboutModal();
	}
};

// Export development helpers in development mode
if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'development') {
	window.aboutModalDevHelpers = devHelpers;
}

// Initialize modal styles when module loads
if (typeof document !== 'undefined' && document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', () => {
		// Pre-initialize styles for better performance
		injectModalStyles();
	});
} else if (typeof document !== 'undefined') {
	// Document already loaded, initialize immediately
	injectModalStyles();
}