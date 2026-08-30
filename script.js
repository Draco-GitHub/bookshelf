document.addEventListener("DOMContentLoaded", () => {
    const container = document.getElementById('bookshelf-container');
    const bookshelf = document.getElementById('bookshelf');
    const articles = Array.from(bookshelf.querySelectorAll('article'));

    bookshelf.classList.add('js-active');

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

    articles.forEach((article, index) => {
        const dot = document.createElement('span');
        dot.className = 'dot';
        paginationTrack.appendChild(dot);
        dots.push(dot);

        dot.addEventListener('click', () => {
            const radio = article.querySelector('input[type="radio"]');
            radio.checked = true; 
            article.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
        
        article.querySelector('label[for^="radio-"]').addEventListener('click', () => {
            article.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
    });

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

        if (dots.length > MAX_VISIBLE_DOTS) {
            let offset = Math.max(0, Math.min(activeIndex - 2, dots.length - MAX_VISIBLE_DOTS));
            const translateX = -(offset * (DOT_WIDTH + DOT_GAP));
            paginationTrack.style.transform = `translateX(${translateX}px)`;
        }
    }

    let scrollRAF;
    let scrollEndTimeout;

    bookshelf.addEventListener('scroll', () => {
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

            const maxScrollLeft = bookshelf.scrollWidth - bookshelf.clientWidth;
            if (Math.ceil(bookshelf.scrollLeft) >= maxScrollLeft - 2) {
                closestIndex = articles.length - 1;
            }
            if (bookshelf.scrollLeft <= 2) {
                closestIndex = 0;
            }

            updateVisuals(closestIndex);

            window.clearTimeout(scrollEndTimeout);
            scrollEndTimeout = window.setTimeout(() => {
                const radio = articles[closestIndex].querySelector('input[type="radio"]');
                if (radio && !radio.checked) {
                    radio.checked = true;
                    articles[closestIndex].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                }
            }, 150);
        });
    });

    updateVisuals(0);
});