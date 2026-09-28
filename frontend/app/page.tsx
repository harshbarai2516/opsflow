"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState("Connecting...");


  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">
          Developer Intelligence Platform
        </h1>

        <p className="mt-4 text-lg">
          {status}
        </p>
      </div>
    </main>
  );
}