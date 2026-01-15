# Vercel + Neon Database Setup Guide

## ✅ Այո, կաշխատի, բայց նախ պետք է ստեղծել աղյուսակները

Եթե դուք փոխում եք Vercel-ում `DATABASE_URL`-ը Neon բազային, application-ը կաշխատի, **բայց միայն եթե աղյուսակները արդեն ստեղծված են Neon բազայում**:

## 🚀 Երկու Տարբերակ

### Տարբերակ 1: Ավտոմատ Migrations (Առաջարկվող) ✅

**Այս տարբերակը ավտոմատ կաշխատեցնի migrations-ները Vercel build-ի ժամանակ:**

#### Քայլ 1: Vercel-ում սահմանեք Environment Variables

Vercel Dashboard → Your Project → Settings → Environment Variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_4NFk3DcLajCP@ep-bold-bonus-ahakkqdf-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&client_encoding=UTF8
```

**Կարևոր:** Ավելացրեք `&client_encoding=UTF8` հայերենի համար:

#### Քայլ 2: Build Command-ը արդեն կարգավորված է

`apps/web/package.json`-ում build command-ը արդեն կարգավորված է, որպեսզի ավտոմատ աշխատեցնի migrations-ները:

#### Քայլ 3: Deploy

Պարզապես push անեք code-ը կամ trigger անեք manual deployment Vercel-ում:

**Build command-ը կաշխատեցնի:**
1. `prisma generate` - Generate Prisma Client
2. `prisma migrate deploy` - Deploy migrations (կամ `prisma db push` եթե migrations չկան)
3. `next build` - Build Next.js application

---

### Տարբերակ 2: Manual Migration (Մինչև Deploy)

**Այս տարբերակը պահանջում է, որ դուք նախ locally աշխատեցնեք migrations-ները:**

#### Քայլ 1: Locally աշխատեցրեք Migration Script-ը

```bash
# Ստեղծեք .env ֆայլ root directory-ում
DATABASE_URL="postgresql://neondb_owner:npg_4NFk3DcLajCP@ep-bold-bonus-ahakkqdf-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&client_encoding=UTF8"

# Աշխատեցրեք migration script-ը
npm run setup:neon-db
```

#### Քայլ 2: Vercel-ում սահմանեք DATABASE_URL

Vercel Dashboard → Your Project → Settings → Environment Variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_4NFk3DcLajCP@ep-bold-bonus-ahakkqdf-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&client_encoding=UTF8
```

#### Քայլ 3: Deploy

Deploy անեք Vercel-ում - application-ը կաշխատի, քանի որ աղյուսակները արդեն ստեղծված են:

---

## 🔍 Ստուգում

Deployment-ից հետո ստուգեք, որ ամեն ինչ աշխատում է:

1. **Ստուգեք Vercel Build Logs:**
   - Vercel Dashboard → Your Project → Deployments → Latest Deployment → Build Logs
   - Պետք է տեսնեք: `✅ Prisma migrations deployed successfully`

2. **Ստուգեք Application:**
   - Բացեք ձեր Vercel URL-ը
   - Ստուգեք, որ categories և products load են լինում
   - Եթե error-ներ չկան, ամեն ինչ աշխատում է ✅

3. **Ստուգեք Database:**
   ```sql
   -- Neon Dashboard-ում կամ psql-ով
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```
   
   Պետք է տեսնեք բոլոր աղյուսակները:
   - `users`
   - `categories`
   - `products`
   - `product_variants`
   - `orders`
   - և այլն...

---

## ⚠️ Կարևոր Նշումներ

### 1. Client Encoding

**Միշտ** ավելացրեք `&client_encoding=UTF8` DATABASE_URL-ին:

```env
# ✅ Ճիշտ
DATABASE_URL="postgresql://...?sslmode=require&channel_binding=require&client_encoding=UTF8"

# ❌ Սխալ (կարող է առաջացնել encoding issues հայերենի հետ)
DATABASE_URL="postgresql://...?sslmode=require&channel_binding=require"
```

### 2. Build Command

`apps/web/package.json`-ում build command-ը օգտագործում է `||` operator-ը:

```json
"build": "cd ../../packages/db && npm run db:migrate:deploy || npm run db:push && cd ../../apps/web && next build"
```

Սա նշանակում է:
- Նախ փորձում է `db:migrate:deploy` (եթե migrations կան)
- Եթե error է, փորձում է `db:push` (ավելի պարզ, ստեղծում է աղյուսակները schema-ից)
- Հետո build անում է Next.js application-ը

### 3. First Deployment

Առաջին deployment-ի ժամանակ build-ը կարող է մի քիչ ավելի երկար տևել, քանի որ migrations-ները աշխատում են:

### 4. Error Handling

Եթե build-ը fail է լինում migrations-ների պատճառով:
- Ստուգեք, որ `DATABASE_URL`-ը ճիշտ է Vercel-ում
- Ստուգեք, որ Neon database-ը accessible է
- Ստուգեք Vercel Build Logs-ում error messages-ները

---

## 🎯 Ամփոփում

**Պատասխան:** Այո, եթե փոխեք Vercel-ում `DATABASE_URL`-ը Neon բազային, application-ը կաշխատի, **բայց միայն եթե:**

1. ✅ Աղյուսակները արդեն ստեղծված են Neon բազայում (Տարբերակ 2)
2. ✅ Կամ build command-ը ավտոմատ կստեղծի դրանք (Տարբերակ 1 - արդեն կարգավորված է)

**Առաջարկում եմ Տարբերակ 1-ը**, քանի որ այն ավտոմատ է և չի պահանջում manual steps:

---

## 📞 Աջակցություն

Եթե հանդիպում եք խնդիրների:

1. Ստուգեք Vercel Build Logs
2. Ստուգեք, որ `DATABASE_URL`-ը ճիշտ է
3. Ստուգեք, որ Neon database-ը accessible է
4. Ստուգեք, որ `client_encoding=UTF8`-ը ավելացված է

