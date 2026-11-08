import { Navbar } from "@/components/layout/Navbar";
import { Hero } from "@/components/hero/Hero";

export default function HomePage() {
  return (
    <main className="relative min-h-screen bg-azul-profundo text-white overflow-x-hidden">
      <Navbar />
      <Hero />
    </main>
  );
}
