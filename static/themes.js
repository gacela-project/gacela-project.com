(function initializeTheme() {
    syncBetweenTabs();
    listenToOSChanges();
    let newTheme = returnThemeBasedOnLocalStorage()
        || returnThemeBasedOnOS()
        || returnThemeBasedOnTime();
    enableTheme(newTheme);
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

// If no preference was set, check what the OS pref is.
function returnThemeBasedOnOS() {
    let mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQueryList.matches) {
        return 'dark';
    }

    mediaQueryList = window.matchMedia('(prefers-color-scheme: light)');
    if (mediaQueryList.matches) {
        return 'light';
    }

    return undefined;
}

// For subsequent page loads
function returnThemeBasedOnLocalStorage() {
    const pref = localStorage.getItem('preference-theme');
    const lastChanged = localStorage.getItem('preference-theme-last-change');
    let now = (new Date()).getTime();
    const minutesPassed = (now - lastChanged) / (1000 * 60);

    if (minutesPassed < 120 && pref === "light") {
        return 'light';
    }

    if (minutesPassed < 120 && pref === "dark") {
        return 'dark';
    }

    return undefined;
}

// Fallback for when OS preference isn't available
function returnThemeBasedOnTime() {
    const hour = (new Date()).getHours();
    if (hour > 20 || hour < 5) {
        return 'dark';
    }

    return 'light';
}

// Switch to another theme
function enableTheme(newTheme = 'light') {
    const root = document.documentElement;
    let otherTheme = (newTheme === 'light') ? 'dark' : 'light';

    root.classList.add('theme-' + newTheme);
    root.classList.remove('theme-' + otherTheme);

    let button = document.getElementById('theme-' + otherTheme + '-button');
    button.classList.add('enabled');
    button.setAttribute('aria-pressed', false);

    button = document.getElementById('theme-' + newTheme + '-button');
    button.classList.remove('enabled');
    button.setAttribute('aria-pressed', true);

    gacelaLogoColor(newTheme);

    saveToLocalStorage('preference-theme', newTheme);
}

// Save the state for subsequent page loads
function saveToLocalStorage(key, value) {
    let now = (new Date()).getTime();
    localStorage.setItem(key, value);
    localStorage.setItem(key + "-last-change", now);
}

function gacelaLogoColor(currentTheme) {
    let svgList = document.querySelectorAll('svg');
    svgList.forEach((svg) => {
        let g = svg.querySelector('g');
        if (g) {
            let svgColor = (currentTheme === 'dark') ? '#448aff' : '#123456';
            g.setAttribute('stroke', svgColor);
        }
    });
}
