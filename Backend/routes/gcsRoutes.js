const express = require("express");
const gcsController = require("../controllers/gcsController");
const authMiddleware = require("../middleware/auth");
const gcsRouter = express.Router();

// Test route without authentication
gcsRouter.post("/test", (req, res) => {
  console.log("Test route hit");
  res.json({ message: "Test route working" });
});

// Test audio upload without authentication
gcsRouter.post("/test-audio", (req, res, next) => {
  console.log("Test audio upload route hit");
  gcsController.upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Multer error (test):", err);
      return res.status(400).json({ message: "File upload error", error: err.message });
    }
    console.log("Test audio upload - File:", req.file ? "Present" : "Missing");
    if (req.file) {
      console.log("File details:", {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }
    res.json({ 
      message: "Test audio upload successful", 
      file: req.file ? req.file.originalname : "No file" 
    });
  });
});

// Route for image uploads
gcsRouter.post("/image", authMiddleware, gcsController.upload.single("file"), (req, res) => {
  //   uploadToGCS(req.file, res);
  gcsController.uploadToGCS(req.file, res);
});

// Route for audio uploads
gcsRouter.post("/audio", authMiddleware, (req, res, next) => {
  console.log("Audio upload route hit");
  gcsController.upload.single("file")(req, res, (err) => {
    if (err) {
      console.error("Multer error:", err);
      return res.status(400).json({ message: "File upload error", error: err.message });
    }
    console.log("Audio upload request received");
    console.log("File:", req.file ? "Present" : "Missing");
    console.log("User:", req.user);
    gcsController.uploadToGCS(req.file, res);
  });
});

// Research storage routes
gcsRouter.post(
  "/research/image",
  authMiddleware,
  gcsController.upload.single("file"),
  (req, res) => {
    gcsController.uploadToResearchStorage(req.file, res);
  }
);

gcsRouter.post(
  "/research/audio",
  authMiddleware,
  (req, res, next) => {
    console.log("Research audio upload route hit");
    gcsController.upload.single("file")(req, res, (err) => {
      if (err) {
        console.error("Multer error (research audio):", err);
        return res.status(400).json({ message: "File upload error", error: err.message });
      }
      console.log("Research audio upload request received");
      gcsController.uploadToResearchStorage(req.file, res);
    });
  }
);

// Route for deleting all files
gcsRouter.delete("/delete-all", authMiddleware, async (req, res) => {
  try {
    await gcsController.deleteAllFilesfromRoot();
    res.status(200).send("All files deleted successfully (except for the protected directory).");
  } catch (error) {
    console.error("Error deleting files:", error);
    res.status(500).send("Error deleting files.");
  }
});

module.exports = gcsRouter;
