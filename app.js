// Simple PDF PWA logic using PDF.js and Web Speech API
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.8.162/pdf.worker.min.js';

const pdfSelect = document.getElementById('pdfSelect');
const loadBtn = document.getElementById('loadBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const fromPage = document.getElementById('fromPage');
const toPage = document.getElementById('toPage');
const readBtn = document.getElementById('readBtn');
const canvas = document.getElementById('pdfCanvas');
const ctx = canvas.getContext('2d');
const resultsDiv = document.getElementById('searchResults');

let pdfDoc = null;
let currentUrl = null;
let textCache = {}; // pageNumber -> text

async function loadPdf(url){
  currentUrl = url;
  resultsDiv.textContent = 'Loading...';
  // fetch via CORS-compatible link (Drive direct link). PDF will be cached by service worker.
  const loadingTask = pdfjsLib.getDocument(url);
  pdfDoc = await loadingTask.promise;
  textCache = {};
  await renderPage(1);
  resultsDiv.textContent = `Loaded ${pdfDoc.numPages} pages.`;
}

async function renderPage(pageNum){
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 1.2 });
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  const renderContext = { canvasContext: ctx, viewport };
  await page.render(renderContext).promise;
  // extract text for searching
  const txt = await page.getTextContent();
  const strings = txt.items.map(i => i.str).join(' ');
  textCache[pageNum] = strings;
}

async function searchAll(term){
  resultsDiv.innerHTML = '';
  if(!pdfDoc) return resultsDiv.textContent = 'Load a PDF first.';
  term = term.toLowerCase();
  for(let i=1;i<=pdfDoc.numPages;i++){
    if(!textCache[i]) await loadTextForPage(i);
    if(textCache[i].toLowerCase().includes(term)){
      const hit = document.createElement('div');
      hit.textContent = `Found on page ${i}`;
      hit.style.cursor='pointer';
      hit.onclick = async ()=>{ await renderPage(i); };
      resultsDiv.appendChild(hit);
    }
  }
}

async function loadTextForPage(i){
  const page = await pdfDoc.getPage(i);
  const txt = await page.getTextContent();
  textCache[i] = txt.items.map(it=>it.str).join(' ');
}

function readPages(from, to){
  if(!pdfDoc) return alert('Load a PDF first.');
  from = Math.max(1, Math.floor(from)||1);
  to = Math.min(pdfDoc.numPages, Math.floor(to)||from);
  let combined = '';
  const promises = [];
  for(let i=from;i<=to;i++){
    if(textCache[i]) combined += ' ' + textCache[i];
    else promises.push(loadTextForPage(i));
  }
  Promise.all(promises).then(()=> {
    for(let i=from;i<=to;i++) combined += ' ' + textCache[i];
    speakText(combined);
  });
}

function speakText(text){
  if(!('speechSynthesis' in window)) return alert('Speech synthesis not supported on this browser.');
  const ut = new SpeechSynthesisUtterance(text);
  ut.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(ut);
}

// wire up UI
loadBtn.onclick = ()=> loadPdf(pdfSelect.value);
searchBtn.onclick = ()=> searchAll(searchInput.value.trim());
readBtn.onclick = ()=> readPages(Number(fromPage.value), Number(toPage.value));

// register service worker
if('serviceWorker' in navigator){
  navigator.serviceWorker.register('service-worker.js').catch(()=>console.log('SW fail'));
}

