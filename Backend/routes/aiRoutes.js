const express = require("express");
const aiController = require("../controllers/aiController");
const authMiddleware = require("../middleware/auth");

const aiRouter = express.Router();

aiRouter.post("/question", authMiddleware, async (req, res) => {
  try {
    const { questionId, userId } = req.body;
    if (!questionId || !userId) {
      return res.status(400).json({ message: "Missing questionId or userId." });
    }

    // Call processSubmission and get feedback
    const feedback = await aiController.processSubmission("drawexplain-storage", questionId, userId);

    // feedback should be an object with { grade, writtenFeedback, spokenFeedback }
    // Return the feedback immediately to the frontend
    return res.status(200).json(feedback);
  } catch (error) {
    console.error("Error processing submission:", error);
    return res.status(500).json({ error: "An error occurred while processing the submission." });
  }
});

module.exports = aiRouter;
