(function () {
    const root = document.documentElement;
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    function syncSystemTheme(event) {
        root.dataset.theme = event.matches ? 'dark' : 'light';
    }

    syncSystemTheme(darkQuery);
    darkQuery.addEventListener?.('change', syncSystemTheme);

    document.addEventListener('DOMContentLoaded', function () {
        if (!document.body.classList.contains('oil-page')) return;

        if (!document.getElementById('topo')) document.body.id = 'topo';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'oil-back-to-top';
        button.setAttribute('aria-label', 'Voltar ao topo');
        button.setAttribute('title', 'Voltar ao topo');
        button.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
        document.body.appendChild(button);

        const goToTop = function () {
            window.scrollTo({ top: 0, left: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
        };
        const syncButton = function () {
            button.classList.toggle('is-visible', window.scrollY > 420);
        };

        button.addEventListener('click', goToTop);
        document.addEventListener('click', function (event) {
            const link = event.target.closest('a[href="#topo"], [data-back-to-top]');
            if (!link) return;
            event.preventDefault();
            goToTop();
        });
        window.addEventListener('scroll', syncButton, { passive: true });
        syncButton();
    });
})();
