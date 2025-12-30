"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MathJaxContext, MathJax } from "better-react-mathjax";
import PracticePageSubheader from "@/components/PracticePageSubheader";
import Canvas from "@/components/Canvas";
import Footer from "@/components/Footer";
import QuestionNavigation from "@/components/QuestionNavigation";
import LearnerHeader from "@/components/LearnerHeader";
import { authenticatedFetch } from "@/app/utils/api";
import Cookies from "js-cookie";

interface QuestionData {
  _id: string;
  question: string;
  answer: string;
  module: string;
}

function LatexQuestion({ question }: { question: string }) {
  return (
    <div className='text-lg mb-4 overflow-x-auto p-4'>
      <MathJax>{`$$${question}$$`}</MathJax>
    </div>
  );
}

export default function PracticePage() {
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const userId = Cookies.get("userId") || "";

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setIsLoading(true);
        const response = await authenticatedFetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://drawexplain-138149752130.europe-west1.run.app'}/api/v1/questions`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: QuestionData[] = await response.json();
        setQuestions(data);

        const storedIndex = localStorage.getItem("currentQuestionIndex");
        if (storedIndex !== null) {
          const parsedIndex = parseInt(storedIndex, 10);
          if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < data.length) {
            setCurrentQuestionIndex(parsedIndex);
          } else {
            setCurrentQuestionIndex(0);
            localStorage.setItem("currentQuestionIndex", "0");
          }
        } else {
          setCurrentQuestionIndex(0);
          localStorage.setItem("currentQuestionIndex", "0");
        }
      } catch (error) {
        console.error("Error loading questions:", error);
        setError("Failed to load questions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    loadQuestions();
  }, []);

  const handleNextQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => {
      const nextIndex = (prevIndex + 1) % questions.length;
      localStorage.setItem("currentQuestionIndex", nextIndex.toString());
      return nextIndex;
    });
  };

  const handlePreviousQuestion = () => {
    setCurrentQuestionIndex((prevIndex) => {
      const previousIndex = (prevIndex - 1 + questions.length) % questions.length;
      localStorage.setItem("currentQuestionIndex", previousIndex.toString());
      return previousIndex;
    });
  };

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>Loading questions...</div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center text-red-500'>{error}</div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <MathJaxContext>
      <div className='min-h-screen bg-gray-100 flex flex-col'>
        <LearnerHeader />
        <div className='flex-grow p-8'>
          <div className='max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden'>
            <PracticePageSubheader />
            <div className='p-6'>
              
              {/* Brief instruction */}
              <div className='mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center'>
                <p className='text-blue-800 text-sm font-medium'>
                  🎙️ Press Start Recording • ✍️ Solve & explain • 🛑 Stop • 📤 Submit
                </p>
              </div>
              
              {currentQuestion && (
                <LatexQuestion
                  key={currentQuestionIndex} // Force re-render of LatexQuestion
                  question={currentQuestion.question}
                />
              )}
              <QuestionNavigation
                onPreviousQuestion={handlePreviousQuestion}
                onNextQuestion={handleNextQuestion}
              />
              {currentQuestion && userId && (
                <Canvas
                  currentQuestion={currentQuestion}
                  userId={userId}
                />
              )}
            </div>
            <br />
          </div>
        </div>
        <Footer />
      </div>
    </MathJaxContext>
  );
}
