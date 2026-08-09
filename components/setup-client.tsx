"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Candidate, InterviewApiResponse, StoredSession } from "@/lib/types";

function initials(name: string) { return name.split(/\s+/).map((part) => part[0]).join("").slice(0,2).toUpperCase(); }
function makeId() { return globalThis.crypto?.randomUUID?.() ?? `ab-${Date.now()}-${Math.random().toString(36).slice(2)}`; }

export function SetupClient({ candidates }: { candidates: Candidate[] }) {
  const router = useRouter();
  const [query,setQuery] = useState("");
  const [selected,setSelected] = useState<Candidate>(candidates[0]);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");
  const filtered = useMemo(() => candidates.filter((candidate) => `${candidate.member.name} ${candidate.member.jobRole}`.toLowerCase().includes(query.toLowerCase())),[candidates,query]);
  const passed = selected.missions.filter((mission) => mission.passed);
  const difficult = [...passed].sort((a,b) => (b.attempts ?? 1) - (a.attempts ?? 1)).slice(0,4);

  async function start() {
    setLoading(true);setError("");
    const sessionId = makeId();
    try {
      const response = await fetch("/api/interview", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({sessionId,candidate:selected}) });
      const data = await response.json() as InterviewApiResponse;
      if (!response.ok) throw new Error(data.reply || "Unable to start the interview.");
      const stored: StoredSession = { sessionId, candidate:selected, startedAt:Date.now(), questionCount:1, daysCovered:data.meta?.daysCovered ?? [], messages:[{id:makeId(),role:"agent",content:data.reply,meta:data.meta}] };
      localStorage.setItem("abtalks-interview-session",JSON.stringify(stored));
      localStorage.removeItem("abtalks-final-report");
      router.push("/interview");
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to start the interview."); setLoading(false); }
  }

  return (
    <section className="setup-grid section-shell">
      <div className="candidate-panel app-card">
        <div className="panel-heading"><h2>Candidate profiles</h2><span>{filtered.length} available</span></div>
        <label><span className="room-label">SEARCH BY NAME OR ROLE</span><input className="search-input" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Search candidate profiles…" /></label>
        <div className="candidate-list">
          {filtered.map((candidate) => (
            <button key={candidate.member.id} className={`candidate-card ${selected.member.id===candidate.member.id?"selected":""}`} onClick={()=>setSelected(candidate)} aria-pressed={selected.member.id===candidate.member.id}>
              <span className="avatar">{initials(candidate.member.name)}</span>
              <div><strong>{candidate.member.name}</strong><small>{candidate.member.jobRole} · {candidate.member.yearsExperience} yrs</small></div>
              {selected.member.id===candidate.member.id && <span className="check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <aside className="setup-summary app-card">
        <div className="profile-large"><span className="avatar">{initials(selected.member.name)}</span><div><h2>{selected.member.name}</h2><p>{selected.member.jobRole} · {selected.member.education}</p></div></div>
        <div className="signal-grid">
          <div><strong>{selected.signals.missionsCompleted}</strong><span>Missions</span></div>
          <div><strong>{selected.signals.commitDays}</strong><span>Commit days</span></div>
          <div><strong>{selected.signals.missionsFirstTry}</strong><span>First try</span></div>
        </div>
        <div className="mission-preview"><p>Likely focus areas</p><div className="mission-tags">{difficult.map((mission)=><span className={(mission.attempts??1)>=3?"hard":""} key={mission.day}>Day {mission.day} · {mission.title}</span>)}</div></div>
        <div className="context-block"><span className="context-chip">STANDARD INTERVIEW</span><strong>8 adaptive questions · 4+ curriculum days</strong><p>About 15–20 minutes. The agent will ask follow-ups and produce structured feedback at completion.</p></div>
        <p className="start-note"><b>◎</b><span>Live scores stay hidden during the interview so the experience feels like a real conversation.</span></p>
        {error && <p className="room-error" role="alert">{error}</p>}
        <button className="button button-primary full-width" onClick={start} disabled={loading}>{loading?"Preparing your interview…":"Begin personalized interview"}<span>↗</span></button>
      </aside>
    </section>
  );
}
