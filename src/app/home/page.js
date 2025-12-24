"use client";

import Protected from "../../components/Protected";
import Cards from "@/components/newdesign/Cards";
import FaqSection from "@/components/newdesign/FaqSection";
import Navbar from "@/components/newdesign/Nabar";
import ValueCards from "@/components/newdesign/ValueCards";


export default function HomePage() {
  return (
   <>
        <Navbar />
          <div className="" >
            <Cards />
            <ValueCards />
            <FaqSection />
        </div>
      </>
  );
}