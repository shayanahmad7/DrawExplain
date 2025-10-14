// const express = require('express');
// const multer = require('multer');
// const { Storage } = require('@google-cloud/storage');
// const path = require('path');

// const router = express.Router();
// const storage = new Storage({ keyFilename: '/Users/irfank/Downloads/ppds-f-24-470a0a2126e6.json' });

// const bucket = storage.bucket('ai-grader-storage');

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
// });

// router.post('/upload', upload.single('file'), async (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).send('No file uploaded.');
//     }

//     const blob = bucket.file(req.file.originalname);
//     const blobStream = blob.createWriteStream({
//       resumable: false,
//       contentType: req.file.mimetype,
//     });

//     blobStream.on('error', (err) => {
//       res.status(500).send({ message: err.message });
//     });

//     blobStream.on('finish', () => {
//       const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
//       res.status(200).send({ publicUrl });
//     });

//     blobStream.end(req.file.buffer);
//   } catch (error) {
//     res.status(500).send({ message: error.message });
//   }
// });

// module.exports = router;

// const express = require('express');
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const path = require("path");

// const router = express.Router();
let storage;
let bucket;

try {
  console.log("Initializing Google Cloud Storage...");
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable is not set");
  }
  
  console.log("GOOGLE_APPLICATION_CREDENTIALS_JSON found, parsing...");
  const credentials = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  console.log("Credentials parsed, creating Storage client...");
  storage = new Storage({ credentials });
  console.log("Storage client created, getting bucket...");
  bucket = storage.bucket("draw-explain-storage");
  console.log("Google Cloud Storage initialized successfully with bucket: draw-explain-storage");
} catch (error) {
  console.error("Failed to initialize Google Cloud Storage:", error.message);
  console.error("Error stack:", error.stack);
  // Create a mock storage for development/testing
  storage = null;
  bucket = null;
}

// Multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // Increased file size limit for audio files (10MB)
    fieldSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer file filter - file:', file.originalname, 'mimetype:', file.mimetype);
    cb(null, true);
  }
});

// Generic upload handler
async function uploadToGCS(file, res) {
  try {
    console.log("uploadToGCS called with file:", file ? file.originalname : "null");
    
    if (!file) {
      console.error("No file uploaded");
      return res.status(400).json({ 
        error: "No file uploaded",
        message: "No file was provided in the request"
      });
    }

    if (!storage || !bucket) {
      console.error("Google Cloud Storage not initialized");
      console.error("Storage:", storage ? "Initialized" : "NULL");
      console.error("Bucket:", bucket ? "Initialized" : "NULL");
      return res.status(500).json({ 
        error: "Storage not configured",
        message: "Google Cloud Storage is not properly configured. Please check GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable.",
        details: {
          storage: storage ? "OK" : "NULL",
          bucket: bucket ? "OK" : "NULL"
        }
      });
    }

    const blob = bucket.file(file.originalname);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    blobStream.on("error", (err) => {
      console.error("GCS upload error:", err);
      console.error("Error details:", {
        code: err.code,
        message: err.message,
        stack: err.stack
      });
      res.status(500).json({ 
        error: "Upload failed",
        message: err.message,
        code: err.code,
        details: "Failed to upload file to Google Cloud Storage"
      });
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      console.log("File uploaded successfully:", publicUrl);
      res.status(200).json({ 
        success: true,
        publicUrl,
        fileName: blob.name
      });
    });

    blobStream.end(file.buffer);
  } catch (error) {
    console.error("Upload error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      error: "Upload failed",
      message: error.message,
      details: "An unexpected error occurred during file upload"
    });
  }
}

// // Route for image uploads
// router.post('/upload/image', upload.single('file'), (req, res) => {
//   uploadToGCS(req.file, res);
// });

// // Route for audio uploads
// router.post('/upload/audio', upload.single('file'), (req, res) => {
//   uploadToGCS(req.file, res);
// });

// module.exports = router;
async function uploadToResearchStorage(file, res) {
  try {
    if (!file) {
      return res.status(400).send("No file uploaded.");
    }

    // Construct the full path with the directory
    const directoryPath = "future_research_storage/";
    const fullPath = `${directoryPath}${file.originalname}`;

    const blob = bucket.file(fullPath);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    blobStream.on("error", (err) => {
      console.error("Upload error:", err);
      res.status(500).send({ message: err.message });
    });

    blobStream.on("finish", () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fullPath}`;
      res.status(200).send({
        message: "Upload successful",
        fileName: file.originalname,
        storagePath: fullPath,
        publicUrl,
      });
    });

    blobStream.end(file.buffer);
  } catch (error) {
    console.error("Upload handler error:", error);
    res.status(500).send({
      message: "Failed to process upload",
      error: error.message,
    });
  }
}

module.exports = {
  uploadToGCS,
  upload,
  uploadToResearchStorage,
};
