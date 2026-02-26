"use client";

import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import { ROUTES } from "src/lib/routes";

export default function MarketingHomePage() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return null; // Prevent hydration mismatch
  }

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex justify-end p-6">
        {isSignedIn ? (
          <UserButton />
        ) : (
          <div className="flex gap-4">
            <Link href={ROUTES.SIGN_IN} className="underline">
              Sign In
            </Link>
            <Link
              href={ROUTES.SIGN_UP}
              className="px-4 py-2 bg-black text-white rounded-md"
            >
              Sign Up
            </Link>
          </div>
        )}
      </header>

      <section className="flex flex-col items-center justify-center flex-1 text-center px-6">
        <h1 className="text-4xl font-bold">Socratic</h1>

        <p className="mt-4 max-w-xl text-lg">
          A question-first AI dialogue system designed to help you clarify
          beliefs, assumptions, and goals.
        </p>

        <div className="mt-8">
          {isSignedIn ? (
            <Link
              href={ROUTES.APP}
              className="px-6 py-3 bg-black text-white rounded-md"
            >
              Go to App
            </Link>
          ) : (
            <Link
              href={ROUTES.SIGN_UP}
              className="px-6 py-3 bg-black text-white rounded-md"
            >
              Try Socratic
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
