# Image Rotator — заметки для следующей сессии

Это десктопное приложение на Tauri 2 + React 19 + Vite + TypeScript. Собирает Windows-инсталлятор через NSIS.

## Где что лежит

- `app/` — фронтенд (React + Vite + Tailwind v4 + Zustand)
- `app/src-tauri/` — Rust-крейт `image-rotator`, конфиг Tauri, иконки, capabilities
- Бандлер фронта — Vite 8, точка входа `app/src/main.tsx`
- Финальные артефакты сборки — `app/src-tauri/target/release/bundle/nsis/`

## Что нужно установить один раз (Windows)

Если ещё не доделано в этой сессии:
1. **MSVC C++ Build Tools** — https://aka.ms/vs/17/release/vs_BuildTools.exe → workload «Desktop development with C++» (MSVC v143 + Windows 11 SDK)
2. **Rust toolchain** — https://rustup.rs → `rustup-init.exe`, дефолтные опции
3. Перезапустить терминал, чтобы `rustc` / `cargo` появились в `PATH`

Проверка: `npx tauri info` в `app/` должна показать `rustc`, `cargo`, `MSVC` и `WebView2` зелёными галочками.

## Команды разработки и сборки

Все запускать из `app/`:

```powershell
cd C:\Users\Roman\Desktop\pinterest-test\app

# Разработка с HMR (откроется нативное окно)
npm run tauri:dev

# Production-сборка → NSIS-инсталлятор
npm run tauri:build
```

После `tauri:build` готовый `.exe` лежит здесь:
```
app\src-tauri\target\release\bundle\nsis\Image Rotator_0.1.0_x64-setup.exe
```

Первая сборка занимает 3–5 минут (Rust компилирует все крейты), последующие — секунды.

## Что сделать в следующий заход

1. Убедиться, что Rust + MSVC установлены и `npx tauri info` чистый.
2. Запустить `npm run tauri:dev` и проверить:
   - Окно «Image Rotator» 1280×800 открывается
   - Drag-drop PNG/папок работает
   - Поворот колёсиком/драгом и snap к 0/90/180/270 работает
   - «Экспорт в папку» открывает нативный folder picker и пишет PNG напрямую (без ZIP)
3. Запустить `npm run tauri:build` — получить `.exe` инсталлятор.
4. Опционально: добавить MSI target в `tauri.conf.json` (`bundle.targets: ["nsis", "msi"]`).
5. Опционально: бамп версии в `tauri.conf.json` и `Cargo.toml` перед релизом.

## Архитектурные решения (зафиксированы в коммите миграции)

- **Только desktop** — без отдельного web-режима, можно прямо использовать `@tauri-apps/*` API
- **Native экспорт** — `plugin-dialog.open({directory: true})` + `plugin-fs.writeFile`, без JSZip и без `file-saver`
- **`dragDropEnabled: false`** в `tauri.conf.json` — оставляет браузерный `dragover`/`drop` в WebView2, чтобы текущий код в `Dropzone.tsx` работал без переписывания на Tauri-эвенты
- **Иконка** — Sparkles SVG из `app/public/favicon.svg`, прогнанный через `npx tauri icon`
- **Bundle target** — только NSIS (`Setup.exe` ~3-4 MB). MSI можно добавить в `bundle.targets` если потребуется
- **WebView2 install mode** — `downloadBootstrapper` (на Win10 поставит при установке, Win11 — встроен)

## Полезные команды

```powershell
npx tauri info              # диагностика окружения
npm run lint                # ESLint
npm run build               # tsc -b && vite build (только фронт)
npm run dev                 # vite dev на http://localhost:1420 (без Tauri-окна)
```
