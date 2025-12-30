const fs = require("fs");
const OpenAI = require("openai");
const path = require("path");
const { Storage } = require("@google-cloud/storage");
const questionController = require("./questionController");
const responseController = require("./responseController");

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Google Cloud Storage setup
const storage = new Storage({ credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) });

// Function to list files in the GCS bucket
async function listFilesInBucket(bucketName) {
  const [files] = await storage.bucket(bucketName).getFiles();
  // Return filenames
  return files.map((file) => file.name);
}

// Download file from GCS
async function downloadFileFromGCS(bucketName, srcFilename) {
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(srcFilename);

  const fileExtension = path.extname(srcFilename);
  const fileType = fileExtension === ".png" || fileExtension === ".jpg" ? "image" : "audio";
  const destination = path.resolve(__dirname, `${fileType}${fileExtension}`);

  await file.download({ destination });
  console.log(`File downloaded to ${destination}`);
  return destination;
}

// Delete all files except from protected directory
async function deleteAllFilesfromRoot() {
  const bucketName = "drawexplain_storage";
  const bucket = storage.bucket(bucketName);
  const directoryToSkip = "future_research_storage/";

  try {
    const [files] = await bucket.getFiles();
    console.log(`Found ${files.length} files in bucket ${bucketName}.`);

    for (const file of files) {
      if (file.name.startsWith(directoryToSkip)) {
        console.log(`Skipping deletion of file in protected directory: ${file.name}`);
        continue;
      }

      try {
        await file.delete();
        console.log(`Deleted file: ${file.name}`);
      } catch (error) {
        console.error(`Error deleting file ${file.name}:`, error);
      }
    }

    console.log("File deletion completed (protected directory preserved).");
  } catch (error) {
    console.error("Error listing or deleting files:", error);
  }
}

// Transcribe audio
async function transcribeAudio(audioFilePath) {
  try {
    const transcription = await client.audio.transcriptions.create({
      model: "whisper-1",
      file: fs.createReadStream(audioFilePath),
    });
    return transcription.text;
  } catch (error) {
    console.error(`An error occurred during transcription: ${error}`);
    throw error;
  }
}

// Grade submission
async function gradeSubmission(imagePath, transcription, question, officialAnswer) {
  try {
    const base64Image = fs.readFileSync(imagePath, { encoding: "base64" });

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI grading assistant for a high school and university-level precalculus course. Your role is to objectively and rigorously assess a student's written work (image) and verbal explanation (transcription) for a given math problem. 
    
    ### Your Task:
    Provide a comprehensive assessment that includes:
    1. **An overall letter grade** (A, B, C, D, F with + or - if applicable).
    2. **Detailed feedback** on the student's **written work**.
    3. **Specific feedback** on the student's **verbal explanation**.
    
    ### Grading Criteria:
    Be strict and objective. Follow these criteria to determine the letter grade:
    
    - **A (A+, A, A-)**:  
      - The solution is completely correct with no errors.
      - The student demonstrates a deep understanding of concepts and principles.
      - The reasoning is clear, logical, and well-structured.
      - All steps are justified thoroughly, with no reliance on shortcuts.
      
    - **B (B+, B, B-)**:  
      - Minor errors or inaccuracies that do not affect the overall correctness.
      - Good understanding of concepts, but slight gaps are evident.
      - Logical reasoning with minor lapses in clarity or structure.
      - Adequate explanations, but could be more detailed or thorough.
    
    - **C (C+, C, C-)**:  
      - Noticeable errors or misconceptions, though some correct methodology is present.
      - Basic understanding, but significant gaps or misunderstandings.
      - Flawed or incomplete reasoning.
      - Explanations are vague, incomplete, or overly reliant on rote procedures.
    
    - **D (D+, D, D-)**:  
      - Significant errors or misconceptions throughout the solution.
      - Weak understanding of concepts and principles.
      - Flawed reasoning and minimal explanation.
      - Explanations are unclear or incorrect.
    
    - **F**:  
      - Fundamental errors or a complete misunderstanding of the problem.
      - No clear evidence of understanding.
      - Illogical reasoning or random guessing.
      - No meaningful explanation provided.
    
    ### Feedback Guidelines:
    When providing feedback, ensure you address the following areas:
    
    1. **Conceptual Understanding**:  
       - Identify misconceptions or incorrect assumptions.
       - Explain why certain approaches are correct or incorrect.
    
    2. **Mathematical Reasoning**:  
       - Evaluate the student's logical approach and problem-solving strategy.
       - Highlight flaws in their reasoning process.
    
    3. **Procedural Knowledge**:  
       - Assess the correct application of mathematical operations and techniques.
       - Identify any procedural errors or omissions.
    
    4. **Communication**:  
       - Evaluate the clarity and completeness of the student's explanation.
       - Note if the student relies on shortcuts without proper justification.
    
    ### Important Points:
    - **Highlight Misconceptions**: Point out any misuse of shortcuts or tricks.
    - **Explain the Why**: If the student uses a method incorrectly, explain why it doesn't work and what the correct reasoning is.
    - **Constructive Feedback**: Offer specific suggestions for improvement to help the student understand the material better.
    
    ### Response Format:
    Provide your response as a JSON object in the following format:
    
    \`\`\`json
    {
      "grade": "A letter grade (A, B, C, D, or F, with + or - if applicable)",
      "writtenFeedback": "Detailed feedback on the written solution, including strengths, weaknesses, and suggestions for improvement.",
      "spokenFeedback": "Evaluation of the verbal explanation, including clarity, completeness, and understanding demonstrated."
    }
    \`\`\`
    
    Ensure your response is valid JSON and strictly follows the grading criteria outlined above.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Here is the student's response to a precalculus question.
    
    **Question:** ${question}  
    **Official Answer:** ${officialAnswer}  
    **Student's Verbal Explanation:** ${transcription}
    
    Please analyze the student's written solution (image provided) and verbal explanation, and provide a detailed assessment. Follow the guidelines strictly and ensure the feedback covers all key areas: conceptual understanding, mathematical reasoning, procedural knowledge, and communication.`,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 3200,
    });
    

    let cleanedContent = response.choices[0].message.content;
    cleanedContent = cleanedContent.replace(/```json/g, "").replace(/```/g, "");
    const feedbackObject = JSON.parse(cleanedContent);
    return feedbackObject;
  } catch (error) {
    console.error("An error occurred during grading:", error);
    throw error;
  }
}

// Process Submission
async function processSubmission(bucketName, questionId, userId) {
  try {
    const filenames = await listFilesInBucket(bucketName);

    // Filter files by questionId and userId
    const filteredFilenames = filenames.filter((filename) =>
      filename.startsWith(`${questionId}_${userId}_`)
    );

    const extractTimestamp = (filename) => {
      const match = filename.match(/_(\d{4}-\d{2}-\d{2})_(\d{6})\.(wav|png)$/);
      return match ? `${match[1]}_${match[2]}` : null;
    };
    filteredFilenames.sort((a, b) => {
      const timestampA = extractTimestamp(a);
      const timestampB = extractTimestamp(b);
      return timestampB.localeCompare(timestampA);
    });
    let imageFilename = null;
    let audioFilename = null;

    for (const filename of filteredFilenames) {
      const extension = path.extname(filename);
      if (extension === ".png" || extension === ".jpg") {
        imageFilename = filename;
      } else if (extension === ".mp3" || extension === ".wav") {
        audioFilename = filename;
      }
    }

    if (!imageFilename || !audioFilename) {
      throw new Error("Could not identify both image and audio files in the bucket.");
    }

    const imagePath = await downloadFileFromGCS(bucketName, imageFilename);
    const audioPath = await downloadFileFromGCS(bucketName, audioFilename);

    const transcription = await transcribeAudio(audioPath);

    let question;
    await new Promise((resolve) => {
      questionController.getOneQuestion(
        { params: { question_id: questionId } },
        {
          status: () => ({ json: resolve }),
          send: (error) => {
            console.error(error);
            resolve(null);
          },
        }
      );
    }).then((result) => {
      question = result;
    });

    const officialAnswer = question.ai_solution;

    const feedback = await gradeSubmission(
      imagePath,
      transcription,
      question.question,
      officialAnswer
    );

    console.log("Grading Feedback:", JSON.stringify(feedback, null, 2));

    const req = {
      body: {
        user_id: userId,
        question_id: questionId,
        gpt_written_feedback: feedback.writtenFeedback,
        gpt_spoken_feedback: feedback.spokenFeedback,
        grade: feedback.grade,
      },
    };

    const res = {
      status: (statusCode) => ({
        json: (data) => {
          console.log(`Response saved with status ${statusCode}:`, data);
        },
      }),
    };

    await responseController.createResponse(req, res);
    await deleteAllFilesfromRoot();

    return feedback
    ;
  } catch (error) {
    console.error("An error occurred during submission processing:", error);
    throw error;
  }
}

module.exports = {
  processSubmission,
};
