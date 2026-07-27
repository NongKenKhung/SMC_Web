"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  adminFetch, type AdminMessage, type AdminPartner, type AdminPost, type AdminSolution,
} from "@/lib/admin";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{ s: number; p: number; pa: number; m: number; unread: number } | null>(null);
  const [recent, setRecent] = useState<AdminMessage[]>([]);

  useEffect(() => {
    Promise.all([
      adminFetch<AdminSolution[]>("/admin/solutions"),
      adminFetch<AdminPost[]>("/admin/posts"),
      adminFetch<AdminPartner[]>("/admin/partners"),
      adminFetch<AdminMessage[]>("/admin/messages"),
    ]).then(([s, p, pa, m]) => {
      setStats({
        s: s.length, p: p.length, pa: pa.length, m: m.length,
        unread: m.filter((x) => !x.readAt).length,
      });
      setRecent(m.slice(0, 5));
    }).catch(() => {});
  }, []);

  return (
    <>
      <h1>ภาพรวม</h1>
      <p className="sub">สรุปข้อมูลทั้งหมดในระบบ</p>

      <div className="stat-cards">
        <div className="stat-card"><b>{stats?.s ?? "–"}</b><span>Solutions (หมวด+หัวข้อย่อย)</span></div>
        <div className="stat-card"><b>{stats?.p ?? "–"}</b><span>โพสต์กิจกรรม/ข่าว</span></div>
        <div className="stat-card"><b>{stats?.pa ?? "–"}</b><span>พาร์ทเนอร์</span></div>
        <div className="stat-card"><b>{stats?.unread ?? "–"}</b><span>ข้อความยังไม่อ่าน (ทั้งหมด {stats?.m ?? "–"})</span></div>
      </div>

      <div className="adm-card">
        <h2>ข้อความติดต่อล่าสุด</h2>
        {recent.length === 0 ? (
          <p className="sub" style={{ margin: 0 }}>ยังไม่มีข้อความ</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr><th>จาก</th><th>เรื่อง</th><th>ข้อความ</th><th>วันที่</th><th></th></tr>
            </thead>
            <tbody>
              {recent.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}<br /><small style={{ color: "var(--a-muted)" }}>{m.email}</small></td>
                  <td>{m.topic}</td>
                  <td>{m.message.slice(0, 60)}{m.message.length > 60 ? "…" : ""}</td>
                  <td>{new Date(m.createdAt).toLocaleDateString("th-TH", { dateStyle: "medium" })}</td>
                  <td>{!m.readAt && <span className="pill new">ใหม่</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ marginTop: 14 }}>
          <Link className="adm-btn ghost sm" href="/admin/messages">เปิดกล่องข้อความ →</Link>
        </p>
      </div>
    </>
  );
}
