const homeBtn = document.getElementById('home-btn');
const homePage = document.getElementById('home-page');
const openPdfBtn = document.getElementById('open-pdf-btn');
const fullscreenOverlay = document.getElementById('fullscreen-overlay');
const closeBtn = document.getElementById('close-btn');
const openSlidesBtn = document.getElementById('open-slides-btn');
const fullscreenSlidesOverlay = document.getElementById('fullscreen-slides-overlay');
const closeSlidesBtn = document.getElementById('close-slides-btn');

homeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    homePage.style.display = 'block';
});

openPdfBtn.addEventListener('click', () => {
    fullscreenOverlay.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    fullscreenOverlay.style.display = 'none';
});

openSlidesBtn.addEventListener('click', () => {
    fullscreenSlidesOverlay.style.display = 'block';
});

closeSlidesBtn.addEventListener('click', () => {
    fullscreenSlidesOverlay.style.display = 'none';
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fullscreenOverlay.style.display = 'none';
        fullscreenSlidesOverlay.style.display = 'none';
    }
});