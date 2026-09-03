document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('bookshelf-container');
    const bookshelf = document.getElementById('bookshelf');
    const articles = Array.from(bookshelf.querySelectorAll('article'));

    // Enable JS-specific styling (like hiding scrollbars)
    bookshelf.classList.add('js-active');

    // Setup Pagination DOM
    const paginationWrapper = document.createElement('div');
    paginationWrapper.className = 'pagination-wrapper';
    
    const paginationWindow = document.createElement('div');
    paginationWindow.className = 'pagination-window';
    
    const paginationTrack = document.createElement('div');
    paginationTrack.className = 'pagination-track';

    paginationWindow.appendChild(paginationTrack);
    paginationWrapper.appendChild(paginationWindow);
    container.appendChild(paginationWrapper);

    const dots = [];
    const MAX_VISIBLE_DOTS = 5;
    const DOT_WIDTH = 10;
    const DOT_GAP = 12;

    if (articles.length <= MAX_VISIBLE_DOTS) {
        paginationWindow.style.width = 'auto';
    }

    // Shared variable to track the active slide animation
    let centerAnimationId = null;

    // --- MOVED UP: Pagination Visuals Logic ---
    // We moved this up so it can be called instantly when a dot or book is clicked
    function updateVisuals(activeIndex) {
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === activeIndex);
            
            let isSmall = false;
            if (dots.length > MAX_VISIBLE_DOTS) {
                let offset = Math.max(0, Math.min(activeIndex - 2, dots.length - MAX_VISIBLE_DOTS));
                if (i === offset && offset > 0) isSmall = true;
                if (i === offset + MAX_VISIBLE_DOTS - 1 && offset < dots.length - MAX_VISIBLE_DOTS) isSmall = true;
            }
            dot.classList.toggle('small', isSmall);
        });

        // Slide the dots track if there are more than max visible
        if (dots.length > MAX_VISIBLE_DOTS) {
            let offset = Math.max(0, Math.min(activeIndex - 2, dots.length - MAX_VISIBLE_DOTS));
            const translateX = -(offset * (DOT_WIDTH + DOT_GAP));
            paginationTrack.style.transform = `translateX(${translateX}px)`;
        }
    }

    articles.forEach((article, index) => {
        // Create pagination dot
        const dot = document.createElement('span');
        dot.className = 'dot';
        paginationTrack.appendChild(dot);
        dots.push(dot);

        const radio = article.querySelector('input[type="radio"]');
        const label = article.querySelector('label[for^="radio-"]');

        function animateToCenter() {
            // Cancel any active animation if a user clicks rapidly
            if (centerAnimationId) {
                window.cancelAnimationFrame(centerAnimationId);
            }

            // Temporarily disable CSS scroll locking so JS can animate smoothly
            bookshelf.style.scrollBehavior = 'auto';
            bookshelf.style.scrollSnapType = 'none';

            const startTime = performance.now();
            const duration = 800; // Matches your 0.8s CSS transition exactly
            const startScrollLeft = bookshelf.scrollLeft;

            // A smooth math easing function to make the slide look natural (Ease-Out)
            const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

            function trackCenter(currentTime) {
                const elapsed = currentTime - startTime;
                
                // Calculate animation progress from 0 to 1
                let progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeOutCubic(progress);

                // Use BoundingRects to dynamically calculate the exact center 
                // This accounts for the book expanding its width simultaneously via CSS
                const bookshelfRect = bookshelf.getBoundingClientRect();
                const articleRect = article.getBoundingClientRect();
                
                // The absolute coordinate of the book's center on the scroll canvas
                const absoluteArticleCenter = bookshelf.scrollLeft + (articleRect.left - bookshelfRect.left) + (articleRect.width / 2);
                
                // The scroll position required to put that center in the middle of the screen
                const currentTargetScroll = absoluteArticleCenter - (bookshelfRect.width / 2);

                // Slide the scrollbar smoothly between the starting position and target
                bookshelf.scrollLeft = startScrollLeft + (currentTargetScroll - startScrollLeft) * easedProgress;
                
                if (progress < 1) { 
                    // Continue sliding
                    centerAnimationId = window.requestAnimationFrame(trackCenter);
                } else {
                    // Animation complete: clean up and restore CSS snapping
                    bookshelf.scrollLeft = currentTargetScroll;
                    bookshelf.style.scrollBehavior = '';
                    bookshelf.style.scrollSnapType = '';
                    centerAnimationId = null;
                }
            }
            
            centerAnimationId = window.requestAnimationFrame(trackCenter);
        }

        // Event Listeners for clicking dots or books
        dot.addEventListener('click', () => {
            radio.checked = true; 
            updateVisuals(index); // <-- FIX: Instantly update dot visual
            animateToCenter();
        });
        
        label.addEventListener('click', () => {
            updateVisuals(index); // <-- FIX: Instantly update dot visual
            // setTimeout ensures the click registers before we start calculating the center
            setTimeout(animateToCenter, 0);
        });
    });

    // Scroll tracking to update dots when user manually swipes/scrolls
    let scrollRAF;

    bookshelf.addEventListener('scroll', () => {
        // Don't update dots manually while JS is forcing an animation
        if (centerAnimationId) return; 

        window.cancelAnimationFrame(scrollRAF);
        
        scrollRAF = window.requestAnimationFrame(() => {
            const bookshelfRect = bookshelf.getBoundingClientRect();
            const containerCenter = bookshelfRect.left + (bookshelfRect.width / 2);
            
            let closestIndex = 0;
            let minDistance = Infinity;

            articles.forEach((article, index) => {
                const rect = article.getBoundingClientRect();
                const articleCenter = rect.left + (rect.width / 2);
                const distance = Math.abs(containerCenter - articleCenter);
                
                if (distance < minDistance) {
                    minDistance = distance;
                    closestIndex = index;
                }
            });

            // Edge case overrides for very start and very end
            const maxScrollLeft = bookshelf.scrollWidth - bookshelf.clientWidth;
            if (Math.ceil(bookshelf.scrollLeft) >= maxScrollLeft - 2) {
                closestIndex = articles.length - 1;
            }
            if (bookshelf.scrollLeft <= 2) {
                closestIndex = 0;
            }

            updateVisuals(closestIndex);
        });
    });

    // Initialize first dot on page load
    updateVisuals(0);
});
