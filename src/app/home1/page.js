'use client';

import FaqSection from "@/components/newdesign/FaqSection";
import Footer from "@/components/newdesign/Footer";
import HomeAlt from "@/components/newdesign/HomeAlt";
import Navbar from "@/components/newdesign/Navbar";


export default function HomeOne() {
  return (
   <>
        <Navbar />
          <div className="" >
            <HomeAlt />
            <FaqSection />
            <Footer />
        </div>
    </>
  );
}