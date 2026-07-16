"use client";

import { useEffect, useState } from "react";
import { Users, Package, Truck } from "lucide-react";

const TABS = [
  { id: "demografi", label: "Pengungsi", icon: Users },
  { id: "logistik", label: "Logistik", icon: Package },
  { id: "kedatangan", label: "Kedatangan", icon: Truck },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function TabNav() {
  const [active, setActive] = useState<TabId>("demografi");

  useEffect(() => {
    const sections = TABS.map((t) => document.getElementById(t.id)).filter(Boolean) as HTMLElement[];
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActive(visible[0].target.id as TabId);
        }
      },
      { threshold: 0.3, rootMargin: "-80px 0px -40% 0px" }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: TabId) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setActive(id);
  };

  return (
    <div className="sticky top-[73px] z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollTo(tab.id)}
              className={`
                flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-bold transition-all relative
                ${active === tab.id ? "text-blue-600" : "text-slate-400 hover:text-slate-600"}
              `}
            >
              <span className="mb-1"><tab.icon className="w-5 h-5" /></span>
              <span className="tracking-wide uppercase">{tab.label}</span>
              {active === tab.id && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
