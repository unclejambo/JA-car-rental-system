# Vercel Deployment Configuration for React SPA

## Issue
When deploying a React Single Page Application (SPA) to Vercel, navigating directly to routes (like `/some-random-page`) shows Vercel's default 404 page instead of the app's custom NotFoundPage component.

## Root Cause
React Router handles routing on the client side, but when you navigate to a URL directly (or refresh the page), the server (Vercel) tries to find a file at that path. Since SPAs only have one HTML file (`index.html`), the server returns a 404 error.

## Solution
We need to configure Vercel to redirect all requests to `index.html`, allowing React Router to handle the routing.

## Files Added/Modified

### 1. `vercel.json` (Root Directory)
This file tells Vercel how to serve your application:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**What this does:**
- `rewrites`: Redirects ALL requests to `index.html` (crucial for SPA routing)

**Important:** Build commands are configured in the Vercel Dashboard, not in `vercel.json` for monorepo projects.

### 2. `frontend/public/_redirects` (Fallback)
This is an additional fallback configuration that Vercel also recognizes:

```
/*    /index.html   200
```

**What this does:**
- Catches all routes (`/*`) and serves `index.html` with a 200 status code
- This ensures React Router can handle the routing

## Deployment Steps

### If you haven't deployed yet:
1. Push these changes to your GitHub repository:
   ```bash
   git add vercel.json frontend/public/_redirects
   git commit -m "Add Vercel SPA configuration"
   git push origin main
   ```
2. Connect your repository to Vercel
3. Vercel will automatically detect the configuration and deploy

### If you've already deployed:
1. Push these changes to your GitHub repository
2. Vercel will automatically redeploy with the new configuration
3. Wait for the deployment to complete

### Required Vercel Dashboard Configuration:
For monorepo projects, you **must** configure the Root Directory in the Vercel dashboard:

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings** → **General**
3. Set the following:
   - **Root Directory**: `frontend` ← **CRITICAL! This must be set!**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `dist` (or leave default)
   - **Install Command**: `npm install` (or leave default)

**Note:** The `rewrites` configuration is already in `vercel.json`, so you don't need to add it manually in the dashboard.

## Testing After Deployment

After deploying, test the following scenarios:

1. **Root redirect**: Visit `https://your-app.vercel.app/` → Should redirect to `/home`
2. **Non-existent route (not logged in)**: Visit `https://your-app.vercel.app/random-page` → Should show your custom 404 NotFoundPage
3. **Non-existent route (logged in as admin)**: After logging in, visit `https://your-app.vercel.app/random-page` → Should show 404 with "Go to Dashboard" button that takes you to `/admindashboard`
4. **Existing routes**: All your normal routes should work as expected

## How It Works

```
User visits: https://your-app.vercel.app/random-page
     ↓
Vercel receives request for /random-page
     ↓
vercel.json rewrites rule catches all routes
     ↓
Vercel serves index.html (with 200 status, not 404)
     ↓
React app loads in the browser
     ↓
React Router sees the URL is /random-page
     ↓
No matching route found in main.jsx
     ↓
Catches the "*" route (catch-all)
     ↓
Renders NotFoundPage component
     ↓
User sees your custom 404 page with "Go Back" and "Go to Home/Dashboard" buttons
```

## Important Notes

- The `rewrites` configuration ensures that ALL routes return `index.html` with a **200 status code** (not 404)
- React Router then handles the client-side routing
- If a route doesn't exist in React Router, it shows your custom NotFoundPage component
- This setup works for all deployment scenarios: direct URL access, page refresh, and navigation

## Troubleshooting

### Error: "cd: frontend: No such file or directory"

**Cause:** This error occurs when `vercel.json` contains commands like `cd frontend` or when the Root Directory is not set correctly in Vercel dashboard.

**Solution:**
1. Remove any `buildCommand`, `installCommand`, or `outputDirectory` from `vercel.json`
2. Set **Root Directory** to `frontend` in Vercel Dashboard → Settings → General
3. Redeploy your project

### If you still see Vercel's 404 page:

1. **Check deployment logs**: Look for errors in the Vercel deployment logs
2. **Verify file paths**: Ensure `vercel.json` is in the root directory and `_redirects` is in `frontend/public`
3. **Check build output**: Verify that the build creates a `dist` folder with `index.html` inside
4. **Clear cache**: Try clearing your browser cache or use incognito mode
5. **Redeploy**: Trigger a new deployment in Vercel dashboard
6. **Environment variables**: Make sure all necessary environment variables are set in Vercel dashboard

## Additional Resources

- [Vercel SPA Documentation](https://vercel.com/docs/concepts/projects/project-configuration)
- [React Router with Vercel](https://vercel.com/guides/deploying-react-with-vercel)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
