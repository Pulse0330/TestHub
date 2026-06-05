"use client";

import { Award, BarChart, Book, ClipboardList, Clock, Menu, Moon, School, Sun, UserPlus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import ForgotForm from "@/app/(auth)/forgot/form";
import { LoginForm } from "@/app/(auth)/login/form";
import { SignForm } from "@/app/(auth)/sign/form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

type ModalType = "login" | "sign" | "forgot" | null;

export default function ExmoLanding() {
  const [isDark, setIsDark] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
  };

  const features = [
    {
      icon: <Clock className="w-4 h-4" />,
      title: "Цаг хугацаатай шалгалт",
      desc: "Тест, нээлттэй асуулт, олон сонголтот шалгалтуудыг онлайнаар өгнө. Хугацаа дуусмагц автоматаар хаагдаж, дүн шуурхай гарна.",
      wide: true,
    },
    {
      icon: <ClipboardList className="w-4 h-4" />,
      title: "Дасгал ажил",
      desc: "Багш даалгавар өгч, сурагч гүйцэтгэнэ. Хугацаа, оноо, тайлбараар нарийвчилсан дасгал ажил зохион байгуулна.",
      wide: false,
    },
    {
      icon: <Book className="w-4 h-4" />,
      title: "Сургалтын агуулга",
      desc: "Видео хичээл, гарын авлага, тест дасгалуудыг нэг платформд нэгтгэн суралцах боломж.",
      wide: false,
    },
    {
      icon: <BarChart className="w-4 h-4" />,
      title: "Дүн ба явцын тайлан",
      desc: "Сурагч бүрийн шалгалтын дүн, дасгал ажлын гүйцэтгэл, сургалтын явцыг нэгдсэн дашбоардаас хянана. Багш, эцэг эх хоёулаа харах боломжтой.",
      wide: true,
    },
  ];

  const steps = [
    {
      num: "01",
      icon: <UserPlus className="w-4 h-4" />,
      title: "Бүртгүүлэх",
      desc: "Сурагч эсвэл багшаар бүртгүүлж, ангидаа нэгдэнэ. Хэдхэн минутад бэлэн болно.",
    },
    {
      num: "02",
      icon: <School className="w-4 h-4" />,
      title: "Сурах & Дадлагажих",
      desc: "Сургалтын агуулга үзэж, дасгал ажлаа гүйцэтгэн мэдлэгээ бэхжүүлнэ.",
    },
    {
      num: "03",
      icon: <Award className="w-4 h-4" />,
      title: "Шалгалт өгөх",
      desc: "Тогтоосон хугацаанд шалгалт өгч, дүнгээ тэр дор нь мэдэж, гэрчилгээ авна.",
    },
  ];

  const stats = [
    { num: "8,400+", label: "Бүртгэлтэй сурагч" },
    { num: "1,200+", label: "Шалгалтын сан" },
    { num: "340+", label: "Сургалтын агуулга" },
    { num: "99.9%", label: "Системийн найдвартай байдал" },
  ];

  const modalTitles: Record<NonNullable<ModalType>, string> = {
    login: "Нэвтрэх",
    sign: "Бүртгүүлэх",
    forgot: "Нууц үг сэргээх",
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#030704] text-neutral-900 dark:text-neutral-100 font-sans antialiased transition-colors duration-300 overflow-x-hidden">

      {/* BG glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[480px] bg-gradient-to-b from-emerald-500/10 to-transparent blur-[100px]" />

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-neutral-200/50 dark:border-neutral-900 bg-white/80 dark:bg-[#030704]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 h-14 flex items-center justify-between">
          <div className="flex items-center flex-shrink-0">
            <Image
              src="/image/asd.png"
              alt="EXMO"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
             <span className="text-sm font-black tracking-[3px] uppercase bg-gradient-to-r from-teal-400 to-cyan-500 bg-clip-text text-transparent">EXMO</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-500 dark:text-neutral-400 hover:border-emerald-500/50 transition-all"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            </Button>
            <Button
              onClick={() => setModal("login")}
              className="hidden sm:block text-xs font-medium text-neutral-500 dark:text-neutral-400 px-3 py-1.5 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Нэвтрэх
            </Button>
            <Button
              onClick={() => setModal("sign")}
              className="text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Бүртгүүлэх
            </Button>
            <Button
              className="md:hidden w-8 h-8 flex items-center justify-center text-neutral-500 dark:text-neutral-400"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-neutral-200 dark:border-neutral-900 bg-white dark:bg-[#030704] px-4 py-4 flex flex-col gap-3">
            <div className="flex gap-2">
              <Button
                onClick={() => { setMenuOpen(false); setModal("login"); }}
                className="flex-1 text-sm font-medium border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 py-2 rounded-lg"
              >
                Нэвтрэх
              </Button>
              <Button
                onClick={() => { setMenuOpen(false); setModal("sign"); }}
                className="flex-1 text-sm font-bold bg-emerald-500 text-white py-2 rounded-lg"
              >
                Бүртгүүлэх
              </Button>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 relative">

        {/* HERO */}
        <section className="pt-16 sm:pt-24 pb-16 sm:pb-20 text-center">
          <div className="inline-flex items-center gap-2 bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-full px-4 py-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Шалгалт · Дасгал ажил · Сургалт — нэг дор
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.02] mb-5 text-neutral-900 dark:text-white">
            Шалгалт, Сургалт,<br />
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              Дасгал
            </span>
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto mb-8 leading-relaxed font-light">
            Сурагч, оюутан, багш нарт зориулсан цахим шалгалт, дасгал ажил, сургалтын нэгдсэн платформ. Хаанаас ч нэвтэрч, мэдлэгээ хэмжээрэй.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12 sm:mb-16">
            <Button className="w-full sm:w-auto bg-transparent border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 font-medium text-sm px-7 py-3 rounded-xl transition-all">
              Хэрхэн ажилладаг вэ?
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`py-5 px-4 text-left ${i < stats.length - 1 ? "border-b sm:border-b-0 border-r-0 sm:border-r border-neutral-200 dark:border-neutral-800" : ""} ${i === 1 ? "border-r border-neutral-200 dark:border-neutral-800 sm:border-r" : ""}`}
              >
                <div className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white tracking-tight">{s.num}</div>
                <div className="text-[10px] sm:text-xs text-neutral-400 mt-1 uppercase tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-12 sm:py-16 border-t border-neutral-200 dark:border-neutral-900">
          <div className="mb-8 sm:mb-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">Платформын боломжууд</p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">Бүх хэрэгтэй зүйл нэг дор</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((f) => (
              <div
                key={f.title}
                className={`${f.wide ? "sm:col-span-2 lg:col-span-2" : ""} bg-white dark:bg-neutral-900/30 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 hover:border-emerald-500/30 transition-all`}
              >
                <div className="w-8 h-8 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg flex items-center justify-center text-emerald-500 mb-4">
                  {f.icon}
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* STEPS */}
        <section className="py-12 sm:py-16 border-t border-neutral-200 dark:border-neutral-900">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2">Хэрхэн ажилладаг</p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">3 алхамд бэлэн</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {steps.map((s) => (
              <div key={s.num} className="relative bg-white dark:bg-[#050b06] border border-neutral-200 dark:border-neutral-800/60 rounded-2xl p-5 sm:p-6 overflow-hidden hover:border-emerald-500/25 transition-all">
                <span className="absolute top-3 right-4 text-4xl font-black text-neutral-100 dark:text-neutral-800 select-none">{s.num}</span>
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 mb-5">
                  {s.icon}
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-light">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-6 sm:py-8 border-t border-neutral-200 dark:border-neutral-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center">
            <Image
              src="/image/logoLogin.png"
              alt="EXMO"
              width={90}
              height={24}
              className="h-6 w-auto"
            />
          </div>
          <span className="text-xs text-neutral-400 text-center">© 2026 EXMO. Бүх эрх хуулиар хамгаалагдсан.</span>
        </footer>

      </div>

      {/* Login Dialog */}
      <Dialog open={modal === "login"} onOpenChange={(o) => { if (!o) setModal(null); }}>
        <DialogContent
          className="p-0 border-0 bg-transparent shadow-none max-w-sm w-full [&>button:last-child]:hidden outline-none ring-0 focus:outline-none"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">{modalTitles.login}</DialogTitle>
          <DialogDescription className="sr-only">Нэвтрэх нэр болон нууц үгээ оруулж нэвтэрнэ үү.</DialogDescription>
          <LoginForm onClose={() => setModal(null)} />
          <div className="flex justify-between px-6 pb-4 text-xs text-neutral-500 dark:text-neutral-400">
            <button type="button" onClick={() => setModal("forgot")} className="hover:text-emerald-500 transition-colors">
              Нууц үг мартсан?
            </button>
            <button type="button" onClick={() => setModal("sign")} className="hover:text-emerald-500 transition-colors">
              Бүртгүүлэх
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Dialog */}
      <Dialog open={modal === "sign"} onOpenChange={(o) => { if (!o) setModal(null); }}>
        <DialogContent
          className="p-0 border-0 bg-transparent shadow-none max-w-md w-full h-[95vh] sm:h-[85vh] md:h-auto overflow-y-auto [&>button:last-child]:hidden outline-none ring-0 focus:outline-none"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">{modalTitles.sign}</DialogTitle>
          <DialogDescription className="sr-only">Шинэ бүртгэл үүсгэхийн тулд мэдээллээ оруулна уу.</DialogDescription>
          <SignForm onClose={() => setModal(null)} />
          <div className="flex justify-center px-6 pb-4 text-xs text-neutral-500 dark:text-neutral-400">
            <button type="button" onClick={() => setModal("login")} className="hover:text-emerald-500 transition-colors">
              Бүртгэлтэй юу? Нэвтрэх
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Dialog */}
      <Dialog open={modal === "forgot"} onOpenChange={(o) => { if (!o) setModal(null); }}>
        <DialogContent
          className="p-0 border-0 bg-transparent shadow-none max-w-sm w-full [&>button:last-child]:hidden outline-none ring-0 focus:outline-none"
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">{modalTitles.forgot}</DialogTitle>
          <DialogDescription className="sr-only">Бүртгэлтэй утасны дугаараа оруулж нууц үгээ сэргээнэ үү.</DialogDescription>
          <ForgotForm onClose={() => setModal(null)} />
          <div className="flex justify-center px-6 pb-4 text-xs text-neutral-500 dark:text-neutral-400">
            <button type="button" onClick={() => setModal("login")} className="hover:text-emerald-500 transition-colors">
              ← Нэвтрэх хуудас руу буцах
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}