
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
                    pdfViewer.style.display = 'block';
                });
                pdfList.appendChild(button);
            });
        });

    closePdfBtn.addEventListener('click', () => {
        pdfViewer.style.display = 'none';
        pdfIframe.src = '';
    });
});
