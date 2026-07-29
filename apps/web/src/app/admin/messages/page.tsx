"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch, type AdminMessage } from "@/lib/admin";

export default function AdminMessages() {
  const [rows, setRows] = useState<AdminMessage[]>([]);
  const [open, setOpen] = useState<number | null>(null);

  const load = useCallback(() => {
    adminFetch<AdminMessage[]>("/admin/messages").then(setRows).catch(() => {});
  }, []);
  useEffect(load, [load]);

  async function toggleOpen(m: AdminMessage) {
    setOpen(open === m.id ? null : m.id);
    if (!m.readAt) {
      await adminFetch(`/admin/messages/${m.id}/read`, { method: "PATCH" });
      load();
    }
  }

  async function remove(m: AdminMessage) {
    if (!confirm(`ลบข้อความจาก "${m.name}"?`)) return;
    await adminFetch(`/admin/messages/${m.id}`, { method: "DELETE" });
    load();
  }

  return (
    <>
      <h1>กล่องข้อความ</h1>
      <p className="sub">ข้อความจากฟอร์มติดต่อหน้าเว็บ — คลิกแถวเพื่ออ่านเต็ม (ระบบจะทำเครื่องหมายว่าอ่านแล้ว)</p>

      <div className="adm-card">
        {rows.length === 0 ? (
          <p className="sub" style={{ margin: 0 }}>ยังไม่มีข้อความ</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr><th></th><th>จาก</th><th>เรื่อง</th><th>วันที่</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((m) => (
                <FragmentRow
                  key={m.id}
                  m={m}
                  opened={open === m.id}
                  onOpen={() => toggleOpen(m)}
                  onDelete={() => remove(m)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function FragmentRow({
  m, opened, onOpen, onDelete,
}: {
  m: AdminMessage; opened: boolean; onOpen: () => void; onDelete: () => void;
}) {
  return (
    <>
      <tr onClick={onOpen} style={{ cursor: "pointer", fontWeight: m.readAt ? 400 : 600 }}>
        <td>{!m.readAt && <span className="pill new">ใหม่</span>}</td>
        <td>{m.name}{m.org ? ` (${m.org})` : ""}</td>
        <td>{m.topic}</td>
        <td>{new Date(m.createdAt).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}</td>
        <td>
          <button
            className="adm-btn danger sm"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
          >
            ลบ
          </button>
        </td>
      </tr>
      {opened && (
        <tr>
          <td colSpan={5} style={{ background: "var(--a-soft)" }}>
            <p style={{ whiteSpace: "pre-wrap", marginBottom: 8 }}>{m.message}</p>
            <p style={{ fontSize: ".82rem", color: "var(--a-muted)" }}>
              {/* เปิดหน้าเขียนเมลของ Gmail บนเว็บ แทนที่จะไปเรียกโปรแกรมเมลในเครื่อง */}
              ตอบกลับ:{" "}
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(m.email)}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--a-orange)" }}
              >
                {m.email}
              </a>
              {m.phone ? ` · โทร ${m.phone}` : ""}
            </p>
          </td>
        </tr>
      )}
    </>
  );
}
