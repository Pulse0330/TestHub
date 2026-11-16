# Skuul — Онлайн шалгалтын платформ

Сурагчдад зориулсан **онлайн шалгалт, сорил, дасгал, хичээл**-ийн веб аппликейшн. Next.js App Router дээр суурилсан.

## ✨ Үндсэн боломжууд

| Модуль | Тайлбар |
|---|---|
| 📝 **Шалгалт** | Хяналттай (proctored) онлайн шалгалт, автоматаар хадгалах, хугацаа дуусахад автоматаар илгээх |
| 📚 **Сорил** | Элсэлтийн шалгалтын сорилын сан |
| 🏋️ **Дасгал** | Хичээл, сэдвээр дасгал бодох |
| 🎓 **Хичээл** | Цахим хичээлийн агуулга, төлбөртэй хичээл |
| 💳 **Төлбөр** | QPay |
| 👤 **Хэрэглэгч** | Бүртгэл, нэвтрэлт, OTP, профайл |
| 📊 **Үр дүн** | Шалгалт, сорилын дэлгэрэнгүй үр дүн, rank |

## 🛠 Технологи

- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript
- **UI:** Tailwind CSS v4, Radix UI / shadcn/ui, framer-motion (`LazyMotion`)
- **Өгөгдөл:** TanStack Query v5 (`src/lib/queryKeys.ts` key factory), Zustand
- **Контент:** MathJax 3 (CDN), DOMPurify (`src/lib/sanitize.ts`)
- **Хэрэгсэл:** Bun, Biome (lint/format), Vitest, Playwright

## 🚀 Эхлүүлэх

Шаардлага: [Bun](https://bun.sh/) 1.4+

```bash
bun install
bun run dev          # http://localhost:3000
```

Backend-ийн хаягууд `next.config.ts`-ийн `env` хэсэгт тохируулагдсан.

## 🧪 Скриптүүд

| Команд | Тайлбар |
|---|---|
| `bun run dev` | Хөгжүүлэлтийн сервер |
| `bun run build` / `bun run start` | Production build / ажиллуулах |
| `bun run typecheck` | TypeScript шалгалт |
| `bun run lint` | Biome lint + format шалгалт (`lint:fix` — автоматаар засах) |
| `bun run test` | Vitest unit тест (`test:watch`) |
| `bun run test:e2e` | Playwright e2e тест (`bunx playwright install chromium` эхлээд) |

E2E-ийн бүтэн урсгалын тест зөвхөн `E2E_USERNAME`, `E2E_PASSWORD` env тохируулсан үед ажиллана (тусгай сурагчийн бүртгэл ашиглана уу — тест сорилыг бодитоор эхлүүлдэг).

CI (`.github/workflows/ci.yml`) PR бүр дээр typecheck → lint → test → build ажиллуулна.

## 📁 Бүтэц

```
src/
├── app/
│   ├── (auth)/             # login, sign, forgot
│   ├── (main)/             # home, Lists/*, exercise, examResult, sorilResult, userProfile
│   ├── exam/               # Шалгалт өгөх (+ component/useAnswerSync.ts — хариулт хадгалах)
│   ├── soril/              # Сорил өгөх
│   ├── course/[id]/        # Хичээл
│   └── api/                # qpay, examqpay, otp, sign route handlers
├── features/
│   ├── result-detail/      # Шалгалт/сорилын үр дүнгийн хуваалцсан view + scoring.ts
│   ├── result-list/        # Үр дүнгийн жагсаалтын хуваалцсан хэсэг
│   └── qpay/               # QPay dialog
├── components/             # Хуваалцсан компонентууд (MathContent, Soril/ExamDetailDialog, ...)
├── lib/                    # api, auth, sanitize, mathjax, queryKeys
├── hooks/  stores/  types/
e2e/                        # Playwright тестүүд
```

## 🤝 Хувь нэмэр

Feature branch дээр ажиллаж, PR нээнэ. Commit: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `ci:`.
Мөр төгсгөл LF (`.gitattributes`), формат Biome (tab).
