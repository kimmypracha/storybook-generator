import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();

  // 1. Check if user is already logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 2. Redirect to protected if they are authenticated
  if (user) {
    return redirect("/protected");
  }

  return (
    <main className="min-h-screen flex flex-col items-center bg-slate-50 dark:bg-transparent">
      <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 bg-background">
        <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
          <div className="flex gap-5 items-center font-semibold">
            <Link href={"/"} className="flex items-center gap-2">
              <BookOpen className="text-primary" size={20} />
              Curico Story Generator
            </Link>
          </div>
          <ThemeSwitcher />
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl p-5">
        <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-3xl font-bold tracking-tight">
              Welcome Back
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Log in to start creating magic stories for your kids
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-10 gap-6">
            <div className="bg-primary/5 p-6 rounded-full mb-4">
               <BookOpen size={48} className="text-primary animate-pulse" />
            </div>
            
            {/* The AuthButton contains the Login/Sign-in logic */}
            <div className="w-full scale-125 flex justify-center">
              <AuthButton />
            </div>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              By signing in, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>

      <footer className="w-full p-8 text-center text-xs text-muted-foreground border-t">
        Powered by Curico AI & Supabase
      </footer>
    </main>
  );
}