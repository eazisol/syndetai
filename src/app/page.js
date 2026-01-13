"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RootPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uuid = searchParams?.get("uuid");

  useEffect(() => {
    if (uuid) {
      console.log("RootPage: Redirecting to /product with UUID", uuid);
      router.push(`/product?uuid=${uuid}`);
    } else {
      console.log("RootPage: Redirecting to /product (no UUID)");
      router.push("/login");
    }
  }, [uuid, router]);

  return null;
}

export default function RootPage() {
  return (
    <Suspense fallback={null}>
      <RootPageInner />
    </Suspense>
  );
}
