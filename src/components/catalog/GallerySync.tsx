"use client";

import { createContext, useContext, useState } from "react";

/**
 * Спільний «активний кадр» для галереї й селектора кольору на картці товару.
 *
 * НАВІЩО: коли товар іде в кількох розфарбуваннях, вибір кольору мусить
 * перемикати фото — інакше покупець тисне «салатовий», а бачить золотий і
 * замовляє наосліп. Галерея й панель покупки — сусіди в сітці ProductShell,
 * але різні клієнтські компоненти, тож стан підіймаємо сюди.
 *
 * ⚠️ ОДНЕ джерело правди, а не два стани з синхронізацією. Двостороння
 * синхронізація двох useState тут неминуче дала б цикл або розсинхрон:
 * гортання галереї міняє колір, зміна кольору міняє галерею. Тому індекс
 * живе тільки тут, а обидва компоненти його читають і пишуть.
 *
 * ⚠️ Провайдер НЕОБОВ'ЯЗКОВИЙ. Без нього (а так на всіх товарах без
 * розфарбувань) галерея працює на власному локальному стані — нічого не
 * ламається й зайвого стану не з'являється.
 */
type Sync = { index: number; setIndex: (i: number) => void };

const GallerySyncContext = createContext<Sync | null>(null);

/** null → провайдера немає, компонент має впасти на власний стан. */
export function useGallerySync(): Sync | null {
  return useContext(GallerySyncContext);
}

export function GallerySyncProvider({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  return (
    <GallerySyncContext.Provider value={{ index, setIndex }}>
      {children}
    </GallerySyncContext.Provider>
  );
}
