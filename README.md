# simit.cafe

İstanbul temalı artımlı tarayıcı oyunu. Bir simitle başla, ekibini kur, yedi semti keşfet.

[Oyunu aç](https://korayisildak.github.io/simitclicker/)

## Üçüncü sürüm

- 3.1: Eski FRP oyunlarından ilham alan, pencereye sığan kompakt oyun sahnesi ve yuvalı envanter. Eşyayı seç, etkisini incele, sabit panelden satın al; öğrenilen tarifler envanterde kalır.
- Mobil/yatay ekran uyumu, klavyeyle oynama ve vektör İstanbul kıyısı.
- Tam ekran düğmesi, açılıp kapanan özgün 8-bit müzik ve ayarlardan kapatılabilen piksel RPG imleçleri. Müzik yalnızca açıkça başlatılınca çalar; sekme gizlenince durur.
- 12 üretici, tık ve üretim geliştirmeleri, yedi semtlik rota, ödüllü görev zinciri ve başarımlar.
- İlk martı 12 simit; tık gücü üretimin %3'ünü de kazanır. Yeni semtler kalıcı üretim bonusları açar.
- 45 saniyelik bereket veren altın simit; hareketi azaltma ve isteğe bağlı hafif ses.
- Bağımsız 30 saniyelik yarış; arkadaşının skoruyla açılan meydan okuma bağlantıları, paylaşım kartı indirme ve cihazın paylaşım menüsü.
- 10 saniyede bir ve önemli işlemlerden sonra otomatik kayıt; JSON yedekleme ve geri yükleme.
- v1/v2 kayıt geçişi. Eski kayıt, üçüncü sürüme ilk geçişte ayrı bir anahtara yedeklenir.

Üretim yalnızca oyun sekmesi görünürken sürer. Çevrimdışı kazanç yoktur. Kayıt cihazdaki tarayıcıya aittir; sunucu hesabı, takip kodu veya doğrulanmış çevrimiçi skor tablosu yoktur. Web Locks destekleyen tarayıcılarda ikinci sekme aynı kaydı değiştiremez.

## Çalıştırma ve test

Oyun saf HTML, CSS ve JavaScript modüllerinden oluşur. Derleme ve çalışma zamanı bağımlılığı yoktur. ES modülleri için HTTP üzerinden açılmalıdır:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

[Yerel oyun](http://127.0.0.1:8765/)

```sh
npm ci
npm test
npx playwright install chromium
# Yerel sunucu başka bir terminalde açıkken:
npm run test:browser
```

Var olan Chrome kurulumuyla test için `BROWSER_EXECUTABLE` ortam değişkeni kullanılabilir. `TEST_URL` test edilecek sunucuyu değiştirir. Testler ayrı tarayıcı profilleri kullanır; oyuncu kayıtlarına dokunmaz. Görsel kontrol çıktıları `test-results/` içine yazılır ve depoya alınmaz.

## Dosya düzeni

- `engine.js`: dengeler, üretim, satın alma, görevler, semtler, başarımlar ve kayıt normalleştirme.
- `game.js`: arayüz, görünür sekme döngüsü, ses ve kullanıcı etkileşimleri.
- `music.js`: dış dosya kullanmayan, Web Audio ile üretilen özgün chiptune döngüsü.
- `scene.js`: İstanbul SVG çizimi, simit fotoğrafının hazırlanması ve martılar.
- `storage.js`: güvenli kayıt/yedek işlemleri.
- `challenge.js`: bağımsız süreli yarış.
- `sharing.js`: paylaşım bağlantısı ve yerel paylaşım kartı.
- `tests/`: oyun motoru ve tarayıcı akışı kontrolleri.

## Yayın

GitHub Pages `main` dalının kökünden yayınlanır. Çalışma zamanı modülleri ve CSS aynı sürüm etiketiyle çağrılır; yeni sürümde etiketleri birlikte artır. `npm` yalnızca geliştirme testleri içindir. Ayrıntılı tasarım kararları [DESIGN.md](DESIGN.md) içinde.
