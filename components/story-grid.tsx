"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, X, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StoryGrid({ stories }: { stories: any[] }) {
  const router = useRouter();
  const [selectedStory, setSelectedStory] = useState<any | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const sortedPages = useMemo(() => {
    if (!selectedStory?.pages) return [];
    return [...selectedStory.pages].sort((a, b) => a.page_num - b.page_num);
  }, [selectedStory]);

  const currentPage = sortedPages[currentPageIndex];

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create New Card */}
        <button
          onClick={() => router.push("/quiz")}
          className="group flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[250px]"
        >
          <div className="p-4 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            <Plus size={32} />
          </div>
          <span className="mt-4 font-semibold text-primary">Create New Story</span>
          <p className="text-xs text-muted-foreground mt-1">Take a quiz to start</p>
        </button>

        {/* Story Cards */}
        {stories.map((story) => {
          // Find the image for page 1 to use as the thumbnail
          const coverImage = story.pages?.find((p: any) => p.page_num === 1)?.image_url;

          return (
            <div 
              key={story.id} 
              onClick={() => {
                setSelectedStory(story);
                setCurrentPageIndex(0);
              }}
              className="group cursor-pointer border rounded-xl overflow-hidden bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col"
            >
              <div className="aspect-video bg-muted flex items-center justify-center relative overflow-hidden">
                {coverImage ? (
                  <img 
                    src={coverImage} 
                    alt={story.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
                    <BookOpen size={40} />
                    <span className="text-xs font-medium uppercase tracking-wider">No Cover</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors" />
              </div>

              <div className="p-4 border-t">
                <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                  {story.title}
                </h3>
                <p className="text-sm text-muted-foreground">{story.pages?.length || 0} Pages</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reader Overlay remains the same as before */}
      {selectedStory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
          <button 
            onClick={() => setSelectedStory(null)}
            className="absolute top-6 right-6 p-2 hover:bg-accent rounded-full"
          >
            <X size={24} />
          </button>

          <div className="bg-card border shadow-2xl w-full max-w-3xl rounded-2xl overflow-hidden flex flex-col h-[85vh]">
            <div className="flex-1 bg-muted flex items-center justify-center p-6 overflow-hidden">
                {currentPage?.image_url ? (
                  <img src={currentPage.image_url} alt="Page illustration" className="max-w-full max-h-full object-contain rounded-lg shadow-sm" />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center gap-2">
                    <BookOpen size={48} className="opacity-20" />
                    <p>Illustration for Page {currentPage?.page_num}</p>
                  </div>
                )}
            </div>

            <div className="p-8 bg-card border-t">
              <p className="text-xl font-medium leading-relaxed text-center max-w-2xl mx-auto">
                {currentPage?.content_text}
              </p>
            </div>

            <div className="p-4 border-t flex justify-between items-center bg-accent/20">
              <button 
                onClick={() => setCurrentPageIndex(prev => prev - 1)}
                disabled={currentPageIndex === 0}
                className="flex items-center gap-2 px-4 py-2 disabled:opacity-30 font-medium"
              >
                <ChevronLeft size={20} /> Previous
              </button>
              
              <div className="text-sm font-bold bg-primary/10 text-primary px-4 py-1.5 rounded-full">
                {currentPageIndex + 1} / {sortedPages.length}
              </div>

              <button 
                onClick={() => setCurrentPageIndex(prev => prev + 1)}
                disabled={currentPageIndex === sortedPages.length - 1}
                className="flex items-center gap-2 px-4 py-2 disabled:opacity-30 font-medium"
              >
                Next <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}