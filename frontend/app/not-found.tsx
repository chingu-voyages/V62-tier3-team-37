import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function notFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 md:flex-row md:gap-8">
      <Image
        src="/not-found.svg"
        width={300}
        height={50}
        alt="Not Found"
        className="w-3/4 max-w-xs h-auto md:w-[40%] md:max-w-lg"
      />
      <div className="flex flex-col items-center gap-3 text-center md:items-start md:text-left">
        <h1 className="type-h1">Looks like this page stepped out</h1>
        <p className="type-body text-muted-foreground max-w-md">
          The page you are looking for might have been moved or the address might be incorrect.
          Return to home, search the care directory, or use a quick link below
        </p>
        <Button variant="default" asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}

export default notFound;
