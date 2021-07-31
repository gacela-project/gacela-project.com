(function initializeTheme() {
    syncBetweenTabs();
    listenToOSChanges();
}());

// Listen to preference changes. The event only fires in inactive tabs, so theme changes aren't applied twice.
function syncBetweenTabs() {
    window.addEventListener('storage', (e) => {
        if (e.key === 'preference-theme') {
            if (e.newValue === 'light') {
                enableTheme('light');
            } else if (e.newValue === 'dark') {
                enableTheme('dark');
            }
        }
    })
}

// Add a listener in case OS-level preference changes.
function listenToOSChanges() {
    let mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

    mediaQueryList.addListener((m) => {
        const root = document.documentElement;
        if (m.matches !== true) {
            if (!root.classList.contains('theme-light')) {
                enableTheme('light');
            }
        } else if (!root.classList.contains('theme-dark')) {
            enableTheme('dark');
        }
    })
}
