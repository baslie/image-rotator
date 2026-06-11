# Image Rotator — варианты логотипа

> ✅ **Выбрана концепция `01-rotate-arc`** и внедрена в приложение начиная с **v1.2.0** (иконка `.exe` и установщика, favicon, шапка интерфейса). Остальные концепции сохранены как архив вариантов.

Папка с концепциями фирменного знака для **Image Rotator** — галерея, по которой выбирали логотип.

## Как смотреть

Открой `index.html` двойным кликом (или из PowerShell: `start brand\index.html`). На тёмной странице-галерее показаны все 6 концепций, у каждой — иконка, иконка с градиентом, горизонтальный и вертикальный локап, плюс ряд проверки в размерах 16/32/64 px. Кнопкой сверху переключается тёмный/светлый фон превью.

## Концепции

| № | Папка | Идея |
|---|-------|------|
| 01 | `concepts/01-rotate-arc` | Рамка изображения + круговая стрелка поворота |
| 02 | `concepts/02-rotating-frame` | Повёрнутый кадр с призрачным исходным контуром |
| 03 | `concepts/03-angle-snap` | Циферблат со снап-засечками 0/90/180/270° и стрелкой |
| 04 | `concepts/04-cycle-r` | Монограмма «R» в кольце вращения |
| 05 | `concepts/05-orbit-dot` | Абстрактный знак: точка на орбите + стрелка |
| 06 | `concepts/06-rotor-blades` | Четыре лопасти-ротора (заполненный знак) |

В каждой папке: `icon.svg`, `icon-gradient.svg`, `lockup-horizontal.svg`, `lockup-vertical.svg`.

## Палитра

| Назначение | Значение |
|------------|----------|
| Акцент (brand) | `#23d9b7` = `hsl(160 84% 45%)` |
| Градиент | `#23d9b7 → #0ea5a0` |
| Фон тёмный | `#0a0a0d` |
| Текст | `#fafafa` |
| Приглушённый | `#a8a8b8` |

Stroke-стиль: ширина `3` (в 48-px сетке), скруглённые концы и соединения — в духе lucide-иконок приложения.

## Clear space и минимальный размер

- **Свободное поле** вокруг знака — не меньше высоты внутреннего элемента иконки.
- **Минимальный размер знака:** 16 px (иконки спроектированы читаемыми вплоть до favicon).
- Локап с названием — не уже 120 px по ширине.

## Экспорт в PNG

```powershell
# Inkscape
inkscape concepts\01-rotate-arc\icon.svg --export-type=png --export-width=1024 --export-filename=icon-1024.png

# ImageMagick (прозрачный фон)
magick -background none concepts\01-rotate-arc\icon.svg icon.png
```

Онлайн-вариант без установки: https://cloudconvert.com/svg-to-png

## Внедрение (сделано в v1.2.0)

Выбранная концепция `01-rotate-arc` заведена в приложение:
1. `app/public/favicon.svg` — заменён на знак Rotate Arc;
2. иконки Tauri в `app/src-tauri/icons/` — перегенерированы из источника `app/src-tauri/app-icon.svg` командой `npm run tauri icon src-tauri/app-icon.svg`;
3. `app/src/components/Toolbar.tsx` — иконка Sparkles заменена компонентом `RotateArcLogo` (`app/src/components/icons/RotateArcLogo.tsx`).
