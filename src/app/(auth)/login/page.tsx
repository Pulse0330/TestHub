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

  const popTones = [
    { tile: "bg-pop-violet-soft", ink: "text-pop-violet-ink", shadow: "shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-violet)_35%,transparent)]" },
    { tile: "bg-pop-sky-soft", ink: "text-pop-sky-ink", shadow: "shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sky)_35%,transparent)]" },
    { tile: "bg-pop-mint-soft", ink: "text-pop-mint-ink", shadow: "shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-mint)_35%,transparent)]" },
    { tile: "bg-pop-sun-soft", ink: "text-pop-sun-ink", shadow: "shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-sun)_40%,transparent)]" },
    { tile: "bg-pop-coral-soft", ink: "text-pop-coral-ink", shadow: "shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-coral)_35%,transparent)]" },
    { tile: "bg-pop-pink-soft", ink: "text-pop-pink-ink", shadow: "shadow-[0_4px_0_0_color-mix(in_oklch,var(--pop-pink)_35%,transparent)]" },
  ];

  const authDialogClass =
    "p-0 border-0 bg-transparent shadow-none w-full max-w-[calc(100%-1.5rem)] sm:max-w-md md:max-w-3xl max-h-[94vh] overflow-y-auto scrollbar-none gap-3 [&>button:last-child]:hidden outline-none ring-0 focus:outline-none";
  const authDialogLinksClass =
    "flex flex-wrap items-center gap-2 rounded-2xl border-2 border-border bg-card px-5 py-3 text-sm font-bold text-muted-foreground shadow-[0_4px_0_0_var(--border)]";

  return (
    <div className="min-h-screen bg-page-gradient text-foreground font-sans antialiased transition-colors duration-300 overflow-x-hidden">

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b-2 border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-shrink-0 min-w-0">
            <Image
              src="/image/asd.png"
              alt="EXMO"
              width={120}
              height={32}
              className="h-8 w-auto"
              priority
            />
             <span className="text-lg font-black tracking-[3px] uppercase text-gradient">EXMO</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={toggleTheme}
              variant="outline"
              size="icon-sm"
              aria-label="Theme"
            >
              {isDark ? <Sun className="size-4 text-pop-sun" strokeWidth={2.5} /> : <Moon className="size-4 text-pop-violet" strokeWidth={2.5} />}
            </Button>
            <Button
              onClick={() => setModal("login")}
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex"
            >
              Нэвтрэх
            </Button>
            <Button
              onClick={() => setModal("sign")}
              size="sm"
            >
              Бүртгүүлэх
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="size-5" strokeWidth={2.5} /> : <Menu className="size-5" strokeWidth={2.5} />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t-2 border-border bg-card px-4 py-4 flex flex-col gap-3 animate-pop-in">
            <div className="flex gap-2">
              <Button
                onClick={() => { setMenuOpen(false); setModal("login"); }}
                variant="outline"
                className="flex-1"
              >
                Нэвтрэх
              </Button>
              <Button
                onClick={() => { setMenuOpen(false); setModal("sign"); }}
                className="flex-1"
              >
                Бүртгүүлэх
              </Button>
            </div>
          </div>
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-12 relative">

        {/* HERO */}
        <section className="relative pt-14 sm:pt-20 pb-14 sm:pb-20 text-center">
          {/* Decorative floaters */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden sm:block">
            <span className="absolute top-16 left-[4%] text-5xl animate-float">📚</span>
            <span className="absolute top-28 right-[6%] text-4xl animate-float [animation-delay:1.3s]">✏️</span>
            <span className="absolute top-[52%] left-[10%] text-4xl animate-float [animation-delay:2.4s]">🎯</span>
            <span className="absolute top-[48%] right-[12%] text-5xl animate-float [animation-delay:0.7s]">🏆</span>
          </div>

          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-4 py-1.5 text-xs font-bold text-muted-foreground mb-7 shadow-[0_3px_0_0_var(--border)]">
              <span className="size-2 rounded-full bg-pop-mint" />
              Шалгалт · Дасгал ажил · Сургалт — нэг дор
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-[1.05] mb-5 text-foreground">
              Шалгалт, Сургалт,<br />
              <span className="text-gradient">
                Дасгал
              </span>
            </h1>
            <p className="text-sm sm:text-base font-semibold text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
              Сурагч, оюутан, багш нарт зориулсан цахим шалгалт, дасгал ажил, сургалтын нэгдсэн платформ. Хаанаас ч нэвтэрч, мэдлэгээ хэмжээрэй.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12 sm:mb-16">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Хэрхэн ажилладаг вэ?
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((s, i) => {
                const tone = popTones[i % popTones.length];
                return (
                  <div
                    key={s.label}
                    className={`rounded-2xl p-4 text-left animate-pop-in ${tone.tile} ${tone.shadow}`}
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <div className={`text-2xl sm:text-3xl font-black tracking-tight ${tone.ink}`}>{s.num}</div>
                    <div className="text-[10px] sm:text-xs font-bold text-muted-foreground mt-1 uppercase tracking-wide">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-12 sm:py-16 border-t-2 border-dashed border-border">
          <div className="mb-8 sm:mb-10">
            <p className="text-xs font-extrabold uppercase tracking-widest text-primary mb-2">Платформын боломжууд</p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Бүх хэрэгтэй зүйл нэг дор</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const tone = popTones[(i + 1) % popTones.length];
              return (
                <div
                  key={f.title}
                  className={`${f.wide ? "sm:col-span-2 lg:col-span-2" : ""} card-pop lift p-5 sm:p-6 animate-pop-in`}
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <div className={`size-12 rounded-2xl flex items-center justify-center mb-4 [&_svg]:size-6 ${tone.tile} ${tone.ink} ${tone.shadow}`}>
                    {f.icon}
                  </div>
                  <h3 className="text-base font-extrabold text-foreground mb-2">{f.title}</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* STEPS */}
        <section className="py-12 sm:py-16 border-t-2 border-dashed border-border">
          <div className="text-center mb-8 sm:mb-10">
            <p className="text-xs font-extrabold uppercase tracking-widest text-primary mb-2">Хэрхэн ажилладаг</p>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">3 алхамд бэлэн</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {steps.map((s, i) => {
              const tone = popTones[(i * 2 + 2) % popTones.length];
              return (
                <div
                  key={s.num}
                  className="relative card-pop lift p-5 sm:p-6 overflow-hidden animate-pop-in"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <span className={`absolute top-3 right-4 text-5xl font-black select-none opacity-30 ${tone.ink}`}>{s.num}</span>
                  <div className={`size-12 rounded-2xl flex items-center justify-center mb-5 [&_svg]:size-6 ${tone.tile} ${tone.ink} ${tone.shadow}`}>
                    {s.icon}
                  </div>
                  <h3 className="text-base font-extrabold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="py-6 sm:py-8 border-t-2 border-dashed border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center">
            <Image
              src="/image/logoLogin.png"
              alt="EXMO"
              width={90}
              height={24}
              className="h-6 w-auto"
            />
          </div>
          <span className="text-xs font-semibold text-muted-foreground text-center">© 2026 EXMO. Бүх эрх хуулиар хамгаалагдсан.</span>
        </footer>

      </div>

      {/* Login Dialog */}
      <Dialog open={modal === "login"} onOpenChange={(o) => { if (!o) setModal(null); }}>
        <DialogContent
          className={authDialogClass}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">{modalTitles.login}</DialogTitle>
          <DialogDescription className="sr-only">Нэвтрэх нэр болон нууц үгээ оруулж нэвтэрнэ үү.</DialogDescription>
          <LoginForm onClose={() => setModal(null)} />
          <div className={`${authDialogLinksClass} justify-between`}>
            <button type="button" onClick={() => setModal("forgot")} className="hover:text-primary transition-colors">
              Нууц үг мартсан?
            </button>
            <button type="button" onClick={() => setModal("sign")} className="hover:text-primary transition-colors">
              Бүртгүүлэх
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sign Dialog */}
      <Dialog open={modal === "sign"} onOpenChange={(o) => { if (!o) setModal(null); }}>
        <DialogContent
          className={`${authDialogClass} md:max-w-4xl`}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">{modalTitles.sign}</DialogTitle>
          <DialogDescription className="sr-only">Шинэ бүртгэл үүсгэхийн тулд мэдээллээ оруулна уу.</DialogDescription>
          <SignForm onClose={() => setModal(null)} />
          <div className={`${authDialogLinksClass} justify-center`}>
            <button type="button" onClick={() => setModal("login")} className="hover:text-primary transition-colors">
              Бүртгэлтэй юу? Нэвтрэх
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forgot Dialog */}
      <Dialog open={modal === "forgot"} onOpenChange={(o) => { if (!o) setModal(null); }}>
        <DialogContent
          className={authDialogClass}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">{modalTitles.forgot}</DialogTitle>
          <DialogDescription className="sr-only">Бүртгэлтэй утасны дугаараа оруулж нууц үгээ сэргээнэ үү.</DialogDescription>
          <ForgotForm onClose={() => setModal(null)} />
          <div className={`${authDialogLinksClass} justify-center`}>
            <button type="button" onClick={() => setModal("login")} className="hover:text-primary transition-colors">
              ← Нэвтрэх хуудас руу буцах
            </button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
