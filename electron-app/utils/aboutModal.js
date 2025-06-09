// Utility for About modal dialog

let lastFocusedElement = null;

function getAboutModalContent() {
	return `
		<div class="modal-content">
			<button id="about-modal-close" class="modal-close" tabindex="0" aria-label="Close About dialog">&times;</button>
			<h2>About Fit File Viewer</h2>
			<p>Fit File Viewer is a tool for viewing and analyzing FIT files.</p>
			<p id="about-modal-body"></p>
		</div>
	`;
}

function ensureAboutModal() {
	const existingModal = document.getElementById('about-modal');
	if (existingModal) return;
	const modal = document.createElement('div');
	modal.id = 'about-modal';
	modal.className = 'modal';
	modal.style.display = 'none';
	modal.innerHTML = getAboutModalContent();
	document.body.appendChild(modal);

	// Add the escape key listener once during initialization
	document.addEventListener('keydown', handleEscapeKey, true);

	// Define hover styles for the close button to improve user experience
	const style = document.createElement('style');
	style.textContent = `
	  #about-modal .modal-close {
		position: absolute;
		top: 10px;
		right: 10px;
		background: transparent;
		border: none;
		font-size: 2rem;
		line-height: 1;
		color: #888;
		cursor: pointer;
		transition: color 0.2s;
	  }

	  #about-modal .modal-close:hover {
		color: #d00 !important;
		outline: none;
		background: rgba(0,0,0,0.04) !important;
	  }
	`;
	document.head.appendChild(style);
}

function hideAboutModal() {
	const modal = document.getElementById('about-modal');
	if (modal) {
		modal.style.display = 'none';
		if (lastFocusedElement) {
			lastFocusedElement.focus();
			lastFocusedElement = null;
		}
		document.removeEventListener('keydown', handleEscapeKey, true);
	}
}

function handleEscapeKey(e) {
	if (e.key === 'Escape') {
		hideAboutModal();
	}
}

export function showAboutModal(html) {
	ensureAboutModal();
	const modal = document.getElementById('about-modal');
	if (modal) {
		const body = document.getElementById('about-modal-body');
		const closeBtn = document.getElementById('about-modal-close');
		if (body && closeBtn) {
		body.innerHTML = html;
		modal.style.display = 'flex';

		// Prevent duplicate listeners by removing any existing ones

		closeBtn.onclick = () => {
			hideAboutModal();
		};
		closeBtn.onkeydown = (e) => {
			if (e.key === 'Enter' || e.key === ' ') hideAboutModal();
		};
		modal.onclick = (e) => {
			// Close the modal only when clicking outside the modal content
			if (e.target === modal) hideAboutModal();
		};

		// Save last focused element and move focus to close button
		lastFocusedElement = document.activeElement;
		closeBtn.focus();

	}
}}