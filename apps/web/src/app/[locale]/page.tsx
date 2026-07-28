import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordion } from "@/components/Ux";
import {
  getContent, getPageMedia, getPartners, getPosts, getSolutionsTree, mediaUrl,
  type HeroContent,
} from "@/lib/api";
import { dict, fmtDate, isLocale, pick } from "@/lib/i18n";

const ArrowR = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SOL_ICONS = [
  <svg key="0" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="3" /><circle cx="12" cy="7" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="17" r="1.6" /></svg>,
  <svg key="1" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14" /><path d="M9 10h2M9 14h2M13 10h2M13 14h2M11 21v-4h2v4" /></svg>,
  <svg key="2" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="3" /></svg>,
];

const THUMB_ICONS = [
  <svg key="0" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="3" /><circle cx="12" cy="7" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="17" r="1.6" /></svg>,
  <svg key="1" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="3" /></svg>,
  <svg key="2" width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /><path d="M14 3h7v7" /></svg>,
];

/* เนื้อหา 3 บทบาท + เทคโนโลยี 4 ด้าน (จะย้ายเข้า SiteContent ในเฟส 4) */
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

  const [hero, tree, partners, posts, pageMedia] = await Promise.all([
    getContent<HeroContent>("home.hero", locale),
    getSolutionsTree(),
    getPartners(),
    getPosts({ take: 3 }),
    getPageMedia("home"),
  ]);
  const poster = pageMedia?.poster ?? null;

  return (
    <main>
      {/* ===== Hero ===== */}
      <section className={`hero${poster ? " has-poster" : ""}`}>
        {poster ? (
          <>
            <img className="poster-img" src={mediaUrl(poster.url)!} alt={poster.altTh ?? ""} />
            <span className="poster-veil" />
          </>
        ) : (
          <div className="dots" />
        )}
        <svg className="hero-net" viewBox="0 0 1440 240" fill="none" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <g stroke="#F9C846" strokeWidth="1" opacity=".5">
            <path d="M60 150 L240 90 L420 140 L600 70 L790 130 L980 60 L1170 120 L1380 80" />
            <path d="M240 90 L410 40 L600 70 M790 130 L940 170 L1170 120 M420 140 L560 180 M980 60 L1120 30 L1380 80" />
          </g>
          <g fill="#F9C846" opacity=".85">
            <circle cx="60" cy="150" r="4" /><circle cx="240" cy="90" r="5" /><circle cx="420" cy="140" r="4" />
            <circle cx="600" cy="70" r="5" /><circle cx="790" cy="130" r="4" /><circle cx="980" cy="60" r="5" />
            <circle cx="1170" cy="120" r="4" /><circle cx="1380" cy="80" r="5" /><circle cx="410" cy="40" r="3" />
            <circle cx="940" cy="170" r="3" /><circle cx="1120" cy="30" r="3" /><circle cx="560" cy="180" r="3" />
          </g>
          <g fill="#16294F" opacity=".9">
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
          <span className="eyebrow">{hero?.eyebrow ?? "Smart City Research Center · School of Engineering · KMITL"}</span>
          <h1 className="reveal in">
            {hero?.titleLine1} <span className="grad">{hero?.titleLine2}</span>
          </h1>
          <p className="lead reveal in d1">{hero?.lead}</p>
          <div className="hero-cta reveal in d2">
            <Link href={`${base}/solutions`} className="btn btn-primary">
              {t.common.getStarted} <ArrowR />
            </Link>
            <Link href={`${base}/contact`} className="btn btn-ghost">{t.common.contactLab}</Link>
          </div>
          <div className="hero-stats reveal in d3">
            {hero?.stats?.map((s) => (
              <div key={s.label}><b>{s.value}</b><span>{s.label}</span></div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== วิดีโอ ===== */}
      <section className="sec">
        <div className="container">
          <figure className="video-card reveal">
            <div className="dots2" />
            <button className="play-btn" title={t.home.videoCaption} aria-label="Play">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </button>
            <figcaption>{t.home.videoCaption}</figcaption>
          </figure>
        </div>
      </section>

      {/* ===== 3 บทบาท ===== */}
      <section className="sec dark-sec">
        <div className="container">
          <div className="sec-head reveal">
            <span className="eyebrow">{t.home.whatWeDo}</span>
            <h2>{t.home.whatWeDoTitle}</h2>
            <p className="lead">{t.home.whatWeDoLead}</p>
          </div>
          <div className="pillars">
            {PILLARS[locale].map((p, i) => (
              <article className={`pillar reveal${i ? ` d${i}` : ""}`} key={p.title}>
                <div className="p-icon">
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    {i === 0 && <><path d="M9 3h6M10 3v5.5L4.7 18a2 2 0 0 0 1.8 3h11a2 2 0 0 0 1.8-3L14 8.5V3" /><path d="M7 15h10" /></>}
                    {i === 1 && <><path d="M12 2l8 4.5v9L12 20l-8-4.5v-9L12 2z" /><path d="M12 11l8-4.5M12 11v9M12 11L4 6.5" /></>}
                    {i === 2 && <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>}
                  </svg>
                </div>
                <h3>{p.title} <em>{p.en}</em></h3>
                <p>{p.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== เทคโนโลยีหลัก ===== */}
      <section className="sec">
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
            <div className="sec-head left reveal">
              <span className="eyebrow">{t.home.coreTech}</span>
              <h2>
                {t.home.coreTechTitle1} <span className="grad">{t.home.coreTechTitle2}</span> {t.home.coreTechTitle3}
              </h2>
              <p className="lead">{t.home.coreTechLead}</p>
            </div>
            <div className="reveal d1">
              <Accordion items={TECHS[locale]} />
            </div>
          </div>
        </div>
      </section>

      {/* ===== โซลูชัน ===== */}
      <section className="sec soft-sec">
        <div className="container">
          <div className="sec-head reveal">
            <span className="eyebrow">Solution &amp; Product</span>
            <h2>
              {t.home.solutionsTitle1} <span className="grad">{t.home.solutionsTitle2}</span>
            </h2>
            <p className="lead">{t.home.solutionsLead}</p>
          </div>
          <div className="sol-grid">
            {(tree ?? []).map((s, i) => (
              <article className={`card reveal${i ? ` d${i}` : ""}`} key={s.id}>
                <div className="sol-icon">{SOL_ICONS[i % SOL_ICONS.length]}</div>
                <h3>{pick(s, "name", locale)}</h3>
                <p>{pick(s, "summary", locale)}</p>
                <div className="chips">
                  {s.children.map((c) => (
                    <span className="chip" key={c.id}>{pick(c, "name", locale)}</span>
                  ))}
                </div>
                <Link className="more" href={`${base}/solutions/${s.slug}`}>
                  {t.common.readMore} <ArrowR />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== พาร์ทเนอร์ ===== */}
      <section className="sec">
        <div className="container">
          <div className="sec-head reveal">
            <span className="eyebrow">Our Partners</span>
            <h2>{t.home.partnersTitle}</h2>
            <p className="lead">{t.home.partnersLead}</p>
          </div>
          <div className="logo-row reveal">
            {(partners ?? []).slice(0, 5).map((p) => (
              <div className="logo-card" key={p.id}>
                {p.logoUrl ? <img src={mediaUrl(p.logoUrl)!} alt={p.name} /> : <b>{p.name}</b>}
                <span>{p.caption}</span>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 34 }} className="reveal d1">
            <Link className="btn btn-navy" href={`${base}/partners`}>{t.home.viewAllPartners}</Link>
          </p>
        </div>
      </section>

      {/* ===== กิจกรรมล่าสุด ===== */}
      <section className="sec soft-sec">
        <div className="container">
          <div className="sec-head reveal">
            <span className="eyebrow">Activity &amp; News</span>
            <h2>{t.home.blogTitle}</h2>
            <p className="lead">{t.home.blogLead}</p>
          </div>
          <div className="post-grid">
            {(posts ?? []).map((p, i) => (
              <Link href={`${base}/blog/${p.slug}`} key={p.id} className={`post-card reveal${i ? ` d${i}` : ""}`}>
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
          <p style={{ textAlign: "center", marginTop: 44 }} className="reveal">
            <Link className="btn btn-primary" href={`${base}/blog`}>{t.home.viewAllPosts}</Link>
          </p>
        </div>
      </section>

      {/* ===== ปิดท้าย: eyebrow bookend (คู่กับหัว hero ด้านบน) ===== */}
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
