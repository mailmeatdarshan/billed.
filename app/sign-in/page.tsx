import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { ShaderBackground } from "@/components/auth/shader-background";

export default function SignInPage() {
  return (
    <main className="relative flex min-h-dvh flex-1 items-center justify-center overflow-y-auto bg-[#06070a] p-4 py-10 lg:p-8">
      <div className="hidden md:block">
        <ShaderBackground />
      </div>
      <div className="relative z-10 flex w-full justify-center">
        <Suspense fallback={<div className="min-h-[640px] w-full max-w-[1040px]" />}>
          <AuthForm mode="sign-in" />
        </Suspense>
      </div>
    </main>
  );
}
