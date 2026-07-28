"use client";

import QRCode from "qrcode";

/** ระดับการกู้คืนข้อมูลของ QR — เลือก H เมื่อมีโลโก้ทับตรงกลาง
 *  H กู้คืนได้ถึง 30% จึงยอมให้โลโก้บังได้โดยยังสแกนติด */
export type QrLevel = "M" | "Q" | "H";

export interface QrStyle {
  /** ด้านกว้างของรูป (px) — ใช้ตอนดาวน์โหลด PNG */
  size: number;
  /** สีจุด และสีพื้น */
  dark: string;
  light: string;
  /** ขอบขาวรอบ QR (หน่วยเป็น "ช่อง" ตามสเปก ไม่ใช่ px) */
  margin: number;
  level: QrLevel;
  /** ใส่โลโก้ตรงกลางไหม */
  logo: boolean;
  /** ข้อความใต้ QR (เว้นว่าง = ไม่ใส่) */
  caption: string;
}

export const DEFAULT_STYLE: QrStyle = {
  size: 1024,
  dark: "#10203e",
  light: "#ffffff",
  margin: 2,
  level: "H",
  logo: true,
  caption: "",
};

/** วาด QR ลง canvas พร้อมโลโก้และคำบรรยาย แล้วคืน canvas
 *  ใช้ทั้งตอนแสดงตัวอย่างและตอนดาวน์โหลด (ต่างกันแค่ขนาด) */
export async function drawQr(
  text: string,
  style: QrStyle,
  logoImg?: HTMLImageElement | null,
): Promise<HTMLCanvasElement> {
  const { size, dark, light, margin, level, caption } = style;

  /* ความสูงส่วนคำบรรยาย คิดเป็นสัดส่วนของขนาด QR จะได้คมทุกความละเอียด */
  const capSize = caption ? Math.round(size * 0.062) : 0;
  const capPad = caption ? Math.round(size * 0.055) : 0;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size + capPad + capSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("เบราว์เซอร์นี้วาดรูปไม่ได้");

  ctx.fillStyle = light;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  /* วาด QR ลง canvas ชั่วคราวก่อน แล้วค่อยแปะ — กันไม่ให้ toCanvas ล้างพื้นที่คำบรรยาย */
  const qrCanvas = document.createElement("canvas");
  await QRCode.toCanvas(qrCanvas, text, {
    width: size,
    margin,
    errorCorrectionLevel: level,
    color: { dark, light },
  });
  ctx.drawImage(qrCanvas, 0, 0, size, size);

  /* โลโก้ตรงกลาง วางบนแผ่นสีพื้นให้ตัดกับลาย QR */
  if (style.logo && logoImg?.complete && logoImg.naturalWidth > 0) {
    const box = Math.round(size * 0.21);
    const x = Math.round((size - box) / 2);
    const pad = Math.round(box * 0.12);
    const r = Math.round(box * 0.18);

    ctx.fillStyle = light;
    ctx.beginPath();
    ctx.roundRect(x - pad, x - pad, box + pad * 2, box + pad * 2, r);
    ctx.fill();

    /* คงสัดส่วนโลโก้ ไม่ให้ยืด */
    const ratio = logoImg.naturalWidth / logoImg.naturalHeight;
    const w = ratio >= 1 ? box : box * ratio;
    const h = ratio >= 1 ? box / ratio : box;
    ctx.drawImage(logoImg, (size - w) / 2, (size - h) / 2, w, h);
  }

  if (caption) {
    ctx.fillStyle = dark;
    ctx.font = `600 ${capSize}px Sarabun, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(caption, size / 2, size + capPad / 2 + capSize / 2, size * 0.94);
  }

  return canvas;
}

/** QR แบบ SVG — เหมาะกับงานพิมพ์ ขยายเท่าไหร่ก็ไม่แตก
 *  (ไม่มีโลโก้/คำบรรยาย เพราะเป็นเวกเตอร์ล้วนจากไลบรารี) */
export function qrSvg(text: string, style: QrStyle): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    margin: style.margin,
    errorCorrectionLevel: style.level,
    color: { dark: style.dark, light: style.light },
  });
}

/** ตั้งชื่อไฟล์จาก URL ให้อ่านรู้เรื่อง เช่น qr-solutions-smart-traffic.png */
export function qrFileName(url: string, ext: string) {
  let slug = "home";
  try {
    const p = new URL(url).pathname.replace(/^\/(th|en)\/?/, "").replace(/\/+$/, "");
    if (p) slug = p.replace(/\//g, "-");
  } catch {
    /* URL ที่ผู้ใช้พิมพ์เองอาจยังไม่สมบูรณ์ — ใช้ชื่อกลาง ๆ ไปก่อน */
  }
  return `qr-${slug}.${ext}`.replace(/[^\w.-]/g, "");
}

/** สั่งดาวน์โหลด blob ออกมาเป็นไฟล์ */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  /* ปล่อยหน่วยความจำหลังเบราว์เซอร์เริ่มดาวน์โหลดแล้ว */
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
