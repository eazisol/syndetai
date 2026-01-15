
"use client";

import Cards from "@/components/newdesign/Cards";
import CartDrawer from "@/components/newdesign/CartDrawer";
import FaqSection from "@/components/newdesign/FaqSection";
import Footer from "@/components/newdesign/Footer";
import Navbar from "@/components/newdesign/Navbar";
import ValueCards from "@/components/newdesign/ValueCards";


export default function HomePage() {
    return (
        <>
            <Navbar />
            <div className="" >
                <Cards />
                <ValueCards />
                <FaqSection />
                <Footer />
            </div>
        </>
    );
}
