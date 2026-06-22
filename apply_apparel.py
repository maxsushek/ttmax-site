#!/usr/bin/env python3
"""
apply_apparel.py — вставляє 58 нових карток одягу/аксесуарів у каталог
і додає підпис типу «Штани». Запускати з КОРЕНЯ репозиторію ttmax-site
(у Codespace через термінал, або локально). Поруч має лежати apparel_cards_gear.ts.txt.

Що робить:
  1) src/data/catalog/gear.ts — вставляє об'єкти карток перед закриваючим `];` масиву catalogGear;
  2) src/app/[locale]/[...segments]/page.tsx — додає рядок `pants` у GEAR_TYPE_LABEL.

Ідемпотентно: якщо вже застосовано — пропускає (можна запускати повторно).
Нічого НЕ комітить і НЕ пушить — це робиш ти після перегляду `git diff`.

Запуск:  python3 apply_apparel.py
"""
import os, re, sys

CARDS_FILE = "apparel_cards_gear.ts.txt"
GEAR = "src/data/catalog/gear.ts"
PAGE = "src/app/[locale]/[...segments]/page.tsx"
SENTINEL = "futbolka-butterfly-adross"            # перший новий slug — маркер «вже застосовано»
PANTS_LINE = '  pants: { ua: "Штани", ru: "Штаны" },'
SKIRT_ANCHOR = '  skirt: { ua: "Спідниця", ru: "Юбка" },'

def read(p): return open(p, encoding="utf-8").read()
def write(p, s): open(p, "w", encoding="utf-8").write(s)

def main():
    for p in (CARDS_FILE, GEAR, PAGE):
        if not os.path.exists(p):
            sys.exit(f"✗ Не знайдено {p}\n  Запусти скрипт з кореня репозиторію ttmax-site, поруч із {CARDS_FILE}.")

    # 1) КАРТКИ → gear.ts
    cards = "\n".join(l for l in read(CARDS_FILE).splitlines() if not l.lstrip().startswith("//")).strip("\n")
    g = read(GEAR)
    if SENTINEL in g:
        print("• gear.ts: картки вже вставлені — пропускаю.")
    else:
        idx = g.rstrip().rfind("];")
        if idx == -1:
            sys.exit("✗ gear.ts: не знайшов закриваючий `];` масиву catalogGear.")
        write(GEAR, g[:idx] + cards + "\n" + g[idx:])
        print("• gear.ts: вставлено 58 карток (перед `];`).")

    # 2) ПІДПИС pants → page.tsx
    pg = read(PAGE)
    if re.search(r'\n\s*pants:\s*\{', pg):
        print("• page.tsx: підпис pants уже є — пропускаю.")
    elif SKIRT_ANCHOR in pg:
        write(PAGE, pg.replace(SKIRT_ANCHOR, PANTS_LINE + "\n" + SKIRT_ANCHOR, 1))
        print("• page.tsx: додано рядок pants у GEAR_TYPE_LABEL.")
    else:
        print("! page.tsx: не знайшов якір skirt — додай рядок вручну (див. pants_label_patch.txt).")

    print("\nГотово. Далі:")
    print("  git diff                       # перевір зміни")
    print('  git add -A && git commit -m "apparel: 58 нових товарів" && git push')
    print("\nФото — окремо (після export CLOUDINARY_URL):")
    print("  python3 upload_apparel_to_cloudinary.py")

if __name__ == "__main__":
    main()
