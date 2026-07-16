import { Navbar } from "@/components/home/Navbar";
import { Hero } from "@/components/home/Hero";
import { StatsBanner } from "@/components/home/StatsBanner";
import { HowItWorks } from "@/components/home/HowItWorks";
import { CoreFeatures } from "@/components/home/CoreFeatures";
import { SneakPeekMap } from "@/components/home/SneakPeekMap";
import { Testimonials } from "@/components/home/Testimonials";
import { Footer } from "@/components/home/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Hero />
        <HowItWorks />
        <CoreFeatures />
        <SneakPeekMap />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
}
