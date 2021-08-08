document.addEventListener("DOMContentLoaded", _ => {
    gacelaLogoColor()
});

function gacelaLogoColor() {
    let currentTheme = localStorage.theme === 'light'
    || (localStorage.theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches)
        ? 'light' : 'dark';

    let svgList = document.querySelectorAll('svg');
    svgList.forEach((svg) => {
        let g = svg.querySelector('g');
        if (g) {
            let svgColor = (currentTheme === 'dark') ? '#448aff' : '#123456';
            g.setAttribute('stroke', svgColor);
        }
    });
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (localStorage.theme === 'system') {
        if (e.matches) {
            document.documentElement.classList.add('theme-dark');
        } else {
            document.documentElement.classList.remove('theme-dark');
        }
    }
});

window.toDarkMode = function () {
    localStorage.theme = "dark";
    localStorage.setItem('preference-theme', "theme-dark");
    window.updateTheme();
}

window.toLightMode = function () {
    localStorage.theme = "light";
    localStorage.setItem('preference-theme', "theme-light");
    window.updateTheme();
}

window.toSystemMode = function () {
    localStorage.theme = "system";
    localStorage.setItem('preference-theme', "theme-system");
    window.updateTheme();
}

function updateTheme() {
    if (!('theme' in localStorage)) {
        localStorage.theme = 'system';
    }

    switch (localStorage.theme) {
        case 'system':
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.classList.add('theme-dark');
            } else {
                document.documentElement.classList.remove('theme-dark');
            }
            document.documentElement.setAttribute('color-theme', 'system');
            break;

        case 'dark':
            document.documentElement.classList.add('theme-dark');
            document.documentElement.setAttribute('color-theme', 'dark');
            break;

        case 'light':
            document.documentElement.classList.remove('theme-dark');
            document.documentElement.setAttribute('color-theme', 'light');
            break;
    }

    gacelaLogoColor();
}

updateTheme();
