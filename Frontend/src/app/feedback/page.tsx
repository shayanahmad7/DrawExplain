"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import { Button } from "@/components/ui/button";
import FeedbackPageSubheader from "@/components/FeedbackPageSubheader";
import FeedbackContent from "@/components/FeedbackContent";
import Footer from "@/components/Footer";
import LearnerHeader from "@/components/LearnerHeader";
import { authenticatedFetch } from "../utils/api";

interface QuestionData {
  _id: string;
  index: number;
  question: string;
  topic: string;
  answer: string;
  ai_solution: string;
}

interface FeedbackData {
  grade: string;
  writtenFeedback: string;
  spokenFeedback: string;
}

const config = {
  loader: { load: ["[tex]/html"] },
  tex: {
    packages: { "[+]": ["html"] },
    inlineMath: [["$", "$"]],
    displayMath: [["$$", "$$"]],
    processEscapes: true,
    processEnvironments: true,
  },
};

export default function FeedbackPage() {
  const router = useRouter();
  const [questionData, setQuestionData] = useState<QuestionData | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const storedFeedback = localStorage.getItem("currentFeedback");
        if (!storedFeedback) {
          throw new Error("No feedback data found in localStorage");
        }

        const feedback: FeedbackData = JSON.parse(storedFeedback);
        setFeedbackData(feedback);

        // Also load questions to get AI solution for this question
        const questionID = localStorage.getItem("questionID");
        const questionResponse = await authenticatedFetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://drawexplainbackend-74788697407.europe-west1.run.app'}/api/v1/questions/`);
        if (!questionResponse.ok) {
          throw new Error(`HTTP error loading questions: ${questionResponse.status}`);
        }

        const questions: QuestionData[] = await questionResponse.json();
        setTotalQuestions(questions.length);

        const storedIndex = localStorage.getItem("currentQuestionIndex");
        if (storedIndex === null) throw new Error("No question index found in localStorage");

        const questionIndex = parseInt(storedIndex, 10);
        if (isNaN(questionIndex) || questionIndex < 0 || questionIndex >= questions.length) {
          throw new Error("Invalid question index");
        }

        const currentQuestion = questions[questionIndex];
        if (!currentQuestion) {
          throw new Error(`Question with index ${questionIndex} not found`);
        }

        if (isMounted) {
          setQuestionData(currentQuestion);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError(`Error loading data. ${err instanceof Error ? err.message : "Please try again."}`);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleTryAnotherQuestion = () => {
    const currentIndex = parseInt(localStorage.getItem("currentQuestionIndex") || "0", 10);
    const nextIndex = (currentIndex + 1) % totalQuestions;
    localStorage.setItem("currentQuestionIndex", nextIndex.toString());
    router.push("/practice");
  };

  if (isLoading) {
    return <div className='p-4'>Loading...</div>;
  }

  if (error) {
    return <div className='text-red-500 p-4'>{error}</div>;
  }

  if (!questionData || !feedbackData) {
    return <div className='p-4'>No data available</div>;
  }

  return (
    <MathJaxContext config={config}>
      <div className='min-h-screen bg-gray-100 flex flex-col'>
        <LearnerHeader />
        <div className='flex-grow p-8'>
          <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden'>
            <FeedbackPageSubheader />
            <div className='p-6 space-y-8'>
              <FeedbackContent
                grade={feedbackData.grade}
                writtenFeedback={feedbackData.writtenFeedback}
                spokenFeedback={feedbackData.spokenFeedback}
              />
              <div className='mt-6'>
                <h3 className='text-lg font-semibold mb-2'>AI Solution:</h3>
                <div className='bg-gray-100 p-4 rounded-md overflow-x-auto'>
                  <MathJax>{questionData.ai_solution}</MathJax>
                </div>
              </div>
              <Button
                onClick={handleTryAnotherQuestion}
                className='w-full bg-blue-600 hover:bg-blue-700 text-white'
              >
                Try Another Question
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </MathJaxContext>
  );
}
