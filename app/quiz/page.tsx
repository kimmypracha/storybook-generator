"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import quizData from "@/lib/quiz-data.json";
import { createClient } from "@/lib/supabase/client"; // Ensure this helper exists

export default function QuizPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  
  const currentStep = quizData.steps[currentStepIdx];
  const [showSummary, setShowSummary] = useState(false);

  const handleNext = (value: string) => {
    const updatedAnswers = { ...answers, [currentStep.id]: value };
    setAnswers(updatedAnswers);
    if (currentStepIdx < quizData.steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      setShowSummary(true);
    }
  };

const handleGenerate = async () => {
  if (Object.keys(answers).length === 0) return; // Prevent empty calls
  
  setIsGenerating(true);
  
  const promptString = Object.entries(answers)
    .map(([key, value]) => `${key}: ${value}`)
    .join(". ");

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      alert("Please sign in to generate a story.");
      return;
    }
    // Wrap in a simple object with the 'prompt' key to match your Deno serve logic
    console.log("Invoking function with prompt:", promptString);
    const { data, error } = await supabase.functions.invoke("storybook-generation", {
      body: { prompt: promptString }
    });

    if (error) throw error;
    
    router.push("/");
    router.refresh();
  } catch (err) {
    console.error("Generation failed:", err);
    // Log more detail if possible
  } finally {
    setIsGenerating(false);
  }
};

  if (showSummary) {
    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-4">Ready for Magic?</h2>
          <div className="text-left bg-slate-50 p-4 rounded-lg mb-8 space-y-2 text-sm">
            {quizData.steps.map((step) => (
              <p key={step.id}>
                <span className="text-muted-foreground uppercase text-[10px] font-bold block">{step.title}</span>
                {answers[step.id] || "Not answered"}
              </p>
            ))}
          </div>
          <button 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-primary text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Writing your story...
              </>
            ) : (
              "Generate My Story"
            )}
          </button>
        </div>
    );
  }

  return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <button 
          onClick={() => currentStepIdx === 0 ? router.back() : setCurrentStepIdx(currentStepIdx - 1)} 
          className="flex items-center gap-2 text-sm text-muted-foreground mb-8 hover:text-foreground"
        >
          <ArrowLeft size={16} /> {currentStepIdx === 0 ? "Back" : "Previous"}
        </button>

        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">{currentStep.title}</h2>
          <p className="text-muted-foreground">{currentStep.description}</p>
        </div>

        <div className="space-y-3">
          {currentStep.type === "selection" ? (
            currentStep.options?.map((opt) => (
              <button 
                key={opt}
                onClick={() => handleNext(opt)}
                className="w-full p-4 border rounded-xl text-left hover:border-primary hover:bg-primary/5 flex justify-between items-center group transition-all"
              >
                {opt}
                <ChevronRight size={18} className="text-muted-foreground opacity-0 group-hover:opacity-100" />
              </button>
            ))
          ) : (
            <div className="space-y-4">
              <textarea 
                autoFocus
                placeholder={currentStep.placeholder}
                className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-primary outline-none min-h-[120px]"
                id="text-input"
              />
              <button 
                onClick={() => {
                  const val = (document.getElementById("text-input") as HTMLTextAreaElement).value;
                  if (val) handleNext(val);
                }}
                className="w-full bg-primary text-white p-4 rounded-xl font-bold"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
  );
}