const homeBtn = document.getElementById('home-btn');
const homePage = document.getElementById('home-page');
const openPdfBtn = document.getElementById('open-pdf-btn');
const fullscreenOverlay = document.getElementById('fullscreen-overlay');
const closeBtn = document.getElementById('close-btn');
const openSlidesBtn = document.getElementById('open-slides-btn');
const fullscreenSlidesOverlay = document.getElementById('fullscreen-slides-overlay');
const closeSlidesBtn = document.getElementById('close-slides-btn');

const carouselImages = document.querySelectorAll('.carousel-image');
const nextArrow = document.querySelector('.next-arrow');
let currentImageIndex = 0;

function showImage(index) {
    carouselImages.forEach((img, i) => {
        if (i === index) {
            img.classList.add('active');
        } else {
            img.classList.remove('active');
        }
    });
}

nextArrow.addEventListener('click', () => {
    currentImageIndex = (currentImageIndex + 1) % carouselImages.length;
    showImage(currentImageIndex);
});

homeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    homePage.style.display = 'block';
});

openPdfBtn.addEventListener('click', () => {
    fullscreenOverlay.classList.add('show-overlay');
});

closeBtn.addEventListener('click', () => {
    fullscreenOverlay.classList.remove('show-overlay');
});

openSlidesBtn.addEventListener('click', () => {
    fullscreenSlidesOverlay.classList.add('show-overlay');
});

closeSlidesBtn.addEventListener('click', () => {
    fullscreenSlidesOverlay.classList.remove('show-overlay');
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fullscreenOverlay.classList.remove('show-overlay');
        fullscreenSlidesOverlay.classList.remove('show-overlay');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    fullscreenOverlay.classList.remove('show-overlay');
    fullscreenSlidesOverlay.classList.remove('show-overlay');

    if (carouselImages.length > 0) {
        carouselImages[0].style.opacity = '1';
    }

    showImage(currentImageIndex);
});