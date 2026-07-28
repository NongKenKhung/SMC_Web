/** หน้าจอ 404 — ขึ้นเลข 404 อย่างเดียว
 *  ใช้ร่วมกันทั้งตัวระดับราก (URL มั่ว) และตัวในเส้นทางภาษา
 *  ไม่มีข้อความอื่นแล้ว จึงไม่ต้องรู้ภาษา และไม่ต้องเป็น client component */
export default function NotFoundView() {
  return (
    <main>
      <section className="nf">
        <div className="dots" />
        <span className="orb orb-a" aria-hidden="true" />
        <span className="orb orb-b" aria-hidden="true" />
        <h1 className="nf-code">404</h1>
      </section>
    </main>
  );
}
