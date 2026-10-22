// src/lib/supabase/build-memo.ts
// Один запит до Supabase на ПРОЦЕС збірки замість одного на кожну сторінку.
//
// Чому це потрібно: `next build` рендерить ~1600 сторінок у кількох паралельних процесах.
// unstable_cache під час збірки часто промахується (ключ залежить від зібраного коду функції),
// і кожна сторінка тягнула з бази ту саму карту фото (~0,5 МБ, 2 запити) — близько 18 разів
// за один деплой. Це майже весь трафік Supabase (тариф Free: 5 ГБ egress на місяць):
// у логах 95% запитів припадали на години деплоїв, а не на відвідувачів.
//
// Тут — мемо на рівні процесу, і ЛИШЕ на етапі збірки: дані під час білда незмінні, а
// помилка (rejected promise) так само валить збірку, як і раніше. У рантаймі (ISR,
// адмінка, revalidateTag) поведінка не змінюється — працює звичайний unstable_cache.
const memo = new Map<string, Promise<unknown>>();

const isBuild = () => process.env.NEXT_PHASE === "phase-production-build";

export function buildMemo<T>(key: string, load: () => Promise<T>): Promise<T> {
  if (!isBuild()) return load();
  let p = memo.get(key) as Promise<T> | undefined;
  if (!p) {
    p = load();
    memo.set(key, p);
  }
  return p;
}
