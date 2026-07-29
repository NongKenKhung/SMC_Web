"use client";

import { useCallback, useEffect, useState } from "react";
import RichText from "@/components/admin/RichText";
import Upload from "@/components/admin/Upload";
import { adminFetch, type AdminBlock, type AdminSolution } from "@/lib/admin";

/** นิยามชุดเนื้อหาที่แก้ได้ — เพิ่มชุดใหม่ = เพิ่มรายการที่นี่ (ไม่ต้องแก้ฐานข้อมูล) */
type GroupDef = {
  group: string;
  label: string;
  hint: string;
  fields: { subtitle?: string; body?: string; icon?: boolean; image?: boolean };
};

const BASE_GROUPS: GroupDef[] = [
  {
    group: "home.pillars",
    label: "หน้าแรก — บทบาทของศูนย์วิจัย",
    hint: "การ์ด 3 ใบในส่วนพื้นหลังสีเข้ม (งานวิจัย / นวัตกรรมต้นแบบ / บริการวิชาการ)",
    fields: { subtitle: "คำกำกับภาษาอังกฤษ (เช่น Research)", body: "คำอธิบาย" },
  },
  {
    group: "home.techs",
    label: "หน้าแรก — เทคโนโลยีหลัก",
    hint: "รายการแบบกดเปิด-ปิด (accordion) ข้างรูปภาพ",
    fields: { body: "คำอธิบายเทคโนโลยี" },
  },
  {
    group: "about.story",
    label: "เกี่ยวกับศูนย์ — ความเป็นมา",
    hint: "ย่อหน้าเล่าที่มาของศูนย์วิจัย (เรียงตามลำดับ)",
    fields: { body: "เนื้อหาย่อหน้า" },
  },
  {
    group: "about.timeline",
    label: "เกี่ยวกับศูนย์ — เส้นทางของศูนย์วิจัย",
    hint: "ไทม์ไลน์เหตุการณ์สำคัญ ใส่ปีในช่อง 'ปี'",
    fields: { subtitle: "ปี (เช่น 2564 หรือ 2567–ปัจจุบัน)", body: "รายละเอียดเหตุการณ์" },
  },
  {
    group: "about.team",
    label: "เกี่ยวกับศูนย์ — ทีมงาน",
    hint: "อาจารย์และนักวิจัยของศูนย์ — ใส่ชื่อในช่องหัวข้อ ตำแหน่งในช่องตำแหน่ง และรูปถ่าย",
    fields: {
      subtitle: "ตำแหน่ง (เช่น หัวหน้าศูนย์วิจัย)",
      body: "ความเชี่ยวชาญ / ประวัติย่อ",
      image: true,
    },
  },
  {
    group: "about.publications",
    label: "เกี่ยวกับศูนย์ — ผลงานตีพิมพ์",
    hint: "บทความวิชาการ ใส่ชื่อเรื่องในช่องหัวข้อ และวารสาร/ปีในช่องแหล่งตีพิมพ์ — ใส่ลิงก์ในช่องเนื้อหาได้",
    fields: {
      subtitle: "วารสาร / งานประชุม และปี",
      body: "ผู้แต่ง และลิงก์ไปยังบทความ",
    },
  },
];

const EMPTY = {
  titleTh: "", titleEn: "", subtitleTh: "", subtitleEn: "",
  bodyTh: "", bodyEn: "", icon: "", image: "", published: true,
};
type FormState = typeof EMPTY & { id?: number };

export default function AdminBlocks() {
  const [groups, setGroups] = useState<GroupDef[]>(BASE_GROUPS);
  const [active, setActive] = useState(BASE_GROUPS[0].group);
  const [items, setItems] = useState<AdminBlock[]>([]);
  const [form, setForm] = useState<FormState | null>(null);
  const [msg, setMsg] = useState<{ ok?: string; err?: string }>({});

  /* เพิ่มกลุ่ม "ฟีเจอร์ของ solution" ตามรายการ solution จริงในระบบ */
  useEffect(() => {
    adminFetch<AdminSolution[]>("/admin/solutions")
      .then((sols) => {
        const extra: GroupDef[] = sols
          .filter((s) => s.parentId !== null) // เฉพาะหัวข้อย่อย (หน้าที่มีส่วนฟีเจอร์)
          .map((s) => ({
            group: `solution.features:${s.id}`,
            label: `ฟีเจอร์ — ${s.nameTh}`,
            hint: "รายการความสามารถที่แสดงเป็นการ์ดมีเลขกำกับในหน้ารายละเอียด",
            fields: { body: "คำอธิบายฟีเจอร์" },
          }));
        setGroups([...BASE_GROUPS, ...extra]);
      })
      .catch(() => {});
  }, []);

  const def = groups.find((g) => g.group === active) ?? BASE_GROUPS[0];

  const load = useCallback(async () => {
    try {
      const rows = await adminFetch<AdminBlock[]>(`/admin/blocks?group=${encodeURIComponent(active)}`);
      setItems(rows.sort((a, b) => a.order - b.order));
    } catch {
      /* 401 จัดการแล้ว */
    }
  }, [active]);

  useEffect(() => {
    load();
    setForm(null);
  }, [load]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const { id, ...rest } = form;
    const payload = { ...rest, group: active };
    try {
      if (id) {
        await adminFetch(`/admin/blocks/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
      } else {
        await adminFetch("/admin/blocks", { method: "POST", body: JSON.stringify(payload) });
      }
      setMsg({ ok: "บันทึกแล้ว — หน้าเว็บอัปเดตทันที" });
      setForm(null);
      load();
    } catch (e) {
      setMsg({ err: e instanceof Error ? e.message : "บันทึกไม่สำเร็จ" });
    }
  }

  async function remove(b: AdminBlock) {
    if (!confirm(`ลบ "${b.titleTh}"?`)) return;
    await adminFetch(`/admin/blocks/${b.id}`, { method: "DELETE" });
    load();
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...items];
    const t = index + dir;
    if (t < 0 || t >= next.length) return;
    [next[index], next[t]] = [next[t], next[index]];
    setItems(next);
    await adminFetch("/admin/blocks/reorder", {
      method: "PUT",
      body: JSON.stringify({ ids: next.map((x) => x.id) }),
    });
  }

  return (
    <>
      <h1>เนื้อหาในหน้าเว็บ</h1>
      <p className="sub">แก้ข้อความส่วนที่เป็นรายการซ้ำ ๆ ของแต่ละหน้า — เพิ่ม ลบ จัดลำดับได้เอง</p>

      {msg.ok && <p className="adm-msg-ok" style={{ marginBottom: 14 }}>{msg.ok}</p>}
      {msg.err && <p className="adm-msg-err" style={{ marginBottom: 14 }}>{msg.err}</p>}

      <div className="adm-card">
        <div className="adm-form" style={{ marginBottom: 16 }}>
          <div>
            <label>เลือกชุดเนื้อหา</label>
            <select value={active} onChange={(e) => setActive(e.target.value)}>
              {groups.map((g) => <option key={g.group} value={g.group}>{g.label}</option>)}
            </select>
          </div>
        </div>
        <p className="sub" style={{ marginTop: -6 }}>{def.hint}</p>

        <div className="adm-actions" style={{ margin: "14px 0" }}>
          <button className="adm-btn" onClick={() => { setForm({ ...EMPTY }); setMsg({}); }}>+ เพิ่มรายการ</button>
        </div>

        {items.length === 0 ? (
          <p className="sub" style={{ margin: 0 }}>
            ยังไม่มีรายการในชุดนี้ — หน้าเว็บจะใช้เนื้อหาเริ่มต้นที่ฝังมากับระบบไปก่อน
            พอเพิ่มรายการแรก หน้าเว็บจะเปลี่ยนมาใช้ข้อมูลจากที่นี่แทน
          </p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr><th>ลำดับ</th><th>หัวข้อ</th><th>คำกำกับ</th><th>สถานะ</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((b, i) => (
                <tr key={b.id}>
                  <td>{i + 1}</td>
                  <td>{b.titleTh}</td>
                  <td>{b.subtitleTh}</td>
                  <td><span className={`pill ${b.published ? "on" : "off"}`}>{b.published ? "แสดง" : "ซ่อน"}</span></td>
                  <td>
                    <div className="adm-actions">
                      <button className="adm-btn ghost sm" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                      <button className="adm-btn ghost sm" disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
                      <button className="adm-btn ghost sm" onClick={() => { setForm({ ...EMPTY, ...b, titleEn: b.titleEn ?? "", subtitleTh: b.subtitleTh ?? "", subtitleEn: b.subtitleEn ?? "", bodyTh: b.bodyTh ?? "", bodyEn: b.bodyEn ?? "", icon: b.icon ?? "", image: b.image ?? "" }); setMsg({}); }}>แก้ไข</button>
                      <button className="adm-btn danger sm" onClick={() => remove(b)}>ลบ</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {form && (
        <div className="adm-card">
          <h2>{form.id ? `แก้ไข: ${form.titleTh}` : `เพิ่มรายการใน "${def.label}"`}</h2>
          <form className="adm-form" onSubmit={save}>
            <div className="row2">
              <div>
                <label>หัวข้อ (ไทย) *</label>
                <input value={form.titleTh} onChange={(e) => setForm({ ...form, titleTh: e.target.value })} required />
              </div>
              <div>
                <label>หัวข้อ (อังกฤษ)</label>
                <input value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} />
              </div>
            </div>

            {def.fields.subtitle && (
              <div className="row2">
                <div>
                  <label>{def.fields.subtitle} (ไทย)</label>
                  <input value={form.subtitleTh} onChange={(e) => setForm({ ...form, subtitleTh: e.target.value })} />
                </div>
                <div>
                  <label>{def.fields.subtitle} (อังกฤษ)</label>
                  <input value={form.subtitleEn} onChange={(e) => setForm({ ...form, subtitleEn: e.target.value })} />
                </div>
              </div>
            )}

            {def.fields.body && (
              <>
                <div>
                  <label>{def.fields.body} (ไทย)</label>
                  <RichText value={form.bodyTh} onChange={(html) => setForm({ ...form, bodyTh: html })} />
                </div>
                <div>
                  <label>{def.fields.body} (อังกฤษ)</label>
                  <RichText value={form.bodyEn} onChange={(html) => setForm({ ...form, bodyEn: html })} />
                </div>
              </>
            )}

            <div>
              <label>รูปประกอบ (ไม่บังคับ)</label>
              <Upload value={form.image} onDone={(url) => setForm({ ...form, image: url })} />
            </div>

            <label className="check">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              แสดงบนเว็บ
            </label>

            <div className="adm-actions">
              <button className="adm-btn" type="submit">บันทึก</button>
              <button className="adm-btn ghost" type="button" onClick={() => setForm(null)}>ยกเลิก</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
