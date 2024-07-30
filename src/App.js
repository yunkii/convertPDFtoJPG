import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as pdfjsLib from 'pdfjs-dist/webpack';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const App = () => {
  const [canvases, setCanvases] = useState([]);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setFileName(file.name.replace(/\.pdf$/i, ''));
      renderPDF(file);
    } else {
      alert('Please select a valid PDF file.');
    }
  };

  const renderPDF = async (file) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const typedArray = new Uint8Array(reader.result);
      const pdf = await pdfjsLib.getDocument({ data: typedArray }).promise;
      const renderedCanvases = [];

      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
        renderedCanvases.push(canvas);
      }

      setCanvases(renderedCanvases);
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadSingleImage = () => {
    if (canvases.length === 1) {
      const canvas = canvases[0];
      canvas.toBlob((blob) => {
        saveAs(blob, `${fileName}-1.jpg`);
      }, 'image/jpeg');
    }
  };

  const downloadAllAsZip = async () => {
    if (canvases.length > 1) {
      const zip = new JSZip();
      const promises = canvases.map((canvas, index) =>
        new Promise((resolve) => {
          canvas.toBlob((blob) => {
            zip.file(`${fileName}-${index + 1}.jpg`, blob);
            resolve();
          }, 'image/jpeg');
        })
      );

      await Promise.all(promises);
      zip.generateAsync({ type: 'blob' }).then((content) => {
        saveAs(content, `${fileName}.zip`);
      });
    }
  };

  return (
    <div>
      <div className='max-w-xl mx-auto p-4'>
      <h1 className="text-3xl font-bold mb-4 text-center">PDF to JPG Converter without upload</h1>
     <p className='text-center mb-4'>This page allow you to convert your PDF to JPGs without upload it to a server. Everything stored locally in your computer."
</p>
     <div className='flex gap-2 justify-center'>
     <input
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        className="mb-4 p-2 border border-gray-300 rounded"
      />
      <div>
      {canvases.length === 1 && (
        <button
          onClick={downloadSingleImage}
          className="mt-1 p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Download the Image
        </button>
      )}
      {canvases.length > 1 && (
        <button
          onClick={downloadAllAsZip}
          className="mt-1 p-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Download All in .zip
        </button>
      )}

      </div>


      </div>

     </div>
     
     



      <div id="output" className="space-y-4">
        {canvases.map((canvas, index) => (
          <div key={index} className="space-y-2">
            <h3 className="text-lg font-semibold">Page {index + 1}</h3>
            <img src={canvas.toDataURL('image/jpeg')} alt={`Page ${index + 1}`} className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;
