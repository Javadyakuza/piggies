'use client';

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";


const ReactSwagger = dynamic(() => import("./react-swagger"), { ssr: false });

export default function IndexPage() {
  const [spec, setSpec] = useState<Record<string, any> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSpec() {
      try {
        const res = await fetch("/api/swagger", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch Swagger spec");
        const data = await res.json();
        setSpec(data);
      } catch (err) {
        console.error("Error fetching Swagger spec:", err);
        setError((err as Error).message);
      }
    }
    fetchSpec();
  }, []);

  if (error) {
    return (
      <section className="container">
        <h1>Error</h1>
        <p>Failed to load API documentation: {error}</p>
      </section>
    );
  }

  if (!spec) {
    return (
      <section className="container">
        <h1>Loading API Documentation...</h1>
      </section>
    );
  }

  return (
    <section className="container">
      <h1>Pig Referral API Documentation</h1>
      <ReactSwagger spec={spec} />
    </section>
  );
}