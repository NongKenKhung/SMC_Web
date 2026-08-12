"use client";

import { useState } from "react";
import { dict, type Locale } from "@/lib/i18n";

export default function ContactForm({ locale }: { locale: Locale }) {
  const t = dict(locale).contact;
  const [status, setStatus] = useState<"idle" | "sending" | "ok" | "err">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const res = /* เส้นทางสัมพัทธ์ — ยิงไปที่ origin เดียวกับที่ผู้ใช้เปิดเว็บอยู่ */
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("ok");
      form.reset();
    } catch {
      setStatus("err");
    }
  }

  return (
    <div className="card form-card reveal d1">
      <h3>{t.formTitle}</h3>
      <form onSubmit={onSubmit}>
        {/* กับดักบอท — คนจริงมองไม่เห็นและ tab ไม่ถึง ถ้าช่องนี้มีค่าแปลว่าเป็นบอท
            ใช้ตำแหน่งนอกจอแทน display:none เพราะบอทบางตัวข้ามช่องที่ซ่อนแบบนั้น */}
        <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <label htmlFor="f-website">อย่ากรอกช่องนี้</label>
          <input id="f-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        <div className="f-row">
          <div className="field">
            <label htmlFor="f-name">{t.fName}</label>
            <input id="f-name" name="name" type="text" placeholder={t.fNamePh} required maxLength={120} />
          </div>
          <div className="field">
            <label htmlFor="f-org">{t.fOrg}</label>
            <input id="f-org" name="org" type="text" placeholder={t.fOrgPh} maxLength={160} />
          </div>
        </div>
        <div className="f-row">
          <div className="field">
            <label htmlFor="f-email">{t.fEmail}</label>
            <input id="f-email" name="email" type="email" placeholder="name@example.com" required />
          </div>
          <div className="field">
            <label htmlFor="f-tel">{t.fPhone}</label>
            <input id="f-tel" name="phone" type="tel" placeholder="08x-xxx-xxxx" maxLength={30} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="f-topic">{t.fTopic}</label>
          <select id="f-topic" name="topic" defaultValue={t.topics[0]}>
            {t.topics.map((op) => (
              <option key={op} value={op}>{op}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-msg">{t.fMsg}</label>
          <textarea id="f-msg" name="message" placeholder={t.fMsgPh} required maxLength={4000} />
        </div>
        <p className="form-note">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          {t.note}
        </p>
        <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
          {status === "sending" ? t.sending : t.send}
        </button>
        {status === "ok" && <p className="form-ok">{t.ok}</p>}
        {status === "err" && <p className="form-err">{t.err}</p>}
      </form>
    </div>
  );
}
