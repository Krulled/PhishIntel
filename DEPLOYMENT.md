# PhishIntel Deployment Guide 🚀

This guide will help you deploy your PhishIntel application to production using:
- **Render** (for the Python Flask backend)
- **Vercel** (for the React frontend)

## Prerequisites

Before you start, make sure you have:
- A GitHub account with your PhishIntel code pushed to a repository
- A Render account (free at [render.com](https://render.com))
- A Vercel account (free at [vercel.com](https://vercel.com))
- OpenAI API key (required for AI analysis features)
- URLScan API key (optional, for enhanced screenshot features)

## Part 1: Deploy Backend to Render 🖥️

### Step 1: Sign up and Connect GitHub
1. Go to [render.com](https://render.com) and sign up/login
2. Click "New +" button → "Web Service"
3. Connect your GitHub account if not already connected
4. Select your PhishIntel repository

### Step 2: Configure the Web Service
1. **Name**: `phishintel-backend` (or any name you prefer)
2. **Runtime**: `Python 3.11` (important: use 3.11, not 3.13)
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `python app.py`
5. **Plan**: Choose "Free" for testing (can upgrade later)

### Step 3: Set Environment Variables
In the "Environment" section, add these variables:

| Variable Name | Value | Notes |
|---------------|-------|-------|
| `FLASK_ENV` | `production` | Disables debug mode |
| `OPENAI_API_KEY` | `your_openai_api_key_here` | **Required** - Get from OpenAI |
| `URLSCAN_API_KEY` | `your_urlscan_key_here` | Optional - Get from URLScan.io |
| `ALLOWED_ORIGINS` | `https://your-app-name.vercel.app` | Will update later with Vercel URL |

### Step 4: Add Persistent Storage (Optional)
1. Scroll down to "Disk"
2. Click "Add Disk"
3. **Name**: `data`
4. **Mount Path**: `/opt/render/project/src/Data`
5. **Size**: `1 GB` (free tier limit)

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment (usually 2-5 minutes)
3. Once deployed, copy your backend URL (looks like: `https://phishintel-backend-xxxx.onrender.com`)

## Part 2: Deploy Frontend to Vercel 🌐

### Step 1: Sign up and Import Project
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the `ui` folder as the root directory

### Step 2: Configure Build Settings
Vercel should auto-detect these, but confirm:
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Set Environment Variables
In the "Environment Variables" section, add:

| Variable Name | Value |
|---------------|-------|
| `VITE_API_URL` | `https://your-render-backend-url.onrender.com` |

⚠️ **Important**: Use the exact Render URL you copied in Part 1, Step 5

### Step 4: Deploy
1. Click "Deploy"
2. Wait for deployment (usually 1-3 minutes)
3. Once deployed, copy your frontend URL (looks like: `https://your-app-name.vercel.app`)

## Part 3: Connect Frontend and Backend 🔗

### Step 1: Update Backend CORS Settings
1. Go back to your Render dashboard
2. Select your backend service
3. Go to "Environment" tab
4. Update `ALLOWED_ORIGINS` to your Vercel URL:
   ```
   ALLOWED_ORIGINS=https://your-app-name.vercel.app
   ```
5. Click "Save Changes" (this will trigger a redeploy)

### Step 2: Test the Connection
1. Open your Vercel app URL
2. Try submitting a URL for analysis
3. Check if the frontend can communicate with the backend

## Part 4: Domain Setup (Optional) 🌍

### For Custom Domain on Vercel:
1. Go to your Vercel project dashboard
2. Click "Domains" tab
3. Add your custom domain
4. Follow DNS setup instructions

### For Custom Domain on Render:
1. Go to your Render service dashboard
2. Click "Settings" tab
3. Scroll to "Custom Domains"
4. Add your custom domain

## Troubleshooting 🔧

### Common Issues:

**❌ Python Version Compatibility Errors**
- **Problem**: Build fails with scikit-learn compilation errors
- **Solution**: Use Python 3.11 instead of 3.13. The project includes `runtime.txt` and `.python-version` files to specify this.
- **Alternative**: If Render still uses Python 3.13, manually select Python 3.11 in the service settings

**❌ CORS Errors**
- Make sure `ALLOWED_ORIGINS` on Render includes your exact Vercel URL
- Check that both services are deployed and running

**❌ API Key Errors**
- Verify `OPENAI_API_KEY` is set correctly on Render
- Check OpenAI account has sufficient credits

**❌ Build Failures**
- Check build logs in Render/Vercel dashboards
- Ensure all dependencies are in `requirements.txt` and `package.json`
- Try clearing the build cache in Render settings

**❌ Frontend Can't Reach Backend**
- Verify `VITE_API_URL` points to correct Render URL
- Make sure Render service is running (not sleeping)

### Check Service Status:
- **Render**: Visit `https://your-backend.onrender.com/api/recent`
- **Vercel**: Visit your frontend URL and try the contact form

## Environment Variables Summary 📋

### Backend (Render):
```env
FLASK_ENV=production
OPENAI_API_KEY=your_openai_api_key_here
URLSCAN_API_KEY=your_urlscan_key_here
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

### Frontend (Vercel):
```env
VITE_API_URL=https://your-render-backend.onrender.com
```

## Free Tier Limitations ⚠️

### Render Free Tier:
- 500 hours/month
- Services sleep after 15 minutes of inactivity
- 1GB persistent storage

### Vercel Free Tier:
- 100GB bandwidth/month
- 6000 build hours/month
- Unlimited static hosting

## Next Steps 🎯

1. **Monitor Usage**: Check Render and Vercel dashboards for usage stats
2. **Set Up Monitoring**: Consider setting up uptime monitoring
3. **Backup Data**: Regularly backup your Render persistent storage
4. **Scale**: Upgrade to paid plans when you exceed free tier limits

## Getting Help 🆘

- **Render Support**: [render.com/docs](https://render.com/docs)
- **Vercel Support**: [vercel.com/docs](https://vercel.com/docs)
- **Project Issues**: Create an issue in your GitHub repository

---

🎉 **Congratulations!** Your PhishIntel application should now be live and accessible worldwide!
