// main.js
document.addEventListener("DOMContentLoaded", function () {
  const fileInput = document.getElementById("file-input");
  const selectFileBtn = document.getElementById("select-file-btn");
  const dropArea = document.getElementById("drop-area");
  const previewContainer = document.getElementById("preview-container");
  const loadingElement = document.getElementById("loading");
  const errorContainer = document.getElementById("error-container");

  let currentPDF = null;
  let currentPage = 1;
  let numPages = 0;

  // Tombol pilih file
  selectFileBtn.addEventListener("click", function () {
    fileInput.click();
  });

  // Deteksi perubahan pada input file
  fileInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      processFile(file);
    } else if (file) {
      showError("File harus berformat PDF");
    }
  });

  // Fungsi drag and drop
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ["dragenter", "dragover"].forEach((eventName) => {
    dropArea.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropArea.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropArea.style.borderColor = "#2ecc71";
    dropArea.style.backgroundColor = "#e8f8f5";
  }

  function unhighlight() {
    dropArea.style.borderColor = "#3498db";
    dropArea.style.backgroundColor = "#f7fbfe";
  }

  dropArea.addEventListener("drop", function (e) {
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      processFile(file);
    } else if (file) {
      showError("File harus berformat PDF");
    }
  });

  // Proses file PDF
  function processFile(file) {
    showLoading();
    clearError();

    const fileReader = new FileReader();

    fileReader.onload = function () {
      const typedArray = new Uint8Array(this.result);

      // Menggunakan PDF.js untuk membuka file PDF
      pdfjsLib
        .getDocument(typedArray)
        .promise.then(function (pdf) {
          currentPDF = pdf;
          numPages = pdf.numPages;
          currentPage = 1;

          renderPage(currentPage);
        })
        .catch(function (error) {
          hideLoading();
          showError("Gagal memproses PDF: " + error.message);
        });
    };

    fileReader.onerror = function () {
      hideLoading();
      showError("Gagal membaca file.");
    };

    fileReader.readAsArrayBuffer(file);
  }

  // Render halaman PDF
  function renderPage(pageNumber) {
    showLoading();

    currentPDF
      .getPage(pageNumber)
      .then(function (page) {
        // Mendapatkan skala yang tepat
        const viewport = page.getViewport({ scale: 1.5 });

        // Membuat canvas untuk render PDF
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        // Render PDF ke canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        page
          .render(renderContext)
          .promise.then(function () {
            previewContainer.innerHTML = "";

            // Menampilkan gambar hasil render
            const imgData = canvas.toDataURL("image/png");

            // Membuat elemen kontrol halaman jika PDF memiliki lebih dari 1 halaman
            if (numPages > 1) {
              const pageControls = document.createElement("div");
              pageControls.className = "page-controls";

              const prevBtn = document.createElement("button");
              prevBtn.className = "page-btn";
              prevBtn.textContent = "Sebelumnya";
              prevBtn.disabled = pageNumber === 1;
              prevBtn.addEventListener("click", function () {
                if (currentPage > 1) {
                  currentPage--;
                  renderPage(currentPage);
                }
              });

              const pageNum = document.createElement("span");
              pageNum.id = "page-num";
              pageNum.textContent = `Halaman ${pageNumber} dari ${numPages}`;

              const nextBtn = document.createElement("button");
              nextBtn.className = "page-btn";
              nextBtn.textContent = "Selanjutnya";
              nextBtn.disabled = pageNumber === numPages;
              nextBtn.addEventListener("click", function () {
                if (currentPage < numPages) {
                  currentPage++;
                  renderPage(currentPage);
                }
              });

              pageControls.appendChild(prevBtn);
              pageControls.appendChild(pageNum);
              pageControls.appendChild(nextBtn);

              previewContainer.appendChild(pageControls);
            }

            // Tampilkan gambar preview
            const img = document.createElement("img");
            img.src = imgData;
            img.className = "preview-image";
            img.alt = "Preview PDF halaman " + pageNumber;
            previewContainer.appendChild(img);

            // Tombol download
            const downloadLink = document.createElement("a");
            downloadLink.href = imgData;
            downloadLink.download = `halaman-${pageNumber}.png`;
            downloadLink.className = "download-btn";
            downloadLink.textContent = "Unduh Gambar";
            previewContainer.appendChild(downloadLink);

            hideLoading();
          })
          .catch(function (error) {
            hideLoading();
            showError("Gagal merender halaman PDF: " + error.message);
          });
      })
      .catch(function (error) {
        hideLoading();
        showError("Gagal memuat halaman PDF: " + error.message);
      });
  }

  function showLoading() {
    loadingElement.style.display = "block";
  }

  function hideLoading() {
    loadingElement.style.display = "none";
  }

  function showError(message) {
    errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
  }

  function clearError() {
    errorContainer.innerHTML = "";
  }
});
