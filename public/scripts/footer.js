document.addEventListener('DOMContentLoaded', function() {
    const footer = document.querySelector('footer');
    const main = document.querySelector('main');

    function checkFooterVisibility() {
        const scrollPosition = main.scrollTop + main.clientHeight;
        const scrollHeight = main.scrollHeight;

        if (scrollPosition >= scrollHeight - 50) {
            footer.classList.add('visible');
        } else {
            footer.classList.remove('visible');
        }
    }

    checkFooterVisibility();

    main.addEventListener('scroll', checkFooterVisibility);
});