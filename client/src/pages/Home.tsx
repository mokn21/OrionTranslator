import { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Copy, ImagePlus, Loader2, Play, ScanText, Trash2, Upload, WandSparkles } from "lucide-react";

type Selection = { x: number; y: number; width: number; height: number };
type HistoryItem = { source: string; translation: string; createdAt: number };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function Home() {
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [ocrText, setOcrText] = useState("");
  const [currentTranslation, setCurrentTranslation] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [status, setStatus] = useState("أنشئ جلسة ثم ارفع لقطة واضحة من اللعبة.");
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Awaited<ReturnType<typeof createWorker>> | null>(null);

  const createSession = trpc.sessions.create.useMutation();
  const translate = trpc.sessions.translate.useMutation();

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      void workerRef.current?.terminate();
    };
  }, []);

  const startSession = async () => {
    setError("");
    setStatus("ننشيء جلسة جديدة...");
    try {
      const result = await createSession.mutateAsync();
      setSessionCode(result.code);
      setStatus("الجلسة جاهزة. ارفع صورة ثم ارسم مستطيلاً حول الحوار.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر إنشاء الجلسة");
      setStatus("فشل إنشاء الجلسة");
    }
  };

  const onFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("اختر ملف صورة بصيغة PNG أو JPG أو WEBP.");
      return;
    }
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setSelection(null);
    setOcrText("");
    setCurrentTranslation("");
    setError("");
    setStatus("الصورة جاهزة. ارسم منطقة الكلام داخلها.");
  };

  const pointFromEvent = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
    };
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!imageUrl) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart(pointFromEvent(event));
    setSelection({ ...pointFromEvent(event), width: 0, height: 0 });
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart) return;
    const point = pointFromEvent(event);
    setSelection({
      x: Math.min(dragStart.x, point.x),
      y: Math.min(dragStart.y, point.y),
      width: Math.abs(point.x - dragStart.x),
      height: Math.abs(point.y - dragStart.y),
    });
  };

  const onPointerUp = () => {
    if (selection && (selection.width < 0.02 || selection.height < 0.02)) setSelection(null);
    setDragStart(null);
  };

  const runOcr = async () => {
    setError("");
    if (!sessionCode) return setError("أنشئ جلسة أولاً.");
    if (!imageFile || !imageRef.current) return setError("ارفع صورة أولاً.");
    if (!selection || selection.width < 0.02 || selection.height < 0.02) return setError("حدد مستطيلاً حول النص أولاً.");
    setIsOcrRunning(true);
    setProgress(0);
    setStatus("نحمّل محرك OCR المجاني لأول مرة...");
    try {
      if (!workerRef.current) {
        workerRef.current = await createWorker("eng", 1, {
          logger: message => {
            if (typeof message.progress === "number") setProgress(Math.round(message.progress * 100));
          },
        });
      }
      const image = imageRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * selection.width));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * selection.height));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("تعذر تجهيز منطقة الصورة");
      context.drawImage(image, image.naturalWidth * selection.x, image.naturalHeight * selection.y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
      setStatus("نقرأ النص من المنطقة المحددة...");
      const result = await workerRef.current.recognize(canvas);
      const text = result.data.text.replace(/\s+/g, " ").trim();
      if (!text) throw new Error("لم يتم العثور على نص. جرّب تحديد منطقة أكبر أو صورة أوضح.");
      setOcrText(text);
      const previous = history.find(item => item.source.toLowerCase() === text.toLowerCase());
      if (previous) {
        setCurrentTranslation(previous.translation);
        setStatus("هذه الجملة موجودة في السجل، لم نكرر طلب الترجمة.");
        return;
      }
      setStatus("نترجم النص إلى العربية...");
      const translated = await translate.mutateAsync({ code: sessionCode, text });
      setCurrentTranslation(translated.translation);
      setHistory(items => [...items, translated]);
      setStatus("اكتملت الترجمة بنجاح.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "فشل OCR أو الترجمة");
      setStatus("تعذر إكمال المعالجة");
    } finally {
      setIsOcrRunning(false);
    }
  };

  const clearHistory = () => { setHistory([]); setCurrentTranslation(""); setOcrText(""); };

  return (
    <main className="workspace" dir="rtl">
      <header className="workspace-header"><div><div className="brand-line"><span className="brand-mark">س</span><strong>سرد عربي</strong><span className="real-badge">نسخة فعلية للصورة</span></div><h1>اختبر الترجمة من لقطة لعبة</h1><p>ارفع صورة من الآيباد، حدد مكان الحوار، ثم شغّل OCR والترجمة فعلياً.</p></div><div className="session-box">{sessionCode ? <><small>رمز الجلسة</small><strong>{sessionCode}</strong><button onClick={() => navigator.clipboard?.writeText(sessionCode)} title="نسخ الرمز"><Copy size={15} /></button></> : <button className="primary" onClick={startSession} disabled={createSession.isPending}><Play size={16} /> إنشاء جلسة حقيقية</button>}</div></header>
      <div className="notice"><CheckCircle2 size={17} /><span><b>هذه المرحلة لا تلتقط Remote Play.</b> نختبر الآن السلسلة الحقيقية من صورة مرفوعة فقط.</span></div>
      <section className="work-grid">
        <div className="card input-card"><div className="card-title"><span><Upload size={18} /> 1. ارفع صورة</span><small>PNG / JPG / WEBP</small></div><input ref={fileInputRef} type="file" accept="image/*" hidden onChange={event => onFile(event.target.files?.[0])} /><button className="upload-zone" onClick={() => fileInputRef.current?.click()}><ImagePlus size={32} /><b>{imageFile ? imageFile.name : "اضغط لاختيار صورة"}</b><small>اختر لقطة فيها حوار إنجليزي واضح</small></button>{imageUrl && <div className="image-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}><img ref={imageRef} src={imageUrl} alt="لقطة اللعبة" draggable={false} />{selection && <div className="selection" style={{ left: `${selection.x * 100}%`, top: `${selection.y * 100}%`, width: `${selection.width * 100}%`, height: `${selection.height * 100}%` }}><span>منطقة OCR</span></div>}</div>}<div className="card-title selection-title"><span><ScanText size={18} /> 2. حدد منطقة الكلام</span><small>{selection ? "تم التحديد" : "اسحب على الصورة"}</small></div><button className="primary process-btn" onClick={runOcr} disabled={isOcrRunning || !imageUrl}>{isOcrRunning ? <><Loader2 className="spin" size={17} /> جاري المعالجة {progress}%</> : <><WandSparkles size={17} /> استخراج وترجمة النص</>}</button>{error && <div className="error-box"><AlertCircle size={17} /><span>{error}</span></div>}<div className="status-line"><span className={isOcrRunning ? "status-dot busy" : "status-dot"} /> {status}</div></div>
        <div className="card translation-card"><div className="card-title"><span><WandSparkles size={18} /> 3. شاشة الترجمة</span><button className="clear-btn" onClick={clearHistory} disabled={!history.length && !currentTranslation}><Trash2 size={14} /> مسح السجل</button></div><div className="black-screen">{currentTranslation ? <div className="translation-live"><small>الآن</small><strong>{currentTranslation}</strong></div> : <div className="empty-screen"><ScanText size={31} /><p>ستظهر الترجمة هنا</p><small>بعد رفع صورة وتحديد منطقة النص</small></div>}{history.length > 0 && <div className="history"><span>السابق</span>{history.slice(0, -1).reverse().map(item => <p key={item.createdAt}>{item.translation}</p>)}</div>}</div><div className="ocr-result"><small>النص المستخرج</small><p>{ocrText || "لم يتم استخراج نص بعد"}</p></div><div className="free-note">OCR يعمل محلياً داخل المتصفح. الترجمة تستخدم MyMemory المجانية وقد تكون محدودة أو تتوقف مؤقتاً.</div></div>
      </section>
      <footer className="workspace-footer">لا يوجد دعم Android TV أو APK في هذه المرحلة · ولا ندّعي دعم التقاط PS Remote Play</footer>
    </main>
  );
}
