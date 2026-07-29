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

export default function AdminContent() {
  const [hero, setHero] = useState<Hero | null>(null);
  const [contact, setContact] = useState<Contact | null>(null);
  const [about, setAbout] = useState<About | null>(null);
  const [embed, setEmbed] = useState<Embed | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});

  useEffect(() => {
    adminFetch<AdminContentRow[]>("/admin/content").then((rows) => {
      const find = (k: string) => rows.find((r) => r.key === k)?.valueTh as unknown;
      setHero((find("home.hero") as Hero) ?? { eyebrow: "", titleLine1: "", titleLine2: "", lead: "", stats: [] });
      setContact((find("site.contact") as Contact) ?? { address: "", phone: "", email: "", hours: "" });
      setAbout((find("about.main") as About) ?? { vision: "", missions: [] });
      setEmbed((find("site.embed") as Embed) ?? { videoUrl: "", videoTitle: "", mapQuery: "" });
    }).catch(() => {});
  }, []);

  async function save(key: string, valueTh: unknown) {
    setMsg({});
    try {
      await adminFetch(`/admin/content/${key}`, { method: "PUT", body: JSON.stringify({ valueTh }) });
      setMsg({ ok: "บันทึกแล้ว — หน้าเว็บอัปเดตทันที (รีเฟรชหน้าเว็บเพื่อดูผล)" });
    } catch (e) {
      setMsg({ err: e instanceof Error ? e.message : "บันทึกไม่สำเร็จ" });
    }
  }

  if (!hero || !contact || !about || !embed) return null;

  return (
    <>
      <h1>ข้อความหน้าเว็บ</h1>
      <p className="sub">แก้ข้อความส่วนกลางของเว็บ (ภาษาไทย — ช่องภาษาอังกฤษจะเพิ่มตามหลัง)</p>

      {msg.ok && <p className="adm-msg-ok" style={{ marginBottom: 14 }}>{msg.ok}</p>}
      {msg.err && <p className="adm-msg-err" style={{ marginBottom: 14 }}>{msg.err}</p>}

      {/* Hero หน้าแรก */}
      <div className="adm-card">
        <h2>Hero หน้าแรก</h2>
        <div className="adm-form">
          <div>
            <label>ข้อความบรรทัดเล็กด้านบน (eyebrow)</label>
            <input value={hero.eyebrow} onChange={(e) => setHero({ ...hero, eyebrow: e.target.value })} />
          </div>
          <div className="row2">
            <div>
              <label>หัวข้อบรรทัดที่ 1</label>
              <input value={hero.titleLine1} onChange={(e) => setHero({ ...hero, titleLine1: e.target.value })} />
            </div>
            <div>
              <label>หัวข้อบรรทัดที่ 2 (ตัวไล่สีส้ม)</label>
              <input value={hero.titleLine2} onChange={(e) => setHero({ ...hero, titleLine2: e.target.value })} />
            </div>
          </div>
          <div>
            <label>คำโปรย</label>
            <textarea value={hero.lead} onChange={(e) => setHero({ ...hero, lead: e.target.value })} />
          </div>
          <label>ตัวเลขสถิติ 3 ช่อง</label>
          <div className="row3">
            {hero.stats.map((s, i) => (
              <div key={i} style={{ display: "grid", gap: 6 }}>
                <input
                  value={s.value}
                  placeholder="ตัวเลข เช่น 12+"
                  onChange={(e) => {
                    const stats = [...hero.stats];
                    stats[i] = { ...stats[i], value: e.target.value };
                    setHero({ ...hero, stats });
                  }}
                />
                <input
                  value={s.label}
                  placeholder="คำอธิบาย"
                  onChange={(e) => {
                    const stats = [...hero.stats];
                    stats[i] = { ...stats[i], label: e.target.value };
                    setHero({ ...hero, stats });
                  }}
                />
              </div>
            ))}
          </div>
          <div className="adm-actions">
            <button className="adm-btn" onClick={() => save("home.hero", hero)}>บันทึก Hero</button>
          </div>
        </div>
      </div>

      {/* ข้อมูลติดต่อ */}
      <div className="adm-card">
        <h2>ข้อมูลติดต่อ (แสดงหน้า Contact + footer + เมนูมือถือ)</h2>
        <div className="adm-form">
          <div>
            <label>ที่อยู่</label>
            <textarea value={contact.address} onChange={(e) => setContact({ ...contact, address: e.target.value })} />
          </div>
          <div className="row3">
            <div>
              <label>โทรศัพท์</label>
              <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
            </div>
            <div>
              <label>อีเมล</label>
              <input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
            </div>
            <div>
              <label>เวลาทำการ</label>
              <input value={contact.hours} onChange={(e) => setContact({ ...contact, hours: e.target.value })} />
            </div>
          </div>
          <div className="adm-actions">
            <button className="adm-btn" onClick={() => save("site.contact", contact)}>บันทึกข้อมูลติดต่อ</button>
          </div>
        </div>
      </div>

      {/* เกี่ยวกับศูนย์ */}
      <div className="adm-card">
        <h2>เกี่ยวกับศูนย์ (วิสัยทัศน์ / พันธกิจ)</h2>
        <div className="adm-form">
          <div>
            <label>วิสัยทัศน์</label>
            <textarea value={about.vision} onChange={(e) => setAbout({ ...about, vision: e.target.value })} />
          </div>
          <label>พันธกิจ (บรรทัดละข้อ)</label>
          <textarea
            style={{ minHeight: 110 }}
            value={about.missions.join("\n")}
            onChange={(e) => setAbout({ ...about, missions: e.target.value.split("\n") })}
          />
          <div className="adm-actions">
            <button
              className="adm-btn"
              onClick={() => save("about.main", { ...about, missions: about.missions.filter((m) => m.trim()) })}
            >
              บันทึกเกี่ยวกับศูนย์
            </button>
          </div>
        </div>
      </div>

      {/* วิดีโอ + แผนที่ */}
      <div className="adm-card" style={{ marginTop: 18 }}>
        <h2>วิดีโอ &amp; แผนที่</h2>
        <p className="sub" style={{ margin: "0 0 14px" }}>
          เว้นว่างไว้ = ไม่แสดงส่วนนั้นในหน้าเว็บ
        </p>
        <div className="adm-form">
          <div>
            <label>ลิงก์วิดีโอแนะนำศูนย์ (แสดงหน้าแรก)</label>
            <input
              value={embed.videoUrl}
              onChange={(e) => setEmbed({ ...embed, videoUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="qr-note">รองรับ YouTube และ Vimeo — วางลิงก์จากช่องที่อยู่ของเบราว์เซอร์ได้เลย</p>
          </div>
          <div>
            <label>หัวข้อเหนือวิดีโอ</label>
            <input
              value={embed.videoTitle}
              onChange={(e) => setEmbed({ ...embed, videoTitle: e.target.value })}
              placeholder="รู้จักศูนย์วิจัยเมืองอัจฉริยะ"
            />
          </div>
          <div>
            <label>ตำแหน่งแผนที่ (แสดงหน้าติดต่อเรา)</label>
            <input
              value={embed.mapQuery}
              onChange={(e) => setEmbed({ ...embed, mapQuery: e.target.value })}
              placeholder="13.7276,100.7791 หรือ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง"
            />
            <p className="qr-note">
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
