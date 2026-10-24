<div align="center">

# ⚡ FreelanceZero

**Sıfır komisyonlu, açık kaynak, kendi sunucunuzda barındırılabilir freelance pazar yeri**

**%100 Türkçe arayüz — kazandığınızın tamamı sizde kalır**

[![Lisans: MIT](https://img.shields.io/badge/Lisans-MIT-green.svg)](./LICENSE)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![React 19](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](https://www.typescriptlang.org)
[![Prisma 6](https://img.shields.io/badge/Prisma%206-PostgreSQL-2D3748)](https://www.prisma.io)
[![Arayüz: %100 Türkçe](https://img.shields.io/badge/Aray%C3%BCz-%25100%20T%C3%BCrk%C3%A7e-E30A17)](#çok-dillilik-i18n)

![FreelanceZero ana sayfa](docs/screenshots/01-ana-sayfa.png)

**Kazandığınızın %100'ü sizde kalsın.** Geleneksel freelance pazar yerleri her
faturadan %10–20 komisyon keser; FreelanceZero **hiçbir şey kesmez**. Platform
paranın vasisi değil, yalnızca eşleştiricisidir: ödeme, işverenden freelancer'a
seçtiğiniz sağlayıcı üzerinden doğrudan akar.

[Özellikler](#özellikler) · [Ekran Görüntüleri](#ekran-görüntüleri) · [Kurulum](#hızlı-başlangıç) · [Demo Hesaplar](#demo-hesaplar) · [Lisans](#lisans)

</div>

## İçindekiler

1. [Neden FreelanceZero?](#neden-freelancezero)
2. [Özellikler](#özellikler)
3. [Ekran Görüntüleri](#ekran-görüntüleri)
4. [Teknolojiler](#teknolojiler)
5. [Hızlı Başlangıç](#hızlı-başlangıç)
6. [Demo Hesaplar](#demo-hesaplar)
7. [Çok Dillilik (i18n)](#çok-dillilik-i18n)
8. [Güvenlik](#güvenlik)
9. [Proje Yapısı](#proje-yapısı)
10. [Testler ve Kalite](#testler-ve-kalite)
11. [Yol Haritası ve Katkı](#yol-haritası-ve-katkı)
12. [Lisans](#lisans)

## Neden FreelanceZero?

Upwork, Fiverr gibi geleneksel pazar yerleri freelancer'ın kazandığı her tutardan
%10–20'ye varan kesinti alır; üstüne başvuru yapabilmek için ücretli "connect"
kredileri satın almanızı bekler. Bu model, en çok da en yeni ve en küçük
freelancer'ı vurur: kazançtan önce masraf çıkarır. FreelanceZero bu dengiyi
tersine çevirir — platformun geliri komisyondan değil, isteğe bağlı barındırma ve
kurumsal özelliklerden gelir; bireysel freelancer asla komisyon ödemez.

Teknik olarak bu karar veri modeline kadar işlenmiştir: platform hiçbir aşamada
paranın *vasisi* değildir, ödeme akışları tak-çıkar (pluggable) sağlayıcı
arayüzleri üzerinden doğrudan taraflar arasında yürür. Tüm para alanları kayan
noktalı sayı yerine tamsayı (kuruş) birimlerinde saklanır; böylece yuvarlama
hataları ve para birimi belirsizliği tasarım gereği imkânsızlaşır. Proje MIT
lisanslıdır — kendi sunucunuzda tek komutla ayağa kaldırabilir, dilediğiniz gibi
özgüleştirebilirsiniz.

| | FreelanceZero | Geleneksel pazar yeri |
|---|---|---|
| Platform komisyonu | **%0** | %10–20 |
| Başvuru kredisi ("connects") | Yok | Ücretli |
| Açık kaynak | ✅ MIT | Genellikle kapalı |
| Kendi sunucunda barındırma | ✅ Docker ile tek komut | ❌ |
| Arayüz dili | Türkçe (varsayılan) + İngilizce | Genellikle yalnızca İngilizce |

## Özellikler

### Freelancer'lar için

- **Profil ve portföy yönetimi** — beceriler, saatlik ücret, müsaitlik, dil
  bilgisi, web sitesi / LinkedIn / GitHub bağlantıları ve portföy projeleriyle
  zengin bir genel profil sayfası.
- **İş arama ve teklif gönderme** — ilanlar arasında arama, detay sayfasında
  bütçe ve süreç bilgisi, tek tıkla teklif ve gönderilen tekliflerin takibi.
- **İlan bazlı mesajlaşma** — işverenle teklif üzerinden doğrudan, okunmamış
  sayaçlı bir sohbet akışı.
- **Profil tamamlanma göstergesi** — profili eksik alanlar için yönlendirmeli
  tamamlanma yüzdesi.
- **Bildirimler** — teklif, mesaj ve yönetim olayları için üst bardaki zil
  menüsünde toplanan bildirim akışı.

### İşverenler için

- **İş ilanı oluşturma ve yayınlama** — başlık, açıklama, bütçe, süre ve şirket
  eşleştirmeli adım adım ilan formu.
- **Gelen teklifleri değerlendirme** — ilan başına teklif listesi, teklif
  sahibinin profilini inceleyip doğrudan yanıt verme ve mesajlaşmaya geçme.
- **Şirket profili yönetimi** — şirket adı, açıklama ve web adresi; ilanlar
  şirket kimliğiyle yayınlanır.
- **Ödeme yöntemi uyarısı** — ödeme alabilmek için ödeme yöntemi ekleme
  hatırlatıcıları.

### Yöneticiler için

- **Kullanıcı yönetimi** — tüm hesapların listesi, rol ve durum yönetimi.
- **İlan kürasyonu** — onay kuyruğu, yayındaki ilanlar ve yayından kaldırma;
  iletişim adresi bulunamayan kazınmış ilanların taslak olarak ele alınması.
- **Yönetim paneli** — onaylar, kullanıcılar ve ilanlar sekmeli tek arayüz.

### Platform geneli

- **Üç ana rol** — Freelancer, İşveren (Client) ve Yönetici (Admin); ayrıca
  ajans sahibi/üyesi rolleri veri modelinde hazır.
- **Kazıma hattı (job ingestion)** — harici ilan kaynaklarından (ör. RemoteOK)
  ilan çeker, taslak olarak kaydeder; yayınlanmadan önce kürasyon ve gerçek
  iletişim bilgisi zorunludur.
- **Kimlik doğrulama (identity) akışı** — doğrulama durum makinesi
  (UNVERIFIED → PENDING → PROCESSING → VERIFIED/FAILED).
- **E-posta doğrulama ve şifre akışları** — token tabanlı, tek kullanımlık,
  süresi sınırlı doğrulama bağlantıları.
- **Blog ve SEO altyapısı** — yerel ayar duyarlı meta etiketler, hreflang
  alternatifleri, site haritası ve robots kuralları.
- **Sağlık kontrolleri ve güvenli varsayılanlar** — üretim ortamında tohum
  komutları kilitli, ayrıntılı günlükler yalnızca geliştirmede.

## Ekran Görüntüleri

### Genel sayfalar

| ![İş ilanları](docs/screenshots/02-is-listesi.png) | ![İş ilanı detayı](docs/screenshots/03-is-detayi.png) |
|:---:|:---:|
| **İş ilanları** | **İş ilanı detayı** |
| ![Freelancer profili](docs/screenshots/04-freelancerlar.png) | ![Giriş](docs/screenshots/05-giris.png) |
| **Freelancer profili (genel görünüm)** | **Giriş** |
| ![Kayıt](docs/screenshots/06-kayit.png) | |
| **Kayıt** | |

### Freelancer deneyimi

| ![Freelancer paneli](docs/screenshots/07-freelancer-paneli.png) | ![Mesajlar](docs/screenshots/09-freelancer-mesajlar.png) | ![Profil](docs/screenshots/10-freelancer-profil.png) |
|:---:|:---:|:---:|
| **Freelancer paneli** | **Mesajlar** | **Profil sayfası** |

### İşveren deneyimi

| ![İşveren paneli](docs/screenshots/11-isveren-paneli.png) | ![İş ilanı oluşturma](docs/screenshots/12-is-ilani-olustur.png) |
|:---:|:---:|
| **İşveren paneli** | **İş ilanı oluşturma** |
| ![Gelen teklifler](docs/screenshots/13-gelen-teklifler.png) | ![Mesajlar](docs/screenshots/14-isveren-mesajlar.png) |
| **Gelen teklifler** | **Mesajlar** |
| ![Mesaj detayı](docs/screenshots/18-mesaj-detayi.png) | |
| **Mesaj detayı (ilan bazlı sohbet)** | |

### Yönetici paneli

| ![Yönetici paneli](docs/screenshots/15-yonetici-paneli.png) | ![Kullanıcı yönetimi](docs/screenshots/16-kullanici-yonetimi.png) | ![İlan yönetimi](docs/screenshots/17-is-yonetimi.png) |
|:---:|:---:|:---:|
| **Yönetici paneli** | **Kullanıcı yönetimi** | **İlan yönetimi** |

## Teknolojiler

| Katman | Teknoloji |
|---|---|
| Çatı (framework) | Next.js 15 (App Router) + React 19 |
| Dil | TypeScript (strict mod) |
| Arayüz | Tailwind CSS + Radix UI + lucide-react ikonları |
| Kimlik doğrulama | Auth.js / NextAuth v5 + Prisma Adapter |
| Veritabanı | PostgreSQL + Prisma ORM 6 |
| Form ve doğrulama | React Hook Form + Zod |
| Veri çekme | TanStack Query |
| Çok dillilik | next-intl v4 |
| E-posta | Nodemailer (yerel geliştirmede MailHog) |
| Test | Jest (birim) + Playwright (uçtan uca) |
| CI | GitHub Actions |
| Dağıtım | Docker / docker compose + Vercel yapılandırması |

## Hızlı Başlangıç

### Gereksinimler

- Node.js **20 veya üzeri**
- PostgreSQL **14 veya üzeri** (yerel kurulum ya da Docker)
- npm 10+

### Kurulum adımları

```bash
# 1) Depoyu klonlayın
git clone https://github.com/aliyuzerler/Freelancer_platform.git
cd Freelancer_platform

# 2) Bağımlılıkları kurun
npm install

# 3) Ortam değişkenlerini hazırlayın
cp .env.example .env
# .env dosyasını düzenleyin (aşağıdaki tabloya bakın)

# 4) Veritabanı şemasını oluşturun
npx prisma migrate deploy

# 5) (Opsiyonel) Türkçe demo verisini yükleyin
npx tsx prisma/seed-tr.ts

# 6) Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcınızda **http://localhost:3000** adresini açın — arayüz varsayılan olarak
Türkçe gelir.

### Ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|---|:---:|---|
| `DATABASE_URL` | ✅ | PostgreSQL bağlantı adresi |
| `AUTH_SECRET` | ✅ | Oturum çerezlerini imzalayan gizli anahtar (`openssl rand -base64 32` ile üretin) |
| `NEXT_PUBLIC_APP_URL` | Önerilir | Kanonik ve hreflang bağlantıları için uygulamanın kök adresi |

Diğer tüm değişkenler için `.env.example` dosyasına bakın.

### Docker ile çalıştırma

Uygulamayı PostgreSQL ve MailHog ile birlikte tek komutta ayağa kaldırabilirsiniz:

```bash
POSTGRES_PASSWORD=güçlü-bir-şifre AUTH_SECRET="$(openssl rand -base64 32)" docker compose up --build
```

### Demo verisi

`npx tsx prisma/seed-tr.ts` komutu, ekran görüntülerinde gördüğünüz Türkçe demo
içeriğini idempotent biçimde (tekrar çalıştırmaya güvenli) ekler:

- 8 popüler beceri etiketi ve 16 demo şirket profili,
- farklı kategorilerde 5 iş ilanı (Next.js kurumsal site, e-ticaret, analitik
  panosu vb.),
- 4 örnek teklif, bildirimler ve örnek bir işveren–freelancer mesajlaşması.

## Demo Hesaplar

Tohum verisini yükledikten sonra üç rolle oturum açabilirsiniz:

| Rol | E-posta | Şifre | Karakter |
|---|---|---|---|
| Freelancer | `serbest@ornek.dev` | `Password123` | Ayşe Demir |
| İşveren | `isveren@ornek.dev` | `Password123` | Bora Yılmaz · Boğaz Teknoloji |
| Yönetici | `yonetici@ornek.dev` | `Password123` | Sistem yöneticisi |

Ek freelancer hesapları: `emre@ornek.dev` ve `zeynep@ornek.dev` (şifre aynı).

> Bu hesaplar yalnızca geliştirme ve demo amaçlıdır; production ortamında
> kullanmayın.

## Çok Dillilik (i18n)

Arayüz metinleri **next-intl v4** üzerinde anahtar tabanlı yönetilir; kök adres
varsayılan olarak Türkçe (`/tr`) içeriğe yönlendirilir, İngilizce sürüm `/en`
altında yayındır. Üst bardaki dil değiştiricisi seçimi `NEXT_LOCALE` çerezinde
bir yıl boyunca saklar. Tüm çeviri katalogları (`messages/tr.json` ve
`messages/en.json`) 1.100'den fazla anahtar içerir ve anahtar paritesi
doğrulanmıştır. Tarih ve para biçimleri yerel ayara göre (tr-TR / en-US)
biçimlendirilir; e-posta şablonları da alıcının dilinde gönderilir.

Yeni bir dil eklemek yalnızca üç adımdır:

1. `messages/` altında yeni katalog dosyasını oluşturun (`tr.json` kopyasını
   çevirerek `xx.json` üretin).
2. `src/i18n/routing.ts` içindeki yerel ayar listesine `xx` kodunu ekleyin.
3. Aynı dosyadaki `LOCALE_LABELS` haritasına dilin görünen adını yazın.

Yazı tipleri (Inter / Sora) Türkçe karakterleri kapsayan latin-ext alt kümeleri
yle yüklenir; yeni dillerde bu alt kümenin yeterli olduğunu doğrulamanız yeterli.

## Güvenlik

Proje, bağımsız bir teknik denetimden geçmiş ve tespit edilen **28 bulgunun
tamamı** (2 kritik, 7 yüksek, 12 orta, 7 düşük) kapatılmıştır. Başlıca
sertleştirmeler:

- E-posta doğrulaması tamamlanmadan şifre girişi engellenir; doğrulanmamış
  OAuth bağlamalarında devralınan şifre özetleri temizlenir.
- Kimlik token'ları veritabanında SHA-256 özeti olarak saklanır; sızma
  durumunda ham token geri elde edilemez.
- Webhook imzaları HMAC ile doğrulanır; imzasız veya geçersiz imzalı istekler
  **fail-closed** ilkesiyle reddedilir.
- IP başına kayar pencere hız sınırlama: giriş 10/dk, kayıt 5/dk, şifre
  sıfırlama 5/5 dk, e-posta başına 30/saat.
- CSP, HSTS, X-Frame-Options, Referrer-Policy ve Permissions-Policy başlıkları
  etkin.
- JWT içindeki rol bilgisi en fazla 5 dakika yaşlanır; askıya alınan veya
  rolü düşen hesabın oturumu kısa sürede geçersizleşir.
- Tüm para alanları tamsayı (kuruş) birimlerinde; para birimi listesi ve tutar
  üst sınırı doğrulanır.
- Kazınan ilanlar her zaman taslak açılır ve yayınlanmadan önce gerçek iletişim
  adresi zorunlu kılınır — sahte ilan üzerinden başvuran PII'si korunur.

Güvenlik açığı bildirimi ve politika ayrıntıları için
[SECURITY.md](./SECURITY.md) dosyasına bakın.

## Proje Yapısı

```
freelancezero/
├── prisma/                  # Şema, migrasyonlar, tohumlar (Türkçe demo: seed-tr.ts)
├── messages/                # Çeviri katalogları: tr.json · en.json (1.100+ anahtar)
├── docs/
│   ├── screenshots/         # README ekran görüntüleri
│   └── *.md                 # Ürün dokümanları (rekabet analizi, wireframe, GTM)
├── src/
│   ├── app/
│   │   ├── [locale]/        # Tüm sayfalar (App Router, yerel ayar esaslı)
│   │   └── api/             # REST uçları (auth, jobs, proposals, messages, admin…)
│   ├── components/          # Arayüz bileşenleri (site-header, ui/*, marketing/*)
│   ├── i18n/                # next-intl yapılandırması (routing, request, navigation)
│   ├── lib/                 # auth, rate-limit, webhook-signature, mail, scrapers…
│   └── middleware.ts        # Hız sınırı + oturum + yerel ayar yönlendirmesi
├── tests/                   # Jest birim testleri
├── Dockerfile               # Üretim imajı
├── docker-compose.yml       # Uygulama + PostgreSQL + MailHog
└── .github/workflows/       # CI hattı
```

## Testler ve Kalite

```bash
npm run typecheck   # TypeScript tip kontrolü
npm run lint        # ESLint
npm test            # Jest birim testleri (güvenlik + doğrulama paketleri)
```

Playwright uçtan uca test altyapısı hazırdır; `npm run test:e2e` ile
çalıştırabilirsiniz. Derleme, `npm run build` ile Prisma istemcisi üretilip
tüm yerel ayar rotaları için tip güvenli biçimde tamamlanır.

## Yol Haritası ve Katkı

Kısa ve orta vadeli planlar [ROADMAP.md](./ROADMAP.md) dosyasında, katkı
kuralları [CONTRIBUTING.md](./CONTRIBUTING.md) içinde yer alır. Ürün konumlaması
ve rekabet analizi için [docs/COMPETITIVE-ADVANTAGES.md](./docs/COMPETITIVE-ADVANTAGES.md),
ekran tasarımları için [docs/WIREFRAMES.md](./docs/WIREFRAMES.md) dosyalarına
bakabilirsiniz.

Hata bildirimleri ve özellik önerileri için GitHub Issues sekmesini
kullanabilirsiniz; çekme istekleri önce küçük ve odaklı olmak üzere memnuniyetle
karşılanır.

## Lisans

Bu proje [MIT lisansı](./LICENSE) ile sunulur — dilediğiniz gibi kullanın,
özgüleştirin ve paylaşın.
