import { UserButton } from "@clerk/nextjs";

export default function AppHomePage() {
  return (
    <main className="p-6">
      <div className="flex justify-end">
        <UserButton />
      </div>

      <h1 className="mt-8 text-2xl font-semibold">
        Socratic Authenticated Shell
      </h1>
    </main>
  );
}
