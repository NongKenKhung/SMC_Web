"use client";

import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useRef, useState } from "react";
import { adminFetch } from "@/lib/admin";

/* ปุ่มบนแถบเครื่องมือ — ต้องเป็น type="button" เสมอ
   เพราะ editor นี้ถูกวางในฟอร์ม ถ้าไม่ระบุจะกลายเป็นปุ่ม submit */
function Btn({
  active, disabled, title, onClick, children,
}: {
  active?: boolean; disabled?: boolean; title: string;
  onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`rt-btn${active ? " on" : ""}`}
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()} /* กันไม่ให้ editor เสีย focus */
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onPickImage }: { editor: Editor; onPickImage: () => void }) {
  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("ใส่ลิงก์ (เว้นว่างเพื่อลบลิงก์)", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div className="rt-bar">
      <Btn title="ตัวหนา" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></Btn>
      <Btn title="ตัวเอียง" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></Btn>
      <Btn title="ขีดเส้นทับ" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></Btn>
      <span className="rt-sep" />
      <Btn title="หัวข้อใหญ่" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</Btn>
      <Btn title="หัวข้อย่อย" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</Btn>
      <span className="rt-sep" />
      <Btn title="รายการจุด" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>• รายการ</Btn>
      <Btn title="รายการตัวเลข" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. ลำดับ</Btn>
      <Btn title="ข้อความอ้างอิง" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>❝</Btn>
      <span className="rt-sep" />
      <Btn title="ลิงก์" active={editor.isActive("link")} onClick={setLink}>🔗</Btn>
      <Btn title="แทรกรูปในเนื้อหา" onClick={onPickImage}>🖼 รูป</Btn>
      <span className="rt-sep" />
      <Btn title="ล้างรูปแบบ" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>ล้างรูปแบบ</Btn>
    </div>
  );
}

/** ช่องแก้ข้อความแบบจัดรูปแบบได้ — คืนค่าเป็น HTML
 *  หมายเหตุความปลอดภัย: HTML ที่ได้จากที่นี่ยังถูก sanitize ซ้ำที่เซิร์ฟเวอร์เสมอ */
export default function RichText({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const imgInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    /* ต้องปิด เพราะ Next.js render ฝั่งเซิร์ฟเวอร์ก่อน — ถ้าไม่ปิดจะ hydration mismatch */
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Link.configure({ openOnClick: false, autolink: false }),
      Image.configure({ inline: false }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "rt-content",
        ...(placeholder ? { "data-placeholder": placeholder } : {}),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  if (!editor) {
    return <div className="rt-wrap"><div className="rt-content rt-loading">กำลังโหลดตัวแก้ไข...</div></div>;
  }

  /* อัปโหลดรูปแล้วแทรกลงเนื้อหาทันที — เก็บ path /uploads/.. ไว้ใน HTML
     (sanitizer ฝั่งเซิร์ฟเวอร์อนุญาตเฉพาะรูปที่อยู่ใต้ /uploads/) */
  async function insertImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editor) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const media = await adminFetch<{ url: string }>("/admin/media", { method: "POST", body: fd });
      editor.chain().focus().setImage({ src: media.url, alt: "" }).run();
    } catch (err) {
      alert(err instanceof Error ? err.message : "อัปโหลดรูปไม่สำเร็จ");
    } finally {
      setUploading(false);
      if (imgInput.current) imgInput.current.value = "";
    }
  }

  return (
    <div className="rt-wrap">
      <Toolbar editor={editor} onPickImage={() => imgInput.current?.click()} />
      <EditorContent editor={editor} />
      {uploading && <p className="rt-uploading">กำลังอัปโหลดรูป…</p>}
      <input
        ref={imgInput}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        hidden
        onChange={insertImage}
      />
    </div>
  );
}
