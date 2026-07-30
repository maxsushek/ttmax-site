#!/usr/bin/env python3
"""
upload_apparel_to_cloudinary.py — САМОДОСТАТНІЙ скрипт заливки фото одягу в Cloudinary.
План (58 товарів + посилання на фото) вшитий усередину — окремий JSON НЕ потрібен.

Перед запуском (у тебе вже зроблено в цьому ж терміналі):
    export CLOUDINARY_URL='cloudinary://<KEY>:<SECRET>@dh6vuxjko'

Заливає фото у ttmax/product/<slug>/NN (overwrite=True, повторний запуск безпечний),
наприкінці пише apparel_cloudinary_manifest.json. Манифест надішли мені — впишу в entity_media.

Запуск:  python3 upload_apparel_to_cloudinary.py
"""
import json, os, sys, tempfile, time, requests

try:
    import cloudinary, cloudinary.uploader
except ImportError:
    sys.exit("Нема cloudinary. Постав:  python3 -m pip install cloudinary requests")

MANIFEST = "apparel_cloudinary_manifest.json"
DELAY = 0.25
HEADERS = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                         "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36"}

if not os.environ.get("CLOUDINARY_URL"):
    sys.exit("CLOUDINARY_URL не заданий. Спочатку:  export CLOUDINARY_URL='cloudinary://KEY:SECRET@dh6vuxjko'")
cloudinary.config(secure=True)
if cloudinary.config().cloud_name != "dh6vuxjko":
    sys.exit("cloud_name=" + str(cloudinary.config().cloud_name) + ", а треба dh6vuxjko. Перевір ключ.")

session = requests.Session(); session.headers.update(HEADERS)

def fetch(url):
    for a in range(4):
        try:
            r = session.get(url, timeout=40)
            if r.status_code == 200 and r.content:
                return r.content
        except Exception:
            pass
        time.sleep(0.6 * (a + 1))
    return None

PLAN = json.loads(r'''[
  {
    "slug": "futbolka-butterfly-adross",
    "name_uk": "Футболка Butterfly Adross",
    "name_en": "Adross T-shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/47420_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/47420_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/47420_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/47420_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/47420_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/47420_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/47420_07.jpg"
    ]
  },
  {
    "slug": "pov-iazka-na-holovu-butterfly-al-ii",
    "name_uk": "Пов'язка на голову Butterfly AL II",
    "name_en": "AL Head Band II",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/77410_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/77410_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/77410_03.jpg"
    ]
  },
  {
    "slug": "rushnyk-butterfly-altee",
    "name_uk": "Рушник Butterfly Altee",
    "name_en": "Altee Hand Towel",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/77310_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/77310_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/77310_03.jpg"
    ]
  },
  {
    "slug": "rushnyk-butterfly-big-altee",
    "name_uk": "Рушник Butterfly Big Altee",
    "name_en": "Altee Sports Towel",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/77300_02-1.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/77300_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/77300_03.jpg"
    ]
  },
  {
    "slug": "shtany-butterfly-atlenge",
    "name_uk": "Штани Butterfly Atlenge",
    "name_en": "Atlenge Pants",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/52140-1.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/52140_02-1.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/52140_03-1.jpg"
    ]
  },
  {
    "slug": "rushnyk-butterfly-big-atomis",
    "name_uk": "Рушник Butterfly Big Atomis",
    "name_en": "Atomis Sports Towel",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77250_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77250_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77250_03.jpg"
    ]
  },
  {
    "slug": "shtany-butterfly-bty",
    "name_uk": "Штани Butterfly BTY",
    "name_en": "BTY Half Pants",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/52220_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/52220_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/52220_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/52220_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/52220_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/52220_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/52220_07.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-bty-25",
    "name_uk": "Футболка Butterfly BTY 25",
    "name_en": "BTY T-Shirt 25",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/BTY-Tee-SMU-070-F-scaled.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/BTY-Tee-SMU-070-B-scaled.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/BTY-Tee-SMU-070-P-scaled.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/BTY-Tee-SMU-278-F-scaled.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/BTY-Tee-SMU-278-B-scaled.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/BTY-Tee-SMU-278-P-scaled.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-bwh-837",
    "name_uk": "Футболка Butterfly BWH 837",
    "name_en": "BWH 837 T-Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/20230201164049_24552.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-bwh-276",
    "name_uk": "Футболка Butterfly BWH-276",
    "name_en": "BWH-276 Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/10/IMG_9861.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/10/IMG_9863.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/10/IMG_9856.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/10/IMG_9857.jpg"
    ]
  },
  {
    "slug": "shorty-butterfly-bws-331",
    "name_uk": "Шорти Butterfly BWS-331",
    "name_en": "BWS-331 Shorts",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/067A5882-scaled.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/067A5847-scaled.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/067A5849-scaled.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/067A5889-scaled.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/067A5890-scaled.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/067A5886-scaled.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/067A5887-scaled.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/067A5888-scaled.jpg"
    ]
  },
  {
    "slug": "shorty-butterfly-bws-332",
    "name_uk": "Шорти Butterfly BWS-332",
    "name_en": "BWS-332",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/BWS-332-2.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/BWS-332-1.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-celsard",
    "name_uk": "Футболка Butterfly Celsard",
    "name_en": "Celsard T-shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47820_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47820_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47820_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47820_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47820_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47820_06.jpg"
    ]
  },
  {
    "slug": "shtany-butterfly-elistar10",
    "name_uk": "Штани Butterfly Elistar10",
    "name_en": "Elistar10 Pants",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/52160_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/52160_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/52160_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/52160_04.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-elistar10",
    "name_uk": "Футболка Butterfly Elistar10",
    "name_en": "Elistar10 Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46280_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46280_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46280_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46280_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46280_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46280_06.jpg"
    ]
  },
  {
    "slug": "shtany-butterfly-elistar11",
    "name_uk": "Штани Butterfly Elistar11",
    "name_en": "Elistar11 Pants",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52190.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52190_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52190_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52190_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52190_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52190_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52190_09.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52190_07.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52190_08.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52190_10.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-elistar11-shirt",
    "name_uk": "Футболка Butterfly Elistar11 (Shirt)",
    "name_en": "Elistar11 Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46510.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46510_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46510_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46510_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46510_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46510_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46510_07.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46510_08.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46510_09.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46510_10.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46510_11.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-elistar11-t-shirt",
    "name_uk": "Футболка Butterfly Elistar11 (T-shirt)",
    "name_en": "Elistar11 T-shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46530_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46530_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46530_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46530_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46530_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46530_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46530_07.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46530_08.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46530_09.jpg"
    ]
  },
  {
    "slug": "shtany-butterfly-elistar13",
    "name_uk": "Штани Butterfly Elistar13",
    "name_en": "Elistar13 Pants",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52500_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52500_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52500_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52500_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52500_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52500_06.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-elistar13",
    "name_uk": "Футболка Butterfly Elistar13",
    "name_en": "Elistar13 Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47850_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47850_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47850_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47850_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47850_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47850_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47850_07.jpg"
    ]
  },
  {
    "slug": "spidnytsia-butterfly-elistar13",
    "name_uk": "Спідниця Butterfly Elistar13",
    "name_en": "Elistar13 Skirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/05/52519_01.webp",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/05/52519_02.webp",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/05/52519_03.webp",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/05/52519_04.webp",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/05/52519_05.webp",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/05/52519_06.webp",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/05/52519_07.webp"
    ]
  },
  {
    "slug": "futbolka-butterfly-eneel",
    "name_uk": "Футболка Butterfly Eneel",
    "name_en": "Eneel T-shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46600_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46600_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46600_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46600_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46600_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46600_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46600_07.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46600_08.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46600_09.jpg"
    ]
  },
  {
    "slug": "rushnyk-butterfly-esppira",
    "name_uk": "Рушник Butterfly Esppira",
    "name_en": "Esppira Hand Towel",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/77520_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/77520_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/77520_03.jpg"
    ]
  },
  {
    "slug": "rushnyk-butterfly-big-esppira",
    "name_uk": "Рушник Butterfly Big Esppira",
    "name_en": "Esppira Sports Towel",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/77510_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/77510_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/77510_03.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-eufinia",
    "name_uk": "Футболка Butterfly Eufinia",
    "name_en": "Eufinia Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/47880_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/47880_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/47880_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/47880_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/47880_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/47880_06.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-extera",
    "name_uk": "Футболка Butterfly Extera",
    "name_en": "Extera T-shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/08/46430.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/08/46430_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/08/46430_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/08/46430_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/08/46430_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/08/46430_04.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-flazer",
    "name_uk": "Футболка Butterfly Flazer",
    "name_en": "Flazer Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/47170_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/47170_07.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/47170_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/47170_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/47170_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/47170_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/47170_04.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-fulgress",
    "name_uk": "Футболка Butterfly Fulgress",
    "name_en": "Fulgress Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46300_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/08/46300_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/08/46300_05-1.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/08/46300_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/08/46300_02.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-grecely",
    "name_uk": "Футболка Butterfly Grecely",
    "name_en": "Grecely Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46310-1.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46310_02-1.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46310_03-1.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46310_04-1.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46310_05-1.jpg"
    ]
  },
  {
    "slug": "shtany-butterfly-harune",
    "name_uk": "Штани Butterfly Harune",
    "name_en": "Harune Pants",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/05/52529.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/05/52529_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/05/52529_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/05/52529_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/05/52529_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/05/52529_06.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-haruneo",
    "name_uk": "Футболка Butterfly Haruneo",
    "name_en": "Haruneo Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/47899_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/47899_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/47899_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/47899_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/47899_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/02/47899_06.jpg"
    ]
  },
  {
    "slug": "shtany-butterfly-infiria2",
    "name_uk": "Штани Butterfly Infiria2",
    "name_en": "Infiria2 Pants",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52480_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52480_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52480_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52480_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52480_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52480_06.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-infiria2",
    "name_uk": "Футболка Butterfly Infiria2",
    "name_en": "Infiria2 Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47830_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47830_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47830_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47830_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47830_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47830_06.jpg"
    ]
  },
  {
    "slug": "spidnytsia-butterfly-infiria2",
    "name_uk": "Спідниця Butterfly Infiria2",
    "name_en": "Infiria2 Skirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52499_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52519_07.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52499_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52499_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52499_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52499_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52499_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/52499_07.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-jenora",
    "name_uk": "Футболка Butterfly Jenora",
    "name_en": "Jenora T-shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/47240_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/47240_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/47240_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/47240_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/47240_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/47240_04.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-korea-nt2024",
    "name_uk": "Футболка Butterfly Korea NT2024",
    "name_en": "Korea NT2024 Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/KCG_koreaNT_re_SKY_0.png",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/KCG_koreaNT_re_SKY_1.png",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/KCG_koreaNT_re_SKY_2.png",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/KCG_koreaNT_re_SKY_3.png",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/KCG_koreaNT_re_LIME_0.png",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/KCG_koreaNT_re_NAVY_0.png"
    ]
  },
  {
    "slug": "rushnyk-butterfly-lasicle",
    "name_uk": "Рушник Butterfly Lasicle",
    "name_en": "Lasicle Hand Towel",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/77180.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/77180_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/77180_02.jpg"
    ]
  },
  {
    "slug": "rushnyk-butterfly-big-lasicle",
    "name_uk": "Рушник Butterfly Big Lasicle",
    "name_en": "Lasicle Sports Towel",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/77170_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/77170.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/77170_03.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-lecoot",
    "name_uk": "Футболка Butterfly Lecoot",
    "name_en": "Lecoot T-Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/46790_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/46790_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/46790_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/46790_07.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/46790_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/46790_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/46790_04.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-lunaseam",
    "name_uk": "Футболка Butterfly Lunaseam",
    "name_en": "Lunaseam T-shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47810_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47810_06.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-maltil",
    "name_uk": "Футболка Butterfly Maltil",
    "name_en": "Maltil  T-shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46580.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46580_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46580_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46580_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46580_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46580_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46580_07.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46580_08.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/46580_09.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-minalea",
    "name_uk": "Футболка Butterfly Minalea",
    "name_en": "Minalea Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46549_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46549_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46549_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46549_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46549_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46549_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46549_07.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46549_08.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/05/46549_09.jpg"
    ]
  },
  {
    "slug": "napulsnyk-butterfly-nl",
    "name_uk": "Напульсник Butterfly NL",
    "name_en": "NL Wrist Band",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2017/09/NL-wrist-band.jpg"
    ]
  },
  {
    "slug": "napulsnyk-butterfly-nl-ii",
    "name_uk": "Напульсник Butterfly NL II",
    "name_en": "NL Wrist Band II",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/77400_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/77400_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/77400_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/77400_04.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-noial",
    "name_uk": "Футболка Butterfly Noial",
    "name_en": "Noial T-shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/47430_01.webp",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/47430_02.webp",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/47430_03.webp",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/47430_04.webp",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/47430_05.webp",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/47430_06.jpg.webp",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/47430_07.webp"
    ]
  },
  {
    "slug": "rushnyk-butterfly-palest",
    "name_uk": "Рушник Butterfly Palest",
    "name_en": "Palest Hand Towel",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77260_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77260_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77260_02.jpg"
    ]
  },
  {
    "slug": "shtany-butterfly-pelsedo",
    "name_uk": "Штани Butterfly Pelsedo",
    "name_en": "Pelsedo Pants",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52200.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52200_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52200_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52200_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/03/52200_05.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-playce",
    "name_uk": "Футболка Butterfly Playce",
    "name_en": "Playce Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46340-2.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46340_02-2.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46340_03-2.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46340_04-2.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46340_05-2.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2023/03/46340_06-2.jpg"
    ]
  },
  {
    "slug": "rushnyk-butterfly-ramic",
    "name_uk": "Рушник Butterfly Ramic",
    "name_en": "Ramic Hand Towel",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/77450_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/77450_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/77450_03.jpg"
    ]
  },
  {
    "slug": "rushnyk-butterfly-big-ramic",
    "name_uk": "Рушник Butterfly Big Ramic",
    "name_en": "Ramic Sport Towel",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/77440_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/77440_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/09/77440_03.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-reseine",
    "name_uk": "Футболка Butterfly Reseine",
    "name_en": "Reseine Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46590_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46590_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46590_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46590_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46590_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46590_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46590_07.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46590_08.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/04/46590_09.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-rimeral",
    "name_uk": "Футболка Butterfly Rimeral",
    "name_en": "Rimeral Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47800_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47800_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47800_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47800_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47800_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47800_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47800_07.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-rubbers",
    "name_uk": "Футболка Butterfly Rubbers",
    "name_en": "Rubbers T-Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/46770_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/46770_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/46770_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/46770_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/46770_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/46770_04.jpg"
    ]
  },
  {
    "slug": "rushnyk-butterfly-sarafuwari",
    "name_uk": "Рушник Butterfly Sarafuwari",
    "name_en": "Sarafuwari Towel",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77270_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77270_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77270_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77270_07.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77270_08.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77270_09.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77270_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77270_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/77270_06.jpg"
    ]
  },
  {
    "slug": "shtany-butterfly-selwin",
    "name_uk": "Штани Butterfly Selwin",
    "name_en": "Selwin Pants",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/52330_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/52330_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/52330_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/52330_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2025/02/52330_04.jpg"
    ]
  },
  {
    "slug": "shtany-butterfly-semi-long",
    "name_uk": "Штани Butterfly Semi-Long",
    "name_en": "Semi-long pants",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/52280_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/52280_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/52280_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/52280_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/52280_04.jpg"
    ]
  },
  {
    "slug": "futbolka-butterfly-sollien",
    "name_uk": "Футболка Butterfly Sollien",
    "name_en": "Sollien Shirt",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47790.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47790_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47790_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47790_04.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47790_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47790_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2026/03/47790_07.jpg"
    ]
  },
  {
    "slug": "shtany-butterfly-vf",
    "name_uk": "Штани Butterfly VF",
    "name_en": "VF pants",
    "images": [
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/52270_01.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/52270_06.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/52270_02.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/52270_03.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/52270_05.jpg",
      "https://www.butterflythailand.co.th/wp-content/uploads/2024/09/52270_04.jpg"
    ]
  }
]''')

def main():
    rows, ok, skip = [], 0, 0
    total = sum(len(p["images"]) for p in PLAN)
    print("До заливки: " + str(len(PLAN)) + " товарів, " + str(total) + " фото -> Cloudinary dh6vuxjko\n")
    for p in PLAN:
        slug = p["slug"]; alt = p.get("name_uk") or ("Butterfly " + slug)
        for i, url in enumerate(p["images"]):
            pid = "ttmax/product/" + slug + "/" + ("%02d" % i)
            data = fetch(url)
            if not data:
                print("  SKIP  " + pid + "  (не скачалось)"); skip += 1; continue
            tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".img"); tmp.write(data); tmp.close()
            try:
                res = cloudinary.uploader.upload(tmp.name, public_id=pid, overwrite=True,
                        resource_type="image", unique_filename=False, use_filename=False)
            except Exception as e:
                print("  SKIP  " + pid + "  (" + str(e) + ")"); skip += 1; os.unlink(tmp.name); continue
            os.unlink(tmp.name)
            rows.append({"entity_type": "product", "entity_slug": slug, "public_id": res["public_id"],
                         "format": res.get("format"), "width": res.get("width"),
                         "height": res.get("height"), "alt": alt, "sort": i})
            ok += 1
            print("  OK    " + pid + "  " + str(res.get("width")) + "x" + str(res.get("height")) + " " + str(res.get("format")))
            json.dump(rows, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
            time.sleep(DELAY)
    json.dump(rows, open(MANIFEST, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print("\nГотово. Залито: " + str(ok) + ", пропущено: " + str(skip) + ".")
    print("Манифест: " + MANIFEST + " (" + str(len(rows)) + " рядків) — надішли мені.")

if __name__ == "__main__":
    sys.exit(main())
