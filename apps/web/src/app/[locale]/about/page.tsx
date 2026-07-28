import Link from "next/link";
import { notFound } from "next/navigation";
import PageBanner from "@/components/PageBanner";
import { getContent, getPageMedia, type AboutContent } from "@/lib/api";
import { dict, isLocale } from "@/lib/i18n";

/* Timeline mock — จะย้ายเข้า DB/admin ในเฟส 4 */
const TIMELINE = {
  th: [
    { year: "2564", title: "ก่อตั้งศูนย์วิจัย SMC", body: "รวมทีมวิจัยด้าน AI / IoT ก่อตั้งศูนย์วิจัยเมืองอัจฉริยะที่ สจล." },
    { year: "2565", title: "โครงการนำร่องแรก", body: "ทดลองระบบจราจรอัจฉริยะร่วมกับเทศบาลตัวอย่าง เก็บข้อมูลและปรับปรุงระบบจากการใช้งานจริง" },
    { year: "2566", title: "ขยายเครือข่ายความร่วมมือ", body: "ลงนาม MOU กับหน่วยงาน 3 แห่ง และเปิดตัว City Data Platform เวอร์ชันแรก" },
    { year: "2567–ปัจจุบัน", title: "ขยายผลสู่ 5 จังหวัด", body: "นำโซลูชัน Smart CCTV และระบบตรวจวัดสิ่งแวดล้อมไปติดตั้งใช้งานจริงในหลายพื้นที่" },
  ],
  en: [
    { year: "2021", title: "SMC founded", body: "AI / IoT researchers founded the smart-city research center at KMITL." },
    { year: "2022", title: "First pilot project", body: "Piloted an intelligent traffic system with a partner municipality, iterating from real usage." },
    { year: "2023", title: "Growing partnerships", body: "Signed MOUs with 3 organizations and launched the first City Data Platform." },
    { year: "2024–present", title: "Scaling to 5 provinces", body: "Deployed Smart CCTV and environmental monitoring solutions across multiple areas." },
  ],
};

const STORY = {
  th: [
    "Smart City Research Center (SMC) ก่อตั้งขึ้นโดยทีมอาจารย์และนักวิจัย คณะวิศวกรรมศาสตร์ สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง จากความตั้งใจที่จะนำงานวิจัยด้าน AI, IoT และข้อมูลเมือง ออกจากห้องแลปไปสู่การใช้งานจริง",
    "ปัจจุบันแลปทำงานร่วมกับเทศบาล หน่วยงานภาครัฐ และภาคเอกชนหลายแห่ง ทั้งโครงการนำร่องและโครงการติดตั้งจริง ครอบคลุมระบบจราจร ความปลอดภัย สิ่งแวดล้อม และแพลตฟอร์มข้อมูลเมือง",
  ],
  en: [
    "Smart City Research Center (SMC) was founded by faculty and researchers of the Faculty of Engineering, KMITL, with the intent of taking AI, IoT and urban-data research out of the lab and into the real world.",
    "Today the lab works with municipalities, government agencies and private partners on both pilots and production deployments — covering traffic, safety, environment and city data platforms.",
  ],
};

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = dict(locale);
  const base = `/${locale}`;
  const about = await getContent<AboutContent>("about.main", locale);
  const pageMedia = await getPageMedia("about");

  return (
    <main>
      <PageBanner
        poster={pageMedia?.poster}
        title={t.about.title}
        crumbs={[{ label: t.common.home, href: base }, { label: t.about.title }]}
      />

      {/* วิสัยทัศน์ / พันธกิจ */}
      <section className="sec">
        <div className="container">
          <div className="sec-head reveal">
            <span className="eyebrow">{t.about.vmEyebrow}</span>
            <h2>{t.about.vmTitle}</h2>
          </div>
          <div className="vm-grid">
            <div className="vm-card vision reveal">
              <h3>{t.about.vision}</h3>
              <p>{about?.vision}</p>
            </div>
            <div className="vm-card mission reveal d1">
              <h3>{t.about.mission}</h3>
              <ul>
                {about?.missions?.map((m) => (
                  <li key={m}><span className="tick">✓</span> {m}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          <span>SMART CITY</span><span className="o">RESEARCH</span><span>INNOVATION</span><span className="o">KMITL</span>
          <span>SMART CITY</span><span className="o">RESEARCH</span><span>INNOVATION</span><span className="o">KMITL</span>
        </div>
      </div>

      {/* ความเป็นมา */}
      <section className="sec">
        <div className="container history">
          <div className="mock-visual reveal">
            <svg width="60%" viewBox="0 0 300 240" fill="none" aria-hidden="true">
              <rect x="30" y="150" width="34" height="70" fill="#1F3864" />
              <rect x="72" y="120" width="40" height="100" fill="#16294F" />
              <rect x="120" y="90" width="34" height="130" fill="#1F3864" />
              <rect x="162" y="130" width="44" height="90" fill="#2E4E86" />
              <rect x="214" y="105" width="36" height="115" fill="#16294F" />
              <circle cx="150" cy="46" r="26" fill="#F9C846" opacity=".9" />
              <path d="M40 70 L110 40 L180 66 L250 36" stroke="#F26B21" strokeWidth="3" strokeLinecap="round" />
              <circle cx="40" cy="70" r="5" fill="#F26B21" /><circle cx="110" cy="40" r="5" fill="#F26B21" />
              <circle cx="180" cy="66" r="5" fill="#F26B21" /><circle cx="250" cy="36" r="5" fill="#F26B21" />
            </svg>
            <span className="ph-label">{t.about.imgPlaceholder}</span>
          </div>
          <div>
            <div className="sec-head left reveal">
              <span className="eyebrow">{t.about.storyEyebrow}</span>
              <h2>{t.about.storyTitle1} <span className="grad">SMC</span></h2>
            </div>
            <div className="reveal d1">
              {STORY[locale].map((p) => (
                <p key={p.slice(0, 20)}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="sec soft-sec">
        <div className="container">
          <div className="sec-head reveal">
            <span className="eyebrow">Milestones</span>
            <h2>{t.about.milestonesTitle}</h2>
            <p className="lead">{t.about.milestonesLead}</p>
          </div>
          <div className="timeline">
            {TIMELINE[locale].map((item) => (
              <div className="tl-item reveal" key={item.year}>
                <div className="tl-year">{item.year}</div>
                <div className="tl-card">
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="sec-tight">
        <div className="container">
          <div className="cta-band reveal">
            <div>
              <h3>{t.about.ctaTitle}</h3>
              <p>{t.about.ctaLead}</p>
            </div>
            <Link className="btn" href={`${base}/contact`}>{t.common.contactUs}</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
