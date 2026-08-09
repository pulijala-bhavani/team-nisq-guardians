"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { InterviewApiResponse, StoredSession } from "@/lib/types";

function initials(name:string){return name.split(/\s+/).map((part)=>part[0]).join("").slice(0,2).toUpperCase()}
function formatTime(seconds:number){return `${String(Math.floor(seconds/60)).padStart(2,"0")}:${String(seconds%60).padStart(2,"0")}`}
function makeId(){return globalThis.crypto?.randomUUID?.()??`ab-${Date.now()}-${Math.random().toString(36).slice(2)}`}

export function InterviewRoom(){
  const router=useRouter();
  const [session,setSession]=useState<StoredSession|null>(null);
  const [input,setInput]=useState("");
  const [sending,setSending]=useState(false);
  const [error,setError]=useState("");
  const [elapsed,setElapsed]=useState(0);
  const [ready,setReady]=useState(false);
  const messagesRef=useRef<HTMLDivElement>(null);

  useEffect(()=>{try{const raw=localStorage.getItem("abtalks-interview-session");if(raw)setSession(JSON.parse(raw) as StoredSession)}finally{setReady(true)}},[]);
  const startedAt=session?.startedAt;
  useEffect(()=>{if(!startedAt)return;const timer=setInterval(()=>setElapsed(Math.floor((Date.now()-startedAt)/1000)),1000);return()=>clearInterval(timer)},[startedAt]);
  useEffect(()=>{if(messagesRef.current)messagesRef.current.scrollTop=messagesRef.current.scrollHeight},[session?.messages,sending]);

  async function send(){
    const answer=input.trim();if(!answer||!session||sending)return;
    const userMessage={id:makeId(),role:"user" as const,content:answer};
    const optimistic={...session,messages:[...session.messages,userMessage]};
    setSession(optimistic);setInput("");setSending(true);setError("");
    try{
      const response=await fetch("/api/interview",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sessionId:session.sessionId,message:answer})});
      const data=await response.json() as InterviewApiResponse;
      if(!response.ok)throw new Error(data.reply||"The interviewer could not continue.");
      if(data.done&&data.feedback){
        const finished={...optimistic,messages:[...optimistic.messages,{id:makeId(),role:"agent" as const,content:data.reply}],questionCount:8};
        localStorage.setItem("abtalks-interview-session",JSON.stringify(finished));
        const report={feedback:data.feedback,candidate:session.candidate,sessionId:session.sessionId,completedAt:Date.now(),duration:elapsed,daysCovered:session.daysCovered};
        localStorage.setItem("abtalks-final-report",JSON.stringify(report));
        const history=JSON.parse(localStorage.getItem("abtalks-report-history")||"[]") as unknown[];
        localStorage.setItem("abtalks-report-history",JSON.stringify([report,...history].slice(0,10)));
        setSession(finished);setTimeout(()=>router.push("/report"),900);
      }else{
        const next={...optimistic,messages:[...optimistic.messages,{id:makeId(),role:"agent" as const,content:data.reply,meta:data.meta}],questionCount:data.meta?.questionNumber??optimistic.questionCount+1,daysCovered:data.meta?.daysCovered??optimistic.daysCovered};
        setSession(next);localStorage.setItem("abtalks-interview-session",JSON.stringify(next));
      }
    }catch(err){setError(err instanceof Error?err.message:"The interviewer could not continue.");setSession(session);setInput(answer)}finally{setSending(false)}
  }

  if(!ready)return null;
  if(!session)return <section className="no-session section-shell"><div className="app-card"><span className="section-index">NO ACTIVE SESSION</span><h1>Configure your interview first.</h1><p>Select a candidate profile so the agent can map questions to the right missions and curriculum days.</p><Link className="button button-primary" href="/setup">Choose a candidate <span>→</span></Link></div></section>;

  const latestMeta=[...session.messages].reverse().find((message)=>message.meta)?.meta;
  const progress=Math.min(100,(session.questionCount/8)*100);
  return <section className="room-shell">
    <aside className="room-sidebar">
      <div className="room-profile"><span className="avatar">{initials(session.candidate.member.name)}</span><div><strong>{session.candidate.member.name}</strong><small>{session.candidate.member.jobRole}</small></div></div>
      <span className="room-label">INTERVIEW PROGRESS</span><div className="room-value">Question {Math.min(session.questionCount,8)} of 8</div><div className="progress-track"><i style={{width:`${progress}%`}}/></div>
      <span className="room-label">DAYS COVERED</span><div className="coverage-days">{session.daysCovered.map((day)=><span key={day} className={day===latestMeta?.day?"current":""}>{String(day).padStart(2,"0")}</span>)}</div>
      <span className="room-label">CURRENT FOCUS</span><div className="context-block"><span className="context-chip">DAY {latestMeta?.day??"—"}</span><strong>{latestMeta?.topic??"Preparing context"}</strong><p>{latestMeta?.isFollowUp?"Follow-up based on your previous response.":"New curriculum domain."}</p></div>
      <span className="room-label">SESSION ID</span><div className="room-value" style={{fontFamily:"var(--font-geist-mono)",fontSize:8,overflowWrap:"anywhere"}}>{session.sessionId}</div>
    </aside>

    <div className="room-main">
      <header className="room-topbar"><div><h1>Technical interview</h1><p>Adaptive · curriculum-aware · context maintained</p></div><div className="room-live"><i/> LIVE · {formatTime(elapsed)}</div></header>
      <div className="messages" ref={messagesRef} aria-live="polite">
        {session.messages.map((message)=><div className={`message ${message.role}`} key={message.id}>
          <span className="message-avatar">{message.role==="agent"?"AI":initials(session.candidate.member.name)}</span>
          <div className="bubble">{message.role==="agent"&&message.meta&&<small>{message.meta.isFollowUp?"FOLLOW-UP":"QUESTION"} · DAY {message.meta.day} · {message.meta.topic}</small>}{message.content}</div>
        </div>)}
        {sending&&<div className="message"><span className="message-avatar">AI</span><div className="bubble typing" aria-label="Interviewer is thinking"><i/><i/><i/></div></div>}
      </div>
      {error&&<p className="room-error" role="alert">{error}</p>}
      <div className="composer"><div className="composer-box"><textarea value={input} onChange={(event)=>setInput(event.target.value)} onKeyDown={(event)=>{if(event.key==="Enter"&&!event.shiftKey){event.preventDefault();send()}}} placeholder="Explain your reasoning, trade-offs, and evidence…" aria-label="Your interview answer" disabled={sending}/><button onClick={send} disabled={!input.trim()||sending} aria-label="Send answer">↑</button></div><div className="composer-hint"><span>Enter to send · Shift + Enter for a new line</span><span>Be specific. Think out loud.</span></div></div>
    </div>

    <aside className="room-context">
      <span className="room-label">INTERVIEW PRINCIPLE</span><div className="context-block"><span className="context-chip">THINK IN SYSTEMS</span><strong>Explain the why, not only the what.</strong><p>Strong answers connect implementation, constraints, failure modes, and measurement.</p></div>
      <span className="room-label">WHAT THE AGENT TRACKS</span><div className="integrity-list"><div><i/>Technical specificity</div><div><i/>Depth of reasoning</div><div><i/>Clear communication</div><div><i/>Production awareness</div></div>
      <span className="room-label">INTERVIEW INTEGRITY</span><div className="context-block"><strong>Scores stay hidden</strong><p>Feedback appears only after all eight questions, preserving a realistic interview rhythm.</p></div>
      <span className="room-label">NEED TO RESET?</span><Link href="/setup" className="text-link" onClick={()=>localStorage.removeItem("abtalks-interview-session")}>New session <span>→</span></Link>
    </aside>
  </section>
}
