import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Brands
  const rainy = await prisma.brand.upsert({
    where: { slug: 'rainy' },
    update: {},
    create: { name: 'Rainy', slug: 'rainy' },
  });

  const bridge = await prisma.brand.upsert({
    where: { slug: 'bridge' },
    update: {},
    create: { name: 'Bridge', slug: 'bridge' },
  });

  const neo = await prisma.brand.upsert({
    where: { slug: 'neo-macro' },
    update: {},
    create: { name: 'Neo Macro', slug: 'neo-macro' },
  });

  const wooting = await prisma.brand.upsert({
    where: { slug: 'wooting' },
    update: {},
    create: { name: 'Wooting', slug: 'wooting' },
  });

  const aula = await prisma.brand.upsert({
    where: { slug: 'aula' },
    update: {},
    create: { name: 'Aula', slug: 'aula' },
  });

  // Vendors
  const stacksKB = await prisma.vendor.upsert({
    where: { slug: 'stackskb' },
    update: {},
    create: {
      name: 'StacksKB',
      slug: 'stackskb',
      website: 'https://stackskb.com',
      enabled: true,
      scraperEnabled: true,
      scraperEngine: 'cheerio',
      priceSelector: '.price .money, .product-price, [data-price]',
      priceAttribute: 'text',
      availabilitySelector: '.product-available, [data-availability]',
      availabilityAttribute: 'text',
      titleSelector: 'h1.product-title, h1',
      titleAttribute: 'text',
      imageSelector: '.product-image img, .product-photo img',
      imageAttribute: 'src',
    },
  });

  const genesisPC = await prisma.vendor.upsert({
    where: { slug: 'genesispc' },
    update: {},
    create: {
      name: 'GenesisPC',
      slug: 'genesispc',
      website: 'https://genesispc.in',
      enabled: true,
      scraperEnabled: true,
      scraperEngine: 'cheerio',
      priceSelector: '.price, .product-price, [data-price]',
      priceAttribute: 'text',
      availabilitySelector: '.stock-status, [data-availability]',
      availabilityAttribute: 'text',
      titleSelector: 'h1.product-title, h1',
      titleAttribute: 'text',
      imageSelector: '.product-image img, .product-photo img',
      imageAttribute: 'src',
    },
  });

  const neoMacro = await prisma.vendor.upsert({
    where: { slug: 'neomacro' },
    update: {},
    create: {
      name: 'Neo Macro',
      slug: 'neomacro',
      website: 'https://neomacro.com',
      enabled: true,
      scraperEnabled: true,
      scraperEngine: 'cheerio',
      priceSelector: '.price, .product-price, [data-price]',
      priceAttribute: 'text',
      availabilitySelector: '.stock-status, [data-availability]',
      availabilityAttribute: 'text',
      titleSelector: 'h1.product-title, h1',
      titleAttribute: 'text',
      imageSelector: '.product-image img, .product-photo img',
      imageAttribute: 'src',
    },
  });

  const hardwareCorpus = await prisma.vendor.upsert({
    where: { slug: 'hardwarecorpus' },
    update: {},
    create: {
      name: 'Hardware Corpus',
      slug: 'hardwarecorpus',
      website: 'https://hardwarecorpus.com',
      enabled: true,
      scraperEnabled: true,
      scraperEngine: 'cheerio',
      priceSelector: '.price, .product-price, [data-price]',
      priceAttribute: 'text',
      availabilitySelector: '.stock-status, [data-availability]',
      availabilityAttribute: 'text',
      titleSelector: 'h1.product-title, h1',
      titleAttribute: 'text',
      imageSelector: '.product-image img, .product-photo img',
      imageAttribute: 'src',
    },
  });

  // Products
  const rainy75 = await prisma.product.upsert({
    where: { slug: 'rainy75' },
    update: {},
    create: {
      name: 'Rainy75',
      slug: 'rainy75',
      brandId: rainy.id,
      productType: 'keyboards',
      description: 'Premium 75% wireless mechanical keyboard with gasket mount and aluminum case.',
    },
  });

  const bridge75 = await prisma.product.upsert({
    where: { slug: 'bridge75' },
    update: {},
    create: {
      name: 'Bridge75',
      slug: 'bridge75',
      brandId: bridge.id,
      productType: 'keyboards',
      description: 'Affordable 75% keyboard with gasket mount and south-facing RGB.',
    },
  });

  const neo80 = await prisma.product.upsert({
    where: { slug: 'neo80' },
    update: {},
    create: {
      name: 'Neo80',
      slug: 'neo80',
      brandId: neo.id,
      productType: 'keyboards',
      description: 'TKL barebone keyboard with aluminum construction.',
    },
  });

  const aulaF75 = await prisma.product.upsert({
    where: { slug: 'aula-f75' },
    update: {},
    create: {
      name: 'Aula F75',
      slug: 'aula-f75',
      brandId: aula.id,
      productType: 'keyboards',
      description: 'Budget 75% mechanical keyboard with hot-swap and RGB.',
    },
  });

  const wooting60he = await prisma.product.upsert({
    where: { slug: 'wooting-60he' },
    update: {},
    create: {
      name: 'Wooting 60HE',
      slug: 'wooting-60he',
      brandId: wooting.id,
      productType: 'keyboards',
      description: 'Hall Effect gaming keyboard with rapid trigger.',
    },
  });

  // Vendor Products (prices)
  const vendorProducts = [
    { vendorId: stacksKB.id, productId: rainy75.id, price: 8999, shippingIncluded: true, vendorUrl: 'https://stackskb.com/products/rainy75' },
    { vendorId: genesisPC.id, productId: rainy75.id, price: 9499, shippingCost: 0, shippingIncluded: true, vendorUrl: 'https://genesispc.in/products/rainy75' },
    { vendorId: neoMacro.id, productId: rainy75.id, price: 9999, shippingCost: 200, shippingIncluded: false, vendorUrl: 'https://neomacro.com/products/rainy75' },
    { vendorId: hardwareCorpus.id, productId: rainy75.id, price: 10499, shippingIncluded: true, vendorUrl: 'https://hardwarecorpus.com/products/rainy75' },

    { vendorId: stacksKB.id, productId: bridge75.id, price: 3999, shippingIncluded: true, vendorUrl: 'https://stackskb.com/products/bridge75' },
    { vendorId: genesisPC.id, productId: bridge75.id, price: 4299, shippingIncluded: true, vendorUrl: 'https://genesispc.in/products/bridge75' },

    { vendorId: stacksKB.id, productId: neo80.id, price: 7499, shippingIncluded: true, vendorUrl: 'https://stackskb.com/products/neo80' },
    { vendorId: neoMacro.id, productId: neo80.id, price: 7999, shippingCost: 150, shippingIncluded: false, vendorUrl: 'https://neomacro.com/products/neo80' },

    { vendorId: stacksKB.id, productId: aulaF75.id, price: 2499, shippingIncluded: true, vendorUrl: 'https://stackskb.com/products/aula-f75' },
    { vendorId: genesisPC.id, productId: aulaF75.id, price: 2799, shippingIncluded: true, vendorUrl: 'https://genesispc.in/products/aula-f75' },

    { vendorId: stacksKB.id, productId: wooting60he.id, price: 17999, shippingIncluded: true, vendorUrl: 'https://stackskb.com/products/wooting-60he' },
  ];

  for (const vp of vendorProducts) {
    const shipping = vp.shippingIncluded ? 0 : (vp.shippingCost ?? 0);
    const total = vp.price + shipping;

    const existing = await prisma.vendorProduct.findUnique({
      where: { vendorId_productId: { vendorId: vp.vendorId, productId: vp.productId } },
    });

    if (!existing) {
      const created = await prisma.vendorProduct.create({
        data: {
          vendorId: vp.vendorId,
          productId: vp.productId,
          vendorUrl: vp.vendorUrl,
          price: vp.price,
          shippingCost: shipping,
          shippingIncluded: vp.shippingIncluded,
          totalPrice: total,
          stockStatus: 'in_stock',
          availability: 'IN_STOCK',
          scrapeStatus: 'PENDING',
        },
      });

      await prisma.priceHistory.create({
        data: {
          vendorProductId: created.id,
          price: vp.price,
          shippingCost: shipping,
          totalPrice: total,
          stockStatus: 'in_stock',
          availability: 'IN_STOCK',
          source: 'MANUAL',
        },
      });
    }
  }

  console.log('Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
