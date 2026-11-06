/**
 * We Be High - Main JavaScript
 * 
 * Vanilla JS (ES6+) - No jQuery
 * Simplified: Hero search is the primary AJAX search
 * 
 * @package WeBeHighv2026
 */

(function() {
	'use strict';

	/**
	 * DOM Ready
	 */
	function domReady(fn) {
		if (document.readyState !== 'loading') {
			fn();
		} else {
			document.addEventListener('DOMContentLoaded', fn);
		}
	}

	/**
	 * Debounce utility
	 */
	function debounce(func, wait) {
		let timeout;
		return function executedFunction(...args) {
			const later = function() {
				clearTimeout(timeout);
				func(...args);
			};
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
		};
	}

	/**
	 * Header Scroll Effect
	 */
	function initHeaderScroll() {
		const header = document.getElementById('masthead');
		if (!header) return;

		window.addEventListener('scroll', function() {
			const currentScroll = window.pageYOffset;

			if (currentScroll > 10) {
				header.classList.add('is-scrolled');
			} else {
				header.classList.remove('is-scrolled');
			}
		}, { passive: true });
	}

	/**
	 * Mega-Breadcrumb Navigation
	 * Interactive breadcrumb segments with dropdown siblings
	 */
	function initMegaNav() {
		const megaNav = document.getElementById('mega-nav');
		if (!megaNav) return;

		const segments = megaNav.querySelectorAll('.mega-segment');
		let activeDropdown = null;

		/**
		 * Close all dropdowns
		 */
		function closeAllDropdowns() {
			segments.forEach(function(segment) {
				const btn = segment.querySelector('.mega-segment-btn');
				const dropdown = segment.querySelector('.mega-dropdown');
				if (btn && dropdown) {
					btn.setAttribute('aria-expanded', 'false');
					dropdown.hidden = true;
				}
			});
			activeDropdown = null;
		}

		/**
		 * Toggle a specific dropdown
		 */
		function toggleDropdown(segment) {
			const btn = segment.querySelector('.mega-segment-btn');
			const dropdown = segment.querySelector('.mega-dropdown');
			if (!btn || !dropdown) return;

			const isExpanded = btn.getAttribute('aria-expanded') === 'true';

			// Close all first
			closeAllDropdowns();

			// If it wasn't expanded, open it
			if (!isExpanded) {
				btn.setAttribute('aria-expanded', 'true');
				dropdown.hidden = false;
				activeDropdown = dropdown;
			}
		}

		// Add click handlers to each segment button
		segments.forEach(function(segment) {
			const btn = segment.querySelector('.mega-segment-btn');
			if (!btn) return;

			btn.addEventListener('click', function(e) {
				e.stopPropagation();
				toggleDropdown(segment);
			});
		});

		// Close dropdowns when clicking outside
		document.addEventListener('click', function(e) {
			if (!megaNav.contains(e.target)) {
				closeAllDropdowns();
			}
		});

		// Close on Escape key
		document.addEventListener('keydown', function(e) {
			if (e.key === 'Escape' && activeDropdown) {
				closeAllDropdowns();
			}
		});

		// Keyboard navigation within dropdowns
		megaNav.addEventListener('keydown', function(e) {
			if (!activeDropdown) return;

			const items = activeDropdown.querySelectorAll('a');
			const currentIndex = Array.from(items).indexOf(document.activeElement);

			if (e.key === 'ArrowDown') {
				e.preventDefault();
				const nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
				items[nextIndex].focus();
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				const prevIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
				items[prevIndex].focus();
			}
		});
	}

	/**
	 * Global Search Toggle
	 * Swap between mega-nav and global search input
	 */
	function initGlobalSearchToggle() {
		const searchToggle = document.getElementById('search-toggle');
		const megaNav = document.getElementById('mega-nav');
		const globalSearch = document.getElementById('global-search');
		const searchInput = document.getElementById('global-search-input');
		const searchClose = document.querySelector('.global-search-close');
		const searchResults = document.getElementById('global-search-results');

		if (!searchToggle || !globalSearch) return;

		/**
		 * Show search, hide mega-nav
		 */
		function openSearch() {
			if (megaNav) megaNav.hidden = true;
			globalSearch.hidden = false;
			if (searchInput) {
				searchInput.focus();
			}
		}

		/**
		 * Hide search, show mega-nav
		 */
		function closeSearch() {
			globalSearch.hidden = true;
			if (megaNav) megaNav.hidden = false;
			if (searchInput) {
				searchInput.value = '';
			}
			if (searchResults) {
				searchResults.hidden = true;
				searchResults.innerHTML = '';
			}
		}

		// Toggle button
		searchToggle.addEventListener('click', function() {
			if (globalSearch.hidden) {
				openSearch();
			} else {
				closeSearch();
			}
		});

		// Close button
		if (searchClose) {
			searchClose.addEventListener('click', closeSearch);
		}

		// Close on Escape
		if (searchInput) {
			searchInput.addEventListener('keydown', function(e) {
				if (e.key === 'Escape') {
					closeSearch();
					searchToggle.focus();
				}
			});
		}

		// Global search AJAX (reuse existing search logic)
		if (searchInput && searchResults) {
			let currentFocusIndex = -1;

			const performGlobalSearch = debounce(function(term) {
				if (term.length < 2) {
					searchResults.innerHTML = '';
					searchResults.hidden = true;
					currentFocusIndex = -1;
					return;
				}

				searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
				searchResults.hidden = false;

				fetch('/_no-backend/webehigh/v1/search?term=' + encodeURIComponent(term))
					.then(function(response) {
						return response.json();
					})
					.then(function(results) {
						if (results.length === 0) {
							searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
							return;
						}

						let html = '';
						results.forEach(function(result) {
							const icon = result.type === 'post' ? '📄' : (result.flag || '🌍');
							
							html += '<a href="' + result.url + '" class="search-result-item">';
							html += '<span class="search-result-flag">' + icon + '</span>';
							html += '<div class="search-result-info">';
							html += '<span class="search-result-city">' + escapeHtml(result.title) + '</span>';
							if (result.country) {
								html += '<span class="search-result-country">' + escapeHtml(result.country) + '</span>';
							}
							html += '</div>';
							html += '</a>';
						});

						searchResults.innerHTML = html;
						currentFocusIndex = -1;
					})
					.catch(function(error) {
						console.error('Search error:', error);
						searchResults.innerHTML = '<div class="search-no-results">Search error</div>';
					});
			}, 300);

			searchInput.addEventListener('input', function() {
				performGlobalSearch(this.value.trim());
			});

			// Keyboard navigation
			searchInput.addEventListener('keydown', function(e) {
				const items = searchResults.querySelectorAll('.search-result-item');
				
				if (items.length === 0) return;
				
				if (e.key === 'ArrowDown') {
					e.preventDefault();
					currentFocusIndex = Math.min(currentFocusIndex + 1, items.length - 1);
					updateSearchFocus(items, currentFocusIndex);
				} else if (e.key === 'ArrowUp') {
					e.preventDefault();
					currentFocusIndex = Math.max(currentFocusIndex - 1, -1);
					if (currentFocusIndex === -1) {
						items.forEach(function(item) { item.classList.remove('is-focused'); });
					} else {
						updateSearchFocus(items, currentFocusIndex);
					}
				} else if (e.key === 'Enter' && currentFocusIndex >= 0) {
					e.preventDefault();
					items[currentFocusIndex].click();
				}
			});

			function updateSearchFocus(items, index) {
				items.forEach(function(item, i) {
					if (i === index) {
						item.classList.add('is-focused');
						item.scrollIntoView({ block: 'nearest' });
					} else {
						item.classList.remove('is-focused');
					}
				});
			}
		}
	}

	/**
	 * Regions Dropdown - Legacy (keep for backward compatibility)
	 * Opens a full-width panel below navbar with backdrop overlay
	 */
	function initRegionsDropdown() {
		const toggle = document.querySelector('.regions-toggle');
		const panel = document.getElementById('regions-panel');
		const backdrop = document.getElementById('regions-backdrop');
		
		if (!toggle || !panel) return;

		/**
		 * Open the regions panel
		 */
		function openPanel() {
			toggle.setAttribute('aria-expanded', 'true');
			panel.hidden = false;
			if (backdrop) backdrop.hidden = false;
			document.body.style.overflow = 'hidden'; // Prevent scroll
		}

		/**
		 * Close the regions panel
		 */
		function closePanel() {
			toggle.setAttribute('aria-expanded', 'false');
			panel.hidden = true;
			if (backdrop) backdrop.hidden = true;
			document.body.style.overflow = ''; // Restore scroll
		}

		/**
		 * Toggle panel open/closed
		 */
		function togglePanel() {
			const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
			if (isExpanded) {
				closePanel();
			} else {
				openPanel();
			}
		}

		// Toggle button click
		toggle.addEventListener('click', function(e) {
			e.stopPropagation();
			togglePanel();
		});

		// Close when clicking backdrop
		if (backdrop) {
			backdrop.addEventListener('click', closePanel);
		}

		// Close when clicking outside (but not on panel content)
		document.addEventListener('click', function(e) {
			if (!toggle.contains(e.target) && !panel.contains(e.target) && !panel.hidden) {
				closePanel();
			}
		});

		// Close on escape
		document.addEventListener('keydown', function(e) {
			if (e.key === 'Escape' && !panel.hidden) {
				closePanel();
				toggle.focus();
			}
		});

		// Close when clicking a region link (after navigation starts)
		panel.addEventListener('click', function(e) {
			if (e.target.closest('.region-card')) {
				// Small delay to allow navigation to start
				setTimeout(closePanel, 100);
			}
		});
	}

	/**
	 * Mobile Menu (Slide Down)
	 */
	function initMobileMenu() {
		const menuToggle = document.querySelector('.menu-toggle');
		const mobileMenu = document.getElementById('mobile-menu');
		if (!menuToggle || !mobileMenu) return;

		menuToggle.addEventListener('click', function() {
			const isExpanded = menuToggle.getAttribute('aria-expanded') === 'true';
			menuToggle.setAttribute('aria-expanded', !isExpanded);
			mobileMenu.hidden = isExpanded;
			document.body.classList.toggle('mobile-menu-open', !isExpanded);
		});

		// Close on escape
		document.addEventListener('keydown', function(e) {
			if (e.key === 'Escape' && !mobileMenu.hidden) {
				menuToggle.setAttribute('aria-expanded', 'false');
				mobileMenu.hidden = true;
				document.body.classList.remove('mobile-menu-open');
			}
		});
	}

	/**
	 * Hero AJAX Search (Primary Search)
	 * Targets the hero search input on the front page
	 * 2027 Premium Command Palette Style
	 */
	function initHeroSearch() {
		const heroInput = document.getElementById('hero-search-input');
		const heroResults = document.getElementById('hero-search-results');
		const searchWrapper = heroInput?.closest('.search-hero');
		
		if (!heroInput || !heroResults) return;

		let currentFocusIndex = -1;

		// Focus effect
		heroInput.addEventListener('focus', function() {
			if (searchWrapper) searchWrapper.classList.add('is-focused');
		});

		heroInput.addEventListener('blur', function() {
			if (searchWrapper) searchWrapper.classList.remove('is-focused');
		});

		// AJAX Search with 300ms debounce for performance
		const performSearch = debounce(function(term) {
			if (term.length < 2) {
				heroResults.innerHTML = '';
				heroResults.hidden = true;
				if (searchWrapper) searchWrapper.classList.remove('has-results');
				currentFocusIndex = -1;
				return;
			}

			// Show loading state
			heroResults.innerHTML = '<div class="search-loading">Searching...</div>';
			heroResults.hidden = false;
			if (searchWrapper) searchWrapper.classList.add('has-results');

			// Fetch from REST API
			fetch('/_no-backend/webehigh/v1/search?term=' + encodeURIComponent(term))
				.then(function(response) {
					return response.json();
				})
				.then(function(results) {
					if (results.length === 0) {
						heroResults.innerHTML = '<div class="search-no-results">No results found for "' + escapeHtml(term) + '"</div>';
						return;
					}

					let html = '';
					results.forEach(function(result) {
						const typeClass = result.type === 'post' ? 'search-result-type--blog' : 'search-result-type--city';
						const typeLabel = result.type === 'post' ? 'Blog' : 'City';
						const icon = result.type === 'post' ? '📄' : (result.flag || '🌍');
						
						html += '<a href="' + result.url + '" class="search-result-item" data-type="' + result.type + '">';
						html += '<span class="search-result-flag">' + icon + '</span>';
						html += '<div class="search-result-info">';
						html += '<span class="search-result-city">' + escapeHtml(result.title) + '</span>';
						if (result.country) {
							html += '<span class="search-result-country">' + escapeHtml(result.country) + '</span>';
						} else if (result.type === 'post') {
							html += '<span class="search-result-type ' + typeClass + '">' + typeLabel + '</span>';
						}
						html += '</div>';
						html += '</a>';
					});

					// Add keyboard hint footer
					html += '<div class="search-hint">';
					html += '<span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>';
					html += '<span><kbd>↵</kbd> Open</span>';
					html += '<span><kbd>Esc</kbd> Close</span>';
					html += '</div>';

					heroResults.innerHTML = html;
					currentFocusIndex = -1;
				})
				.catch(function(error) {
					console.error('Search error:', error);
					heroResults.innerHTML = '<div class="search-no-results">Search error. Try again.</div>';
				});
		}, 300); // 300ms debounce for performance

		// Input event
		heroInput.addEventListener('input', function() {
			performSearch(this.value.trim());
		});

		// Focus event - show results if there are any
		heroInput.addEventListener('focus', function() {
			if (heroResults.innerHTML && this.value.trim().length >= 2) {
				heroResults.hidden = false;
				if (searchWrapper) searchWrapper.classList.add('has-results');
			}
		});

		// Close results when clicking outside
		document.addEventListener('click', function(e) {
			if (!heroInput.contains(e.target) && !heroResults.contains(e.target)) {
				heroResults.hidden = true;
				if (searchWrapper) searchWrapper.classList.remove('has-results');
				currentFocusIndex = -1;
			}
		});

		// Keyboard navigation
		heroInput.addEventListener('keydown', function(e) {
			const items = heroResults.querySelectorAll('.search-result-item');
			
			if (items.length === 0) return;
			
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				currentFocusIndex = Math.min(currentFocusIndex + 1, items.length - 1);
				updateFocus(items);
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				currentFocusIndex = Math.max(currentFocusIndex - 1, -1);
				if (currentFocusIndex === -1) {
					items.forEach(function(item) { item.classList.remove('is-focused'); });
				} else {
					updateFocus(items);
				}
			} else if (e.key === 'Enter' && currentFocusIndex >= 0) {
				e.preventDefault();
				items[currentFocusIndex].click();
			} else if (e.key === 'Escape') {
				heroResults.hidden = true;
				if (searchWrapper) searchWrapper.classList.remove('has-results');
				currentFocusIndex = -1;
			}
		});

		function updateFocus(items) {
			items.forEach(function(item, index) {
				if (index === currentFocusIndex) {
					item.classList.add('is-focused');
					item.scrollIntoView({ block: 'nearest' });
				} else {
					item.classList.remove('is-focused');
				}
			});
		}
	}

	/**
	 * Escape HTML entities
	 */
	function escapeHtml(text) {
		const div = document.createElement('div');
		div.textContent = text;
		return div.innerHTML;
	}

	/**
	 * Table of Contents Generator
	 * Generates TOC from H2 headings in the content
	 * Supports both desktop sidebar and mobile collapsed TOC
	 */
	function initTableOfContents() {
		const desktopTocList = document.getElementById('toc-list');
		const mobileTocList = document.getElementById('mobile-toc-list');
		const content = document.getElementById('city-content');
		
		if (!content) return;

		// Get all H2 headings from multiple sections:
		// 1. .legal-text-dynamic (Marijuana Laws - dynamic from Legality Manager)
		// 2. .entry-content (main post content)
		// 3. .field-reports-section (Community Field Reports - h2 is nested in header)
		const headings = content.querySelectorAll('.legal-text-dynamic h2, .entry-content h2, .field-reports-section h2');
		
		if (headings.length === 0) {
			// Hide TOC widgets if no headings
			const tocWidget = desktopTocList?.closest('.toc-widget');
			const mobileTocWrapper = document.getElementById('mobile-toc-wrapper');
			if (tocWidget) tocWidget.style.display = 'none';
			if (mobileTocWrapper) mobileTocWrapper.style.display = 'none';
			return;
		}

		// Build TOC items
		const tocItems = [];
		headings.forEach(function(heading, index) {
			// Create ID if it doesn't exist
			if (!heading.id) {
				heading.id = 'section-' + (index + 1);
			}
			
			// Get display text (shorten "Community Field Reports" to "Field Reports")
			let displayText = heading.textContent.trim();
			if (heading.id === 'field-reports' || heading.id === 'field-reports-heading') {
				displayText = 'Field Reports';
				// Use consistent anchor
				heading.id = 'field-reports-heading';
			}
			
			tocItems.push({
				id: heading.id,
				text: displayText
			});
		});

		// Populate desktop TOC
		if (desktopTocList) {
			tocItems.forEach(function(item) {
				const li = document.createElement('li');
				const a = document.createElement('a');
				a.href = '#' + item.id;
				a.textContent = item.text;
				li.appendChild(a);
				desktopTocList.appendChild(li);
			});
		}

		// Populate mobile TOC
		if (mobileTocList) {
			tocItems.forEach(function(item) {
				const li = document.createElement('li');
				const a = document.createElement('a');
				a.href = '#' + item.id;
				a.textContent = item.text;
				li.appendChild(a);
				mobileTocList.appendChild(li);
			});
		}

		// Highlight active TOC item on scroll
		initTocHighlight(headings);
	}

	/**
	 * Mobile TOC Toggle
	 */
	function initMobileTocToggle() {
		const toggle = document.getElementById('mobile-toc-toggle');
		const content = document.getElementById('mobile-toc-content');

		if (!toggle || !content) return;

		toggle.addEventListener('click', function() {
			const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
			toggle.setAttribute('aria-expanded', !isExpanded);
			content.hidden = isExpanded;
		});

		// Close TOC when clicking a link
		content.addEventListener('click', function(e) {
			if (e.target.tagName === 'A') {
				toggle.setAttribute('aria-expanded', 'false');
				content.hidden = true;
			}
		});
	}

	/**
	 * TOC Active Highlight
	 */
	function initTocHighlight(headings) {
		const tocLinks = document.querySelectorAll('.toc-list a');
		if (tocLinks.length === 0) return;

		const observerOptions = {
			rootMargin: '-20% 0px -70% 0px',
			threshold: 0
		};

		const observer = new IntersectionObserver(function(entries) {
			entries.forEach(function(entry) {
				if (entry.isIntersecting) {
					// Remove active from all
					tocLinks.forEach(function(link) {
						link.classList.remove('active');
					});

					// Add active to current (both desktop and mobile)
					const activeLinks = document.querySelectorAll('.toc-list a[href="#' + entry.target.id + '"]');
					activeLinks.forEach(function(link) {
						link.classList.add('active');
					});
				}
			});
		}, observerOptions);

		headings.forEach(function(heading) {
			observer.observe(heading);
		});
	}

	/**
	 * Smooth Scroll for Anchor Links
	 */
	function initSmoothScroll() {
		document.addEventListener('click', function(e) {
			const link = e.target.closest('a[href^="#"]');
			if (!link) return;

			const targetId = link.getAttribute('href');
			if (targetId === '#') return;

			const target = document.querySelector(targetId);
			if (!target) return;

			e.preventDefault();

			const headerHeight = document.getElementById('masthead')?.offsetHeight || 0;
			const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - 32;

			window.scrollTo({
				top: targetPosition,
				behavior: 'smooth'
			});

			// Update URL without jumping
			history.pushState(null, null, targetId);
		});
	}

	/**
	 * City Sort (for taxonomy pages)
	 */
	function initCitySort() {
		const sortSelect = document.getElementById('cities-sort');
		if (!sortSelect) return;

		sortSelect.addEventListener('change', function() {
			const value = this.value;
			const url = new URL(window.location.href);
			
			// Parse sort value
			const [orderby, order] = value.split('-');
			
			url.searchParams.set('orderby', orderby);
			url.searchParams.set('order', order);
			
			window.location.href = url.toString();
		});

		// Set initial value from URL
		const url = new URL(window.location.href);
		const orderby = url.searchParams.get('orderby') || 'title';
		const order = url.searchParams.get('order') || 'asc';
		sortSelect.value = orderby + '-' + order;
	}

	/**
	 * Report Form Modal & AJAX Submission
	 * Handles the "Submit Update" modal on single city pages
	 * Desktop: centered modal | Mobile: fullscreen popup
	 */
	function initReportForm() {
		const toggleBtn = document.getElementById('report-toggle');
		const toggleBtnInline = document.getElementById('report-toggle-inline');
		const toggleBtnEmpty = document.getElementById('report-toggle-empty'); // Empty state CTA
		const modal = document.getElementById('report-modal');
		const backdrop = document.getElementById('report-modal-backdrop');
		const closeBtn = document.getElementById('report-modal-close');
		const form = document.getElementById('report-form');
		const cancelBtn = document.getElementById('report-cancel');
		const statusEl = document.getElementById('report-status');
		const updateTypeSelect = document.getElementById('update_type');
		const reportDetails = document.getElementById('report_details');
		const charCounter = document.getElementById('report_details_count');
		const maxLength = 5000;

		// Character counter for textarea
		if (reportDetails && charCounter) {
			function updateCharCount() {
				const count = reportDetails.value.length;
				charCounter.textContent = count.toLocaleString();
				// Visual warning when approaching limit
				const counterParent = charCounter.closest('.form-hint--counter');
				if (counterParent) {
					if (count >= maxLength) {
						counterParent.classList.add('is-limit');
						counterParent.classList.remove('is-warning');
					} else if (count >= maxLength * 0.9) {
						counterParent.classList.add('is-warning');
						counterParent.classList.remove('is-limit');
					} else {
						counterParent.classList.remove('is-warning', 'is-limit');
					}
				}
			}
			reportDetails.addEventListener('input', updateCharCount);
			// Initialize on load
			updateCharCount();
		}

		// Track which element opened the modal (for focus return)
		let openerElement = null;

		// Need at least one toggle button and the modal/form
		if ((!toggleBtn && !toggleBtnInline && !toggleBtnEmpty) || !modal || !form) return;

		/**
		 * Open modal with optional preselected update type
		 * @param {string|null} preselectedType - The update_type value to preselect (e.g., 'price_update', 'safety_update')
		 * @param {Element|null} opener - The element that triggered the modal open
		 */
		function openModal(preselectedType, opener) {
			// Store the opener element for focus return on close
			openerElement = opener || null;

			// Preselect update type if provided
			if (preselectedType && updateTypeSelect) {
				updateTypeSelect.value = preselectedType;
				// Trigger change event in case there are any listeners
				updateTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
			}

			modal.hidden = false;
			document.body.classList.add('modal-open');
			if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
			if (toggleBtnInline) toggleBtnInline.setAttribute('aria-expanded', 'true');
			if (toggleBtnEmpty) toggleBtnEmpty.setAttribute('aria-expanded', 'true');

			// Focus first input when opened
			const firstInput = form.querySelector('select, input:not([type="hidden"]), textarea');
			if (firstInput) {
				setTimeout(function() {
					firstInput.focus();
				}, 100);
			}

			// Trap focus inside modal
			modal.addEventListener('keydown', trapFocus);
		}

		/**
		 * Close modal
		 */
		function closeModal() {
			modal.hidden = true;
			document.body.classList.remove('modal-open');
			if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
			if (toggleBtnInline) toggleBtnInline.setAttribute('aria-expanded', 'false');
			if (toggleBtnEmpty) toggleBtnEmpty.setAttribute('aria-expanded', 'false');

			// Return focus to the element that opened the modal (prevents scroll jump)
			if (openerElement && typeof openerElement.focus === 'function') {
				openerElement.focus({ preventScroll: true });
			} else if (toggleBtn) {
				toggleBtn.focus({ preventScroll: true });
			}
			// Reset opener reference
			openerElement = null;

			// Remove focus trap
			modal.removeEventListener('keydown', trapFocus);
		}

		/**
		 * Trap focus inside modal
		 */
		function trapFocus(e) {
			if (e.key !== 'Tab') return;
			
			const focusableEls = modal.querySelectorAll('button, [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])');
			const firstEl = focusableEls[0];
			const lastEl = focusableEls[focusableEls.length - 1];
			
			if (e.shiftKey && document.activeElement === firstEl) {
				e.preventDefault();
				lastEl.focus();
			} else if (!e.shiftKey && document.activeElement === lastEl) {
				e.preventDefault();
				firstEl.focus();
			}
		}

		/**
		 * Show status message
		 */
		function showStatus(message, type) {
			statusEl.textContent = message;
			statusEl.className = 'report-status report-status--' + type;
			statusEl.hidden = false;
		}

		/**
		 * Reset form
		 */
		function resetForm() {
			form.reset();
			statusEl.hidden = true;
			statusEl.className = 'report-status';
		}

		// Open modal on button click (sidebar button)
		if (toggleBtn) {
			toggleBtn.addEventListener('click', function() {
				openModal(null, this);
			});
		}

		// Open modal on inline button click (field reports section)
		if (toggleBtnInline) {
			toggleBtnInline.addEventListener('click', function() {
				openModal(null, this);
			});
		}

		// Open modal on empty state CTA button click
		if (toggleBtnEmpty) {
			toggleBtnEmpty.addEventListener('click', function() {
				openModal(null, this);
			});
		}

		// Open modal on section CTA button click (with preselected update type)
		document.querySelectorAll('.section-cta-btn').forEach(function(btn) {
			btn.addEventListener('click', function(e) {
				e.preventDefault();
				var updateType = this.getAttribute('data-update-type');
				openModal(updateType, this);
			});
		});

		// Close modal on close button click
		if (closeBtn) {
			closeBtn.addEventListener('click', function() {
				closeModal();
			});
		}

		// Close modal on backdrop click
		if (backdrop) {
			backdrop.addEventListener('click', function() {
				closeModal();
			});
		}

		// Cancel button click
		if (cancelBtn) {
			cancelBtn.addEventListener('click', function() {
				resetForm();
				closeModal();
			});
		}

		// Close on Escape key
		document.addEventListener('keydown', function(e) {
			if (e.key === 'Escape' && !modal.hidden) {
				resetForm();
				closeModal();
			}
		});

		// Form submission
		form.addEventListener('submit', function(e) {
			e.preventDefault();

			const submitBtn = document.getElementById('report-submit');
			
			// Disable button while submitting
			submitBtn.disabled = true;
			submitBtn.textContent = 'Submitting...';
			statusEl.hidden = true;

			// Gather form data
			const formData = new FormData(form);
			formData.append('action', 'submit_city_report');

			// Check for AJAX URL
			if (typeof webehighAjax === 'undefined' || !webehighAjax.ajaxUrl) {
				showStatus('Configuration error. Please refresh and try again.', 'error');
				submitBtn.disabled = false;
				submitBtn.textContent = 'Submit';
				return;
			}

			// Send AJAX request
			fetch(webehighAjax.ajaxUrl, {
				method: 'POST',
				body: formData,
				credentials: 'same-origin'
			})
			.then(function(response) {
				return response.json();
			})
			.then(function(data) {
				if (data.success) {
					// Show success popup with OK button
					alert(data.data.message || 'Thank you! Your report has been submitted.');
					resetForm();
					closeModal();
				} else {
					showStatus(data.data.message || 'An error occurred. Please try again.', 'error');
				}
			})
			.catch(function(error) {
				console.error('Report submission error:', error);
				showStatus('Network error. Please check your connection and try again.', 'error');
			})
			.finally(function() {
				submitBtn.disabled = false;
				submitBtn.textContent = 'Submit Update';
			});
		});
	}

	/**
	 * Mobile Anchor Ad Close
	 */
	function initMobileAdClose() {
		const closeBtn = document.getElementById('ad-mobile-close');
		const adContainer = document.getElementById('ad-mobile-anchor');

		if (!closeBtn || !adContainer) return;

		closeBtn.addEventListener('click', function() {
			adContainer.classList.add('is-closed');
			document.body.style.paddingBottom = '0';
			
			// Store in session so it stays closed during session
			try {
				sessionStorage.setItem('webehigh_ad_closed', '1');
			} catch (e) {
				// Session storage not available
			}
		});

		// Check if ad was closed this session
		try {
			if (sessionStorage.getItem('webehigh_ad_closed') === '1') {
				adContainer.classList.add('is-closed');
				document.body.style.paddingBottom = '0';
			}
		} catch (e) {
			// Session storage not available
		}
	}

	/**
	 * Hero Slideshow (Cinematic Cross-Dissolve)
	 * Barely perceptible drift with smooth 2s dissolve between images
	 * Supports both desktop and mobile slideshows
	 */
	function initHeroSlideshow() {
		// Initialize desktop slideshow
		initSingleSlideshow('hero-slideshow');
		
		// Initialize mobile slideshow
		initSingleSlideshow('hero-slideshow-mobile');
	}

	/**
	 * Initialize a single slideshow by ID
	 */
	function initSingleSlideshow(slideshowId) {
		const slideshow = document.getElementById(slideshowId);
		if (!slideshow) return;

		const slides = Array.from(slideshow.querySelectorAll('.hero-slide'));
		if (slides.length === 0) return;

		// If only 1 image, just show it (no animation needed)
		if (slides.length === 1) {
			slides[0].classList.add('is-visible');
			return;
		}

		let currentIndex = 0;
		const displayDuration = 10000; // 10 seconds per image

		/**
		 * Show a slide with drift animation
		 */
		function showSlide(index) {
			const slide = slides[index];
			
			// Reset animation
			slide.classList.remove('is-drifting');
			slide.style.transform = '';
			void slide.offsetWidth; // Force reflow
			
			// Make visible and start drifting
			slide.classList.add('is-visible', 'is-drifting');
		}

		/**
		 * Hide a slide
		 */
		function hideSlide(index) {
			const slide = slides[index];
			slide.classList.remove('is-visible');
			
			// Clean up after fade completes
			setTimeout(function() {
				slide.classList.remove('is-drifting');
				slide.style.transform = '';
			}, 2000);
		}

		/**
		 * Transition to next slide
		 */
		function nextSlide() {
			const prevIndex = currentIndex;
			currentIndex = (currentIndex + 1) % slides.length;
			
			// Show next slide (fades in via CSS transition)
			showSlide(currentIndex);
			
			// Hide previous slide (fades out via CSS transition)
			hideSlide(prevIndex);
		}

		// Start: show first slide
		showSlide(0);

		// Loop through slides
		setInterval(nextSlide, displayDuration);
	}

	/**
	 * Updates Filter Dropdown
	 * Handles the filter dropdown toggle and filtering of legal updates
	 */
	function initUpdatesFilter() {
		const dropdown = document.getElementById('filterDropdown');
		if (!dropdown) return;

		const button = dropdown.querySelector('.filter-button');
		const items = dropdown.querySelectorAll('.dropdown-item');
		const currentText = dropdown.querySelector('.filter-current');
		const updateList = document.getElementById('legal-updates-list');

		// Toggle dropdown on button click
		button.addEventListener('click', function(e) {
			e.stopPropagation();
			const isOpen = dropdown.classList.contains('open');
			dropdown.classList.toggle('open');
			button.setAttribute('aria-expanded', !isOpen);
		});

		// Handle item selection
		items.forEach(function(item) {
			item.addEventListener('click', function(e) {
				e.stopPropagation();
				
				// Update active state
				items.forEach(function(i) {
					i.classList.remove('active');
				});
				item.classList.add('active');

				// Update button text
				if (currentText) {
					currentText.textContent = item.textContent.trim();
				}

				// Close dropdown
				dropdown.classList.remove('open');
				button.setAttribute('aria-expanded', 'false');

				// Filter updates
				const filterValue = item.getAttribute('data-filter');
				filterLegalUpdates(filterValue);
			});
		});

		// Close dropdown when clicking outside
		document.addEventListener('click', function(e) {
			if (!dropdown.contains(e.target)) {
				dropdown.classList.remove('open');
				button.setAttribute('aria-expanded', 'false');
			}
		});

		// Close on escape key
		document.addEventListener('keydown', function(e) {
			if (e.key === 'Escape' && dropdown.classList.contains('open')) {
				dropdown.classList.remove('open');
				button.setAttribute('aria-expanded', 'false');
				button.focus();
			}
		});

		/**
		 * Filter legal updates based on category
		 * @param {string} filter - Category slug or 'all'
		 */
		function filterLegalUpdates(filter) {
			if (!updateList) return;

			const updateItems = updateList.querySelectorAll('.update-item');
			
			updateItems.forEach(function(item) {
				const categories = item.getAttribute('data-categories') || '';
				const categoryArray = categories.split(',').filter(Boolean);

				if (filter === 'all') {
					// Show all items
					item.style.display = '';
					item.classList.remove('filtered-out');
				} else {
					// Check if item has the category
					if (categoryArray.includes(filter)) {
						item.style.display = '';
						item.classList.remove('filtered-out');
					} else {
						item.style.display = 'none';
						item.classList.add('filtered-out');
					}
				}
			});

			// Check if any items are visible
			const visibleItems = updateList.querySelectorAll('.update-item:not(.filtered-out)');
			const noResultsMsg = updateList.querySelector('.no-filter-results');

			if (visibleItems.length === 0) {
				// Show no results message
				if (!noResultsMsg) {
					const msg = document.createElement('p');
					msg.className = 'no-filter-results';
					msg.textContent = 'No updates in this category.';
					msg.style.cssText = 'text-align: center; padding: 40px 20px; color: #6b7280; font-size: 14px;';
					updateList.appendChild(msg);
				}
			} else {
				// Remove no results message if it exists
				if (noResultsMsg) {
					noResultsMsg.remove();
				}
			}
		}
	}

	/**
	 * Legal Updates Accordion
	 * Handles expand/collapse behavior for update cards
	 */
	function initLegalUpdatesAccordion() {
		const updateList = document.getElementById('legal-updates-list');
		if (!updateList) return;

		const updateItems = updateList.querySelectorAll('.update-item');

		updateItems.forEach(function(item) {
			const header = item.querySelector('.update-header');
			const body = item.querySelector('.update-body');

			if (!header || !body) return;

			header.addEventListener('click', function(e) {
				e.preventDefault();
				
				const isOpen = item.classList.contains('is-open');

				// Close all other open items (accordion behavior)
				updateItems.forEach(function(otherItem) {
					if (otherItem !== item && otherItem.classList.contains('is-open')) {
						closeItem(otherItem);
					}
				});

				// Toggle current item
				if (isOpen) {
					closeItem(item);
				} else {
					openItem(item);
				}
			});

			// Keyboard support
			header.addEventListener('keydown', function(e) {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					header.click();
				}
			});
		});

		/**
		 * Open an accordion item
		 * @param {HTMLElement} item - The update item to open
		 */
		function openItem(item) {
			const header = item.querySelector('.update-header');
			const body = item.querySelector('.update-body');
			
			item.classList.add('is-open');
			header.setAttribute('aria-expanded', 'true');
			body.setAttribute('aria-hidden', 'false');
		}

		/**
		 * Close an accordion item
		 * @param {HTMLElement} item - The update item to close
		 */
		function closeItem(item) {
			const header = item.querySelector('.update-header');
			const body = item.querySelector('.update-body');
			
			item.classList.remove('is-open');
			header.setAttribute('aria-expanded', 'false');
			body.setAttribute('aria-hidden', 'true');
		}
	}

	/**
	 * Adblock Empty Slot Collapse
	 *
	 * Detects empty ad slots after a delay and collapses them to remove gaps.
	 * Preserves CLS protection for normal users by only collapsing AFTER
	 * ads have had time to load (1200ms initial, 2500ms follow-up check).
	 */
	function initAdblockCollapse() {
		// Ad slot selectors to check
		var adSelectors = [
			'div[data-mantis-zone]',
			'.hero-ad-slot',
			'.hero-ad-wrapper',
			'.destination-ad-slot'
		];

		/**
		 * Check if an ad slot is empty (no iframe, no rendered content)
		 * @param {HTMLElement} slot - The ad slot element to check
		 * @returns {boolean} True if slot appears empty
		 */
		function isSlotEmpty(slot) {
			// Check for iframes (most ad networks use iframes)
			if (slot.querySelector('iframe')) {
				return false;
			}

			// Check for any substantial content (images, divs with content)
			var hasContent = slot.querySelector('img, video, canvas, object, embed');
			if (hasContent) {
				return false;
			}

			// Check rendered height - if > 30px, something rendered
			var rect = slot.getBoundingClientRect();
			if (rect.height > 30) {
				// Double-check it's not just min-height with no actual content
				// If it has children with actual height, consider it filled
				for (var i = 0; i < slot.children.length; i++) {
					var child = slot.children[i];
					var childRect = child.getBoundingClientRect();
					if (childRect.height > 10) {
						return false;
					}
				}
			}

			return true;
		}

		/**
		 * Collapse empty ad slots
		 */
		function collapseEmptySlots() {
			adSelectors.forEach(function(selector) {
				var slots = document.querySelectorAll(selector);
				slots.forEach(function(slot) {
					// Skip already collapsed slots
					if (slot.classList.contains('ad-collapsed')) {
						return;
					}

					if (isSlotEmpty(slot)) {
						slot.classList.add('ad-collapsed');

						// Also collapse parent wrapper if it exists and is now empty
						var wrapper = slot.closest('.hero-ad-wrapper, .destination-ad-slot');
						if (wrapper && wrapper !== slot && isSlotEmpty(wrapper)) {
							wrapper.classList.add('ad-collapsed');
						}
					}
				});
			});
		}

		// First check after 1200ms (gives ads time to load)
		setTimeout(collapseEmptySlots, 1200);

		// Second check after 2500ms (catches slow-loading ads, more conservative)
		setTimeout(collapseEmptySlots, 2500);
	}

	/**
	 * Field Reports Filter Pills
	 * Filters field reports by type when clicking filter pills.
	 */
	function initFieldReportsFilter() {
		const filterContainer = document.querySelector('.field-reports-filters');
		if (!filterContainer) return;

		const pills = filterContainer.querySelectorAll('.filter-pill');
		const reportsList = document.querySelector('.field-reports-list');
		if (!reportsList) return;

		const reports = reportsList.querySelectorAll('.field-report');

		// Mark first and last visible reports for consistent spacing
		function updateVisibleMarkers() {
			reports.forEach(function(r) {
				r.classList.remove('is-first-visible', 'is-last-visible');
			});
			const visibleReports = Array.from(reports).filter(function(r) {
				return !r.classList.contains('is-hidden');
			});
			if (visibleReports.length > 0) {
				visibleReports[0].classList.add('is-first-visible');
				visibleReports[visibleReports.length - 1].classList.add('is-last-visible');
			}
		}

		// Initial state
		updateVisibleMarkers();

		pills.forEach(function(pill) {
			pill.addEventListener('click', function() {
				const filterType = this.getAttribute('data-filter');

				// Update active pill and aria-pressed state
				pills.forEach(function(p) {
					p.classList.remove('active');
					p.setAttribute('aria-pressed', 'false');
				});
				this.classList.add('active');
				this.setAttribute('aria-pressed', 'true');

				// Filter reports
				reports.forEach(function(report) {
					const reportType = report.getAttribute('data-type');
					if (filterType === 'all' || reportType === filterType) {
						report.classList.remove('is-hidden');
					} else {
						report.classList.add('is-hidden');
					}
				});

				// Update visible markers for consistent spacing
				updateVisibleMarkers();
			});
		});
	}

	/**
	 * Field Reports Read More Toggle
	 * Expands/collapses long report content with proper ARIA support.
	 */
	function initFieldReportsReadMore() {
		const readMoreButtons = document.querySelectorAll('.read-more-toggle');
		if (!readMoreButtons.length) return;

		readMoreButtons.forEach(function(button) {
			button.addEventListener('click', function() {
				const content = this.previousElementSibling;
				if (!content || !content.classList.contains('field-report-content')) return;

				const isExpanded = content.classList.contains('is-expanded');
				const label = this.querySelector('.read-more-label');
				const chevron = this.querySelector('.read-more-chevron');

				if (isExpanded) {
					content.classList.remove('is-expanded');
					content.classList.add('is-truncated');
					if (label) label.textContent = 'Read more';
					if (chevron) chevron.textContent = '▾';
					this.setAttribute('aria-expanded', 'false');
				} else {
					content.classList.remove('is-truncated');
					content.classList.add('is-expanded');
					if (label) label.textContent = 'Read less';
					if (chevron) chevron.textContent = '▴';
					this.setAttribute('aria-expanded', 'true');
				}
			});
		});
	}

	/**
	 * Section CFR Links
	 * Handles clicks on "See community reports" links under legacy sections.
	 * Scrolls to CFR and preselects the relevant filter.
	 */
	function initSectionCfrLinks() {
		const cfrLinks = document.querySelectorAll('.section-cfr-link, .section-view-btn');
		if (!cfrLinks.length) return;

		cfrLinks.forEach(function(link) {
			link.addEventListener('click', function(e) {
				e.preventDefault();

				const filterType = this.getAttribute('data-filter-type');

				// Try primary ID, fallback to alternative if needed.
				let target = document.querySelector('#field-reports');
				if (!target) {
					target = document.querySelector('#community-field-reports');
				}
				if (!target) {
					target = document.querySelector('.field-reports-section');
				}

				if (target) {
					// Scroll to CFR section
					target.scrollIntoView({ behavior: 'smooth', block: 'start' });

					// After scroll, select the filter pill if filterType is set
					if (filterType) {
						// Small delay to ensure scroll completes before filter activation
						setTimeout(function() {
							// Try exact match first
							var filterPill = document.querySelector('.filter-pill[data-filter="' + filterType + '"]');

							// If no pill found for this type, fallback to "All"
							if (!filterPill) {
								filterPill = document.querySelector('.filter-pill[data-filter="all"]');
							}

							if (filterPill && !filterPill.classList.contains('active')) {
								filterPill.click();
							}
						}, 300);
					}
				}
			});
		});
	}

	/**
	 * Initialize All
	 */
	domReady(function() {
		initHeaderScroll();
		initMegaNav();
		initGlobalSearchToggle();
		initRegionsDropdown();
		initMobileMenu();
		initHeroSearch();
		initHeroSlideshow();
		initUpdatesFilter();
		initLegalUpdatesAccordion();
		initTableOfContents();
		initMobileTocToggle();
		initSmoothScroll();
		initCitySort();
		initReportForm();
		initMobileAdClose();
		initAdblockCollapse();
		initFieldReportsFilter();
		initFieldReportsReadMore();
		initSectionCfrLinks();
	});

})();
