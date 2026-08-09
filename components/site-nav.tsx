"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function SiteNav() {
  const path = usePathname();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setDark(document.documentElement.dataset.theme === "dark"));
    return () => cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    localStorage.setItem("abtalks-theme", next ? "dark" : "light");
  }

  const links = [
    ["/", "Overview"],
    ["/setup", "Candidates"],
    ["/interview", "Interview"],
    ["/report", "Feedback"],
  ];

  return (
    <header className="site-nav-wrap">
      <nav className="site-nav section-shell" aria-label="Primary navigation">
        <Link href="/" className="brand" aria-label="AB Talks Interview Agent home">
          <span className="brand-mark">AB</span>
          <span><Image className="brand-wordmark-img" src="/abtalks-wordmark.png" alt="AB Talks" width={92} height={24} priority /><small>INTERVIEW AGENT</small></span>
        </Link>
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Toggle navigation" aria-expanded={open}>{open ? "×" : "☰"}</button>
        <div className={`nav-links ${open ? "open" : ""}`}>
          {links.map(([href,label]) => <Link key={href} href={href} className={path === href ? "active" : ""} onClick={() => setOpen(false)}>{label}</Link>)}
        </div>
        <div className="nav-actions">
          <button className="theme-switch" onClick={toggleTheme} aria-label={`Switch to ${dark ? "light" : "dark"} mode`}>
            <span className={!dark ? "selected" : ""}>☼</span><span className={dark ? "selected" : ""}>◐</span>
          </button>
          <Link className="nav-cta" href="/setup">Start interview <span>↗</span></Link>
        </div>
      </nav>
    </header>
  );
}