import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { Suspense } from "react";
import StoryGrid from "@/components/story-grid";

async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/auth/login");
  }

  const { data: stories } = await supabase
    .from("stories")
    .select("*, pages(*)")
    .eq("uid", data.claims.sub)
    .order('created_at', { ascending: false });

  if (!stories || stories.length === 0) {
    return <div><p className="text-muted-foreground py-8 text-center">No stories found yet. Start creating!</p>
    <StoryGrid stories={[]} /></div>;
  }

  // Passing the raw stories array to the client component
  return <StoryGrid stories={stories} />;
}

export default function ProtectedPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-12 p-4 max-w-7xl mx-auto">      
      <div className="flex flex-col gap-6 items-start w-full">
        <h2 className="font-bold text-3xl tracking-tight">Your Storybook</h2>
        <Suspense fallback={<div className="w-full h-48 animate-pulse bg-gray-100 rounded-lg" />}>
          <UserDetails />
        </Suspense>
      </div>
    </div>
  );
}