"use client";

import { useEffect, useState } from "react";
import { adminFetch, type AdminContentRow } from "@/lib/admin";

interface Hero {
  eyebrow: string; titleLine1: string; titleLine2: string; lead: string;
  stats: { value: string; label: string }[];
}
interface Contact { address: string; phone: string; email: string; hours: string }
interface About { vision: string; missions: string[] }
interface Embed { videoUrl: string; videoTitle: string; mapQuery: string }

/** ชุดข้อมูลหนึ่งคีย์ = ไทย + อังกฤษ */
type Pair<T> = { th: T; en: T };

const EMPTY_HERO: Hero = { eyebrow: "", titleLine1: "", titleLine2: "", lead: "", stats: [] };
const EMPTY_CONTACT: Contact = { address: "", phone: "", email: "", hours: "" };
const EMPTY_ABOUT: About = { vision: "", missions: [] };
const EMPTY_EMBED: Embed = { videoUrl: "", videoTitle: "", mapQuery: "" };

export default function AdminContent() {
  const [hero, setHero] = useState<Pair<Hero> | null>(null);
  const [contact, setContact] = useState<Pair<Contact> | null>(null);
  const [about, setAbout] = useState<Pair<About> | null>(null);
  const [embed, setEmbed] = useState<Pair<Embed> | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});
  /* สลับดู/แก้ทีละภาษา — ฟอร์มเดียวใช้ได้ทั้งสอง ไม่ต้องเลื่อนหาสองชุด */
  const [lang, setLang] = useState<"th" | "en">("th");

  useEffect(() => {
    adminFetch<AdminContentRow[]>("/admin/content").then((rows) => {
      const row = (k: string) => rows.find((r) => r.key === k);
      const pair = <T,>(k: string, empty: T): Pair<T> => {
        const r = row(k);
        const th = (r?.valueTh as T) ?? empty;
        /* ยังไม่เคยกรอกอังกฤษ → เริ่มจากค่าไทยให้แก้ต่อได้เลย ไม่ต้องพิมพ์ใหม่ทั้งหมด */
        return { th, en: (r?.valueEn as T) ?? th };
      };
      setHero(pair("home.hero", EMPTY_HERO));
      setContact(pair("site.contact", EMPTY_CONTACT));
      setAbout(pair("about.main", EMPTY_ABOUT));
      setEmbed(pair("site.embed", EMPTY_EMBED));
    }).catch(() => {});
  }, []);

  /** บันทึกทั้งสองภาษาพร้อมกัน — กันกรณีแก้ภาษาหนึ่งแล้วลืมกดบันทึกอีกภาษา */
  async function save(key: string, value: Pair<unknown>) {
    setMsg({});
    try {
      await adminFetch(`/admin/content/${key}`, {
        method: "PUT",
        body: JSON.stringify({ valueTh: value.th, valueEn: value.en }),
      });
      setMsg({ ok: "บันทึกแล้วทั้งภาษาไทยและอังกฤษ — รีเฟรชหน้าเว็บเพื่อดูผล" });
    } catch (e) {
      setMsg({ err: e instanceof Error ? e.message : "บันทึกไม่สำเร็จ" });
    }
  }

  if (!hero || !contact || !about || !embed) return null;

  /* ตัวช่วยแก้เฉพาะภาษาที่กำลังเลือกอยู่ */
  const setHeroField = (patch: Partial<Hero>) =>
    setHero({ ...hero, [lang]: { ...hero[lang], ...patch } });
  const setContactField = (patch: Partial<Contact>) =>
    setContact({ ...contact, [lang]: { ...contact[lang], ...patch } });
  const setAboutField = (patch: Partial<About>) =>
    setAbout({ ...about, [lang]: { ...about[lang], ...patch } });

  const h = hero[lang];
  const c = contact[lang];
  const a = about[lang];

  return (
    <>
      <h1>ข้อความหน้าเว็บ</h1>
      <p className="sub">แก้ข้อความส่วนกลางของเว็บ — สลับภาษาที่ปุ่มด้านล่าง แล้วกดบันทึกครั้งเดียวได้ทั้งสองภาษา</p>

      <div className="lang-switch">
        <button className={lang === "th" ? "on" : ""} onClick={() => setLang("th")}>ภาษาไทย</button>
        <button className={lang === "en" ? "on" : ""} onClick={() => setLang("en")}>English</button>
      </div>

      {msg.ok && <p className="adm-msg-ok" style={{ marginBottom: 14 }}>{msg.ok}</p>}
      {msg.err && <p className="adm-msg-err" style={{ marginBottom: 14 }}>{msg.err}</p>}

      {/* Hero หน้าแรก */}
      <div className="adm-card">
        <h2>Hero หน้าแรก <span className="lang-tag">{lang === "th" ? "ไทย" : "English"}</span></h2>
        <div className="adm-form">
          <div>
            <label>ข้อความบรรทัดเล็กด้านบน (eyebrow)</label>
            <input value={h.eyebrow} onChange={(e) => setHeroField({ eyebrow: e.target.value })} />
          </div>
          <div className="row2">
            <div>
              <label>หัวข้อบรรทัดที่ 1</label>
              <input value={h.titleLine1} onChange={(e) => setHeroField({ titleLine1: e.target.value })} />
            </div>
            <div>
              <label>หัวข้อบรรทัดที่ 2</label>
              <input value={h.titleLine2} onChange={(e) => setHeroField({ titleLine2: e.target.value })} />
            </div>
          </div>
          <div>
            <label>คำโปรย</label>
            <textarea value={h.lead} onChange={(e) => setHeroField({ lead: e.target.value })} />
          </div>

          <label>ตัวเลขสถิติ (เว้นว่างไว้ = ไม่แสดงแถบสถิติ)</label>
          {h.stats.map((s, i) => (
            <div className="row2" key={i}>
              <input
                value={s.value}
                placeholder="ตัวเลข เช่น 12+"
                onChange={(e) => {
                  const stats = [...h.stats];
                  stats[i] = { ...stats[i], value: e.target.value };
                  setHeroField({ stats });
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={s.label}
                  placeholder="คำอธิบาย"
                  onChange={(e) => {
                    const stats = [...h.stats];
                    stats[i] = { ...stats[i], label: e.target.value };
                    setHeroField({ stats });
                  }}
                />
                <button
                  type="button"
                  className="adm-btn danger sm"
                  onClick={() => setHeroField({ stats: h.stats.filter((_, j) => j !== i) })}
                >
                  ลบ
                </button>
              </div>
            </div>
          ))}
          <div className="adm-actions">
            <button
              type="button"
              className="adm-btn ghost sm"
              onClick={() => setHeroField({ stats: [...h.stats, { value: "", label: "" }] })}
            >
              + เพิ่มตัวเลขสถิติ
            </button>
          </div>
          <p className="adm-note">ใส่เฉพาะตัวเลขที่เป็นของจริง — ตัวเลขที่ไม่จริงทำให้เสียความน่าเชื่อถือกับหน่วยงาน</p>

          <div className="adm-actions">
            <button className="adm-btn" onClick={() => save("home.hero", hero)}>บันทึก Hero</button>
          </div>
        </div>
      </div>

      {/* ข้อมูลติดต่อ */}
      <div className="adm-card">
        <h2>ข้อมูลติดต่อ <span className="lang-tag">{lang === "th" ? "ไทย" : "English"}</span></h2>
        <p className="sub" style={{ margin: "0 0 14px" }}>แสดงหน้า Contact, footer และเมนูมือถือ</p>
        <div className="adm-form">
          <div>
            <label>ที่อยู่</label>
            <textarea value={c.address} onChange={(e) => setContactField({ address: e.target.value })} />
          </div>
          <div className="row3">
            <div>
              <label>โทรศัพท์</label>
              <input value={c.phone} onChange={(e) => setContactField({ phone: e.target.value })} />
            </div>
            <div>
              <label>อีเมล</label>
              <input value={c.email} onChange={(e) => setContactField({ email: e.target.value })} />
            </div>
            <div>
              <label>เวลาทำการ</label>
              <input value={c.hours} onChange={(e) => setContactField({ hours: e.target.value })} />
            </div>
          </div>
          <div className="adm-actions">
            <button className="adm-btn" onClick={() => save("site.contact", contact)}>บันทึกข้อมูลติดต่อ</button>
          </div>
        </div>
      </div>

      {/* เกี่ยวกับศูนย์ */}
      <div className="adm-card">
        <h2>เกี่ยวกับศูนย์ <span className="lang-tag">{lang === "th" ? "ไทย" : "English"}</span></h2>
        <p className="sub" style={{ margin: "0 0 14px" }}>วิสัยทัศน์ / พันธกิจ</p>
        <div className="adm-form">
          <div>
            <label>วิสัยทัศน์</label>
            <textarea value={a.vision} onChange={(e) => setAboutField({ vision: e.target.value })} />
          </div>
          <label>พันธกิจ (บรรทัดละข้อ)</label>
          <textarea
            style={{ minHeight: 110 }}
            value={a.missions.join("\n")}
            onChange={(e) => setAboutField({ missions: e.target.value.split("\n") })}
          />
          <div className="adm-actions">
            <button
              className="adm-btn"
              onClick={() =>
                save("about.main", {
                  th: { ...about.th, missions: about.th.missions.filter((m) => m.trim()) },
                  en: { ...about.en, missions: about.en.missions.filter((m) => m.trim()) },
                })
              }
            >
              บันทึกเกี่ยวกับศูนย์
            </button>
          </div>
        </div>
      </div>

      {/* วิดีโอ + แผนที่ — ลิงก์ใช้ร่วมกันทั้งสองภาษา ต่างกันแค่หัวข้อวิดีโอ */}
      <div className="adm-card">
        <h2>วิดีโอ &amp; แผนที่</h2>
        <p className="sub" style={{ margin: "0 0 14px" }}>เว้นว่างไว้ = ไม่แสดงส่วนนั้นในหน้าเว็บ</p>
        <div className="adm-form">
          <div>
            <label>ลิงก์วิดีโอแนะนำศูนย์ (แสดงหน้าแรก)</label>
            <input
              value={embed.th.videoUrl}
              onChange={(e) =>
                setEmbed({
                  th: { ...embed.th, videoUrl: e.target.value },
                  en: { ...embed.en, videoUrl: e.target.value },
                })
              }
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="adm-note">รองรับ YouTube และ Vimeo — วางลิงก์จากช่องที่อยู่ของเบราว์เซอร์ได้เลย</p>
          </div>
          <div className="row2">
            <div>
              <label>หัวข้อเหนือวิดีโอ (ไทย)</label>
              <input
                value={embed.th.videoTitle}
                onChange={(e) => setEmbed({ ...embed, th: { ...embed.th, videoTitle: e.target.value } })}
                placeholder="รู้จักศูนย์วิจัยเมืองอัจฉริยะ"
              />
            </div>
            <div>
              <label>หัวข้อเหนือวิดีโอ (อังกฤษ)</label>
              <input
                value={embed.en.videoTitle}
                onChange={(e) => setEmbed({ ...embed, en: { ...embed.en, videoTitle: e.target.value } })}
                placeholder="Meet the centre"
              />
            </div>
          </div>
          <div>
            <label>ตำแหน่งแผนที่ (แสดงหน้าติดต่อเรา)</label>
            <input
              value={embed.th.mapQuery}
              onChange={(e) =>
                setEmbed({
                  th: { ...embed.th, mapQuery: e.target.value },
                  en: { ...embed.en, mapQuery: e.target.value },
                })
              }
              placeholder="13.7276,100.7791 หรือชื่อสถานที่"
            />
            <p className="adm-note">
              ใส่พิกัด (ละติจูด,ลองจิจูด) จะแม่นที่สุด — เปิด Google Maps คลิกขวาที่จุดที่ต้องการแล้วคัดลอกตัวเลขมาวาง
            </p>
          </div>
          <div className="adm-actions">
            <button className="adm-btn" onClick={() => save("site.embed", embed)}>
              บันทึกวิดีโอ &amp; แผนที่
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
