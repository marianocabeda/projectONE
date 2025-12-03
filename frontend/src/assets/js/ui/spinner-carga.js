(function () {
    // Reusable global loading spinner component
    // Exposes window.LoadingSpinner.show(message?) and .hide()

    const OVERLAY_ID = 'global-loading-spinner';

    function createOverlay(message) {
        // Avoid duplicates
        if (document.getElementById(OVERLAY_ID)) return;

        const overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.className = 'fixed inset-0 flex items-center justify-center bg-black/20 dark:bg-black/70 backdrop-blur-sm z-[99999]';

        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-dark-bg-secondary p-6 rounded-xl flex gap-4 items-center shadow-2xl dark:shadow-black/50 max-w-[90%] border border-gray-200 dark:border-dark-border-primary';

        const spinnerContainer = document.createElement('div');
        spinnerContainer.className = 'relative w-14 h-14';
        
        const circle = document.createElement('div');
        circle.className = 'absolute inset-0 border-4 border-gray-200 dark:border-dark-border-primary rounded-full';
        
        const spinningCircle = document.createElement('div');
        spinningCircle.className = 'absolute inset-0 border-4 border-transparent border-t-principal-500 dark:border-t-dark-principal-600 rounded-full animate-spin';

        spinnerContainer.appendChild(circle);
        spinnerContainer.appendChild(spinningCircle);

        const text = document.createElement('div');
        text.className = 'text-sm font-medium text-gray-900 dark:text-dark-text-primary';
        text.textContent = message || 'Procesando...';

        card.appendChild(spinnerContainer);
        card.appendChild(text);
        overlay.appendChild(card);

        document.body.appendChild(overlay);
    }

    function removeOverlay() {
        const existing = document.getElementById(OVERLAY_ID);
        if (existing) existing.remove();
    }

    window.LoadingSpinner = {
        show: function(message) {
            try {
                createOverlay(message);
            } catch (e) {
                // swallow to avoid breaking callers
            }
        },
        hide: function() {
            try {
                removeOverlay();
            } catch (e) {}
        }
    };
})();
