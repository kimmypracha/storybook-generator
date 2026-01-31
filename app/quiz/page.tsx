"use client";

import { useState , useEffect} from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, ChevronRight, Loader2, CheckCircle2 } from "lucide-react";
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

  const [progress, setProgress] = useState({ total: 0, completed: 0 });
  const [storyId, setStoryId] = useState<string | null>(null);
  const handleNext = (value: string) => {
    const updatedAnswers = { ...answers, [currentStep.id]: value };
    setAnswers(updatedAnswers);
    if (currentStepIdx < quizData.steps.length - 1) {
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      setShowSummary(true);
    }
  };
  // Realtime Listener
  useEffect(() => {
    if (!storyId) return;

    // Subscribe to changes in the 'pages' table for this story
    const channel = supabase
      .channel(`realtime-story-${storyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pages',
          filter: `story_id=eq.${storyId}`,
        },
        (payload) => {
          // Whenever a page status changes from 'pending' to 'completed' (or image_url is set)
          if (payload.new.image_url) {
            setProgress((prev) => ({
              ...prev,
              completed: prev.completed + 1,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storyId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const promptString = Object.entries(answers).map(([k, v]) => `${k}: ${v}`).join(". ");

    try {
      const { data, error } = await supabase.functions.invoke("storybook-generation", {
        body: { prompt: promptString },
      });

      if (error) throw error;

      // The Edge Function returns the storyId and the count of pages it created
      setStoryId(data.storyId);
      setProgress({ total: data.pageCount, completed: 0 });
      
    } catch (err) {
      console.error(err);
      setIsGenerating(false);
    }
  };

  // Calculate percentage
  const percentage = progress.total > 0 
    ? Math.round((progress.completed / progress.total) * 100) 
    : 0;

  if (isGenerating) {
    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          {!storyId ? (
            <div className="space-y-4">
              <Loader2 className="animate-spin mx-auto text-primary" size={48} />
              <h2 className="text-xl font-bold">AI is writing your story...</h2>
              <p className="text-sm text-muted-foreground">This takes about 10-15 seconds.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative w-32 h-32 mx-auto">
                 {/* Circular Progress Placeholder */}
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle className="text-slate-100 stroke-current" strokeWidth="10" fill="transparent" r="40" cx="50" cy="50"/>
                  <circle className="text-primary stroke-current transition-all duration-500 ease-in-out" strokeWidth="10" strokeDasharray={`${percentage * 2.51} 251`} strokeLinecap="round" fill="transparent" r="40" cx="50" cy="50" transform="rotate(-90 50 50)"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xl">
                  {percentage}%
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-bold">Painting Illustrations</h2>
                <p className="text-sm text-muted-foreground">
                  Generated {progress.completed} of {progress.total} pages
                </p>
              </div>

              {percentage === 100 && (
                <button 
                  onClick={() => router.push("/protected")}
                  className="w-full bg-green-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 animate-bounce"
                >
                  <CheckCircle2 size={20} />
                  Read Story Now!
                </button>
              )}
            </div>
          )}
        </div>
    );
  }
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