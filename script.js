let pdfDoc = null;
let currentFile = "file1.pdf";

const canvas = document.getElementById("pdfCanvas");
const ctx = canvas.getContext("2d");

document.getElementById("fileSelect").addEventListener("change", function() {
    currentFile = this.value;
    loadPDF(currentFile);
});

function loadPDF(file) {
    pdfjsLib.getDocument(file).promise.then(function(pdf) {
        pdfDoc = pdf;
        renderPage(1);
    });
}

function renderPage(num) {
    pdfDoc.getPage(num).then(function(page) {
        const viewport = page.getViewport({ scale: 1.5 });

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport
        };

        page.render(renderContext);
    });
}

// Load first PDF
loadPDF(currentFile);

// 🔍 REAL SEARCH
async function searchText() {
    let keyword = document.getElementById("searchBox").value.toLowerCase();
    let resultText = "";

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        let page = await pdfDoc.getPage(i);
        let content = await page.getTextContent();

        let text = content.items.map(item => item.str).join(" ").toLowerCase();

        if (text.includes(keyword)) {
            resultText += "Found on page " + i + "<br>";
        }
    }

    document.getElementById("searchResult").innerHTML = resultText || "Not found";
}

// 🔊 REAL READ ALOUD
async function readPages() {
    let start = parseInt(document.getElementById("startPage").value);
    let end = parseInt(document.getElementById("endPage").value);

    let fullText = "";

    for (let i = start; i <= end; i++) {
        let page = await pdfDoc.getPage(i);
        let content = await page.getTextContent();

        let text = content.items.map(item => item.str).join(" ");
        fullText += text + " ";
    }

    let speech = new SpeechSynthesisUtterance(fullText);
    speech.lang = "en-US";

    window.speechSynthesis.speak(speech);
}