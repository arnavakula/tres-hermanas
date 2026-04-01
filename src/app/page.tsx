import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">Tres Hermanas</h1>
      <p className="text-muted-foreground text-lg">
        Restaurant Scheduling & Operations Hub
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <a href="/login">Get Started</a>
        </Button>
      </div>
    </div>
  );
}
