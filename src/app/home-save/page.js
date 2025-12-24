'use client';

import FaqSection from "@/components/newdesign/FaqSection";
import HomeAlt from "@/components/newdesign/HomeAlt";
import Navbar from "@/components/newdesign/Nabar";
import Protected from "@/components/Protected";

export default function HomeSave() {
  return (
   <>
        <Navbar />
          <div className="" >
            <HomeAlt />
            <FaqSection />
        </div>
    </>
  );
}