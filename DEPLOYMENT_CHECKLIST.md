# Deployment Checklist

## ✅ Pre-Deployment Steps

### 1. Supabase Setup
- [ ] Create Supabase project
- [ ] Run `database_schema.sql` in SQL Editor
- [ ] Verify all tables created (9 tables)
- [ ] Confirm storage buckets exist (3 buckets)
- [ ] Check RLS policies are enabled

### 2. Edge Function Deployment
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy function
supabase functions deploy process-knowledge

# Set secrets
supabase secrets set OPENAI_API_KEY=sk-...
```

### 3. Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Set `VITE_SUPABASE_URL`
- [ ] Set `VITE_SUPABASE_ANON_KEY`
- [ ] Never commit `.env` to git

### 4. Local Testing
```bash
npm install
npm run dev
```
- [ ] Test admin login
- [ ] Test seeker login
- [ ] Generate upload code
- [ ] Complete upload flow
- [ ] Test AI processing
- [ ] Test search functionality
- [ ] Test file downloads

## 🚀 Deployment Steps

### Option A: Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

**Vercel Dashboard:**
- Settings → Environment Variables
- Add `VITE_SUPABASE_URL`
- Add `VITE_SUPABASE_ANON_KEY`

### Option B: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod

# Set environment variables
netlify env:set VITE_SUPABASE_URL "https://..."
netlify env:set VITE_SUPABASE_ANON_KEY "eyJ..."
```

### Option C: Manual Build

```bash
# Build
npm run build

# Deploy /dist folder to your hosting provider
```

## 👤 Post-Deployment Setup

### 1. Create First Admin User

**Via Supabase Dashboard:**
1. Authentication → Users → Add User
2. Enter admin email and password
3. Go to SQL Editor:

```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'YOUR_ADMIN_EMAIL@company.com';
```

### 2. Create Initial Seeker Accounts

**Via Admin Dashboard:**
1. Login as admin
2. Navigate to "Seekers" tab
3. Add seeker accounts with:
   - Email
   - Temporary password
   - Department

**Or via SQL:**
```sql
-- Create auth user first in Supabase Dashboard
-- Then update profile
UPDATE user_profiles 
SET role = 'seeker', department = 'Engineering'
WHERE email = 'seeker@company.com';
```

### 3. Generate First Upload Code

1. Login as admin
2. Click "Generate Upload Code"
3. Copy code and test upload flow

## 🔍 Post-Deployment Verification

### Functional Tests
- [ ] Landing page loads correctly
- [ ] Admin login works
- [ ] Seeker login works
- [ ] Upload code validation works
- [ ] 5-step questionnaire completes
- [ ] File uploads succeed
- [ ] AI processing triggers (check Supabase logs)
- [ ] Submissions appear in admin dashboard
- [ ] Approve/reject workflow works
- [ ] Search returns results
- [ ] Filters work correctly
- [ ] Resource detail page displays
- [ ] File downloads work
- [ ] Logout works for all roles

### Security Checks
- [ ] Cannot access admin routes without admin role
- [ ] Cannot access seeker routes without login
- [ ] Upload codes expire after 24 hours
- [ ] Used codes cannot be reused
- [ ] Seekers only see approved submissions
- [ ] Anonymous uploads don't expose identifiers
- [ ] Files are stored with UUID names

### Performance Checks
- [ ] Pages load in <2 seconds
- [ ] Search returns results in <3 seconds
- [ ] File uploads complete successfully
- [ ] No console errors
- [ ] Mobile responsive design works

## 📊 Monitoring Setup

### Supabase Dashboard Monitoring
1. **Auth Logs** - Track login activity
2. **Database Performance** - Query speed
3. **Storage Usage** - File uploads
4. **Edge Function Logs** - AI processing

### Set Up Alerts (Optional)
- Database size approaching limit
- High number of failed logins
- Edge function errors
- Storage quota warnings

## 🔧 Common Issues & Fixes

### Issue: "Invalid JWT" errors
**Fix:** Verify `VITE_SUPABASE_ANON_KEY` is correct (use anon key, not service role)

### Issue: AI processing fails
**Fix:** 
```bash
supabase secrets list
# Verify OPENAI_API_KEY is set
supabase secrets set OPENAI_API_KEY=sk-...
```

### Issue: Files won't upload
**Fix:** Check storage buckets exist and RLS policies are applied

### Issue: Search returns no results
**Fix:** Ensure submissions are "approved" status and AI processing completed

## 📝 Admin Training Checklist

Train admins on:
- [ ] Generating upload codes
- [ ] Reviewing submissions
- [ ] Approving/rejecting content
- [ ] Creating seeker accounts
- [ ] Monitoring dashboard stats
- [ ] Handling PII flags from AI

## 🎯 Success Criteria

✅ Application is accessible at production URL
✅ Admin can login and generate codes
✅ Departing employees can complete upload flow
✅ AI processes submissions automatically
✅ Seekers can search and find knowledge
✅ All files are downloadable
✅ No security vulnerabilities
✅ Performance meets requirements (<2s page load)

## 📅 Maintenance Schedule

### Daily
- Monitor Edge Function logs for AI errors
- Check for pending submissions needing review

### Weekly
- Review storage usage
- Check for expired codes to clean up
- Monitor user activity stats

### Monthly
- Clean up old rejected submissions (>30 days)
- Review and archive unused upload codes
- Backup database
- Review search analytics
- Update seeker accounts as needed

---

## 🆘 Emergency Rollback

If issues occur:

```bash
# Revert to previous deployment
vercel rollback  # or netlify rollback

# Or redeploy previous version
git checkout previous-tag
npm run build
vercel --prod
```

## 📞 Support Contacts

- Supabase Support: support@supabase.com
- OpenAI Support: help.openai.com
- Technical Lead: [YOUR EMAIL]

---

**Last Updated:** December 2024
**Version:** 1.0.0 
