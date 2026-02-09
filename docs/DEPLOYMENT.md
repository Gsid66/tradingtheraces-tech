# Deployment Guide - Render

This guide walks you through deploying your Trading the Races platform to Render.

## Prerequisites

- ✅ GitHub repository: `Gsid66/tradingtheraces-tech`
- ✅ Render account (free tier is fine to start)
- ✅ PostgreSQL database on Render (you already have this!)
- ✅ Code pushed to GitHub

## Step 1: Prepare Your Repository

Make sure your repository has these files (already created):
- `package.json` - Dependencies
- `next.config.js` - Next.js configuration
- `.env.example` - Environment variables template
- `.gitignore` - Protects sensitive files

## Step 2: Connect GitHub to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** button
3. Select **"Web Service"**
4. Click **"Connect a repository"**
5. If first time: Authorize Render to access your GitHub
6. Find and select `Gsid66/tradingtheraces-tech`

## Step 3: Configure Your Web Service

Fill in the following settings:

### Basic Settings

| Field | Value |
|-------|-------|
| **Name** | `tradingtheraces-tech` (or your choice) |
| **Region** | Choose closest to you (e.g., Oregon USA) |
| **Branch** | `main` |
| **Root Directory** | Leave empty |
| **Runtime** | `Node` |

### Build & Deploy Settings

| Field | Value |
|-------|-------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `npm start` |

**Note:** The `npm install` command automatically runs database migrations via the `postinstall` hook.

### Instance Type

- **Free** - Good for testing ($0/month)
- **Starter** - Recommended for production ($7/month)
  - Better performance
  - Custom domains
  - No spin-down

## Step 4: Environment Variables

Click **"Advanced"** then add these environment variables:

| Key | Value | Where to Get It |
|-----|-------|----------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | Your Render PostgreSQL dashboard |
| `NODE_ENV` | `production` | Just type this |
| `NEXT_PUBLIC_API_URL` | `https://your-app.onrender.com` | Will be your app URL (fill after first deploy) |

### Getting Your DATABASE_URL:
1. Go to Render Dashboard
2. Click your PostgreSQL service
3. Copy the **"External Database URL"**
4. Paste into `DATABASE_URL` field

## Step 5: Deploy!

1. Click **"Create Web Service"**
2. Render will start building your app
3. Watch the logs (they'll appear automatically)
4. Wait 2-5 minutes for first deploy

### What Happens During Deploy:
```
1. Render clones your GitHub repo
2. Runs: npm install (downloads dependencies)
3. Runs: npm run migrate (automatically via postinstall - applies database migrations)
4. Runs: npm run build (builds Next.js app)
5. Runs: npm start (starts the server)
6. Your app is live! 🎉
```

## Step 6: Get Your App URL

After deployment completes:
1. Look for the URL at the top: `https://your-app.onrender.com`
2. Click it to open your site
3. Copy this URL

## Step 7: Update Environment Variable

1. Go back to your web service settings
2. Click **"Environment"**
3. Edit `NEXT_PUBLIC_API_URL`
4. Paste your app URL
5. Click **"Save Changes"**
6. Your app will automatically redeploy

## Step 8: Connect Your Domain (Optional)

To use `tradingtheraces.tech` instead of `your-app.onrender.com`:

### On Render:
1. Go to your web service
2. Click **"Settings"** tab
3. Scroll to **"Custom Domain"**
4. Click **"Add Custom Domain"**
5. Enter: `tradingtheraces.tech`
6. Render will show you DNS records to add

### On BlueHost:
1. Log into BlueHost
2. Go to **"Domains"** → **"DNS"**
3. Add a **CNAME** record:
   - Name: `@` (or leave blank for root domain)
   - Points to: (value from Render)
4. Save and wait 5-60 minutes for DNS propagation

## Automatic Deployments

Now whenever you push to GitHub:
```bash
git add .
git commit -m "Update homepage"
git push origin main
```

Render automatically:
1. Detects the push
2. Builds your new code
3. Deploys it (zero downtime!)
4. Your site updates in ~2-3 minutes

## Monitoring Your Deployment

### View Logs
1. Go to your web service
2. Click **"Logs"** tab
3. See real-time application logs

### Check Metrics
1. Click **"Metrics"** tab
2. See CPU, memory, response times

### Set Up Alerts (Optional)
1. Click **"Settings"** → **"Alerts"**
2. Add email notifications for errors

## Troubleshooting

### Database Migrations

This project uses an automated migration system that runs during deployment.

#### How It Works

1. **Automatic Execution**: When `npm install` runs, the `postinstall` script automatically executes `npm run migrate`
2. **Migration Files**: The system scans two directories for `.sql` files:
   - `migrations/` - Legacy migration files (e.g., `007_create_scratchings_table.sql`)
   - `drizzle/migrations/` - Drizzle ORM migrations (e.g., `0004_add_scratchings_table.sql`)
3. **Execution Order**: Migrations are executed in numerical order based on the prefix (001, 002, 007, etc.)
4. **Idempotent**: All migrations use `CREATE TABLE IF NOT EXISTS` and similar patterns, making them safe to run multiple times
5. **Logging**: The migration runner logs which migrations were executed and any errors encountered

#### Manual Migration

If you need to run migrations manually:

```bash
# Run all pending migrations
npm run migrate

# Or run a specific migration file
psql $DATABASE_URL -f migrations/007_create_scratchings_table.sql
```

#### Migration Troubleshooting

**Problem:** Migration fails with "relation already exists"
**Solution:** This is normal and safe - the migration script skips already-created tables

**Problem:** Migration fails with "DATABASE_URL not set"
**Solution:** 
- Verify `DATABASE_URL` environment variable is set in Render
- For local testing, ensure `.env.local` contains `DATABASE_URL`

**Problem:** Migration fails with SSL/connection errors
**Solution:**
- The migration script uses SSL by default (required for Render)
- Verify your database is accessible and the URL is correct
- Check database service is running in Render dashboard

**Problem:** Build fails during postinstall
**Solution:**
- Check Render logs for specific migration errors
- Temporarily disable automatic migrations by removing `postinstall` from `package.json`
- Run migrations manually after deployment using `npm run migrate`

#### Adding New Migrations

When adding a new migration file:

1. **Name Format**: Use numeric prefix followed by description (e.g., `008_add_new_table.sql`)
2. **Location**: Place in either `migrations/` or `drizzle/migrations/`
3. **Idempotent SQL**: Always use `IF NOT EXISTS` patterns:
   ```sql
   CREATE TABLE IF NOT EXISTS my_table (...);
   CREATE INDEX IF NOT EXISTS idx_name ON my_table(column);
   ```
4. **Test Locally**: Run `npm run migrate` locally before pushing
5. **Auto-Deploy**: Push to GitHub - Render will automatically run the new migration

## Troubleshooting

### Build Fails
**Problem:** `npm run build` fails
**Solution:** 
- Check logs for specific error
- Make sure all dependencies in `package.json`
- Test build locally: `npm run build`

### Can't Connect to Database
**Problem:** "connection refused" or timeout
**Solution:**
- Verify `DATABASE_URL` is correct
- Check database is running
- Use "Internal Database URL" if available (faster)

### App Crashes on Start
**Problem:** Service keeps restarting
**Solution:**
- Check logs for error messages
- Verify `npm start` works locally
- Check all environment variables are set

### Pages Show Errors
**Problem:** 500 errors or database errors
**Solution:**
- Check database connection in logs
- Verify database tables exist (see DATABASE.md)
- Test database queries work

## Deployment Checklist

Before going live with tradingtheraces.tech:

- [ ] All environment variables set
- [ ] Database schema created (see DATABASE.md)
- [ ] Test homepage loads
- [ ] Test database connection
- [ ] Check logs for errors
- [ ] Test on mobile device
- [ ] Set up custom domain (optional)
- [ ] Enable alerts
- [ ] Backup database (automatic on Render)

## Parallel Running Strategy

While building on Render, keep BlueHost running:

1. **BlueHost (Current):**
   - Keep live at tradingtheraces.tech
   - No changes needed

2. **Render (Development):**
   - Build new features
   - Test thoroughly
   - Use temporary URL: `your-app.onrender.com`

3. **When Ready to Switch:**
   - Update DNS (Step 8 above)
   - Traffic gradually moves to Render
   - Keep BlueHost for 1 week as backup

## Scaling Up

As your traffic grows:

### Upgrade Instance Type
- Free → Starter ($7/mo) - Better performance
- Starter → Standard ($25/mo) - More CPU/RAM
- Standard → Pro ($85/mo) - High traffic

### Add Services
- **Redis** - Caching for faster responses
- **Background Workers** - Process jobs asynchronously
- **Multiple Regions** - Serve users worldwide faster

## Cost Estimate

**Starting Setup:**
- Web Service (Starter): $7/month
- PostgreSQL (Starter): $7/month
- **Total: ~$14/month**

(Free tier available but services sleep after inactivity)

**Compare to BlueHost:**
- You're likely paying $5-20/month already
- Render gives you better performance + auto-deploy

## Next Steps After Deployment

1. ✅ **Verify it works** - Check all pages load
2. ✅ **Test database** - Run some queries
3. ✅ **Start building** - Add your first feature
4. ✅ **Monitor** - Watch logs and metrics
5. ✅ **Iterate** - Push updates frequently

## Useful Render Commands

### View Logs Live
```bash
# From Render dashboard "Logs" tab, or:
# Use Render CLI (optional)
render logs -f
```

### Manual Deploy
If you need to redeploy without code changes:
1. Go to web service
2. Click **"Manual Deploy"**
3. Select branch
4. Click **"Deploy"**

### Rollback
If something breaks:
1. Go to **"Events"** tab
2. Find previous successful deploy
3. Click **"Rollback"**

## Getting Help

- **Render Docs:** https://render.com/docs
- **Render Status:** https://status.render.com
- **Support:** Via Render dashboard (support ticket)

---

**Success!** Your app should now be live on Render. Start building your racing platform! 🏇

**Next:** See [MIGRATION.md](./MIGRATION.md) for moving content from BlueHost.