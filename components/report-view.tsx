"use client";

import Link from "next/link";
import { useEffect,useState } from "react";
import type { Candidate,Feedback } from "@/lib/types";

type Report={feedback:Feedback;candidate:Candidate;sessionId:string;completedAt:number;duration:number;daysCovered:number[]};
function formatDuration(seconds:number){const minutes=Math.max(1,Math.round(seconds/60));return `${minutes} min`}

export function ReportView(){
  const [report,setReport]=useState<Report|null>(null);const [ready,setReady]=useState(false);
  useEffect(()=>{try{const raw=localStorage.getItem("abtalks-final-report");if(raw)setReport(JSON.parse(raw) as Report)}finally{setReady(true)}},[]);
  if(!ready)return null;
  if(!report)return <section className="no-session section-shell"><div className="app-card"><span className="section-index">NO REPORT YET</span><h1>Complete an interview to unlock feedback.</h1><p>Your final report will include a summary, strengths, gaps, and focused next actions.</p><Link className="button button-primary" href="/setup">Start an interview <span>→</span></Link></div></section>;
  const score=Math.max(58,Math.min(94,72+report.feedback.strengths.length*5-report.feedback.gaps.length*2));
  return <>
    <header className="page-intro section-shell"><div><span className="section-index">INTERVIEW COMPLETE</span><h1>Your readiness report.</h1></div><p>Personalized feedback for {report.candidate.member.name}, grounded in {report.daysCovered.length} curriculum days and the complete interview conversation.</p></header>
    <section className="report-layout section-shell">
      <aside className="readiness-card app-card">
        <span className="section-index">TECHNICAL READINESS</span>
        <div className="score-ring" style={{"--score":`${score}%`} as React.CSSProperties}><div><strong>{score}</strong><small>OUT OF 100</small></div></div>
        <h2>{score>=80?"Strong interview signal":"Developing interview signal"}</h2>
        <p>{report.candidate.member.name} · {report.candidate.member.jobRole}</p>
        <div className="signal-grid"><div><strong>8</strong><span>Questions</span></div><div><strong>{report.daysCovered.length}</strong><span>Days</span></div><div><strong>{formatDuration(report.duration)}</strong><span>Duration</span></div></div>
        <div className="mission-tags">{report.daysCovered.map((day)=><span key={day}>Day {day}</span>)}</div>
      </aside>
      <div className="report-content">
        <article className="report-section app-card"><h2><span>◎</span>Executive summary</h2><p>{report.feedback.summary}</p></article>
        <div className="report-columns">
          <article className="report-section app-card"><h2><span>↗</span>Demonstrated strengths</h2><ul className="report-list">{report.feedback.strengths.map((item,index)=><li key={item}><i>{index+1}</i>{item}</li>)}</ul></article>
          <article className="report-section app-card"><h2><span>△</span>Knowledge gaps</h2><ul className="report-list">{report.feedback.gaps.map((item,index)=><li key={item}><i>{index+1}</i>{item}</li>)}</ul></article>
        </div>
        <article className="report-section app-card"><h2><span>→</span>Your next three moves</h2><ul className="report-list">{report.feedback.next.map((item,index)=><li key={item}><i>{String(index+1).padStart(2,"0")}</i>{item}</li>)}</ul></article>
        <div className="report-actions"><Link className="button button-primary" href="/setup" onClick={()=>localStorage.removeItem("abtalks-interview-session")}>Practise with another profile <span>↗</span></Link><Link className="button button-quiet" href="/">Return to overview</Link></div>
      </div>
    </section>
  </>
}
