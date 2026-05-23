"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html>
      <body className="flex items-center justify-center min-h-screen bg-[#0F1117]">
        <div className="text-center text-white space-y-4 p-8">
          <h1 className="text-2xl font-bold">Application Error</h1>
          <p className="text-white/60 text-sm max-w-sm mx-auto">
            {error.message ?? "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            className="mt-4 px-4 py-2 bg-[#B45309] text-white text-sm rounded-md hover:bg-[#92400E]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
