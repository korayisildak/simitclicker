# SimitClicker v3 — inceleme ve tasarım kararları

## Mevcut oyunda görülen sorunlar

İnceleme, `a97d80a` sürümünün kaynak koduna ve önceki ekran görüntülerine dayanır. Gerçek oyuncu analitiği veya kullanıcı araştırması yapılmamıştır.

| Alan              | Kaynakta görülen sorun                                                                                           | Yeni sürümde karşılığı                                                                                                             |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Görsel tasarım    | Koyu paneller, birbiriyle yarışan görsel stiller; silüette büyük kırık çatı çizgileri ve ekran oranında kırpılma | Sıcak kâğıt, mürekkep mavisi ve kiremit tonları; tutarlı tipografi; ayrıntılı ve tamamen görünür kıyı çizimi                       |
| Oyun dengesi      | İlk martı 15 simit ve 0,1/sn; sonraki fiyatlar çok hızlı yükseliyor, oyuncuya yakın bir hedef sunulmuyor         | 12 simitlik ilk üretici ve 0,4/sn; daha yumuşak maliyet basamakları, aktif oynamayı değerli tutan üretime bağlı tık gücü           |
| Level tasarımı    | Binalar ve başarımlar var, ama semtler ve somut ilerleme rotası yok                                              | Birikmiş toplam üretimle açılan yedi semt, üretim bonusları ve tek seferlik ödüllü görev zinciri                                   |
| Kullanım akışı    | Mobilde dükkânın önünde uzun istatistik alanı; bilgi fareyle üzerine gelmeye bağlı; tıklanabilir öğeler div/img  | Oyun ve dükkân birbirine yakın; dükkân/rota/koleksiyon sekmeleri; gerçek düğmeler, görünür fiyat/üretim/açıklama ve klavye erişimi |
| Kayıt             | Manuel kayıt unutulursa ilerleme kaybı; kayıt verisi az denetleniyor                                             | Otomatik kayıt, v1/v2 geçişi ve yedeği, bozuk kaydı koruma, dışa/içe aktarma, çoklu sekmede yazma kilidi                           |
| Kod akışı         | Bütün işlevler tek dosyada; yükseltme listesi düzenli aralıklarla tamamen yeniden oluşturuluyor                  | DOM'dan bağımsız test edilebilir motor ve ayrı görünüm/kayıt/paylaşım/yarış modülleri; sabit düğümleri güncelleme                  |
| Paylaşılabilirlik | Arkadaşına gönderecek skor, yarış veya paylaşım önizlemesi yok                                                   | Eşit başlangıçlı 30 saniyelik yarış, hedef skor taşıyan bağlantı, kişisel kart indirme, Web Share ve pano desteği                  |

## Oyuncunun yolculuğu

İlk ekranda ana simit, mevcut birikim, üretim hızı ve bir sonraki görev görünür. İlk birkaç dokunuştan sonra martı satın alınır; üretim kendiliğinden başlar. Görev ödülleri ekibi büyütmeye yardım eder. Toplam üretim semtleri açarken harcamalar yalnızca tezgâhtaki bakiyeyi azaltır. Yeni semtlerin bonusları bütün üretime uygulanır.

Altın simit fırsatı kısa bir üretim artışı sağlar. Fırsat kaçırmak ilerleme kaybettirmez. Günlük giriş zorunluluğu, süreli satın alma baskısı, bildirim isteği veya ücretli hızlandırıcı bulunmaz. Üretim sekme gizliyken durur; eski oyunun çevrimdışı kazanç olmaması kuralı korunmuştur.

Yarış ana ekonomiden bağımsızdır: her dokunuş bir simittir ve dükkân bonusları yarışta işlemez. Meydan okuma bağlantısındaki skor yalnızca arkadaşlar arası karşılaştırmadır. İstemci tarafından üretildiğinden doğrulanmış bir liderlik tablosu iddiasında bulunulmaz.

## Görsel ve erişilebilirlik tercihleri

Ana simit fotoğrafı korunur. Yeni İstanbul çizimi çözünürlükten bağımsız SVG'dir. Galata, kubbeler, minareler, renkli evler, köprü ve Kız Kulesi ilk anda görünür. Sisli tepe katmanı yoktur. Vapur köprünün altında toplam 6 SVG birimlik mesafede süzülür. Semtler ilerledikçe pencereler ve köprü ışıkları ısınır.

Klavye odağı görünürdür. Sekmeler ok tuşları, Home ve End ile değişir. Modal pencereler yerel dialog kullanır. Gereksiz hareketler sistemin azaltılmış hareket tercihiyle veya oyun ayarından kapanır. Ses varsayılan olarak kapalıdır. Sayaç sürekli ekran okuyucu duyurusu yapmaz; anlamlı olaylar ayrı durum alanında duyurulur.

## Kayıt güvenliği

Ana kayıt anahtarı aynı kalır: `simitclicker-istanbul`. Geçişte eski sürüm `simitclicker-istanbul-before-v3` anahtarına kopyalanır. İçe aktarmadan önce mevcut kayıt `simitclicker-istanbul-before-import` altında korunur. Okunamayan veya daha yeni sürüme ait kayıt otomatik üzerine yazılmaz. Üretim hesabına bilinmeyen bina/yükseltme kimlikleri ve geçersiz sayılar alınmaz.

## Yayın sonrası değerlendirilebilecek ölçüler

Bu değişiklikler paylaşmayı kolaylaştırır; viral büyüme garantisi vermez. İlk martıyı alma süresi, ilk görev tamamlama, ikinci semte ulaşma, yarış bitirme ve paylaşım düğmesini kullanma oranları ileride gönüllü test oturumlarıyla ölçülebilir. Bu sürüm veri toplama veya üçüncü taraf analitik eklemez.
