
const openSlidesBtn = document.getElementById('open-slides-btn');
const fullscreenSlidesOverlay = document.getElementById('fullscreen-slides-overlay');
const closeSlidesBtn = document.getElementById('close-slides-btn');





openSlidesBtn.addEventListener('click', () => {
    fullscreenSlidesOverlay.classList.add('show-overlay');
});

closeSlidesBtn.addEventListener('click', () => {
    fullscreenSlidesOverlay.classList.remove('show-overlay');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fullscreenSlidesOverlay.classList.remove('show-overlay');
    }
});

<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', () => {
    fullscreenSlidesOverlay.classList.remove('show-overlay');
=======
document.addEventListener('DOMContentLoaded', () => {
    fullscreenSlidesOverlay.classList.remove('show-overlay');
>>>>>>> d64c7bfdaf1f67ae645dca49e798cb29cc0210cd
});