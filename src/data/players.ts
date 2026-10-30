// src/data/players.ts
// Гравці Butterfly для статей блогу: імена, Wikidata (→ Person.sameAs) і фото-аватарки.
//
// ⚠️ ФОТО — ЛИШЕ З WIKIMEDIA COMMONS під вільними ліцензіями (CC BY / CC BY-SA / PD), звірено 27.10.2026.
// Фото з butterfly.co.jp та інших сайтів НЕ брати: прав на них у магазину немає.
// Ліцензії вимагають указати автора, ліцензію й джерело — це робить блок «Фото» під статтею
// (BlogArticle.tsx), який збирає підписи з цього файлу. Без photo → кружок з ініціалами.
// Аватарки: обличчя вирізано по Apple Vision, 128×128 WebP у public/blog/players/<slug>.webp.
// Slug — як на butterfly.co.jp/players/detail/<slug>.html.
import type { Locale } from "@/i18n/config";

export type PlayerPhoto = {
  src: string;
  /** Автор зі сторінки файлу на Commons. */
  author: string;
  /** Коротка назва ліцензії (CC BY-SA 4.0 тощо). */
  license: string;
  licenseUrl?: string;
  /** Сторінка файлу на Commons. */
  sourceUrl: string;
};

export type Player = {
  name: Record<Locale, string>;
  /** Латиницею — для Person.name у розмітці (як пишуть ITTF і Butterfly). */
  nameEn: string;
  /** Q-ідентифікатор Wikidata → sameAs. */
  wikidata: string;
  photo?: PlayerPhoto;
};

const PLAYERS_DATA = {
  "harimoto-tomokazu": {
    name: { ua: "Томокадзу Харімото", ru: "Томокадзу Харимото" },
    nameEn: "Tomokazu Harimoto",
    wikidata: "Q27917476",
    photo: {
      src: "/blog/players/harimoto-tomokazu.webp",
      author: "Peter Porai-Koshits",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:ITTF_World_Tour_2017_German_Open_Harimoto_Tomokazu_04.jpg",
    },
  },
  "harimoto-miwa": {
    name: { ua: "Міва Харімото", ru: "Мива Харимото" },
    nameEn: "Miwa Harimoto",
    wikidata: "Q56533455",
    photo: {
      src: "/blog/players/harimoto-miwa.webp",
      author: "中国新闻社",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Harimoto_Miwa_2023.png",
    },
  },
  "matsushima-sora": {
    name: { ua: "Сора Мацусіма", ru: "Сора Мацусима" },
    nameEn: "Sora Matsushima",
    wikidata: "Q105704235",
  },
  "togami-shunsuke": {
    name: { ua: "Сюнсуке Тогамі", ru: "Сюнсукэ Тогами" },
    nameEn: "Shunsuke Togami",
    wikidata: "Q108807035",
  },
  "shinozuka-hiroto": {
    name: { ua: "Хірото Сінодзука", ru: "Хирото Синодзука" },
    nameEn: "Hiroto Shinozuka",
    wikidata: "Q108777169",
  },
  "fan-zhendong": {
    name: { ua: "Фань Чженьдун", ru: "Фань Чжэньдун" },
    nameEn: "Fan Zhendong",
    wikidata: "Q14594723",
    photo: {
      src: "/blog/players/fan-zhendong.webp",
      author: "Peter Porai-Koshits",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:ITTF_World_Tour_2017_German_Open_Fan_Zhendong_03.jpg",
    },
  },
  "lin-shidong": {
    name: { ua: "Лінь Шидун", ru: "Линь Шидун" },
    nameEn: "Lin Shidong",
    wikidata: "Q118697979",
  },
  "lin-yunju": {
    name: { ua: "Лінь Юньжу", ru: "Линь Юньжу" },
    nameEn: "Lin Yun-Ju",
    wikidata: "Q20063561",
    photo: {
      src: "/blog/players/lin-yunju.webp",
      author: "Marcus Cyron",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Table_tennis_at_the_2018_Summer_Youth_Olympics_%E2%80%93_Men%27s_Singles_Bronze_Medal_Match_501_(cropped).jpg",
    },
  },
  "cheng-i-ching": {
    name: { ua: "Чен Іцзін", ru: "Чэн Ицзин" },
    nameEn: "Cheng I-Ching",
    wikidata: "Q16078561",
    photo: {
      src: "/blog/players/cheng-i-ching.webp",
      author: "XIAOYU TANG",
      license: "CC BY-SA 2.5",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.5",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Cheng_I_Ching_WTTC_2016_(cropped).jpg",
    },
  },
  "zhu-yuling": {
    name: { ua: "Чжу Юйлін", ru: "Чжу Юйлин" },
    nameEn: "Zhu Yuling",
    wikidata: "Q13360630",
    photo: {
      src: "/blog/players/zhu-yuling.webp",
      author: "Pierre-Yves Beaudouin",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Mondial_Ping_-Women%27s_Singles_-_Quarterfinal_-_Zhu_Yuling-Feng_Tianwei_-_08.jpg",
    },
  },
  "lim-jonghoon": {
    name: { ua: "Лім Джонхун", ru: "Лим Чжонхун" },
    nameEn: "Lim Jong-hoon",
    wikidata: "Q82159936",
    photo: {
      src: "/blog/players/lim-jonghoon.webp",
      author: "KTTL 한국프로탁구리그 (한국실업탁구연맹)",
      license: "CC BY 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:%EC%9E%84%EC%A2%85%ED%9B%88_%EC%84%A0%EC%88%98.jpg",
    },
  },
  "wong-chun-ting": {
    name: { ua: "Вонг Чунтін", ru: "Вонг Чунтин" },
    nameEn: "Wong Chun Ting",
    wikidata: "Q16321529",
    photo: {
      src: "/blog/players/wong-chun-ting.webp",
      author: "Peter Porai-Koshits",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:ITTF_World_Tour_2017_German_Open_Wong_Chun_Ting_04.jpg",
    },
  },
  "ovtcharov-dimitrij": {
    name: { ua: "Дмитро Овчаров", ru: "Дмитрий Овчаров" },
    nameEn: "Dimitrij Ovtcharov",
    wikidata: "Q58021",
    photo: {
      src: "/blog/players/ovtcharov-dimitrij.webp",
      author: "Sandro Halank, Wikimedia Commons",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:2022-08-19_European_Championships_2022_%E2%80%93_Table_Tennis_by_Sandro_Halank%E2%80%93059.jpg",
    },
  },
  "franziska-patrick": {
    name: { ua: "Патрік Франціска", ru: "Патрик Франциска" },
    nameEn: "Patrick Franziska",
    wikidata: "Q2057592",
    photo: {
      src: "/blog/players/franziska-patrick.webp",
      author: "Peter Porai-Koshits",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:ITTF_World_Tour_2017_German_Open_Franziska_Patrick.jpg",
    },
  },
  "qiu-dang": {
    name: { ua: "Дан Цю", ru: "Дан Цю" },
    nameEn: "Dang Qiu",
    wikidata: "Q29862601",
    photo: {
      src: "/blog/players/qiu-dang.webp",
      author: "Granada",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:20220814_European_Championships_Munich_2022_Dang_Qiu_850_2751.jpg",
    },
  },
  "kallberg-anton": {
    name: { ua: "Антон Чельберг", ru: "Антон Чельберг" },
    nameEn: "Anton Källberg",
    wikidata: "Q23060866",
    photo: {
      src: "/blog/players/kallberg-anton.webp",
      author: "Peter Porai-Koshits",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:ITTF_World_Tour_2017_German_Open_Kallberg_Anton_01.jpg",
    },
  },
  "freitas-marcos": {
    name: { ua: "Маркуш Фрейташ", ru: "Маркуш Фрейташ" },
    nameEn: "Marcos Freitas",
    wikidata: "Q1894059",
    photo: {
      src: "/blog/players/freitas-marcos.webp",
      author: "XIAOYU TANG",
      license: "CC BY-SA 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Marcos_Freitas_WTTC2016_14.jpeg",
    },
  },
  "apolonia-tiago": {
    name: { ua: "Тіагу Аполонія", ru: "Тиагу Аполония" },
    nameEn: "Tiago Apolónia",
    wikidata: "Q2118021",
    photo: {
      src: "/blog/players/apolonia-tiago.webp",
      author: "Peter Porai-Koshits",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:ITTF_World_Tour_2017_German_Open_Apolonia_Tiago_03.jpg",
    },
  },
  "gacina-andrej": {
    name: { ua: "Андрей Гачина", ru: "Андрей Гачина" },
    nameEn: "Andrej Gaćina",
    wikidata: "Q502831",
    photo: {
      src: "/blog/players/gacina-andrej.webp",
      author: "Dacoucou",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Andrej_Ga%C4%87ina_2017.jpg",
    },
  },
  "polcanova-sofia": {
    name: { ua: "Софія Полканова", ru: "Софья Полканова" },
    nameEn: "Sofia Polcanova",
    wikidata: "Q26267577",
    photo: {
      src: "/blog/players/polcanova-sofia.webp",
      author: "Granada",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:20220818_European_Championships_Munich_2022_Sofia_Polcanova_850_0544.jpg",
    },
  },
  "jha-kanak": {
    name: { ua: "Канак Джха", ru: "Канак Джа" },
    nameEn: "Kanak Jha",
    wikidata: "Q26508825",
    photo: {
      src: "/blog/players/jha-kanak.webp",
      author: "Marcus Cyron",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Table_tennis_at_the_2018_Summer_Youth_Olympics_%E2%80%93_Men%27s_Singles_Bronze_Medal_Match_024.jpg",
    },
  },
  "diaz-adriana": {
    name: { ua: "Адріана Діас", ru: "Адриана Диас" },
    nameEn: "Adriana Díaz",
    wikidata: "Q22002897",
  },
  "assar-omar": {
    name: { ua: "Омар Ассар", ru: "Омар Ассар" },
    nameEn: "Omar Assar",
    wikidata: "Q7089642",
  },
  "boll-timo": {
    name: { ua: "Тімо Болль", ru: "Тимо Болль" },
    nameEn: "Timo Boll",
    wikidata: "Q57747",
    photo: {
      src: "/blog/players/boll-timo.webp",
      author: "Dr. Stephan Roscher",
      license: "Attribution",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Timo_Boll.JPG",
    },
  },
  "mizutani-jun": {
    name: { ua: "Дзюн Мідзутані", ru: "Дзюн Мидзутани" },
    nameEn: "Jun Mizutani",
    wikidata: "Q1332747",
    photo: {
      src: "/blog/players/mizutani-jun.webp",
      author: "XIAOYU TANG",
      license: "CC BY-SA 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Mizutani_Jun_WTTC2016_32.jpeg",
    },
  },
  "maze-michael": {
    name: { ua: "Міхаель Мейс", ru: "Михаэль Мэйз" },
    nameEn: "Michael Maze",
    wikidata: "Q559105",
    photo: {
      src: "/blog/players/maze-michael.webp",
      author: "speculos",
      license: "CC BY 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Michael_Maze.jpg",
    },
  },
  "chuang-chih-yuan": {
    name: { ua: "Чжуан Чжиюань", ru: "Чжуан Чжиюань" },
    nameEn: "Chuang Chih-yuan",
    wikidata: "Q705179",
    photo: {
      src: "/blog/players/chuang-chih-yuan.webp",
      author: "Pierre-Yves Beaudouin",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Mondial_Ping_-_Men%27s_Doubles_-_Semifinals_-_23.jpg",
    },
  },
  // Легенди з іменними основами Butterfly (стаття про зняті з виробництва основи, 29.10.2026).
  // Фото — P18 з Wikidata, ліцензії звірено через Commons API; на кадрах із кількома людьми
  // взято найбільше обличчя (головний герой фото).
  "primorac-zoran": {
    name: { ua: "Зоран Примораць", ru: "Зоран Приморац" },
    nameEn: "Zoran Primorac",
    wikidata: "Q26355",
    photo: {
      src: "/blog/players/primorac-zoran.webp",
      author: "Vladimir Mirskiy",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Zoran_Primorac-001.JPG",
    },
  },
  "gionis-panagiotis": {
    name: { ua: "Панайотіс Гіоніс", ru: "Панайотис Гионис" },
    nameEn: "Panagiotis Gionis",
    wikidata: "Q3120927",
    photo: {
      src: "/blog/players/gionis-panagiotis.webp",
      author: "XIAOYU TANG",
      license: "CC BY-SA 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Panagiotis_Gionis_WTTC2016.jpeg",
    },
  },
  "mazunov-andrei": {
    name: { ua: "Андрій Мазунов", ru: "Андрей Мазунов" },
    nameEn: "Andrei Mazunov",
    wikidata: "Q502706",
    photo: {
      src: "/blog/players/mazunov-andrei.webp",
      author: "Vladimir Mirskiy",
      license: "CC BY 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Andrey_Mazunov-02.JPG",
    },
  },
  "schmidberger-thomas": {
    name: { ua: "Томас Шмідбергер", ru: "Томас Шмидбергер" },
    nameEn: "Thomas Schmidberger",
    wikidata: "Q2427112",
    photo: {
      src: "/blog/players/schmidberger-thomas.webp",
      author: "Gaël Marziou",
      license: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Thomas_Schmidberger_WPTTC2010_1_(cropped).jpeg",
    },
  },
  "korbel-petr": {
    name: { ua: "Петр Корбел", ru: "Петр Корбел" },
    nameEn: "Petr Korbel",
    wikidata: "Q973508",
  },
  "zhang-jike": {
    name: { ua: "Чжан Цзіке", ru: "Чжан Цзикэ" },
    nameEn: "Zhang Jike",
    wikidata: "Q197218",
    photo: {
      src: "/blog/players/zhang-jike.webp",
      author: "Pierre-Yves Beaudouin",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Mondial_Ping_-_Men%27s_Singles_-_Final_-_Zhang_Jike_vs_Wang_Hao_-_40.jpg",
    },
  },
  "liu-shiwen": {
    name: { ua: "Лю Шивень", ru: "Лю Шивэнь" },
    nameEn: "Liu Shiwen",
    wikidata: "Q443175",
    photo: {
      src: "/blog/players/liu-shiwen.webp",
      author: "Pierre-Yves Beaudouin",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Mondial_Ping_-_Women%27s_Doubles_-_Final_-_36.jpg",
    },
  },
  "fukuhara-ai": {
    name: { ua: "Ай Фукухара", ru: "Ай Фукухара" },
    nameEn: "Ai Fukuhara",
    wikidata: "Q239371",
    photo: {
      src: "/blog/players/fukuhara-ai.webp",
      author: "Didier Garcon",
      license: "CC BY 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Ai_Fukuhara_at_Table_Tennis_Pro_Tour_Grand_Finals_2011.jpg",
    },
  },
  "matsudaira-kenta": {
    name: { ua: "Кента Мацудайра", ru: "Кента Мацудайра" },
    nameEn: "Kenta Matsudaira",
    wikidata: "Q2363614",
    photo: {
      src: "/blog/players/matsudaira-kenta.webp",
      author: "Pierre-Yves Beaudouin",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Mondial_Ping_-_Men%27s_Singles_-_Round_4_-_Kenta_Matsudaira-Vladimir_Samsonov_-_42.jpg",
    },
  },
} satisfies Record<string, Player>;

export type PlayerSlug = keyof typeof PLAYERS_DATA;

export const PLAYERS: Record<PlayerSlug, Player> = PLAYERS_DATA;

export function getPlayer(slug: PlayerSlug): Player {
  return PLAYERS[slug];
}

/** Ініціали для кружка без фото: перші літери двох слів імені. */
export function playerInitials(slug: PlayerSlug, locale: Locale): string {
  return PLAYERS[slug].name[locale]
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}
