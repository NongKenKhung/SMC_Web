import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordion, Stat } from "@/components/Ux";
import RichContent, { blockText } from "@/components/RichContent";
import {
  getBlocks, getContent, getPageMedia, getPartners, getPosts, getSolutionsTree, mediaUrl,
  type HeroContent,
} from "@/lib/api";
import { dict, fmtDate, isLocale, pick } from "@/lib/i18n";

const ArrowR = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const THUMB_ICONS = [
  <svg key="0" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="3" /><circle cx="12" cy="7" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="17" r="1.6" /></svg>,
  <svg key="1" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="3" /></svg>,
  <svg key="2" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /><path d="M14 3h7v7" /></svg>,
];

/* ตัวอักษรยักษ์ใน hero — ซอยเป็นรายตัวเพื่อทำอนิเมชันโผล่ทีละตัว (เทคนิคเดียวกับ gsap.com)
   SMART เป็นสีขาว ส่วน CITY ไล่จากเหลืองไปส้มทีละตัวอักษร */
const HERO_LETTERS = [..."SMART", " ", ..."CITY"];
const CITY_COLORS = ["#F9C846", "#F7A63A", "#F58A2E", "#F26B21"];

/* คำในแถบตัววิ่ง (marquee) คั่นหัวเรื่องแบบงานนิทรรศการ */
const MARQ = [
  "Smart City", "AI & Computer Vision", "IoT Sensor Network", "Big Data Platform",
  "Digital Twin", "Smart Mobility", "Research", "Innovation",
];

/* เนื้อหาเริ่มต้นของ 3 บทบาท + เทคโนโลยีหลัก
   ใช้เมื่อยังไม่มีข้อมูลในระบบ admin (กลุ่ม home.pillars / home.techs)
   พอเพิ่มรายการแรกใน admin ระบบจะใช้ข้อมูลจากฐานข้อมูลแทนทันที */
const PILLARS = {
  th: [
    { title: "งานวิจัย", en: "Research", body: "พัฒนาองค์ความรู้ด้าน AI, IoT และ Data Analytics สำหรับบริบทเมืองไทย ตีพิมพ์และต่อยอดร่วมกับเครือข่ายวิชาการ" },
    { title: "นวัตกรรมต้นแบบ", en: "Prototype", body: "แปลงงานวิจัยเป็นระบบต้นแบบที่ติดตั้งใช้งานได้จริง ทดสอบในพื้นที่จริงร่วมกับหน่วยงานท้องถิ่น" },
    { title: "บริการวิชาการ", en: "Service", body: "ให้คำปรึกษา ฝึกอบรม และถ่ายทอดเทคโนโลยีให้หน่วยงานรัฐ เอกชน และชุมชนที่ต้องการพัฒนาเมืองอัจฉริยะ" },
  ],
  en: [
    { title: "Research", en: "Research", body: "Advancing AI, IoT and data analytics for the Thai urban context, published and extended with academic networks." },
    { title: "Prototype", en: "Innovation", body: "Turning research into deployable prototype systems, field-tested with local government partners." },
    { title: "Academic Service", en: "Service", body: "Consulting, training and technology transfer for government, private sector and communities." },
  ],
};

const TECHS = {
  th: [
    { title: "IoT & Sensor Network", body: "เครือข่ายเซนเซอร์เก็บข้อมูลเมืองแบบเรียลไทม์ ทั้งจราจร สิ่งแวดล้อม และพลังงาน เชื่อมต่อผ่าน LoRa / NB-IoT / 5G" },
    { title: "AI & Computer Vision", body: "วิเคราะห์ภาพจากกล้อง CCTV ตรวจจับยานพาหนะ บุคคล และเหตุการณ์ผิดปกติ ประมวลผลได้แบบเรียลไทม์" },
    { title: "Big Data & City Platform", body: "แพลตฟอร์มรวมศูนย์ข้อมูลเมือง (City Data Platform) พร้อมแดชบอร์ดสำหรับผู้บริหารเมืองใช้ตัดสินใจ" },
    { title: "Digital Twin & Simulation", body: "แบบจำลองเมืองเสมือนสำหรับทดลองนโยบายและจำลองสถานการณ์ ก่อนลงทุนจริงในพื้นที่" },
  ],
  en: [
    { title: "IoT & Sensor Network", body: "Real-time city sensing — traffic, environment and energy — connected over LoRa / NB-IoT / 5G." },
    { title: "AI & Computer Vision", body: "CCTV analytics detecting vehicles, people and anomalies in real time." },
    { title: "Big Data & City Platform", body: "A centralized City Data Platform with dashboards for decision makers." },
    { title: "Digital Twin & Simulation", body: "Virtual city models to test policies and scenarios before real investment." },
  ],
};

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  const base = `/${locale}`;

  const [hero, tree, partners, posts, pageMedia, blocks] = await Promise.all([
    getContent<HeroContent>("home.hero", locale),
    getSolutionsTree(),
    getPartners(),
    getPosts({ take: 3 }),
    getPageMedia("home"),
    getBlocks(["home.pillars", "home.techs"]),
  ]);
  const poster = pageMedia?.poster ?? null;

  /* ถ้ามีข้อมูลใน admin ใช้ของนั้น ไม่มีก็ใช้ค่าเริ่มต้นที่ฝังมากับระบบ */
  const pillarBlocks = blocks["home.pillars"] ?? [];
  const pillars = pillarBlocks.length
    ? pillarBlocks.map((b) => ({
        title: blockText(b, "title", locale),
        en: blockText(b, "subtitle", locale),
        body: blockText(b, "body", locale),
        html: true,
      }))
    : PILLARS[locale].map((p) => ({ ...p, html: false }));

  const techBlocks = blocks["home.techs"] ?? [];
  const techs = techBlocks.length
    ? techBlocks.map((b) => ({ title: blockText(b, "title", locale), body: blockText(b, "body", locale), html: true }))
    : TECHS[locale].map((x) => ({ ...x, html: false }));

  return (
    <main>
      {/* ===== 1. Hero เต็มจอ — ตรึงจอไว้ให้ section ถัดไปเลื่อนทับแบบม่าน (เทคนิคจาก Expo) ===== */}
      <div className="hero-pin">
      <section className={`hero pin-fade${poster ? " has-poster" : ""}`}>
        {poster ? (
          <>
            <img className="poster-img" src={mediaUrl(poster.url)!} alt={poster.altTh ?? ""} />
            <span className="poster-veil" />
          </>
        ) : (
          <div className="dots" />
        )}
        {/* แสงออโรราลอยช้า ๆ (แบบ linear.app) */}
        <span className="orb orb-a" aria-hidden="true" />
        <span className="orb orb-b" aria-hidden="true" />
        <svg className="hero-net" viewBox="0 0 1440 240" fill="none" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <g stroke="#F9C846" strokeWidth="1" opacity=".45">
            <path d="M60 150 L240 90 L420 140 L600 70 L790 130 L980 60 L1170 120 L1380 80" />
            <path d="M240 90 L410 40 L600 70 M790 130 L940 170 L1170 120 M420 140 L560 180 M980 60 L1120 30 L1380 80" />
          </g>
          <g fill="#F9C846" opacity=".8">
            <circle cx="60" cy="150" r="4" /><circle cx="240" cy="90" r="5" /><circle cx="420" cy="140" r="4" />
            <circle cx="600" cy="70" r="5" /><circle cx="790" cy="130" r="4" /><circle cx="980" cy="60" r="5" />
            <circle cx="1170" cy="120" r="4" /><circle cx="1380" cy="80" r="5" />
          </g>
          <g fill="#16294F" opacity=".85">
            <rect x="0" y="190" width="70" height="50" /><rect x="80" y="165" width="55" height="75" />
            <rect x="145" y="200" width="60" height="40" /><rect x="215" y="150" width="48" height="90" />
            <rect x="275" y="185" width="70" height="55" /><rect x="360" y="160" width="45" height="80" />
            <rect x="420" y="195" width="75" height="45" /><rect x="510" y="145" width="50" height="95" />
            <rect x="575" y="185" width="66" height="55" /><rect x="655" y="165" width="46" height="75" />
            <rect x="715" y="200" width="80" height="40" /><rect x="810" y="150" width="52" height="90" />
            <rect x="875" y="185" width="66" height="55" /><rect x="955" y="160" width="48" height="80" />
            <rect x="1015" y="195" width="76" height="45" /><rect x="1105" y="140" width="50" height="100" />
            <rect x="1170" y="180" width="66" height="60" /><rect x="1250" y="160" width="46" height="80" />
            <rect x="1310" y="190" width="130" height="50" />
          </g>
        </svg>

        <div className="hero-inner">
          <span className="hero-tag">
            {hero?.eyebrow ?? "Smart City Research Center · School of Engineering · KMITL"}
          </span>
          <h1>
            {/* ซอยตัวอักษรทีละตัวเพื่อให้โผล่ไล่กัน — screen reader อ่านจาก aria-label */}
            <span className="display-en" aria-label="Smart City">
              {HERO_LETTERS.map((ch, i) =>
                ch === " " ? (
                  <span key={i} className="ltr-gap" />
                ) : (
                  <i
                    key={i}
                    aria-hidden="true"
                    className="ltr"
                    style={{ "--i": i, color: i > 5 ? CITY_COLORS[i - 6] : undefined } as React.CSSProperties}
                  >
                    {ch}
                  </i>
                ),
              )}
            </span>
            <span className="display-th">
              {hero?.titleLine1} {hero?.titleLine2}
            </span>
          </h1>
          <p className="hero-lead">{hero?.lead}</p>
          <div className="hero-cta">
            <Link href={`${base}/solutions`} className="btn btn-primary">
              {t.common.getStarted} <ArrowR />
            </Link>
            <Link href={`${base}/contact`} className="btn btn-ghost">{t.common.contactLab}</Link>
          </div>
          <div className="hero-stats">
            {hero?.stats?.map((s) => (
              <div key={s.label}><Stat value={s.value} /><span>{s.label}</span></div>
            ))}
          </div>
        </div>
      </section>
      </div>

      {/* ===== 2. บทบาทของศูนย์วิจัย — เลื่อนทับ hero แบบม่าน มีแถบตัววิ่งคั่นหัว ===== */}
      <section className="sec-x dark-sec curtain">
        <div className="marq" aria-hidden="true">
          <div className="marq-track">
            {[0, 1].map((seg) => (
              <div className="marq-seg" key={seg}>
                {MARQ.map((m, i) => (
                  <span key={i} className={i % 2 ? "o" : undefined}>{m}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <span className="ghost-head">Research</span>
        <div className="container">
          <div className="sec-head-x reveal">
            <span className="sec-label">{t.home.whatWeDo}</span>
            <h2>{t.home.whatWeDoTitle}</h2>
            <p>{t.home.whatWeDoLead}</p>
          </div>
          <div className="pillars-x">
            {pillars.map((p, i) => (
              <article className={`pillar-x glow reveal${i ? ` d${i}` : ""}`} key={`${p.title}-${i}`}>
                <div className="num-x">{String(i + 1).padStart(2, "0")}</div>
                <h3>{p.title}</h3>
                {p.en && <span className="en-x">{p.en}</span>}
                {p.html ? <RichContent html={p.body} className="prose-sm" /> : <p>{p.body}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 3. เทคโนโลยีหลัก (รูป + accordion) ===== */}
      <section className="sec-x">
        <div className="container split">
          <div className="mock-visual reveal">
            <svg width="66%" viewBox="0 0 300 300" fill="none" aria-hidden="true">
              <rect x="20" y="40" width="260" height="160" rx="12" fill="#1F3864" />
              <rect x="36" y="58" width="120" height="10" rx="5" fill="#F9C846" />
              <rect x="36" y="78" width="90" height="8" rx="4" fill="#5B7BB4" />
              <rect x="36" y="100" width="105" height="52" rx="8" fill="#16294F" />
              <path d="M44 140 L62 122 L80 132 L98 112 L116 126 L132 108" stroke="#F26B21" strokeWidth="3" strokeLinecap="round" fill="none" />
              <rect x="152" y="100" width="112" height="52" rx="8" fill="#16294F" />
              <rect x="162" y="136" width="12" height="10" rx="2" fill="#F9C846" />
              <rect x="180" y="126" width="12" height="20" rx="2" fill="#F26B21" />
              <rect x="198" y="118" width="12" height="28" rx="2" fill="#F9C846" />
              <rect x="216" y="110" width="12" height="36" rx="2" fill="#F26B21" />
              <rect x="36" y="164" width="228" height="20" rx="6" fill="#0B1730" />
              <circle cx="48" cy="174" r="4" fill="#F26B21" /><circle cx="62" cy="174" r="4" fill="#F9C846" /><circle cx="76" cy="174" r="4" fill="#5B7BB4" />
              <rect x="90" y="230" width="120" height="14" rx="7" fill="#D9E1EF" />
              <rect x="70" y="256" width="160" height="10" rx="5" fill="#E8EDF6" />
            </svg>
            <span className="ph-label">{t.home.imgPlaceholder}</span>
          </div>
          <div>
            <div className="sec-head-x reveal">
              <span className="sec-label">{t.home.coreTech}</span>
              <h2>
                {t.home.coreTechTitle1} <span className="grad">{t.home.coreTechTitle2}</span> {t.home.coreTechTitle3}
              </h2>
              <p>{t.home.coreTechLead}</p>
            </div>
            <div className="reveal d1">
              <Accordion items={techs} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== 4. โซลูชัน (รายการแถวใหญ่ กดได้ทั้งใบ) ===== */}
      <section className="sec-x soft-sec">
        <span className="ghost-head">Solutions</span>
        <div className="container">
          <div className="sec-head-x reveal">
            <span className="sec-label">Solution &amp; Product</span>
            <h2>
              {t.home.solutionsTitle1} <span className="grad">{t.home.solutionsTitle2}</span>
            </h2>
            <p>{t.home.solutionsLead}</p>
          </div>
          <div className="sol-x">
            {(tree ?? []).map((s, i) => (
              <Link href={`${base}/solutions/${s.slug}`} key={s.id} className={`sol-x-item glow reveal${i ? ` d${i}` : ""}`}>
                <span className="sol-x-num">{String(i + 1).padStart(2, "0")}</span>
                <div className="sol-x-body">
                  <h3>{pick(s, "name", locale)}</h3>
                  <p>{pick(s, "summary", locale)}</p>
                  {s.children.length > 0 && (
                    <div className="sol-x-chips">
                      {s.children.map((c) => (
                        <span className="chip" key={c.id}>{pick(c, "name", locale)}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="sol-x-go"><ArrowR /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5. พาร์ทเนอร์ ===== */}
      <section className="sec-x">
        <span className="ghost-head">Partners</span>
        <div className="container">
          <div className="sec-head-x center reveal">
            <span className="sec-label">Our Partners</span>
            <h2>{t.home.partnersTitle}</h2>
            <p>{t.home.partnersLead}</p>
          </div>
          <div className="logo-row reveal">
            {(partners ?? []).slice(0, 5).map((p) => (
              <div className="logo-card" key={p.id}>
                {p.logoUrl ? <img src={mediaUrl(p.logoUrl)!} alt={p.name} /> : <b>{p.name}</b>}
                <span>{p.caption}</span>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: "var(--sp-10)" }} className="reveal d1">
            <Link className="btn btn-navy" href={`${base}/partners`}>{t.home.viewAllPartners}</Link>
          </p>
        </div>
      </section>

      {/* ===== 6. กิจกรรมล่าสุด ===== */}
      <section className="sec-x soft-sec">
        <span className="ghost-head">News</span>
        <div className="container">
          <div className="sec-head-x center reveal">
            <span className="sec-label">Activity &amp; News</span>
            <h2>{t.home.blogTitle}</h2>
            <p>{t.home.blogLead}</p>
          </div>
          <div className="post-grid">
            {(posts ?? []).map((p, i) => (
              <Link href={`${base}/blog/${p.slug}`} key={p.id} className={`post-card glow reveal${i ? ` d${i}` : ""}`}>
                <div className={`thumb t${p.id % 6}`}>
                  {p.coverImage ? <img src={mediaUrl(p.coverImage)!} alt="" /> : THUMB_ICONS[i % THUMB_ICONS.length]}
                </div>
                <div className="post-body">
                  <div className="post-meta">
                    <span className={`badge${p.category === "WORK" ? " b-navy" : ""}`}>
                      {t.categories[p.category] ?? p.category}
                    </span>
                    <span>{fmtDate(p.publishedAt, locale)}</span>
                  </div>
                  <h3>{pick(p, "title", locale)}</h3>
                  <p className="post-x">{pick(p, "excerpt", locale)}</p>
                </div>
              </Link>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: "var(--sp-12)" }} className="reveal">
            <Link className="btn btn-primary" href={`${base}/blog`}>{t.home.viewAllPosts}</Link>
          </p>
        </div>
      </section>

      {/* ===== 7. ปิดท้าย ===== */}
      <section className="closing">
        <div className="container">
          <span className="eyebrow closing-eyebrow">
            {hero?.eyebrow ?? "Smart City Research Center · School of Engineering · KMITL"}
          </span>
        </div>
      </section>
    </main>
  );
}
