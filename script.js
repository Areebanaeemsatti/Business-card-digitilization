const cameraInput = document.getElementById("cameraInput");
const uploadInput = document.getElementById("uploadInput");
const preview = document.getElementById("preview");
const result = document.getElementById("result");
const loader = document.getElementById("loader");

// Webcam Elements
const webcamModal = document.getElementById("webcamModal");
const webcam = document.getElementById("webcam");
const captureBtn = document.getElementById("captureBtn");
const closeWebcam = document.getElementById("closeWebcam");
let webcamStream = null;

function handleImageUpload(input) {
  const files = input.files;
  if (!files || files.length === 0) return;

  // Clear UI
  preview.innerHTML = "";
  result.innerHTML = "";
  preview.style.opacity = "1";
  loader.style.display = "flex";

  const formData = new FormData();

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    formData.append("images", file);

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      preview.appendChild(img);
    };
    reader.readAsDataURL(file);
  }

  fetch("/ocr", {
    method: "POST",
    body: formData,
  })
    .then((res) => res.json())
    .then((results) => {
      loader.style.display = "none";
      if (results.length) {
        results.forEach((res, idx) => {
          const container = document.createElement("div");
          container.className = "info-block";

          if (res.data) {
            const d = res.data;
            container.innerHTML = `
              <div class="success-tick">✅ Extraction Successful</div>
              <h3>📄 Extracted from Image ${idx + 1}</h3>
              <p><strong>Name:</strong> ${d.name || "-"}</p>
              <p><strong>Email:</strong> ${d.email || "-"}</p>
              <p><strong>Phone:</strong> ${d.phone || "-"}</p>
              <p><strong>Address:</strong> ${d.address || "-"}</p>
              <p><strong>Profession:</strong> ${d.profession || "-"}</p>
              <hr>
            `;
          } else {
            container.innerHTML = `<p>❌ Failed: ${res.error || "Unknown error"}</p>`;
          }

          result.appendChild(container);
        });

        // Scroll to result
        setTimeout(() => {
          result.scrollIntoView({ behavior: "smooth" });
        }, 200);
      } else {
        result.innerHTML = "<p>❌ No data returned from server.</p>";
      }
    })
    .catch((err) => {
      loader.style.display = "none";
      console.error("OCR Error:", err);
      result.innerHTML = "<p>⚠️ Error sending images.</p>";
    });
}

// Handle Upload Input
uploadInput.addEventListener("change", function () {
  handleImageUpload(this);
});

// Handle Camera Input (Mobile)
cameraInput.addEventListener("change", function () {
  handleImageUpload(this);
});

// Open webcam modal (Laptop/Desktop)
document.querySelector(".camera-btn").addEventListener("click", function (e) {
  e.preventDefault();
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
      webcamStream = stream;
      webcam.srcObject = stream;
      webcamModal.style.display = "flex";
    })
    .catch(err => {
      alert("Camera not accessible.");
      console.error(err);
    });
});

// Capture from webcam
captureBtn.addEventListener("click", () => {
  const canvas = document.createElement("canvas");
  canvas.width = webcam.videoWidth;
  canvas.height = webcam.videoHeight;
  canvas.getContext("2d").drawImage(webcam, 0, 0, canvas.width, canvas.height);
  canvas.toBlob(blob => {
    const file = new File([blob], "webcam.jpg", { type: "image/jpeg" });
    const dt = new DataTransfer();
    dt.items.add(file);
    uploadInput.files = dt.files;
    handleImageUpload(uploadInput);
  });
  closeWebcamModal();
});

// Close webcam
closeWebcam.addEventListener("click", closeWebcamModal);

function closeWebcamModal() {
  webcamModal.style.display = "none";
  if (webcamStream) {
    webcamStream.getTracks().forEach(track => track.stop());
    webcam.srcObject = null;
  }
}
