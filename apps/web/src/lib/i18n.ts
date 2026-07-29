/** ระบบสองภาษาแบบเบา ๆ — เส้นทาง /th /en + dictionary กลาง
 *  ข้อมูลจาก DB ใช้ field คู่ (_Th/_En): pick() เลือกตาม locale, ถ้า EN ว่างจะ fallback เป็นไทย
 */

export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export function isLocale(v: string): v is Locale {
  return (LOCALES as readonly string[]).includes(v);
}

/** เลือก field ตามภาษา เช่น pick(post, "title", "en") → post.titleEn ?? post.titleTh
 *  รับ object อะไรก็ได้ (generic) — ถ้าประกาศเป็น Record<string, unknown> ตรง ๆ
 *  จะรับ interface ไม่ได้ เพราะ interface ไม่มี implicit index signature (TS2345) */
export function pick<T extends object>(
  obj: T,
  base: string,
  locale: Locale,
): string {
  const rec = obj as Record<string, unknown>;
  const th = (rec[`${base}Th`] as string | null | undefined) ?? "";
  const en = (rec[`${base}En`] as string | null | undefined) ?? "";
  return locale === "en" && en ? en : th;
}

const th = {
  nav: {
    home: "หน้าแรก",
    about: "เกี่ยวกับศูนย์",
    solutions: "Solution & Product",
    partners: "พาร์ทเนอร์",
    blog: "กิจกรรม & ข่าวสาร",
    contact: "ติดต่อเรา",
  },
  common: {
    home: "หน้าแรก",
    readMore: "ดูรายละเอียด",
    viewAll: "ดูทั้งหมด",
    contactUs: "ติดต่อเรา",
    getStarted: "ดูโซลูชันของเรา",
    contactLab: "ติดต่อศูนย์",
    tempName: "(ชื่อชั่วคราว)",
  },
  home: {
    videoCaption: "วิดีโอแนะนำศูนย์ (ตำแหน่งตัวอย่าง — เปลี่ยนลิงก์ได้จากระบบ admin)",
    whatWeDo: "What we do",
    whatWeDoTitle: "ศูนย์ของเราทำอะไร",
    whatWeDoLead: "สามบทบาทหลักที่เชื่อมงานวิจัยในมหาวิทยาลัยเข้ากับการพัฒนาเมืองจริง",
    coreTech: "Core Technology",
    coreTechTitle1: "เทคโนโลยีหลัก",
    coreTechTitle2: "4 ด้าน",
    coreTechTitle3: "ของศูนย์",
    coreTechLead: "รากฐานที่นำไปประกอบเป็นโซลูชันสำหรับเมืองอัจฉริยะทุกตัวของเรา",
    solutionsTitle1: "โซลูชันของเรา",
    solutionsTitle2: "พร้อมนำไปใช้จริง",
    solutionsLead: "เลือกดูตามหมวด — โครงสร้างหมวดและหัวข้อย่อยจัดการผ่านระบบ admin",
    partnersTitle: "พาร์ทเนอร์ของเรา",
    partnersLead: "หน่วยงานที่ร่วมงานกับศูนย์",
    blogTitle: "กิจกรรมล่าสุดของศูนย์",
    blogLead: "อัปเดตอัตโนมัติจากระบบ Blog",
    viewAllPartners: "ดูพาร์ทเนอร์ทั้งหมด",
    viewAllPosts: "ดูกิจกรรมทั้งหมด",
    imgPlaceholder: "รูป/ภาพระบบจริงจะใส่แทนที่ตรงนี้",
  },
  about: {
    title: "เกี่ยวกับศูนย์",
    vmEyebrow: "Vision & Mission",
    vmTitle: "วิสัยทัศน์และพันธกิจ",
    vision: "วิสัยทัศน์",
    mission: "พันธกิจ",
    storyEyebrow: "Our Story",
    storyTitle1: "ความเป็นมาของ",
    milestonesTitle: "เส้นทางของศูนย์",
    milestonesLead: "เหตุการณ์สำคัญของศูนย์",
    ctaTitle: "สนใจร่วมงานหรือเยี่ยมชมศูนย์?",
    ctaLead: "ติดต่อเราเพื่อนัดหมายชมเดโมระบบ หรือหารือความร่วมมือด้านงานวิจัย",
    imgPlaceholder: "รูปทีมศูนย์วิจัย / สถานที่จริงจะใส่ตรงนี้",
  },
  solutions: {
    title: "Solution & Product",
    lead: "เราออกแบบโซลูชันจากงานวิจัยของศูนย์เอง ให้เหมาะกับโจทย์ของแต่ละเมืองและหน่วยงาน เลือกดูตามหมวดด้านล่าง",
    notice: "หมวด A / B / C เป็นชื่อชั่วคราว — เมื่อขึ้นระบบจริง ชื่อหมวด หัวข้อย่อย และหน้ารายละเอียด จะเพิ่ม/ลบ/แก้ไขได้จากระบบ admin และเมนู dropdown จะอัปเดตตามอัตโนมัติ",
    ctaTitle: "ไม่แน่ใจว่าโซลูชันไหนเหมาะกับหน่วยงานของคุณ?",
    ctaLead: "ทีมงานยินดีให้คำปรึกษาและออกแบบโซลูชันตามโจทย์ของพื้นที่",
    ctaBtn: "ปรึกษาฟรี",
    inCategory: "หัวข้อย่อยในหมวดนี้",
    detailCta: "สนใจระบบนี้? นัดชมเดโมได้เลย",
    detailCtaLead: "ทีมงานพร้อมสาธิตระบบจริงและประเมินการติดตั้งในพื้นที่ของคุณ",
    detailCtaBtn: "นัดชมเดโม / ขอใบเสนอราคา",
    imgPlaceholder: "รูประบบจริง / แผนภาพการทำงาน จะใส่แทนตรงนี้",
  },
  partners: {
    title: "พาร์ทเนอร์ของเรา",
    heading1: "หน่วยงานที่",
    heading2: "ร่วมงานกับศูนย์",
    lead: "โลโก้ทั้งหมดจัดการ (อัปโหลด/ลบ/เรียงลำดับ) ได้จากระบบ admin",
    ctaTitle: "สนใจเป็นพาร์ทเนอร์กับเรา?",
    ctaLead: "ร่วมพัฒนาเมืองอัจฉริยะไปด้วยกัน ติดต่อเราเพื่อหารือรูปแบบความร่วมมือ",
  },
  blog: {
    title: "กิจกรรม & ข่าวสาร",
    all: "ทั้งหมด",
    backToList: "← กลับไปหน้ารวมกิจกรรม",
  },
  contact: {
    title: "ติดต่อเรา",
    heading1: "คุยกับทีม",
    lead: "สอบถามข้อมูลโซลูชัน นัดชมเดโม หรือหารือความร่วมมือ ทีมงานตอบกลับภายใน 1–2 วันทำการ",
    phone: "เบอร์โทรศัพท์",
    email: "อีเมล",
    address: "ที่อยู่",
    hours: "เวลาทำการ",
    formTitle: "ส่งข้อความถึงเรา",
    fName: "ชื่อ-นามสกุล *",
    fNamePh: "ชื่อของคุณ",
    fOrg: "หน่วยงาน",
    fOrgPh: "ชื่อหน่วยงาน / บริษัท",
    fEmail: "อีเมล *",
    fPhone: "เบอร์โทร",
    fTopic: "เรื่องที่ติดต่อ",
    topics: ["สอบถามข้อมูลโซลูชัน", "นัดชมเดโม / เยี่ยมชมศูนย์", "ความร่วมมือ / พาร์ทเนอร์", "อื่น ๆ"],
    fMsg: "ข้อความ *",
    fMsgPh: "รายละเอียดที่ต้องการสอบถาม",
    note: "ระบบจริงจะติดตั้งตัวกันสแปม (Turnstile/reCAPTCHA) — ข้อความถูกเก็บใน DB และส่งเข้าอีเมลศูนย์",
    send: "ส่งข้อความ",
    sending: "กำลังส่ง...",
    ok: "ส่งข้อความเรียบร้อย ทีมงานจะติดต่อกลับโดยเร็วครับ",
    err: "ส่งไม่สำเร็จ กรุณาตรวจข้อมูลแล้วลองใหม่อีกครั้ง",
    mapTitle: "แผนที่ Google Maps จะฝังตรงนี้",
    mapLead: "ปักหมุดตำแหน่งศูนย์ที่ สจล. ลาดกระบัง — กดแล้วเปิดนำทางได้",
  },
  footer: {
    desc: "Smart City Research Center (SMC) — ศูนย์วิจัยเมืองอัจฉริยะ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง พัฒนางานวิจัยและนวัตกรรมเพื่อยกระดับคุณภาพชีวิตของคนเมืองอย่างยั่งยืน",
    menu: "เมนู",
    solutions: "โซลูชัน",
    contact: "ติดต่อเรา",
    rights: "© 2569 Smart City Research Center — KMITL. สงวนลิขสิทธิ์",
    mockTag: "ข้อมูลตัวอย่าง — แก้ไขผ่านระบบ admin ในเฟส 4",
  },
  media: {
    galleryTitle: "ภาพประกอบ",
    downloadsTitle: "เอกสารดาวน์โหลด",
    downloadsLead: "ดาวน์โหลดเอกสารประกอบเพิ่มเติมได้ที่นี่",
    download: "ดาวน์โหลด",
    close: "ปิด",
    prev: "รูปก่อนหน้า",
    next: "รูปถัดไป",
  },
  categories: { ACTIVITY: "กิจกรรม", NEWS: "ข่าว", WORK: "ผลงาน" } as Record<string, string>,
  notFound: {
    eyebrow: "Error 404",
    title: "ไม่พบหน้าที่คุณกำลังหา",
  },
  empty: {
    solutions: "ยังไม่มีโซลูชันในระบบ — เพิ่มได้ที่หน้าผู้ดูแลระบบ",
    partners: "ยังไม่มีหน่วยงานพาร์ทเนอร์ในระบบ",
    posts: "ยังไม่มีกิจกรรมหรือข่าวสาร",
  },
};

const en: typeof th = {
  nav: {
    home: "Home",
    about: "About",
    solutions: "Solution & Product",
    partners: "Partners",
    blog: "Activity & News",
    contact: "Contact Us",
  },
  common: {
    home: "Home",
    readMore: "Read more",
    viewAll: "View all",
    contactUs: "Contact us",
    getStarted: "Explore our solutions",
    contactLab: "Contact the center",
    tempName: "(placeholder name)",
  },
  home: {
    videoCaption: "Center introduction video (placeholder — link editable via admin)",
    whatWeDo: "What we do",
    whatWeDoTitle: "What our center does",
    whatWeDoLead: "Three core roles bridging university research and real-world city development",
    coreTech: "Core Technology",
    coreTechTitle1: "Our",
    coreTechTitle2: "4 core",
    coreTechTitle3: "technologies",
    coreTechLead: "The foundations behind every smart-city solution we build",
    solutionsTitle1: "Our solutions,",
    solutionsTitle2: "ready for the real world",
    solutionsLead: "Browse by category — categories and sub-topics are managed via admin",
    partnersTitle: "Our partners",
    partnersLead: "Organizations working with the center",
    blogTitle: "Latest activities",
    blogLead: "Automatically updated from the blog",
    viewAllPartners: "View all partners",
    viewAllPosts: "View all activities",
    imgPlaceholder: "Real system image goes here",
  },
  about: {
    title: "About the Center",
    vmEyebrow: "Vision & Mission",
    vmTitle: "Vision and Mission",
    vision: "Vision",
    mission: "Mission",
    storyEyebrow: "Our Story",
    storyTitle1: "The story of",
    milestonesTitle: "Our journey",
    milestonesLead: "Key milestones of the center",
    ctaTitle: "Interested in collaborating or visiting the center?",
    ctaLead: "Contact us to schedule a demo or discuss research collaboration",
    imgPlaceholder: "Research center team / facility photo goes here",
  },
  solutions: {
    title: "Solution & Product",
    lead: "We design solutions from our own research to fit each city's needs. Browse by category below.",
    notice: "Categories A / B / C are placeholders — on the live system, categories, sub-topics and detail pages are managed via admin, and the dropdown menu updates automatically.",
    ctaTitle: "Not sure which solution fits your organization?",
    ctaLead: "Our team is happy to consult and tailor a solution to your area",
    ctaBtn: "Free consultation",
    inCategory: "Topics in this category",
    detailCta: "Interested? Book a demo",
    detailCtaLead: "Our team can demonstrate the real system and assess deployment in your area",
    detailCtaBtn: "Book a demo / request a quote",
    imgPlaceholder: "Real system image / diagram goes here",
  },
  partners: {
    title: "Our Partners",
    heading1: "Organizations",
    heading2: "working with us",
    lead: "All logos are managed (upload/remove/reorder) via admin",
    ctaTitle: "Interested in partnering with us?",
    ctaLead: "Let's build smart cities together — contact us to discuss collaboration",
  },
  blog: {
    title: "Activity & News",
    all: "All",
    backToList: "← Back to all posts",
  },
  contact: {
    title: "Contact Us",
    heading1: "Talk to the",
    lead: "Ask about solutions, book a demo, or discuss collaboration. We reply within 1–2 business days.",
    phone: "Phone",
    email: "Email",
    address: "Address",
    hours: "Office hours",
    formTitle: "Send us a message",
    fName: "Full name *",
    fNamePh: "Your name",
    fOrg: "Organization",
    fOrgPh: "Organization / company",
    fEmail: "Email *",
    fPhone: "Phone",
    fTopic: "Topic",
    topics: ["Solution inquiry", "Book a demo / center visit", "Partnership", "Other"],
    fMsg: "Message *",
    fMsgPh: "What would you like to ask?",
    note: "The live system will add spam protection (Turnstile/reCAPTCHA) — messages are stored and emailed to the center",
    send: "Send message",
    sending: "Sending...",
    ok: "Message sent — we'll get back to you soon.",
    err: "Failed to send. Please check your input and try again.",
    mapTitle: "Google Maps will be embedded here",
    mapLead: "Pinned at KMITL, Ladkrabang — tap to navigate",
  },
  footer: {
    desc: "Smart City Research Center (SMC) — the smart-city research center of King Mongkut's Institute of Technology Ladkrabang, turning research and innovation into better urban quality of life.",
    menu: "Menu",
    solutions: "Solutions",
    contact: "Contact",
    rights: "© 2026 Smart City Research Center — KMITL. All rights reserved.",
    mockTag: "Sample data — editable via admin in Phase 4",
  },
  media: {
    galleryTitle: "Gallery",
    downloadsTitle: "Documents",
    downloadsLead: "Download supporting documents here",
    download: "Download",
    close: "Close",
    prev: "Previous image",
    next: "Next image",
  },
  categories: { ACTIVITY: "Activity", NEWS: "News", WORK: "Works" } as Record<string, string>,
  notFound: {
    eyebrow: "Error 404",
    title: "We couldn't find that page",
  },
  empty: {
    solutions: "No solutions yet — add them from the admin area",
    partners: "No partner organizations yet",
    posts: "No activities or news yet",
  },
};

const dicts: Record<Locale, typeof th> = { th, en };

export function dict(locale: Locale) {
  return dicts[locale];
}

export function fmtDate(iso: string, locale: Locale) {
  return new Date(iso).toLocaleDateString(
    locale === "th" ? "th-TH-u-ca-buddhist" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );
}
