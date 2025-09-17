import { modalAnimationDuration } from "./aboutModal.js";

/**
 * Injects comprehensive modern styles for the modal
 */
export function injectModalStyles() {
    // Prevent duplicate style injection
    if (document.getElementById("about-modal-styles")) {
        return;
    }

    const style = document.createElement("style");
    style.id = "about-modal-styles";
    style.textContent = `
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
			max-height: 85vh;
			overflow: hidden;
		}		.fancy-modal .modal-content {
			background: var(--color-glass);
			border-radius: 24px;
			box-shadow: var(--color-box-shadow);
			border: 1px solid var(--color-glass-border);
			backdrop-filter: var(--backdrop-blur);
			overflow: hidden;
			position: relative;
			width: 500px;
			max-width: 90vw;
			max-height: 85vh;
			color: var(--color-fg);
			transform: scale(0.8) translateY(40px);
			transition: transform ${modalAnimationDuration}ms var(--transition-bounce);
			display: flex;
			flex-direction: column;
		}

		.fancy-modal.show .modal-content {
			transform: scale(1) translateY(0);
		}
		/* Header Styles */
		.fancy-modal .modal-header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 20px 28px 12px;
			position: relative;
			flex-shrink: 0;
		}		.fancy-modal .modal-icon {
			width: 56px;
			height: 56px;
			background: var(--color-glass);
			border-radius: 16px;
			display: flex;
			align-items: center;
			justify-content: center;
			backdrop-filter: var(--backdrop-blur);
			border: 1px solid var(--color-glass-border);
		}
		.fancy-modal .app-icon {
			width: 40px;
			height: 40px;
			border-radius: 8px;
		}
		/* Features Button */
		.fancy-modal .modal-actions {
			display: flex;
			justify-content: center;
			margin: 20px 0 12px;
		}.fancy-modal .features-btn {
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
			padding: 0 28px 20px;
			text-align: center;
			overflow-y: auto;
			flex: 1;
			min-height: 0;
		}
		.fancy-modal .modal-title {
			font-size: 2.2rem;
			font-weight: 700;
			margin: 0 0 6px 0;
			line-height: 1.2;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 14px;
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
		}		.fancy-modal .version-badge {
			background: var(--color-glass);
			border: 1px solid var(--color-glass-border);
			border-radius: 20px;
			padding: 6px 16px;
			font-size: 0.9rem;
			font-weight: 500;
			backdrop-filter: var(--backdrop-blur);
			animation: pulse 2s ease-in-out infinite;
			display: flex;
			align-items: center;
			gap: 2px;
		}

		.fancy-modal .version-prefix {
			color: var(--color-accent);
			font-weight: 600;
			opacity: 0.8;
			font-size: 0.8rem;
		}
		.fancy-modal .version-number {
			color: var(--color-fg);
			font-weight: 700;
			letter-spacing: 0.5px;
		}		/* System Information Section */
		.fancy-modal .system-info-section {
			margin: 20px 0 18px;
			background: var(--color-glass);
			border: 1px solid var(--color-glass-border);
			border-radius: 16px;
			padding: 20px;
			backdrop-filter: var(--backdrop-blur);
			position: relative;
			overflow: hidden;
			max-height: 250px;
			overflow-y: auto;
			transition: var(--transition-smooth);
		}

		.fancy-modal .system-info-section::before {
			content: '';
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			height: 3px;
			background: linear-gradient(90deg, var(--color-accent), var(--color-accent-secondary));
			opacity: 0.8;
		}
		.fancy-modal .system-info-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 12px;
			text-align: left;
		}
		.fancy-modal .system-info-item {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 10px 14px;
			background: var(--color-glass);
			border: 1px solid var(--color-glass-border);
			border-radius: 12px;
			transition: var(--transition-smooth);
			backdrop-filter: var(--backdrop-blur);
			position: relative;
			overflow: hidden;
		}

		.fancy-modal .system-info-item::before {
			content: '';
			position: absolute;
			left: 0;
			top: 0;
			bottom: 0;
			width: 3px;
			background: var(--color-accent);
			opacity: 0.6;
			transition: var(--transition-smooth);
		}

		.fancy-modal .system-info-item:hover {
			transform: translateY(-2px);
			border-color: var(--color-border-light);
			filter: brightness(1.1);
		}

		.fancy-modal .system-info-item:hover::before {
			opacity: 1;
			width: 4px;
		}

		.fancy-modal .system-info-label {
			font-size: 0.9rem;
			font-weight: 500;
			color: var(--color-fg);
			opacity: 0.8;
			display: flex;
			align-items: center;
			gap: 8px;
		}

		.fancy-modal .system-info-value {
			font-size: 0.9rem;
			font-weight: 600;
			font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
			padding: 4px 8px;
			border-radius: 6px;
			border: 1px solid transparent;
			transition: var(--transition-smooth);
		}

		/* Features Content Styles */
		.fancy-modal .features-content {
			text-align: left;
		}

		.fancy-modal .features-title {
			color: var(--color-fg);
			opacity: 0.9;
			margin: 0 0 16px 0;
			display: flex;
			align-items: center;
			gap: 8px;
			font-size: 1.2rem;
			font-weight: 600;
		}

		.fancy-modal .features-list {
			list-style: none;
			padding: 0;
			margin: 0;
		}
		.fancy-modal .features-item {
			margin-bottom: 12px;
			display: flex;
			align-items: flex-start;
			gap: 10px;
			padding: 12px;
			background: var(--color-glass);
			border: 1px solid var(--color-glass-border);
			border-radius: 12px;
			transition: var(--transition-smooth);
			backdrop-filter: var(--backdrop-blur);
		}

		.fancy-modal .features-item:hover {
			transform: translateY(-2px);
			border-color: var(--color-border-light);
			filter: brightness(1.1);
		}

		.fancy-modal .features-item:last-child {
			margin-bottom: 0;
		}

		.fancy-modal .features-icon {
			font-size: 1.2rem;
			min-width: 24px;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.fancy-modal .features-content-item {
			flex: 1;
		}

		.fancy-modal .features-item-title {
			color: var(--color-fg);
			opacity: 0.95;
			font-weight: 600;
			margin: 0 0 4px 0;
			font-size: 0.95rem;
		}

		.fancy-modal .features-item-description {
			color: var(--color-fg);
			opacity: 0.8;
			font-size: 0.85rem;
			line-height: 1.4;
			margin: 0;
		}

		/* Individual system info value colors */
		.fancy-modal .version-highlight {
			color: #4ade80;
			background: rgba(74, 222, 128, 0.1);
			border-color: rgba(74, 222, 128, 0.3);
		}

		.fancy-modal .electron-highlight {
			color: #60a5fa;
			background: rgba(96, 165, 250, 0.1);
			border-color: rgba(96, 165, 250, 0.3);
		}

		.fancy-modal .node-highlight {
			color: #34d399;
			background: rgba(52, 211, 153, 0.1);
			border-color: rgba(52, 211, 153, 0.3);
		}

		.fancy-modal .chrome-highlight {
			color: #fbbf24;
			background: rgba(251, 191, 36, 0.1);
			border-color: rgba(251, 191, 36, 0.3);
		}

		.fancy-modal .platform-highlight {
			color: #a78bfa;
			background: rgba(167, 139, 250, 0.1);
			border-color: rgba(167, 139, 250, 0.3);
		}

		.fancy-modal .author-highlight {
			color: #f472b6;
			background: rgba(244, 114, 182, 0.1);
			border-color: rgba(244, 114, 182, 0.3);
		}

		.fancy-modal .license-highlight {
			color: #fb7185;
			background: rgba(251, 113, 133, 0.1);
			border-color: rgba(251, 113, 133, 0.3);
		}

		/* Add icons to labels */
		.fancy-modal .system-info-label::before {
			font-size: 0.8rem;
			margin-right: 4px;
		}

		.fancy-modal .system-info-item:nth-child(1) .system-info-label::before {
			content: '🏷️';
		}

		.fancy-modal .system-info-item:nth-child(2) .system-info-label::before {
			content: '⚡';
		}

		.fancy-modal .system-info-item:nth-child(3) .system-info-label::before {
			content: '🟢';
		}

		.fancy-modal .system-info-item:nth-child(4) .system-info-label::before {
			content: '🌐';
		}

		.fancy-modal .system-info-item:nth-child(5) .system-info-label::before {
			content: '💻';
		}

		.fancy-modal .system-info-item:nth-child(6) .system-info-label::before {
			content: '👤';
		}

		.fancy-modal .system-info-item:nth-child(7) .system-info-label::before {
			content: '📄';
		}

		@keyframes pulse {
			0%, 100% { transform: scale(1); opacity: 1; }
			50% { transform: scale(1.05); opacity: 0.9; }
		}		.fancy-modal .modal-subtitle {
			font-size: 1rem;
			color: var(--color-fg);
			opacity: 0.8;
			margin: 0 0 24px 0;
			font-weight: 300;
		}
		/* Feature Highlights */
		.fancy-modal .feature-highlights {
			display: flex;
			justify-content: space-around;
			margin: 16px 0 20px;
			gap: 12px;
			flex-wrap: wrap;
		}		.fancy-modal .feature-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			gap: 6px;
			padding: 12px;
			background: var(--color-glass);
			border-radius: 16px;
			border: 1px solid var(--color-glass-border);
			backdrop-filter: var(--backdrop-blur);
			transition: var(--transition-smooth);
			cursor: default;
			flex: 1;
			min-width: 60px;
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
		}		/* Content Body */
		.fancy-modal .modal-content-body {
			background: var(--color-glass);
			border-radius: 16px;
			padding: 16px;
			margin: 16px 0;
			border: 1px solid var(--color-glass-border);
			backdrop-filter: var(--backdrop-blur);
			text-align: left;
			max-height: 150px;
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
			margin-top: 16px;
			flex-shrink: 0;
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
		/* System Info Scrollbar Styles */
		.fancy-modal .system-info-section::-webkit-scrollbar {
			width: 8px;
		}

		.fancy-modal .system-info-section::-webkit-scrollbar-track {
			background: var(--color-glass);
			border-radius: 4px;
		}

		.fancy-modal .system-info-section::-webkit-scrollbar-thumb {
			background: var(--color-border);
			border-radius: 4px;
			border: 1px solid var(--color-glass);
		}

		.fancy-modal .system-info-section::-webkit-scrollbar-thumb:hover {
			background: var(--color-accent);
		}

		/* Modal Body Scrollbar Styles */
		.fancy-modal .modal-body::-webkit-scrollbar {
			width: 8px;
		}

		.fancy-modal .modal-body::-webkit-scrollbar-track {
			background: transparent;
			border-radius: 4px;
		}

		.fancy-modal .modal-body::-webkit-scrollbar-thumb {
			background: var(--color-border);
			border-radius: 4px;
			border: 1px solid transparent;
		}

		.fancy-modal .modal-body::-webkit-scrollbar-thumb:hover {
			background: var(--color-accent);
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
		}		/* Responsive Design */
		@media (max-width: 600px) {
			.fancy-modal .modal-content {
				width: 95vw;
				margin: 0 16px;
				max-height: 90vh;
			}
			
			.fancy-modal .modal-body {
				padding: 0 20px 16px;
			}
			
			.fancy-modal .modal-header {
				padding: 16px 20px 8px;
			}
			
			.fancy-modal .modal-title {
				font-size: 1.8rem;
				flex-direction: column;
				gap: 8px;
			}
			
			.fancy-modal .feature-highlights {
				flex-direction: column;
				gap: 10px;
				margin: 12px 0 16px;
			}
			
			.fancy-modal .feature-item {
				flex-direction: row;
				justify-content: flex-start;
				text-align: left;
				padding: 10px;
			}

			.fancy-modal .system-info-grid {
				grid-template-columns: 1fr;
				gap: 10px;
			}

			.fancy-modal .system-info-section {
				padding: 16px;
				margin: 16px 0 16px;
				max-height: 200px;
			}

			.fancy-modal .system-info-item {
				padding: 8px 12px;
			}

			.fancy-modal .modal-actions {
				margin: 16px 0 8px;
			}

			.fancy-modal .modal-footer {
				margin-top: 12px;
			}
		}

		/* Ensure proper fitting on 1920x1080 screens */
		@media (min-height: 1080px) {
			.fancy-modal .modal-backdrop {
				max-height: 80vh;
			}
			
			.fancy-modal .modal-content {
				max-height: 80vh;
			}
		}

		/* For very tall screens, allow more space */
		@media (min-height: 1200px) {
			.fancy-modal .modal-backdrop {
				max-height: 85vh;
			}
			
			.fancy-modal .modal-content {
				max-height: 85vh;
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
