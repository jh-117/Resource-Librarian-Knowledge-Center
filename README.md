# Resource Librarian Knowledge Center

A private, internal application designed to capture and retain critical institutional knowledge from departing employees anonymously.

## 📋 Features

- **Anonymous Upload**: Departing employees share knowledge via one-time codes
- **AI-Powered Summarization**: OpenAI automatically processes and categorizes submissions
- **Smart Search**: Find relevant knowledge with filters by department, role, experience
- **Secure & Private**: Row-level security, anonymous submissions, admin approval workflow

## 🏗️ Project Structure

```
resource-librarian-knowledge-center/
├── src/
│   ├── lib/
│   │   └── supabase.js          # Supabase client configuration
│   ├── pages/
│   │   ├── LandingPage.jsx      # Public landing page
│   │   ├── AdminLogin.jsx       # Admin authentication
│   │   ├── AdminDashboard.jsx   # Admin management interface
│   │   ├── SeekerLogin.jsx      # Seeker authentication
│   │   ├── SeekerDashboard.jsx  # Search and browse interface
│   │   ├── UploaderFlow.jsx     # Anonymous 5-step questionnaire
│   │   └── ResourceDetail.jsx   # Detailed knowledge view
│   ├── App.jsx                  # Main app with routing
│   ├── main.jsx                 # React entry point
│   └── index.css                # Global styles
├── supabase/
│   └── functions/
│       └── process-knowledge/   # Edge function for AI processing
│           └── index.ts
├── database_schema.sql          # Database setup
├── package.json
├── .env.example
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Supabase account ([supabase.com](https://supabase.com))
- OpenAI API key ([platform.openai.com](https://platform.openai.com))

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to be ready (2-3 minutes)

### 2. Set Up Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `database_schema.sql`
3. Paste and run the SQL script
4. Verify tables are created in **Table Editor**

### 3. Deploy Edge Function

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (get project ref from dashboard URL)
supabase link --project-ref your-project-ref

# Deploy the edge function
supabase functions deploy process-knowledge

# Set OpenAI API key as secret
supabase secrets set OPENAI_API_KEY=your_openai_api_key
```

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Get these from:** Supabase Dashboard → Settings → API

### 5. Install Dependencies

```bash
npm install
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173`

## 👥 Creating Users

### Create First Admin User

1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Enter email and password
4. After creation, go to **SQL Editor** and run:

```sql
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'admin@yourcompany.com';
```

### Create Seeker Users

**Option 1: Via Admin Dashboard**
1. Login as admin
2. Go to "Seekers" tab
3. Fill in email, password, department
4. Click "Create Seeker Account"

**Option 2: Via Supabase Dashboard**
1. Create user in Authentication
2. User profile is automatically created with role='seeker'

## 📝 User Workflows

### Admin Workflow

1. **Login** at `/admin/login`
2. **Generate Upload Code** (24-hour validity)
3. **Share code** with departing employee
4. **Review submissions** in pending queue
5. **Approve/Reject** knowledge entries
6. **Manage seeker accounts**

### Uploader Workflow (Departing Employee)

1. Visit `/upload`
2. Enter one-time code
3. Complete 5-step questionnaire:
   - Role context
   - Work processes & tools
   - Skills & learning resources
   - Team collaboration tips
   - Final advice & templates
4. Submit (AI processes automatically)
5. Session ends

### Seeker Workflow (Current Employee)

1. **Login** at `/seeker/login`
2. **Search** knowledge base
3. **Filter** by department, role, experience, team size
4. **View** AI summaries and detailed entries
5. **Download** files and resources

## 🔐 Security Features

- **Row-Level Security (RLS)** on all tables
- **Anonymous uploads** - no personal data stored
- **UUID-based file names** - original metadata removed
- **One-time codes** - automatic expiry after 24 hours
- **Admin approval** - content moderated before searchable
- **PII detection** - AI scans for personal identifiers

## 🛠️ Deployment

### Build for Production

```bash
npm run build
```

### Deploy Options

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Important:** Set environment variables in your deployment platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📊 Storage Configuration

The app uses 3 Supabase Storage buckets:

- `process-documents` - SOPs, guides, process docs
- `templates` - Reusable templates
- `examples` - Anonymized work examples

**Policies:**
- Uploaders can insert files
- Authenticated users (seekers/admins) can read files
- All buckets are **private** (not publicly accessible)

## 🔧 Troubleshooting

### "Invalid JWT" error
- Check that your `VITE_SUPABASE_ANON_KEY` is correct
- Make sure you're using the **anon/public** key, not the service role key

### AI processing fails
- Verify OpenAI API key is set: `supabase secrets list`
- Check Edge Function logs: Supabase Dashboard → Edge Functions → Logs

### File uploads fail
- Confirm storage buckets exist: Supabase Dashboard → Storage
- Check RLS policies are applied correctly
- Maximum file size: 100MB per file

### Users can't login
- Verify user email is confirmed in Supabase Auth
- Check that `user_profiles` table has matching record
- For admins, confirm `role = 'admin'` in user_profiles table

## 📈 Monitoring

### Admin Dashboard Stats
- Total submissions
- Pending submissions
- Approved submissions
- Active seekers

### Supabase Dashboard
- **Auth** → User activity, login history
- **Database** → Query performance
- **Storage** → File usage
- **Edge Functions** → AI processing logs

## 🔄 Maintenance

### Clean Up Expired Codes
```sql
DELETE FROM upload_codes 
WHERE expires_at < NOW() - INTERVAL '7 days';
```

### Archive Old Rejected Submissions
```sql
DELETE FROM knowledge_submissions 
WHERE status = 'rejected' 
AND created_at < NOW() - INTERVAL '30 days';
```

### Backup Database
```bash
supabase db dump > backup_$(date +%Y%m%d).sql
```

## 📞 Support

For issues or questions:
1. Check Supabase logs in Dashboard
2. Review browser console for errors
3. Check Edge Function logs for AI processing issues

## 🚧 Future Enhancements (V2)

- Advanced AI Q&A chat interface
- Knowledge gaps analysis
- HR system integration
- Analytics dashboard
- Mobile native app

## 📄 License

Internal use only. All rights reserved.

---

**Built with:** React, Supabase, OpenAI, Tailwind CSS 
