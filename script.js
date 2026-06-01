
document.addEventListener('DOMContentLoaded', () => {
    const pdfList = document.getElementById('pdf-list');
    const pdfViewer = document.getElementById('pdf-viewer');
    const pdfIframe = document.getElementById('pdf-iframe');
    const closePdfBtn = document.getElementById('close-pdf-btn');

    fetch('pdfs.json')
        .then(response => response.json())
        .then(pdfs => {
            pdfs.forEach(pdf => {
                const button = document.createElement('button');
                button.textContent = pdf.name;
                button.addEventListener('click', () => {
                    pdfIframe.src = `pdfs/${pdf.filename}`;
                    pdfViewer.classList.add('active');
                });
                pdfList.appendChild(button);
            });
        });

    closePdfBtn.addEventListener('click', () => {
        pdfViewer.classList.remove('active');
        pdfIframe.src = '';
    });
});

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

document.addEventListener('DOMContentLoaded', () => {
    fullscreenSlidesOverlay.classList.remove('show-overlay');
});

