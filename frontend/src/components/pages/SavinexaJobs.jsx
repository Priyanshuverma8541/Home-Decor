import { useEffect, useState } from "react";
import { savinexaAPI } from "../../services/savinexaApi.js";

export default function SavinexaJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; savinexaAPI.getJobs().then(({ data }) => { if (active) setJobs(data.jobs || []); }).catch(() => { if (active) setJobs([]); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  return <section style={{ maxWidth: 1040, margin: "auto", padding: "48px 20px 72px" }}><p style={{ color: "var(--savinexa-accent)", textTransform: "uppercase", letterSpacing: 2 }}>Careers</p><h1>Build with Savinexa</h1><p>Explore opportunities to work with our team.</p>{loading ? <p>Loading opportunities…</p> : jobs.length ? <div style={{ display: "grid", gap: 14 }}>{jobs.map((job) => <article key={job._id} style={{ padding: 22, background: "white", borderRadius: "var(--savinexa-radius)" }}><h2 style={{ marginTop: 0 }}>{job.title}</h2><p>{[job.department, job.location, job.employmentType].filter(Boolean).join(" · ")}</p><p style={{ whiteSpace: "pre-line" }}>{job.description}</p>{job.requirements && <p><strong>Requirements:</strong> {job.requirements}</p>}{job.applicationEmail && <a href={`mailto:${job.applicationEmail}?subject=${encodeURIComponent(`Application: ${job.title}`)}`}>Apply by email</a>}</article>)}</div> : <p>There are no published openings right now. Please check back soon.</p>}</section>;
}
