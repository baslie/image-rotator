# CLAUDE.md — заметки для ИИ-агента по проекту Image Rotator

Десктопное Windows-приложение (Tauri 2 + React 19 + TypeScript) для пакетного поворота
PNG-изображений с сохранением прозрачности. Подробности — в `README.md`.

## Структура

- `app/` — фронтенд (React + Vite), исходники в `app/src/`
- `app/src-tauri/` — Rust-крейт, `tauri.conf.json`, иконки (`icons/`), `app-icon.svg`
- `docs/` — документация по интеграции и релизам
- `.github/workflows/` — CI

## Релизы и доставка дистрибутива

Сборка — **локально** (Tauri в облаке не собираем):

```powershell
cd app
npm run tauri:build
# установщик: app/src-tauri/target/release/bundle/nsis/*-setup.exe
```

**Распространяем только установщик (NSIS).** Портативный (standalone)
`app/src-tauri/target/release/image-rotator.exe` `tauri build` создаёт всегда (это сам
бинарник приложения), но он **сознательно НЕ распространяется** — ни в GitHub-релизе, ни на
Яндекс.Диске. Не прикладывай его к релизам.

### Версия

Бампить синхронно в трёх местах: `app/package.json`, `app/src-tauri/Cargo.toml`,
`app/src-tauri/tauri.conf.json`.

### GitHub Releases

- На GitHub держим **только последний релиз** — старые удаляем вместе с тегами:
  `gh release delete <tag> --yes --cleanup-tag`.
- К релизу прикладываем **только** установщик `*-setup.exe`. Заметки — на русском, формат
  `vX.Y.Z — <короткое описание>`.

```powershell
gh release create vX.Y.Z `
  (Get-ChildItem app/src-tauri/target/release/bundle/nsis/*-setup.exe).FullName `
  --title "vX.Y.Z" --notes "..."
```

### Автодоставка на Яндекс.Диск

При публикации релиза установщик автоматически уезжает в публичную папку на Яндекс.Диске —
чтобы давать людям постоянную ссылку без доступа к приватному репо.

- **Workflow:** `.github/workflows/release-to-yandex-disk.yml` — триггеры `release: published`
  и ручной `workflow_dispatch`. Качает ассеты релиза и льёт установщик на Диск через
  официальный REST API Яндекс.Диска (`curl`, **не** rclone — у него забанен client_id).
- **Папка на Диске:** `image-rotator-releases` (в корне Диска).
- **Публичная ссылка (для пользователей):** https://disk.yandex.ru/d/k0EwLxhEl6m78w
- **Режим overwrite-only:** на Диске всегда **один** файл со стабильным именем,
  перезаписывается на месте → ссылка постоянная:
  - `image-rotator-setup-latest.exe` — установщик, всегда последняя версия.
- **Токен:** в GitHub-секрете `YANDEX_DISK_TOKEN` (репозиторий `baslie/image-rotator`).
  **В код/доки/коммиты токен не пишем.** Один OAuth-токен Яндекса (доступ на запись всего
  Диска) переиспользуется между проектами Романа.
- **Ручной прогон / бэкфилл:** `gh workflow run release-to-yandex-disk.yml --repo baslie/image-rotator`.

Полная инструкция и отладка — `docs/RELEASE_TO_YANDEX_DISK.md`.

## Брендинг

Логотип — «Rotate Arc» (`app/src/components/icons/RotateArcLogo.tsx`, `app/public/favicon.svg`),
фирменный цвет бирюза `#23d9b7`. Иконки приложения/установщика перегенерируются из
`app/src-tauri/app-icon.svg`: `cd app && npm run tauri icon src-tauri/app-icon.svg`.
