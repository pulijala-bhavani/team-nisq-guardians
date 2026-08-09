import Link from "next/link";
import Image from "next/image";
import { SiteNav } from "@/components/site-nav";

const proofPoints = [
  ["08+", "adaptive questions"],
  ["04+", "curriculum days"],
  ["01", "actionable report"],
];

const steps = [
  {
    number: "01",
    title: "Choose a learning journey",
    copy: "Select a cohort profile. The agent reads completed missions, attempts, skipped topics, and learning signals.",
  },
  {
    number: "02",
    title: "Think out loud",
    copy: "Answer realistic technical questions while follow-ups adapt to the details and trade-offs in each response.",
  },
  {
    number: "03",
    title: "Leave with a plan",
    copy: "Get concise strengths, knowledge gaps, and next actions mapped back to the 31-day curriculum.",
  },
];

export default function Home() {
  return (
    <main>
      <SiteNav />

      <section className="hero section-shell" aria-labelledby="hero-title">
        <div className="hero-copy reveal-up">
          <div className="eyebrow"><span className="status-dot" /> AI Cohort · Interview readiness</div>
          <h1 id="hero-title">Build confidence for the <span>questions that matter.</span></h1>
          <p className="hero-lede">
            A personalized technical interviewer that turns your 31-day AI learning journey into a realistic, adaptive conversation—then shows you exactly where to improve.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/setup">Start your interview <span aria-hidden="true">↗</span></Link>
            <a className="button button-quiet" href="#experience">Explore the experience <span aria-hidden="true">↓</span></a>
          </div>
          <div className="assurance-row" aria-label="Product assurances">
            <span><i>✓</i> Curriculum-aware</span>
            <span><i>✓</i> No generic question bank</span>
            <span><i>✓</i> Actionable feedback</span>
          </div>
        </div>

        <div className="hero-visual" aria-label="Interactive interview intelligence visualization">
          <div className="orbit-stage" aria-hidden="true">
            <div className="cloud-glow cloud-one" />
            <div className="cloud-glow cloud-two" />
            <div className="orbit orbit-one"><span /></div>
            <div className="orbit orbit-two"><span /></div>
            <div className="orbit orbit-three"><span /></div>
            <div className="core-sphere">
              <div className="core-mark">AI</div>
              <small>INTERVIEW CORE</small>
            </div>
            <div className="floating-card card-question">
              <span className="mini-label">FOLLOW-UP · DAY 23</span>
              <strong>How would you secure that MCP tool boundary?</strong>
              <div className="audio-bars">{[1,2,3,4,5,6,7,8].map((n) => <i key={n} />)}</div>
            </div>
            <div className="floating-card card-signal">
              <span className="signal-icon">◎</span>
              <div><small>Learning signal</small><strong>Probe trade-offs</strong></div>
            </div>
            <div className="floating-card card-context">
              <small>CONTEXT</small>
              <div><span>RAG</span><span>MCP</span><span>Deploy</span></div>
            </div>
          </div>
        </div>
      </section>

      <section className="proof-strip section-shell" aria-label="Minimum interview coverage">
        {proofPoints.map(([value, label]) => (
          <div className="proof-stat" key={label}><strong>{value}</strong><span>{label}</span></div>
        ))}
        <p>Designed around the exact hackathon contract: multi-turn, contextual, adaptive, and feedback-driven.</p>
      </section>

      <section className="experience-section section-shell" id="experience" aria-labelledby="experience-title">
        <div className="section-heading">
          <div><span className="section-index">01 / EXPERIENCE</span><h2 id="experience-title">An interview shaped by what you actually learned.</h2></div>
          <p>The agent uses completed missions and learning signals to choose relevant ground, then changes direction when your answers reveal depth—or uncertainty.</p>
        </div>
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <span>{step.number}</span>
              <div className="step-icon" aria-hidden="true">{step.number === "01" ? "⌁" : step.number === "02" ? "◌" : "↗"}</div>
              <h3>{step.title}</h3>
              <p>{step.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="product-scene section-shell" aria-labelledby="product-title">
        <div className="scene-copy">
          <span className="section-index">02 / LIVE INTERVIEW</span>
          <h2 id="product-title">Professional pressure.<br />Useful support.</h2>
          <p>The interface stays calm while the conversation becomes more rigorous. You always know the topic, coverage, and progress—without seeing distracting live scores.</p>
          <ul>
            <li><span>01</span> Follow-ups grounded in your last answer</li>
            <li><span>02</span> Context maintained with one session ID</li>
            <li><span>03</span> Coverage across at least four cohort days</li>
          </ul>
          <Link className="text-link" href="/setup">Configure an interview <span>→</span></Link>
        </div>
        <div className="interview-preview">
          <div className="preview-topbar">
            <div className="brand-mini"><b>AB</b><span>Interview room</span></div>
            <div className="live-pill"><i /> LIVE · 06:42</div>
          </div>
          <div className="preview-body">
            <aside>
              <small>SESSION COVERAGE</small>
              <strong>Question 5 of 8+</strong>
              <div className="meter"><i style={{width:"62%"}} /></div>
              <small>CURRICULUM DAYS</small>
              <div className="day-chips"><b>07</b><b>12</b><b>22</b><b>23</b></div>
            </aside>
            <div className="preview-chat">
              <div className="agent-line"><span>AI</span><p><small>FOLLOW-UP · AGENTIC AI</small>You mentioned retry logic. How would you prevent the agent from repeating a destructive tool call?</p></div>
              <div className="candidate-line"><p>I would make the operation idempotent and persist the tool call state before retrying…</p><span>SJ</span></div>
              <div className="preview-input">Explain your thinking… <b>↑</b></div>
            </div>
          </div>
        </div>
      </section>

      <section className="feedback-section section-shell" aria-labelledby="feedback-title">
        <div className="report-card">
          <div className="report-score"><span>82</span><small>INTERVIEW READINESS</small></div>
          <div className="report-bars">
            {[['Technical depth','88%'],['System thinking','76%'],['Communication','84%']].map(([label,width]) => (
              <div key={label}><p><span>{label}</span><b>{width}</b></p><i><em style={{width}} /></i></div>
            ))}
          </div>
          <div className="report-callout"><span>↗</span><p><small>NEXT BEST ACTION</small>Practise explaining failure modes in hybrid retrieval systems.</p></div>
        </div>
        <div className="feedback-copy">
          <span className="section-index">03 / FEEDBACK</span>
          <h2 id="feedback-title">A report you can act on tomorrow.</h2>
          <p>No vague encouragement. Every interview ends with a clear summary, demonstrated strengths, specific gaps, and focused next steps.</p>
          <div className="feedback-list"><span>Summary</span><span>Strengths</span><span>Gaps</span><span>Next actions</span></div>
        </div>
      </section>

      <section className="final-cta section-shell">
        <div className="cta-orb" aria-hidden="true"><i /><i /><i /><b>AI</b></div>
        <div><span className="section-index">YOUR NEXT INTERVIEW STARTS HERE</span><h2>Turn completed lessons into confident answers.</h2></div>
        <Link className="button button-primary" href="/setup">Enter the interview room <span>↗</span></Link>
      </section>

      <footer className="site-footer section-shell">
        <div className="footer-brand"><Image className="footer-wordmark-img" src="/abtalks-wordmark.png" alt="AB Talks" width={90} height={24} /><p>AI Interview Agent</p></div>
        <p>Built for the 31-day Enterprise AI Engineering cohort.</p>
        <div><a href="#hero-title">Back to top ↑</a></div>
      </footer>
    </main>
  );
}