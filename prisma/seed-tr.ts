/**
 * Türkçe demo veri tohumlayıcı (README ekran görüntüleri ve yerel demo için).
 * Çalıştır: npx tsx prisma/seed-tr.ts
 *
 * Idempotent: tüm kayıtlar kararlı anahtarlara sahip upsert'lerle yazılır,
 * tekrar çalıştırmak veriyi çoğaltmaz. Çıktı özeti prisma/seed-tr-output.json
 * dosyasına yazılır.
 *
 * Hesaplar (tümü Password123):
 *   serbest@ornek.dev  → FREELANCER (Ayşe Demir)
 *   isveren@ornek.dev  → CLIENT (Bora Yılmaz — Boğaz Teknoloji)
 *   yonetici@ornek.dev → ADMIN
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

const db = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const now = () => new Date();
const ago = (ms: number) => new Date(Date.now() - ms);

// --- Beceri taksonomisi (8) ---------------------------------------------------
const SKILLS: Array<{ name: string; category: string; slug: string }> = [
  { name: 'React', category: 'Web Geliştirme', slug: 'react' },
  { name: 'Next.js', category: 'Web Geliştirme', slug: 'nextjs' },
  { name: 'TypeScript', category: 'Web Geliştirme', slug: 'typescript' },
  { name: 'Node.js', category: 'Web Geliştirme', slug: 'nodejs' },
  { name: 'UI/UX Tasarım', category: 'Tasarım', slug: 'ui-ux-tasarim' },
  { name: 'Figma', category: 'Tasarım', slug: 'figma' },
  { name: 'SEO', category: 'Pazarlama', slug: 'seo' },
  { name: 'İçerik Yazarlığı', category: 'Yazma & Çeviri', slug: 'icerik-yazarligi' },
];

// --- Şirket rehberi (16) ------------------------------------------------------
const COMPANIES = [
  'Boğaz Teknoloji',
  'Ege Yazılım',
  'Anadolu Dijital',
  'Marmara Analitik',
  'Kule Stüdyo',
  'Asya Bulut Bilişim',
  'Trakya Labs',
  'Efes Kreatif Ajans',
  'Karadeniz Veri',
  'Toros Yazılım',
  'Kapadokya Medya',
  'Mavi Okyanus Ajans',
  'İstanbul Prodüksiyon',
  'Lykia Teknoloji',
  'Pera Danışmanlık',
  'Smyrna Yazılım',
];

const PASSWORD = 'Password123';

async function main() {
  // FZ-16: bilinen şifreli demo hesapları (ADMIN dahil) gerçek ortama
  // tohumlanamaz.
  if (process.env.NODE_ENV === 'production') {
    console.error(
      'Demo veri tohumlama üretim ortamında reddedildi. NODE_ENV=development ile deneyin.',
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // 1) Beceriler ---------------------------------------------------------------
  const skills: Record<string, { id: string; name: string }> = {};
  for (const s of SKILLS) {
    const row = await db.skill.upsert({
      where: { slug: s.slug },
      update: { name: s.name, category: s.category },
      create: { name: s.name, category: s.category, slug: s.slug },
    });
    skills[s.name] = row;
  }

  // 2) Şirket rehberi -----------------------------------------------------------
  await db.company.createMany({
    data: COMPANIES.map((name) => ({ name })),
    skipDuplicates: true,
  });

  // 3) Admin ---------------------------------------------------------------------
  const admin = await db.user.upsert({
    where: { email: 'yonetici@ornek.dev' },
    update: { role: 'ADMIN', status: 'ACTIVE', emailVerified: ago(30 * DAY), approvedAt: ago(30 * DAY) },
    create: {
      email: 'yonetici@ornek.dev',
      name: 'Sistem Yöneticisi',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      locale: 'tr',
      timezone: 'Europe/Istanbul',
      emailVerified: ago(30 * DAY),
      approvedAt: ago(30 * DAY),
    },
  });

  // 4) İş veren (client) -----------------------------------------------------------
  const client = await db.user.upsert({
    where: { email: 'isveren@ornek.dev' },
    update: {
      emailVerified: ago(25 * DAY),
      approvedAt: ago(24 * DAY),
      payoutProvider: 'MANUAL',
      payoutDetail: 'İş Bankası **** 7890',
      payoutHolderName: 'Bora Yılmaz',
    },
    create: {
      email: 'isveren@ornek.dev',
      name: 'Bora Yılmaz',
      passwordHash,
      role: 'CLIENT',
      status: 'ACTIVE',
      locale: 'tr',
      timezone: 'Europe/Istanbul',
      emailVerified: ago(25 * DAY),
      approvedAt: ago(24 * DAY),
      payoutProvider: 'MANUAL',
      payoutDetail: 'İş Bankası **** 7890',
      payoutHolderName: 'Bora Yılmaz',
      clientProfile: {
        create: {
          companyName: 'Boğaz Teknoloji',
          companyUrl: 'https://bogazteknoloji.example.com',
          about:
            'Boğaz Teknoloji, e-ticaret ve kurumsal yazılım çözümleri geliştiren İstanbul merkezli bir yazılım şirketidir. 24 kişilik ekibiyle Türkiye genelinde 120’den fazla markaya hizmet veriyor.',
          location: 'İstanbul, Türkiye',
          paymentVerified: true,
          companyVerified: true,
          emailVerified: true,
          ratingAvg: 4.8,
          ratingCount: 6,
        },
      },
    },
  });

  // 5) Serbest çalışanlar ------------------------------------------------------------
  const freelancer = await db.user.upsert({
    where: { email: 'serbest@ornek.dev' },
    update: {
      emailVerified: ago(40 * DAY),
      approvedAt: ago(39 * DAY),
      showFullName: true,
      identityStatus: 'VERIFIED',
      identityProvider: 'demo',
      identityRef: 'demo-ayse-demir',
      identityVerifiedAt: ago(20 * DAY),
      payoutProvider: 'WISE',
      payoutDetail: 'TR** **** 4821',
      payoutHolderName: 'Ayşe Demir',
    },
    create: {
      email: 'serbest@ornek.dev',
      name: 'Ayşe Demir',
      passwordHash,
      role: 'FREELANCER',
      status: 'ACTIVE',
      locale: 'tr',
      timezone: 'Europe/Istanbul',
      showFullName: true,
      emailVerified: ago(40 * DAY),
      approvedAt: ago(39 * DAY),
      identityStatus: 'VERIFIED',
      identityProvider: 'demo',
      identityRef: 'demo-ayse-demir',
      identityVerifiedAt: ago(20 * DAY),
      payoutProvider: 'WISE',
      payoutDetail: 'TR** **** 4821',
      payoutHolderName: 'Ayşe Demir',
      freelancerProfile: {
        create: {
          headline: 'Kıdemli Full-Stack Geliştirici · React & Next.js',
          bio:
            '8 yıldır React, Next.js ve TypeScript ile hızlı, erişilebilir ve SEO dostu web uygulamaları geliştiriyorum. E-ticaret, SaaS ve kurumsal projelerde uçtan uca ürün geliştirme deneyimim var; tasarımdan dağıtıma tüm süreci tek başıma yönetebiliyorum.',
          hourlyRate: 95000, // ₺950 / saat (kuruş cinsinden)
          currency: 'TRY',
          availability: 'OPEN_TO_WORK',
          hoursPerWeek: 30,
          location: 'İstanbul, Türkiye',
          timezone: 'Europe/Istanbul',
          yearsExperience: 8,
          websiteUrl: 'https://aysedemir.example.com',
          githubUrl: 'https://github.com/ayse-demir',
          linkedinUrl: 'https://www.linkedin.com/in/ayse-demir',
          completenessScore: 92,
          ratingAvg: 4.9,
          ratingCount: 12,
          skills: {
            create: [
              { skillId: skills['React']!.id, endorsements: 14 },
              { skillId: skills['Next.js']!.id, endorsements: 11 },
              { skillId: skills['TypeScript']!.id, endorsements: 9 },
              { skillId: skills['Node.js']!.id, endorsements: 6 },
            ],
          },
          portfolioItems: {
            create: [
              {
                title: 'Lokum Shop — E-ticaret Frontend',
                description:
                  'Next.js App Router + TypeScript ile geliştirilen, aylık 400 bin ziyaretçili bir e-ticaret vitrini. Lighthouse performans skoru 98.',
                externalUrl: 'https://example.com/case/lokum-shop',
                order: 0,
              },
              {
                title: 'Rota SaaS — Analitik Panosu',
                description:
                  'React Query + Recharts ile zaman serisi görselleştirmeleri; 50 binden fazla veri noktasını 60 FPS’de çizen bir analitik panosu.',
                externalUrl: 'https://example.com/case/rota-saas',
                order: 1,
              },
            ],
          },
          languages: {
            create: [
              { language: 'Türkçe', level: 'Ana dil' },
              { language: 'İngilizce', level: 'Akıcı (C1)' },
            ],
          },
        },
      },
    },
  });

  const extras = [
    {
      email: 'mehmet@ornek.dev',
      name: 'Mehmet Kaya',
      headline: 'Ürün Tasarımcısı · UI/UX & Figma',
      bio: 'Mobil ve web ürünleri için kullanıcı araştırmasından tasarım sistemine uzanan bir süreç yürütüyorum. Figma’da prototip, tasarım sistemi ve dev el kitı hazırlıyorum.',
      rate: 70000,
      skills: [
        { name: 'UI/UX Tasarım', endorsements: 8 },
        { name: 'Figma', endorsements: 12 },
      ],
      rating: 4.8,
      count: 9,
      score: 88,
      location: 'İzmir, Türkiye',
      years: 6,
    },
    {
      email: 'zeynep@ornek.dev',
      name: 'Zeynep Arslan',
      headline: 'İçerik Stratejisti & SEO Uzmanı',
      bio: 'Kurumsal bloglar ve e-ticaret siteleri için SEO uyumlu içerik stratejileri kuruyorum. Teknik SEO denetimi, anahtar kelime araştırması ve düzenli yayın takvimi yönetimi yapıyorum.',
      rate: 55000,
      skills: [
        { name: 'SEO', endorsements: 10 },
        { name: 'İçerik Yazarlığı', endorsements: 7 },
      ],
      rating: 4.7,
      count: 15,
      score: 80,
      location: 'Ankara, Türkiye',
      years: 5,
    },
    {
      email: 'can@ornek.dev',
      name: 'Can Öztürk',
      headline: 'Backend Geliştirici · Node.js & PostgreSQL',
      bio: 'Yüksek trafikli API’ler, veri modelleme ve performans iyileştirme konusunda uzmanlaştım. Node.js ve TypeScript ile ölçeklenebilir servisler yazıyorum.',
      rate: 80000,
      skills: [
        { name: 'Node.js', endorsements: 9 },
        { name: 'TypeScript', endorsements: 5 },
      ],
      rating: 4.6,
      count: 7,
      score: 75,
      location: 'Bursa, Türkiye',
      years: 7,
    },
  ] as const;

  const extraFreelancers: Record<string, { id: string; userId: string; name: string }> = {};
  for (const f of extras) {
    const u = await db.user.upsert({
      where: { email: f.email },
      update: {
        emailVerified: ago(35 * DAY),
        approvedAt: ago(34 * DAY),
      },
      create: {
        email: f.email,
        name: f.name,
        passwordHash,
        role: 'FREELANCER',
        status: 'ACTIVE',
        locale: 'tr',
        timezone: 'Europe/Istanbul',
        emailVerified: ago(35 * DAY),
        approvedAt: ago(34 * DAY),
        freelancerProfile: {
          create: {
            headline: f.headline,
            bio: f.bio,
            hourlyRate: f.rate,
            currency: 'TRY',
            availability: 'OPEN_TO_OFFERS',
            hoursPerWeek: 25,
            location: f.location,
            timezone: 'Europe/Istanbul',
            yearsExperience: f.years,
            completenessScore: f.score,
            ratingAvg: f.rating,
            ratingCount: f.count,
            skills: {
              create: f.skills.map((s) => ({ skillId: skills[s.name]!.id, endorsements: s.endorsements })),
            },
            languages: {
              create: [
                { language: 'Türkçe', level: 'Ana dil' },
                { language: 'İngilizce', level: 'İyi (B2)' },
              ],
            },
          },
        },
      },
    });
    const prof = await db.freelancerProfile.findUnique({ where: { userId: u.id }, select: { id: true } });
    extraFreelancers[f.email] = { id: prof!.id, userId: u.id, name: f.name };
  }

  // 6) İş ilanları (5) -------------------------------------------------------------
  const jobSpecs = [
    {
      slug: 'e-ticaret-frontend-yenileme',
      title: 'E-ticaret sitesi frontend yenileme (Next.js)',
      description:
        'Aylık 400 bin ziyaretçisi olan e-ticaret sitemizin ön yüzünü Next.js App Router üzerine taşımak istiyoruz.\n\nYapılacaklar:\n• Mevcut sayfaların Next.js + TypeScript ile yeniden yazılması\n• Ürün listeleme ve detay sayfalarında Core Web Vitals iyileştirmesi\n• Ödeme adımının mevcut altyapıyla uyumlu şekilde yeniden kurgulanması\n• Tasarım dosyaları Figma üzerinde hazır (mobil ve masaüstü)\n\nBeklentimiz: 6–8 hafta içinde kademeli geçiş, haftalık demo ve net git geçmişi.',
      budgetType: 'FIXED' as const,
      budgetMin: 12000000,
      budgetMax: 12000000,
      experience: 'EXPERT' as const,
      estimatedDays: 45,
      status: 'OPEN' as const,
      publishedAgo: 2 * DAY,
      skillNames: ['Next.js', 'React', 'TypeScript'],
    },
    {
      slug: 'mobil-uygulama-ui-ux-tasarimi',
      title: 'Mobil uygulama için UI/UX tasarımı',
      description:
        'Bireylerin günlük finans alışkanlıklarını takip ettiği mobil uygulamamız için ekran setinin tasarlanmasını bekliyoruz.\n\nKapsam:\n• 18–22 ekranlık akış (onboarding, pano, raporlar, ayarlar)\n• Figma üzerinde bileşen kütüphanesi ve tasarım sistemi\n• Erişilebilirlik kontrolleri (kontrast, dokunma hedefleri)\n• Geliştirici ekibine dev el kitı teslimi\n\nReferans uygulamaları paylaşabiliriz; marka rehberi hazır.',
      budgetType: 'FIXED' as const,
      budgetMin: 4500000,
      budgetMax: 4500000,
      experience: 'INTERMEDIATE' as const,
      estimatedDays: 30,
      status: 'OPEN' as const,
      publishedAgo: 5 * DAY,
      skillNames: ['UI/UX Tasarım', 'Figma'],
    },
    {
      slug: 'kurumsal-site-seo-icerik',
      title: 'Kurumsal web sitesi için SEO ve içerik düzenlemesi',
      description:
        'Kurumsal sitemizin arama motoru görünürlüğünü artırmak için hem teknik SEO hem de içerik tarafında destek arıyoruz.\n\nYapılacaklar:\n• Teknik SEO denetimi (site haritası, yönlendirmeler, meta yapısı)\n• Anahtar kelime araştırması ve içerik planı\n• Aylık 4 SEO uyumlu blog yazısı ( Türkçe, 1.200+ kelime)\n• Aylık performans raporu\n\nSektör: B2B yazılım. Uzun vadeli çalışma dostu, aylık saat bazlı iş modeli tercih ediyoruz.',
      budgetType: 'HOURLY' as const,
      budgetMin: 40000,
      budgetMax: 60000,
      experience: 'INTERMEDIATE' as const,
      estimatedDays: 20,
      status: 'OPEN' as const,
      publishedAgo: 7 * DAY,
      skillNames: ['SEO', 'İçerik Yazarlığı'],
    },
    {
      slug: 'postgresql-performans-optimizasyonu',
      title: 'PostgreSQL veri tabanı performans optimizasyonu',
      description:
        'Sipariş yönetim sistemimizde raporlama sorguları büyüyen veri ile yavaşladı. PostgreSQL 15 üzerinde çalışan veri tabanımızın performansını iyileştirecek bir uzman arıyoruz.\n\nKapsam:\n• Yavaş sorguların tespiti ve EXPLAIN ANALYZE raporu\n• İndeks stratejisinin gözden geçirilmesi\n• Bölümleme (partitioning) ve arşivleme önerileri\n• Node.js servis katmanındaki sorgu düzenlemeleri\n\nSistem canlıda; değişiklikler önce staging üzerinde doğrulanacak.',
      budgetType: 'FIXED' as const,
      budgetMin: 6000000,
      budgetMax: 6000000,
      experience: 'EXPERT' as const,
      estimatedDays: 21,
      status: 'OPEN' as const,
      publishedAgo: 9 * DAY,
      skillNames: ['Node.js', 'TypeScript'],
    },
    {
      slug: 'logo-kurumsal-kimlik-tasarimi',
      title: 'Logo ve kurumsal kimlik tasarımı',
      description:
        'Yeni kurulan yan markamız için logo, renk paleti ve temel kurumsal kimlik öğelerinin tasarlanması.\n\nTeslimler: vektör logo seti (renkli/siyah-beyaz), tipografi önerisi, kartvizit ve e-posta imzası şablonu. Süreç kapandı, referans için arşivde duruyor.',
      budgetType: 'FIXED' as const,
      budgetMin: 2500000,
      budgetMax: 2500000,
      experience: 'INTERMEDIATE' as const,
      estimatedDays: 14,
      status: 'CLOSED' as const,
      publishedAgo: 25 * DAY,
      skillNames: ['UI/UX Tasarım', 'Figma'],
    },
  ];

  const jobs: Record<string, { id: string; title: string }> = {};
  for (const j of jobSpecs) {
    const row = await db.job.upsert({
      where: { slug: j.slug },
      update: { status: j.status },
      create: {
        slug: j.slug,
        clientId: client.id,
        title: j.title,
        description: j.description,
        budgetType: j.budgetType,
        budgetMin: j.budgetMin,
        budgetMax: j.budgetMax,
        currency: 'TRY',
        experience: j.experience,
        estimatedDays: j.estimatedDays,
        status: j.status,
        publishedAt: ago(j.publishedAgo),
        createdAt: ago(j.publishedAgo + 2 * HOUR),
        skills: { create: j.skillNames.map((n) => ({ skillId: skills[n]!.id })) },
      },
      select: { id: true, title: true },
    });
    jobs[j.slug] = row;
  }

  // 7) Teklifler (4) -------------------------------------------------------------
  const proposalSpecs = [
    {
      slug: 'e-ticaret-frontend-yenileme',
      email: 'serbest@ornek.dev',
      coverLetter:
        'Merhaba Bora Bey,\n\nTam da bu ölçekte bir e-ticaret geçişini geçen yıl uçtan uca yönettim: Next.js App Router + TypeScript ile aylık 400 bin ziyaretçili vitrin, kademeli geçişle sıfır kesintiyle taşındı ve LCP 3,4 sn’den 1,2 sn’ye indi.\n\nPlanım: ilk hafta mevcut akışların envanteri ve kritik yolun belirlenmesi, ardından sayfa sayfa paralel geliştirme ve haftalık demo. Ödeme adımında mevcut altyapınızı bozmadan bir sarmalayıcı katman öneriyorum.\n\nUygun olduğunuzda 30 dakikalık bir görüşmede yol haritasını detaylandırabilirim. İyi çalışmalar!',
      bidAmount: 11800000,
      bidType: 'FIXED' as const,
      estimatedDays: 45,
      status: 'SHORTLISTED' as const,
      qualityScore: 92,
    },
    {
      slug: 'e-ticaret-frontend-yenileme',
      email: 'can@ornek.dev',
      coverLetter:
        'Merhaba,\n\n8 yıldır Node.js ve TypeScript ile e-ticaret altyapıları geliştiriyorum. Frontend geçişi sırasında API katmanınızda çıkabilecek darboğazları önceden tespit edip önleyebilirim; ödeme ve stok entegrasyonlarında benzer projelerde deneyimim var.\n\n45–60 günlük bir takvimle, mevcut ekibinizle paralel çalışabilecek şekilde planlama yapabilirim.',
      bidAmount: 12650000,
      bidType: 'FIXED' as const,
      estimatedDays: 60,
      status: 'SUBMITTED' as const,
      qualityScore: 74,
    },
    {
      slug: 'mobil-uygulama-ui-ux-tasarimi',
      email: 'mehmet@ornek.dev',
      coverLetter:
        'Merhaba,\n\nFintek kategorisinde son iki yılda üç ayrı mobil uygulamanın ekran setini tasarladım. Onboarding’de ilk hafta tutunma oranını yükselten küçük ama etkili kalıplar üzerinde çok çalıştım.\n\nKapsamınızı okuduğumda 20 ekran + bileşen kütüphanesi + dev el kitı önerim tam karşılıyor. İlk hafta mevcut analitik verilerinizi inceleyip akış önerilerimi paylaşmak isterim.',
      bidAmount: 4200000,
      bidType: 'FIXED' as const,
      estimatedDays: 30,
      status: 'SUBMITTED' as const,
      qualityScore: 84,
    },
    {
      slug: 'kurumsal-site-seo-icerik',
      email: 'zeynep@ornek.dev',
      coverLetter:
        'Merhaba,\n\nB2B yazılım sektöründe dört yıldır içerik stratejisi yürütüyorum. Şu anda yönettiğim üç kurumsal blogda organik trafiği yılda ortalama %140 artırdım.\n\nÖnerim: iki haftalık teknik denetim + anahtar kelime haritası, ardından aylık 4 yazılık yayın takvimi. Her yazı için başlık–giriş–H2 planını sizinle önceden paylaşıyorum; onaysız yayın yapmıyorum.',
      bidAmount: 55000,
      bidType: 'HOURLY' as const,
      estimatedDays: 20,
      status: 'SUBMITTED' as const,
      qualityScore: 79,
    },
  ];

  let proposalCount = 0;
  for (const p of proposalSpecs) {
    const freelancerId = p.email === 'serbest@ornek.dev' ? freelancer.id : extraFreelancers[p.email]!.userId;
    const existing = await db.proposal.findUnique({
      where: { jobId_freelancerId: { jobId: jobs[p.slug]!.id, freelancerId } },
      select: { id: true },
    });
    if (existing) {
      await db.proposal.update({
        where: { id: existing.id },
        data: { status: p.status, bidAmount: p.bidAmount, bidType: p.bidType },
      });
    } else {
      await db.proposal.create({
        data: {
          jobId: jobs[p.slug]!.id,
          freelancerId,
          coverLetter: p.coverLetter,
          bidAmount: p.bidAmount,
          bidType: p.bidType,
          estimatedDays: p.estimatedDays,
          status: p.status,
          qualityScore: p.qualityScore,
          createdAt: ago(1 * DAY + proposalCount * 3 * HOUR),
        },
      });
      proposalCount += 1;
    }
  }

  // 8) Mesajlaşma -------------------------------------------------------------------
  const c1Spec = [
    { from: 'client', body: 'Merhaba Ayşe Hanım, teklifinizi inceledim. Geçiş planını haftalık demolarla kurgulamanız çok mantıklı görünüyor.', at: 3 * DAY },
    { from: 'freelancer', body: 'Merhaba Bora Bey, teşekkürler! Kademeli geçişte riski en aza indirmek için ödeme adımını son haftaya planlıyorum.', at: 3 * DAY - 40 * 60 * 1000 },
    { from: 'client', body: 'Ödeme altyapımız iyzico üzerinden; sarmalayıcı katman öneriniz bu durumda nasıl çalışır?', at: 2 * DAY },
    { from: 'freelancer', body: 'İyzico formunu olduğu gibi tutup sadece konteyner katmanını yenisiyle değiştiriyoruz. Ödeme akışında A/B geçişi feature flag ile 1 saatte geri alınabilir olur.', at: 2 * DAY - 55 * 60 * 1000 },
    { from: 'client', body: 'Çok iyi. Çarşamba 14:00 için 30 dakikalık bir görüşme ayarlayalım mı?', at: 20 * HOUR },
    { from: 'freelancer', body: 'Çarşamba 14:00 benim için uygun. Görüşmede yol haritasının ilk 3 haftasını ekran paylaşımıyla göstereceğim. 👍', at: 6 * HOUR },
  ] as const;

  const c2Spec = [
    { from: 'client', body: 'Mehmet Bey, portfolyonuzu inceledim. Fintek onboarding akışlarınız çok güzel duruyor.', at: 2 * DAY },
    { from: 'freelancer', body: 'Teşekkür ederim! İsterseniz ilk hafta mevcut analitik verilerinize bakıp hızlı kazanımları listeliyorum.', at: 2 * DAY - 30 * 60 * 1000 },
    { from: 'client', body: 'Olur, erişimi paylaşayım. Bu arada tasarım sistemi dosyasını da bitmiş olarak mı teslim ediyorsunuz?', at: 5 * HOUR },
  ] as const;

  async function ensureConversation(
    aId: string,
    bId: string,
    jobId: string | null,
    spec: ReadonlyArray<{ from: 'client' | 'freelancer'; body: string; at: number }>,
    clientUserId: string,
    freelancerUserId: string,
  ): Promise<string> {
    let conv = await db.conversation.findFirst({
      where: { AND: [{ participants: { some: { userId: aId } } }, { participants: { some: { userId: bId } } }] },
      select: { id: true },
    });
    if (!conv) {
      conv = await db.conversation.create({
        data: {
          jobId,
          participants: {
            create: [
              { userId: aId, lastReadAt: ago(spec[0]!.at) },
              { userId: bId, lastReadAt: ago(spec[0]!.at) },
            ],
          },
        },
        select: { id: true },
      });
    }
    for (const m of spec) {
      const senderId = m.from === 'client' ? clientUserId : freelancerUserId;
      const existing = await db.message.findFirst({
        where: { conversationId: conv.id, senderId, body: m.body },
        select: { id: true },
      });
      if (!existing) {
        await db.message.create({
          data: { conversationId: conv.id, senderId, body: m.body, createdAt: ago(m.at) },
        });
      }
    }
    return conv.id;
  }

  const conv1Id = await ensureConversation(
    client.id,
    freelancer.id,
    jobs['e-ticaret-frontend-yenileme']!.id,
    c1Spec,
    client.id,
    freelancer.id,
  );
  const conv2Id = await ensureConversation(
    client.id,
    extraFreelancers['mehmet@ornek.dev']!.userId,
    jobs['mobil-uygulama-ui-ux-tasarimi']!.id,
    c2Spec,
    client.id,
    extraFreelancers['mehmet@ornek.dev']!.userId,
  );

  // Okunmamış rozetleri: son mesajlar karşı tarafta okunmamış kalsın.
  await db.participant.updateMany({
    where: { conversationId: conv1Id, userId: freelancer.id },
    data: { lastReadAt: ago(7 * HOUR) }, // Bora'nın son mesajı okunmamış (Ayşe tarafında)
  });
  await db.participant.updateMany({
    where: { conversationId: conv1Id, userId: client.id },
    data: { lastReadAt: new Date() }, // Bora okudu
  });
  await db.participant.updateMany({
    where: { conversationId: conv2Id, userId: client.id },
    data: { lastReadAt: ago(6 * HOUR) }, // Mehmet'in son mesajı okunmamış (Bora tarafında)
  });
  await db.participant.updateMany({
    where: { conversationId: conv2Id, userId: extraFreelancers['mehmet@ornek.dev']!.userId },
    data: { lastReadAt: new Date() },
  });

  // 9) Bildirimler --------------------------------------------------------------------
  async function ensureNotification(
    userId: string,
    type: 'PROPOSAL_RECEIVED' | 'PROPOSAL_STATUS' | 'MESSAGE' | 'SYSTEM',
    title: string,
    body: string | null,
    href: string | null,
    read: boolean,
  ) {
    const existing = await db.notification.findFirst({ where: { userId, type, title }, select: { id: true } });
    if (!existing) {
      await db.notification.create({
        data: { userId, type, title, body, href, readAt: read ? ago(2 * HOUR) : null, createdAt: ago(1 * DAY) },
      });
    }
  }

  await ensureNotification(
    client.id,
    'PROPOSAL_RECEIVED',
    'Yeni başvuru: “E-ticaret sitesi frontend yenileme”',
    'Ayşe Demir — ₺118.000, teklif incelenmeyi bekliyor',
    '/jobs/e-ticaret-frontend-yenileme/proposals',
    false,
  );
  await ensureNotification(
    client.id,
    'PROPOSAL_RECEIVED',
    'Yeni başvuru: “Mobil uygulama için UI/UX tasarımı”',
    'Mehmet Kaya — ₺42.000, teklif incelenmeyi bekliyor',
    '/jobs/mobil-uygulama-ui-ux-tasarimi/proposals',
    true,
  );
  await ensureNotification(
    client.id,
    'MESSAGE',
    'Mehmet Kaya size bir mesaj gönderdi',
    'Olur, erişimi paylaşayım. Bu arada tasarım sistemi dosyasını…',
    '/messages',
    false,
  );
  await ensureNotification(
    freelancer.id,
    'PROPOSAL_STATUS',
    'Teklifiniz kısa listeye alındı',
    '“E-ticaret sitesi frontend yenileme” ilanındaki teklifiniz kısa listeye alındı.',
    '/jobs/e-ticaret-frontend-yenileme',
    false,
  );
  await ensureNotification(
    freelancer.id,
    'MESSAGE',
    'Bora Yılmaz (Boğaz Teknoloji) size bir mesaj gönderdi',
    'Çarşamba 14:00 için 30 dakikalık bir görüşme ayarlayalım mı?',
    '/messages',
    false,
  );
  await ensureNotification(
    admin.id,
    'SYSTEM',
    'Demo ortamı hazır',
    'Türkçe demo verileriyle uçtan uca gözden geçirme yapabilirsiniz.',
    null,
    true,
  );

  // 10) Özet çıktısı --------------------------------------------------------------------
  const summary = {
    generatedAt: now().toISOString(),
    accounts: {
      admin: { email: 'yonetici@ornek.dev', role: 'ADMIN' },
      client: { email: 'isveren@ornek.dev', role: 'CLIENT', companyName: 'Boğaz Teknoloji' },
      freelancer: { email: 'serbest@ornek.dev', role: 'FREELANCER', name: 'Ayşe Demir' },
      extraFreelancers: ['mehmet@ornek.dev', 'zeynep@ornek.dev', 'can@ornek.dev'],
      password: PASSWORD,
    },
    counts: {
      skills: await db.skill.count(),
      companies: await db.company.count(),
      users: await db.user.count(),
      jobs: await db.job.count(),
      proposals: await db.proposal.count(),
      conversations: await db.conversation.count(),
      messages: await db.message.count(),
      notifications: await db.notification.count(),
    },
    routes: {
      freelancerProfileId: (await db.freelancerProfile.findUnique({ where: { userId: freelancer.id }, select: { id: true } }))!.id,
      conversationIds: [conv1Id, conv2Id],
    },
  };
  writeFileSync(path.join(process.cwd(), 'prisma', 'seed-tr-output.json'), JSON.stringify(summary, null, 2));

  console.log('✅ Türkçe demo verileri tohumlandı.');
  console.log(`   Beceri: ${summary.counts.skills} · Şirket: ${summary.counts.companies} · Kullanıcı: ${summary.counts.users}`);
  console.log(`   İş: ${summary.counts.jobs} · Teklif: ${summary.counts.proposals} · Sohbet: ${summary.counts.conversations} · Mesaj: ${summary.counts.messages}`);
  console.log(`   Admin:      yonetici@ornek.dev / ${PASSWORD}`);
  console.log(`   İş veren:   isveren@ornek.dev / ${PASSWORD}`);
  console.log(`   Freelancer: serbest@ornek.dev / ${PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
