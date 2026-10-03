import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main>
      <div className="flex min-h-dvh">
        <div className="flex-1 px-4 py-8 sm:px-6">
          <div className="mb-6 flex justify-end">
            <Link href="/auth" className={buttonVariants()}>
              Log in / Sign up
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Welcome to the Home Page</h1>
          <p className="mt-4 text-lg">This is a sample home page for the application.</p>
        </div>
      </div>
    </main>
  );
}
