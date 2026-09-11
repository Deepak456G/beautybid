import { PrismaClient, Role, ProductStatus, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting BeautyBid database seed...');

  // 1. Clean existing seed data
  await prisma.clickEvent.deleteMany();
  await prisma.rankingHistory.deleteMany();
  await prisma.paymentEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.user.deleteMany();
  await prisma.siteSettings.deleteMany();

  console.log('🧹 Cleaned existing tables.');

  // 2. Seed Site Settings
  await prisma.siteSettings.createMany({
    data: [
      {
        key: 'MIN_RANK_INCREMENT',
        value: '500',
        description: 'Minimum promotional spend increment (in INR) required to outbid a rank',
      },
      {
        key: 'PLATFORM_NAME',
        value: 'BeautyBid',
        description: 'Promotional Beauty Leaderboard',
      },
      {
        key: 'DISCLOSURE_TEXT',
        value:
          'Rankings are based on verified promotional spend and do not represent product quality or editorial recommendations.',
        description: 'Mandatory consumer disclosure banner text',
      },
    ],
  });

  // 3. Seed Categories
  const categoryDefs = [
    { name: 'Face Care', slug: 'face-care', icon: 'Sparkles', description: 'Serums, moisturizers, cleansers, and sunscreens', displayOrder: 1 },
    { name: 'Hair Care', slug: 'hair-care', icon: 'Scissors', description: 'Oils, shampoos, serums, and scalp treatments', displayOrder: 2 },
    { name: 'Makeup', slug: 'makeup', icon: 'Palette', description: 'Lipsticks, foundations, eyeliners, and blushes', displayOrder: 3 },
    { name: 'Body Care', slug: 'body-care', icon: 'HeartHandshake', description: 'Body lotions, scrubs, mists, and shower gels', displayOrder: 4 },
    { name: 'Fragrance', slug: 'fragrance', icon: 'Flame', description: 'Luxury perfumes, colognes, and artisanal mists', displayOrder: 5 },
    { name: "Men's Grooming", slug: 'mens-grooming', icon: 'UserCheck', description: 'Beard oils, face washes, and styling essentials', displayOrder: 6 },
    { name: 'Oral Care', slug: 'oral-care', icon: 'Smile', description: 'Toothpastes, teeth whitening, and dental cleansers', displayOrder: 7 },
    { name: 'Wellness', slug: 'wellness', icon: 'Sun', description: 'Collagen supplements, herbal infusions, and vitality boosters', displayOrder: 8 },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoryDefs) {
    categories[cat.slug] = await prisma.category.create({ data: cat });
  }
  console.log('✅ Seeded categories.');

  // 4. Seed Admin and Brand Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('AdminPassword@2026', salt);
  const brandPasswordHash = await bcrypt.hash('BrandPassword@2026', salt);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@beautybid.in',
      name: 'BeautyBid Administrator',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    },
  });

  const brandsData = [
    {
      userEmail: 'growth@beminimalist.co',
      userName: 'Minimalist Team',
      brandName: 'Minimalist',
      slug: 'minimalist',
      logoUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&auto=format&fit=crop&q=80',
      websiteUrl: 'https://beminimalist.co',
      description: 'Science-backed skincare formulated with pure active ingredients for effective results.',
    },
    {
      userEmail: 'concierge@forestessentialsindia.com',
      userName: 'Forest Essentials Official',
      brandName: 'Forest Essentials',
      slug: 'forest-essentials',
      logoUrl: 'https://images.unsplash.com/photo-1608248597359-00624d778d91?w=200&auto=format&fit=crop&q=80',
      websiteUrl: 'https://www.forestessentialsindia.com',
      description: 'Traditional, authentic Ayurvedic skincare hand-crafted in the foothills of Himalayas.',
    },
    {
      userEmail: 'partners@kamaayurveda.com',
      userName: 'Kama Ayurveda Brand Team',
      brandName: 'Kama Ayurveda',
      slug: 'kama-ayurveda',
      logoUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&auto=format&fit=crop&q=80',
      websiteUrl: 'https://www.kamaayurveda.com',
      description: 'Pure, authentic ayurvedic treatments based on ancient time-tested formulas.',
    },
    {
      userEmail: 'hello@dotandkey.com',
      userName: 'Dot & Key Marketing',
      brandName: 'Dot & Key',
      slug: 'dot-and-key',
      logoUrl: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=200&auto=format&fit=crop&q=80',
      websiteUrl: 'https://www.dotandkey.com',
      description: 'Fruit-forward and dermatologically tested skincare designed for modern Indian skin.',
    },
    {
      userEmail: 'care@plumgoodness.com',
      userName: 'Plum Goodness Brand Manager',
      brandName: 'Plum Goodness',
      slug: 'plum-goodness',
      logoUrl: 'https://images.unsplash.com/photo-1556228722-d0b5d0f6bb57?w=200&auto=format&fit=crop&q=80',
      websiteUrl: 'https://plumgoodness.com',
      description: '100% vegan, cruelty-free beauty powered by plant goodness.',
    },
    {
      userEmail: 'marketing@sugarcosmetics.com',
      userName: 'SUGAR Cosmetics Team',
      brandName: 'SUGAR Cosmetics',
      slug: 'sugar-cosmetics',
      logoUrl: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&auto=format&fit=crop&q=80',
      websiteUrl: 'https://sugarcosmetics.com',
      description: 'High-pigment, long-lasting makeup curated for vibrant Indian skin tones.',
    },
  ];

  const brandRecords: Record<string, any> = {};

  for (const b of brandsData) {
    const user = await prisma.user.create({
      data: {
        email: b.userEmail,
        name: b.userName,
        passwordHash: brandPasswordHash,
        role: Role.BRAND,
      },
    });

    const brand = await prisma.brand.create({
      data: {
        userId: user.id,
        name: b.brandName,
        slug: b.slug,
        logoUrl: b.logoUrl,
        websiteUrl: b.websiteUrl,
        description: b.description,
        verified: true,
      },
    });

    brandRecords[b.slug] = { user, brand };
  }
  console.log('✅ Seeded users and brands.');

  // 5. Seed Products with Ranked Spend
  const productsData = [
    {
      brandSlug: 'minimalist',
      categorySlug: 'face-care',
      name: '10% Niacinamide Serum with EUK-134',
      slug: 'minimalist-10-niacinamide-serum',
      description: 'Pure 10% Niacinamide formula clinically proven to fade dark spots, balance excess sebum, and soothe inflammation with powerful EUK-134 antioxidant protection.',
      productUrl: 'https://beminimalist.co/products/niacinamide-10-euk-134-1',
      imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
      verifiedSpend: 150000.0,
      isFeatured: true,
      viewsCount: 14200,
      clicksCount: 3840,
    },
    {
      brandSlug: 'forest-essentials',
      categorySlug: 'face-care',
      name: 'Soundarya Radiance Cream with 24K Gold & SPF 25',
      slug: 'soundarya-radiance-cream-24k-gold',
      description: 'An iconic Ayurvedic youth elixir infused with pure 24 Karat gold bhasma, saffron, and sweet almond oil for unmatched luminosity and deep nourishment.',
      productUrl: 'https://www.forestessentialsindia.com/soundarya-radiance-cream-with-24k-gold-spf-25.html',
      imageUrl: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=80',
      verifiedSpend: 120000.0,
      isFeatured: true,
      viewsCount: 11800,
      clicksCount: 2950,
    },
    {
      brandSlug: 'kama-ayurveda',
      categorySlug: 'face-care',
      name: 'Kumkumadi Miraculous Beauty Ayurvedic Night Serum',
      slug: 'kumkumadi-miraculous-beauty-night-serum',
      description: '100% natural Ayurvedic night serum made with rare Kashmiri Saffron, Indian Madder, and Lotus extracts to illuminate complexion and reduce fine lines.',
      productUrl: 'https://www.kamaayurveda.com/kumkumadi-miraculous-beauty-fluid.html',
      imageUrl: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&auto=format&fit=crop&q=80',
      verifiedSpend: 95000.0,
      isFeatured: true,
      viewsCount: 9400,
      clicksCount: 2110,
    },
    {
      brandSlug: 'plum-goodness',
      categorySlug: 'face-care',
      name: '15% Vitamin C Face Serum with Mandarin',
      slug: 'plum-15-vitamin-c-glow-cocktail',
      description: 'Quick-absorbing antioxidant glow cocktail featuring Japanese Mandarin and pure Ethyl Ascorbic Acid to brighten dull skin and boost natural collagen synthesis.',
      productUrl: 'https://plumgoodness.com/products/15-vitamin-c-face-serum-with-mandarin',
      imageUrl: 'https://images.unsplash.com/photo-1617897903246-719242758050?w=800&auto=format&fit=crop&q=80',
      verifiedSpend: 80000.0,
      isFeatured: false,
      viewsCount: 8200,
      clicksCount: 1980,
    },
    {
      brandSlug: 'dot-and-key',
      categorySlug: 'face-care',
      name: 'Watermelon Cooling Sunscreen SPF 50+ PA+++',
      slug: 'dot-and-key-watermelon-cooling-sunscreen',
      description: 'Ultralight fluid gel sunscreen formulated with fresh watermelon juice and hyaluronic acid for zero white cast, instant cooling hydration, and blue-light protection.',
      productUrl: 'https://www.dotandkey.com/products/watermelon-hyaluronic-cooling-sunscreen-spf-50-pa',
      imageUrl: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=80',
      verifiedSpend: 65000.0,
      isFeatured: false,
      viewsCount: 7500,
      clicksCount: 1620,
    },
    {
      brandSlug: 'sugar-cosmetics',
      categorySlug: 'makeup',
      name: 'Matte As Hell Crayon Lipstick (Scarlett O Hara)',
      slug: 'sugar-matte-as-hell-crayon-lipstick',
      description: 'Intensely pigmented, transfer-proof matte crayon lipstick that glides on like velvet and wears comfortably all day without drying lips.',
      productUrl: 'https://sugarcosmetics.com/products/matte-as-hell-crayon-lipstick',
      imageUrl: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80',
      verifiedSpend: 50000.0,
      isFeatured: false,
      viewsCount: 6800,
      clicksCount: 1450,
    },
    {
      brandSlug: 'forest-essentials',
      categorySlug: 'fragrance',
      name: 'Mysore Sandalwood & Vetiver Body Mist',
      slug: 'forest-essentials-sandalwood-vetiver-body-mist',
      description: 'Distilled therapeutic floral water infused with rich Mysore Sandalwood and cooling earthen Vetiver to refresh mind and body.',
      productUrl: 'https://www.forestessentialsindia.com/body-mist-mysore-sandalwood-vetiver.html',
      imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&auto=format&fit=crop&q=80',
      verifiedSpend: 38000.0,
      isFeatured: false,
      viewsCount: 5200,
      clicksCount: 1100,
    },
    {
      brandSlug: 'minimalist',
      categorySlug: 'hair-care',
      name: 'Rosemary Hair Growth Actives 18%',
      slug: 'minimalist-rosemary-hair-growth-serum',
      description: 'Concentrated scalp formulation featuring pure Rosemary essential extract and Redensyl to dramatically improve hair density and strengthen roots.',
      productUrl: 'https://beminimalist.co/products/hair-growth-actives-18',
      imageUrl: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=800&auto=format&fit=crop&q=80',
      verifiedSpend: 25000.0,
      isFeatured: false,
      viewsCount: 4600,
      clicksCount: 970,
    },
    {
      brandSlug: 'kama-ayurveda',
      categorySlug: 'hair-care',
      name: 'Bringadi Intensive Hair Treatment Oil',
      slug: 'kama-ayurveda-bringadi-intensive-hair-oil',
      description: 'Traditional Ayurvedic botanical elixir infused with Bhringraj, Indigo, and Balloon Vine in pure sesame oil to prevent hair loss and premature greying.',
      productUrl: 'https://www.kamaayurveda.com/bringadi-intensive-hair-treatment-oil.html',
      imageUrl: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&auto=format&fit=crop&q=80',
      verifiedSpend: 18000.0,
      isFeatured: false,
      viewsCount: 3900,
      clicksCount: 820,
    },
    {
      brandSlug: 'plum-goodness',
      categorySlug: 'body-care',
      name: 'Vanilla Vibes Body Lovin Body Butter',
      slug: 'plum-vanilla-vibes-body-butter',
      description: 'Decadent shea butter cream whipped with warm vanilla beans for 48-hour ultra-rich hydration and irresistible sweet gourmand aroma.',
      productUrl: 'https://plumgoodness.com/products/vanilla-vibes-body-butter',
      imageUrl: 'https://images.unsplash.com/photo-1556228722-d0b5d0f6bb57?w=800&auto=format&fit=crop&q=80',
      verifiedSpend: 12000.0,
      isFeatured: false,
      viewsCount: 3100,
      clicksCount: 650,
    },
  ];

  let rankCounter = 1;
  for (const prod of productsData) {
    const brandEntry = brandRecords[prod.brandSlug];
    const category = categories[prod.categorySlug];

    const createdProduct = await prisma.product.create({
      data: {
        brandId: brandEntry.brand.id,
        categoryId: category.id,
        name: prod.name,
        slug: prod.slug,
        description: prod.description,
        productUrl: prod.productUrl,
        imageUrl: prod.imageUrl,
        verifiedSpend: prod.verifiedSpend,
        isFeatured: prod.isFeatured,
        viewsCount: prod.viewsCount,
        clicksCount: prod.clicksCount,
        status: ProductStatus.ACTIVE,
        lastPromotedAt: new Date(Date.now() - (productsData.length - rankCounter) * 3600000),
      },
    });

    // Create payment record for audit
    const payment = await prisma.payment.create({
      data: {
        productId: createdProduct.id,
        brandId: brandEntry.brand.id,
        userId: brandEntry.user.id,
        amount: prod.verifiedSpend,
        currency: 'INR',
        gateway: 'razorpay',
        gatewayOrderId: `order_seed_${rankCounter}_${Date.now()}`,
        gatewayPaymentId: `pay_seed_${rankCounter}_${Date.now()}`,
        gatewaySignature: 'seed_verified_signature',
        status: PaymentStatus.captured,
        targetRank: rankCounter,
        previousSpend: 0,
        newSpend: prod.verifiedSpend,
        verifiedAt: new Date(),
        metadata: { note: 'Initial promotional seed campaign' },
      },
    });

    // Create ranking history record
    await prisma.rankingHistory.create({
      data: {
        productId: createdProduct.id,
        rank: rankCounter,
        verifiedSpend: prod.verifiedSpend,
        triggeredByPaymentId: payment.id,
        createdAt: new Date(),
      },
    });

    rankCounter++;
  }

  console.log('✅ Seeded 10 beauty products with verified promotional spend and payment history.');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
