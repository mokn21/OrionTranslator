import { useState } from "react";
import { ArrowLeft, Check, ChevronLeft, CircleHelp, Download, Eye, Gamepad2, Headphones, MonitorPlay, Smartphone, Sparkles, Tv, Wifi, X } from "lucide-react";

const steps = [
  { number: "01", title: "شبّك الجهاز", text: "ثبّت APK على Android TV من تطبيق Downloader، أو افتح وضع الجوال من المتصفح." },
  { number: "02", title: "ابدأ جلسة", text: "استخدم رمز الجلسة لربط الشاشة مع جوالك بدون إدخال كلمة مرور سوني." },
  { number: "03", title: "العب بالعربي", text: "تظهر الترجمة العربية فوق النص الإنجليزي مع تحكم كامل بالمكان والحجم." },
];

export default function Home() {
  const [device, setDevice] = useState<"tv" | "phone">("tv");
  const [started, setStarted] = useState(false);
  const [size, setSize] = useState("متوسط");
  const [position, setPosition] = useState("أسفل");

  return (
    <main className="site-shell">
      <nav className="topbar">
        <a className="brand" href="/" aria-label="سرد عربي"><span className="brand-mark">س</span><span>سرد <b>عربي</b></span></a>
        <div className="nav-links"><a href="#how">كيف يشتغل؟</a><a href="#download">التنزيل</a><a href="#safety">الأمان</a></div>
        <button className="nav-cta" onClick={() => document.getElementById("session")?.scrollIntoView({ behavior: "smooth" })}>ابدأ الآن <ArrowLeft size={16} /></button>
      </nav>

      <section className="hero section-pad">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot" /> ترجمة فورية لألعاب الكونسول</div>
          <h1>خل الترجمة<br /><em>تمشي معك.</em></h1>
          <p className="hero-lead">شوف كلام اللعبة بالعربي فوق الإنجليزي، على شاشة Android TV أو على جوالك وآيبادك. بدون ما توقف لعبك.</p>
          <div className="hero-actions"><button className="primary-btn" onClick={() => document.getElementById("session")?.scrollIntoView({ behavior: "smooth" })}>جرّب لوحة التحكم <ArrowLeft size={18} /></button><a className="text-btn" href="#how">اعرف الطريقة <ChevronLeft size={17} /></a></div>
          <div className="hero-note"><Wifi size={15} /> يعمل مع جلسة Share Screen · لا نطلب كلمة مرور حساب سوني</div>
        </div>
        <div className="hero-visual" aria-label="معاينة شاشة اللعبة والترجمة">
          <div className="orb orb-one" /><div className="orb orb-two" />
          <div className="tv-frame"><div className="tv-top"><span className="live-pill"><span /> LIVE</span><span>SHARE SCREEN</span></div><div className="game-scene"><div className="scene-sun" /><div className="scene-mountain" /><div className="scene-ground" /><div className="dialogue english">I need to find the old station before nightfall.</div><div className="dialogue arabic">لازم ألقى المحطة القديمة قبل ما يجي الليل.</div></div><div className="tv-foot" /></div>
          <div className="floating-tag tag-top"><Sparkles size={15} /> ترجمة ذكية</div><div className="floating-tag tag-bottom"><span className="mini-signal" /> متصل الآن</div>
        </div>
      </section>

      <section className="trust-row section-pad"><div><span className="trust-icon"><Tv size={17} /></span><span><b>شاشة TV</b><small>وضع العرض الرئيسي</small></span></div><div><span className="trust-icon mint"><Smartphone size={17} /></span><span><b>جوال وآيباد</b><small>مشاهدة وتحكم</small></span></div><div><span className="trust-icon violet"><Headphones size={17} /></span><span><b>بدون إزعاج</b><small>الترجمة فوق المشهد</small></span></div></section>

      <section id="how" className="how section-pad"><div className="section-kicker">ثلاث خطوات وتبدأ</div><h2>من اللعبة إلى العربي<br /><span>بأقل من دقيقة.</span></h2><div className="steps">{steps.map((step) => <div className="step" key={step.number}><span className="step-num">{step.number}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></div>)}</div></section>

      <section id="session" className="session-wrap section-pad"><div className="session-heading"><div><div className="section-kicker">لوحة التحكم</div><h2>جهّز جلستك</h2></div><span className="beta-badge">نسخة تجريبية</span></div><div className="session-card"><div className="device-switch"><button className={device === "tv" ? "active" : ""} onClick={() => setDevice("tv")}><Tv size={17} /> شاشة Android TV</button><button className={device === "phone" ? "active" : ""} onClick={() => setDevice("phone")}><Smartphone size={17} /> جوال / آيباد</button></div><div className="session-grid"><div className="connection-panel"><div className="connection-icon"><Gamepad2 size={23} /></div><div><span className="status-label"><span className="status-dot" /> جاهز للاتصال</span><h3>{device === "tv" ? "اربط شاشة الـTV" : "شاهد من جوالك"}</h3><p>{started ? "الجلسة جاهزة — افتح التطبيق على جهازك الثاني." : "أنشئ جلسة، ثم أدخل الرمز في جهازك الآخر."}</p></div><button className="primary-btn full" onClick={() => setStarted(true)}>{started ? "تم إنشاء الجلسة" : "إنشاء جلسة جديدة"}<ArrowLeft size={17} /></button>{started && <div className="code-box"><small>رمز الجلسة</small><strong>SA-7K4P</strong><button aria-label="إغلاق" onClick={() => setStarted(false)}><X size={15} /></button></div>}</div><div className="settings-panel"><div className="panel-title"><span>إعدادات الترجمة</span><span className="auto-chip"><Check size={13} /> عربي تلقائي</span></div><label>حجم الخط<select value={size} onChange={(e) => setSize(e.target.value)}><option>صغير</option><option>متوسط</option><option>كبير</option></select></label><label>مكان الترجمة<select value={position} onChange={(e) => setPosition(e.target.value)}><option>أسفل</option><option>أعلى</option><option>وسط</option></select></label><div className="preview-box"><span className="preview-english">The door is locked.</span><span className={`preview-arabic size-${size}`}>الباب مقفل.</span></div></div></div></div></section>

      <section id="download" className="download section-pad"><div className="download-copy"><div className="section-kicker">التطبيق على الشاشة</div><h2>نزّل APK<br /><span>وخله فوق اللعبة.</span></h2><p>على Android TV، افتح Downloader والصق رابط التنزيل. التطبيق مخصص لعرض جلسة المشاركة والترجمة فوق النص الإنجليزي.</p><button className="outline-btn"><Download size={17} /> رابط APK — قريباً</button></div><div className="download-card"><div className="download-card-icon"><MonitorPlay size={25} /></div><strong>سرد عربي للـ Android TV</strong><span>الإصدار الأول قيد التجهيز</span><div className="progress-line"><i /></div><small>سيظهر رابط التحميل هنا بعد إصدار أول نسخة APK.</small></div></section>

      <section id="safety" className="safety section-pad"><CircleHelp size={20} /><p><b>خصوصيتك أولاً.</b> لا تدخل كلمة مرور PlayStation في موقع سرد عربي. الربط يكون برمز جلسة أو تدفق تسجيل رسمي فقط، ونوضح لك كل صلاحية يطلبها التطبيق.</p></section>
      <footer><a className="brand" href="/"><span className="brand-mark">س</span><span>سرد <b>عربي</b></span></a><span>ترجمة ألعابك، بدون ما توقف لعبك.</span><span>© 2026 سرد عربي</span></footer>
    </main>
  );
}
