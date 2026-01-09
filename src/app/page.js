"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function RootPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const uuid = searchParams?.get("uuid");

  useEffect(() => {
    if (uuid) {
      console.log("RootPage: Redirecting to /product with UUID", uuid);
      // Redirect to /product with UUID
      router.push(`/product?uuid=${uuid}`);
    } else {
      console.log("RootPage: Redirecting to /product (no UUID)");
      // Redirect to /product (which will handle "no param" case -> 404 or Login)
      router.push("/login");
    }
  }, [uuid, router]);

  return (
    <>
      
    </>
  );
}




















// import { redirect } from 'next/navigation';

// export default function RootRedirect() {
//   redirect('/library');
// }
