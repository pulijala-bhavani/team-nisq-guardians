import { SiteNav } from "@/components/site-nav";
import { SetupClient } from "@/components/setup-client";
import candidatesData from "@/data/candidates.json";
import type { Candidate } from "@/lib/types";

export default function SetupPage() {
  return (
    <main className="app-page">
      <SiteNav />
      <header className="page-intro section-shell">
        <div><span className="section-index">PERSONALIZE THE SESSION</span><h1>Choose a candidate journey.</h1></div>
        <p>The interviewer will prioritize completed missions, revisit higher-attempt concepts, and cover at least four different curriculum days.</p>
      </header>
      <SetupClient candidates={candidatesData.candidates as Candidate[]} />
    </main>
  );
}
