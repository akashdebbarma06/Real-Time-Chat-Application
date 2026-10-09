export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { FaqSection } from "@/components/help/faq-section";

export const metadata: Metadata = {
  title: "Help Center & FAQs",
  description: "Browse frequently asked questions and troubleshooting guides for Aether Chat.",
};

export default function HelpCenterPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <FaqSection />
    </div>
  );
}
