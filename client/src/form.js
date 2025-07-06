import { PDFDocument, rgb } from 'pdf-lib';

// Get the selected template from the URL
const params = new URLSearchParams(window.location.search);
const selectedTemplate = params.get('template');

const formBody = document.getElementById("form-body");
const stagesBody = document.getElementById("stages");
const continueButton = document.getElementById("stage-button");
const stageText = document.getElementById("stage-text");

formBody.style.display = 'none';

let stage = 0;
let displayData = []; // will be populated from server
let pdfPath = ''

// Fetch stages from the server
fetch('/api/messages')
  .then(res => res.json())
  .then(data => {
    // Find the entry with a matching title
    const entry = data.find(item => item.title === selectedTemplate);

    if (!entry) {
      stageText.textContent = `No template found for "${selectedTemplate}"`;
      continueButton.disabled = true;
      return;
    }

    pdfPath = "http://localhost:3000" + entry.file?.path;
    if (!pdfPath) {
      throw new Error('No file path found for this template.');
    }

    // Extract stages into displayData array
    const { stage1, stage2, stage3 } = entry.stages;
    displayData = [stage1, stage2, stage3].filter(Boolean); // filter removes empty/null

    // Show the first stage
    stageText.textContent = displayData[stage];
    document.getElementById('formContent').textContent = displayData[displayData.length - 1]
  })
  .catch(err => {
    console.error('Failed to load template data:', err);
    stageText.textContent = 'Error loading data';
    continueButton.disabled = true;
  });

// On button click, cycle through stages
continueButton.addEventListener("click", () => {
  if (stage < displayData.length - 2) {
    stage++;
    stageText.textContent = displayData[stage];
  } else {
    stagesBody.style.display = "none";
    formBody.style.display = "";
    resizeCanvasToDisplaySize(canvas);
  }
});

// Dummy content for now
// const dummyData = {
//   template1: `1. Purpose of the Procedure
// I understand that a colonoscopy is a procedure that allows a physician to examine the inside of my large intestine (colon and rectum) using a long, flexible tube with a camera. It may be performed to investigate symptoms such as bleeding, abdominal pain, or changes in bowel habits, or as a routine screening for colorectal cancer.

// 2. Procedure Description
// During the colonoscopy:
// - The doctor will insert the colonoscope into the rectum to view the colon lining.
// - Air or carbon dioxide may be introduced to improve visibility.
// - Biopsies (tissue samples) may be taken.
// - Polyps (abnormal tissue growths) may be removed for further examination.

// 3. Risks and Complications
// I understand that while colonoscopy is generally safe, potential risks include:
// - Bleeding, especially if a biopsy or polyp removal is performed
// - Perforation (a tear in the colon wall), which may require surgery
// - Infection
// - Reaction to sedatives

// 4. Sedation and Anesthesia
// I acknowledge that sedation will be administered to reduce discomfort. I understand the risks associated with sedation, including drowsiness, allergic reactions, or breathing difficulties.

// 5. Alternatives
// I am aware that alternatives to colonoscopy may include:
// - CT colonography (virtual colonoscopy)
// - Fecal occult blood test (FOBT)
// - Stool DNA test

// However, these may not allow for tissue sampling or polyp removal.

// 6. Consent
// I have had the opportunity to ask questions and all my questions have been answered to my satisfaction.

// I voluntarily consent to undergo a colonoscopy, including the removal of polyps or biopsy if necessary, and the administration of sedation.

// Date: {{DATE}}
// Signature of Patient: ___________________________`,
//   template2: "This is the consent form for Template 2."
// };

const formContent = document.getElementById('formContent');
// const mytemplate = displayData;
// const rendered = mytemplate.replace("{{DATE}}", new Date().toLocaleDateString());
// formContent.textContent = mytemplate;
// formContent.textContent = dummyData[template] || "Unknown template selected.";

// ===== Signature Input Logic =====
const canvas = document.getElementById("signatureCanvas");
const ctx = canvas.getContext("2d");

let drawing = false;

canvas.addEventListener("mousedown", start);
canvas.addEventListener("mouseup", end);
canvas.addEventListener("mouseout", end);
canvas.addEventListener("mousemove", draw);

// Touch support
canvas.addEventListener("touchstart", (e) => start(e.touches[0]));
canvas.addEventListener("touchend", end);
canvas.addEventListener("touchmove", (e) => {
  draw(e.touches[0]);
  e.preventDefault(); // prevent scrolling while signing
});

function getPosition(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function start(e) {
  drawing = true;
  const pos = getPosition(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function draw(e) {
  if (!drawing) return;
  const pos = getPosition(e);
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
}

function end() {
  drawing = false;
}

// Clear button
document.getElementById("clearSignature").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Fix size mismatch
function resizeCanvasToDisplaySize(canvas) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  // Only reset if different
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

// Call this once on page load
resizeCanvasToDisplaySize(canvas);


const saveButton = document.getElementById('savePdf');

async function generateSignedPdf(canvas) {
  console.log(pdfPath)
  const existingPdfBytes = await fetch(pdfPath).then(res => res.arrayBuffer());
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const firstPage = pdfDoc.getPages()[0];

  const pngDataUrl = canvas.toDataURL('image/png');
  console.log(pngDataUrl)
  const pngImage = await pdfDoc.embedPng(pngDataUrl);
  const pngDims = pngImage.scale(0.5);

  firstPage.drawImage(pngImage, {
    x: 50,
    y: 40,
    width: pngDims.width,
    height: pngDims.height
  });

  const today = new Date().toLocaleDateString();
  firstPage.drawText(today, {
    x: 98,
    y: 152,
    size: 12,
    color: rgb(0, 0, 0),
  });

  return await pdfDoc.save();
}

// 🔘 Save to file
saveButton.addEventListener('click', async () => {
  const pdfBytes = await generateSignedPdf(canvas);

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'colonoscopy_signed.pdf';
  link.click();
});

// 📧 Save and open Gmail
document.getElementById('emailPdf').addEventListener('click', async () => {
  const pdfBytes = await generateSignedPdf(canvas);

  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'colonoscopy_signed.pdf';
  link.click();

  alert("Reminder: Please attach the downloaded PDF before sending your email.");

  const recipient = "yourdoctor@example.com";
  const subject = "Colonoscopy Consent Form";
  const body = `Hi,\n\nPlease find my signed consent form attached.\n\nRegards,`;
  const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.open(gmailLink, "_blank");
});

// saveButton.addEventListener('click', async () => {
//   // 1. Fetch existing PDF
//   const existingPdfBytes = await fetch('/templateform.pdf').then(res => res.arrayBuffer());

//   // 2. Create a PDFDocument from it
//   const pdfDoc = await PDFDocument.load(existingPdfBytes);

//   // 3. Get the first page
//   const pages = pdfDoc.getPages();
//   const firstPage = pages[0];

//   // 4. Get canvas as PNG data URL
//   const pngDataUrl = canvas.toDataURL('image/png');

//   // 5. Embed the PNG into the PDF
//   const pngImage = await pdfDoc.embedPng(pngDataUrl);
//   const pngDims = pngImage.scale(0.5); // adjust scale as needed

//   // 6. Draw image onto PDF (positioned near bottom right)
//   firstPage.drawImage(pngImage, {
//     x: 50, // adjust as needed
//     y: 40,
//     width: pngDims.width,
//     height: pngDims.height
//   });

//   // Get today's date as a string
//   const today = new Date().toLocaleDateString(); // e.g. "18/06/2025"

//   // Draw the date on the PDF (adjust coordinates)
//   firstPage.drawText(`${today}`, {
//     x: 98,              // adjust position as needed
//     y: 152,
//     size: 12,
//     color: rgb(0, 0, 0),
//   });

//   // 7. Download the modified PDF
//   const pdfBytes = await pdfDoc.save();

//   const blob = new Blob([pdfBytes], { type: 'application/pdf' });
//   const link = document.createElement('a');
//   link.href = URL.createObjectURL(blob);
//   link.download = 'colonoscopy_signed.pdf';
//   link.click();

//   // // Prompt email
//   // const recipient = "yourdoctor@example.com";
//   // const subject = "Colonoscopy Consent Form";
//   // const body = `Hi,\n\nPlease find my signed consent form attached.\n\nRegards,`;

//   // // Encode values for URL safety
//   // const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

//   // // Open Gmail in a new tab
//   // window.open(gmailLink, "_blank");
// });

// const emailButton = document.getElementById('emailPdf');

// emailButton.addEventListener('click', async () => {
//   // 1. Fetch existing PDF
//   const existingPdfBytes = await fetch('/templateform.pdf').then(res => res.arrayBuffer());

//   // 2. Create a PDFDocument from it
//   const pdfDoc = await PDFDocument.load(existingPdfBytes);

//   // 3. Get the first page
//   const pages = pdfDoc.getPages();
//   const firstPage = pages[0];

//   // 4. Get canvas as PNG data URL
//   const pngDataUrl = canvas.toDataURL('image/png');

//   // 5. Embed the PNG into the PDF
//   const pngImage = await pdfDoc.embedPng(pngDataUrl);
//   const pngDims = pngImage.scale(0.5); // adjust scale as needed

//   // 6. Draw image onto PDF (positioned near bottom right)
//   firstPage.drawImage(pngImage, {
//     x: 50, // adjust as needed
//     y: 40,
//     width: pngDims.width,
//     height: pngDims.height
//   });

//   // Get today's date as a string
//   const today = new Date().toLocaleDateString(); // e.g. "18/06/2025"

//   // Draw the date on the PDF (adjust coordinates)
//   firstPage.drawText(`${today}`, {
//     x: 98,              // adjust position as needed
//     y: 152,
//     size: 12,
//     color: rgb(0, 0, 0),
//   });

//   // 7. Download the modified PDF
//   const pdfBytes = await pdfDoc.save();

//   const blob = new Blob([pdfBytes], { type: 'application/pdf' });
//   const link = document.createElement('a');
//   link.href = URL.createObjectURL(blob);
//   link.download = 'colonoscopy_signed.pdf';
//   link.click();

//   // Show reminder alert BEFORE opening Gmail
//   alert("Reminder: Please attach the downloaded PDF before sending your email.");

//   // Prompt email
//   const recipient = "yourdoctor@example.com";
//   const subject = "Colonoscopy Consent Form";
//   const body = `Hi,\n\nPlease find my signed consent form attached.\n\nRegards,`;

//   // Encode values for URL safety
//   const gmailLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(recipient)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

//   // Open Gmail in a new tab
//   window.open(gmailLink, "_blank");
// });