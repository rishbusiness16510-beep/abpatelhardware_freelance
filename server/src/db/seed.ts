import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { users, categories, brands } from './schema.js';
import bcrypt from 'bcryptjs';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';
const dbUrl = process.env.DATABASE_URL || (isProd ? process.env.DATABASE_URL_PROD : process.env.DATABASE_URL_DEV);

const sql = neon(dbUrl!);
const db = drizzle(sql);

async function main() {
  console.log('Seeding database...');

  try {
    // 1. Create Admin User
    const passwordHash = await bcrypt.hash('Admin@123!', 10);
    const adminUser = await db.insert(users).values({
      email: 'admin@abpatel.com',
      name: 'Super Admin',
      passwordHash,
      role: 'ADMIN',
    }).returning();
    console.log(`Admin user created: ${adminUser[0].email}`);

    // 2. Create Brands
    const insertedBrands = await db.insert(brands).values([
      { name: 'ABPATEL' },
      { name: 'Bluecoat' },
      { name: 'Velvet' },
      { name: 'Elite' },
      { name: 'Grip' },
    ]).returning();
    console.log(`Created ${insertedBrands.length} brands`);

    // 3. Create Categories (from PRD Section 5.1)
    const categoryData = [
      { name: 'Cabinet Handles', slug: 'cabinet-handles' },
      { name: 'Cabinet Knobs', slug: 'cabinet-knobs' },
      { name: 'Pull Handles', slug: 'pull-handles' },
      { name: 'Concealed Handles', slug: 'concealed-handles' },
      { name: 'Mortise Handles', slug: 'mortise-handles' },
      { name: 'Bathroom Accessories', slug: 'bathroom-accessories' },
      { name: 'Hooks', slug: 'hooks' },
      { name: 'Tower Bolts', slug: 'tower-bolts' },
      { name: 'Lock Bodies & Cylinders', slug: 'lock-bodies-cylinders' },
      { name: 'Hinges', slug: 'hinges' },
      { name: 'Aldrops', slug: 'aldrops' },
    ];

    const insertedCategories = await db.insert(categories).values(categoryData).returning();
    console.log(`Created ${insertedCategories.length} categories`);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

main();
