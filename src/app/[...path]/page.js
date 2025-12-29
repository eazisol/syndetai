import { notFound } from "next/navigation";
import Cards from "@/components/newdesign/Cards";

const KEY = "SYNDET_HOME_2026"; // your secret for now (frontend only)

export default function CatchAllPage({ searchParams }) {
  const k = searchParams?.k || "";

  if (k === KEY) {
    return <Cards />;
  }

  notFound();
}
