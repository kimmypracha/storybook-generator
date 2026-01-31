import { DeployButton } from "@/components/deploy-button";
import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { Hero } from "@/components/hero";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Curico Story Generator</Link>
              <div className="flex items-center gap-2">
                {/* <DeployButton /> */}
              </div>
            </div>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <div className="flex gap-3 items-center justify-end">
                <AuthButton />
                <ThemeSwitcher />
                </div>
              </Suspense>
            )}
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5">
          <Hero />
          <main className="flex-1 flex flex-col gap-6 px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Example Card */}
            <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                This is the Card Title
              </CardTitle>
            </CardHeader>
            <CardContent>
              <img src="https://via.placeholder.com/150" alt="Example Image" />
               Some Card Content
            </CardContent>
          </Card>
            </div>
          </main>
        </div>
      </div>
    </main>
  );
}
