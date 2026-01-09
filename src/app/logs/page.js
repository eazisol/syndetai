"use client";

import React, { Suspense } from "react";
import LogsDetailed from "@/components/LogsDetailed";

export default function Logs() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LogsDetailed />
    </Suspense>
  );
}
