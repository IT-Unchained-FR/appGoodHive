# GoodHive Web - Handover Plan

**Date:** 2025-11-28
**Project:** GoodHive Web Application
**Current Branch:** `main`
**Working Directory:** `/Users/juhan/Developer/GoodHive/GoodHive-Web`

---

## Project Overview

**GoodHive** is a Next.js-based web application that connects companies with talented professionals. It's a job marketplace platform with user profiles, company profiles, job postings, and application management.

### Tech Stack
- **Framework:** Next.js 14.0.1 (React 18.3.1)
- **Language:** TypeScript 5.0.4
- **Styling:** Tailwind CSS 3.4.14, SASS 1.89.0
- **UI Components:** Radix UI, NextUI, Headless UI
- **Database:** PostgreSQL (via `pg` package)
- **Authentication:** Iron Session, JWT (jsonwebtoken)
- **File Storage:** AWS S3 (@aws-sdk/client-s3)
- **CMS:** Sanity 3.58.0
- **Email:** Resend 2.0.0
- **Forms:** React Hook Form 7.53.2, Yup 1.6.1
- **Analytics:** Vercel Analytics, Google Analytics (GA4)
- **Web3:** Thirdweb 5.105.41

---

## Current Status

### Git Status
- **Branch:** `main`
- **Status:** Clean working tree, no uncommitted changes
- **Up to date with:** `origin/main`

### Recent Commits (Last 10)
```
aaa6f34 Merge pull request #174 from IT-Unchained-FR/main
9f68a02 Merge branch 'main' into main
95c5028 Add staging CI/CD deployment pipeline
60222f0 Fix CI/CD: remove frozen-lockfile flag for dependency installation
9b30dc8 Test automated CI/CD deployment
0c94643 Add production deployment automation with CI/CD
13c9290 Update gitignore to exclude sensitive files
096d5d2 Refactor admin dashboard useEffect dependency
4a240f8 Complete admin panel reconstruction with enhanced features
ba229f1 Add infrastructure and deployment configuration files
```

---

## Project Structure

### Key Directories
```
/app
  /api                    - API route handlers
    /companies           - Company-related endpoints
  /companies             - Company pages
    /create-job          - Job creation interface
  /talents               - Talent/user pages
    /my-profile          - User profile management
  /components            - Reusable UI components
    /home                - Homepage components (hero, services, etc.)
    /blog                - Blog-related components
    /footer              - Footer component
  /constants             - Static data (countries, skills, degrees, etc.)
  /db                    - Database utilities and migrations
  /email-templates       - Email template components
  /utils                 - Utility functions

/components/ui           - shadcn/ui components
/interfaces              - TypeScript interfaces
/lib                     - Library configurations (Sanity, etc.)
/utils                   - Shared utility functions
```

---

## Database Schema

### Tables
1. **companies**
   - id, headline, designation, address, country, city
   - phone_country_code, phone_number, email (UNIQUE)
   - telegram, details, image_url

2. **users**
   - id, title, description, first_name, last_name
   - country, city, phone_country_code, phone_number
   - email (UNIQUE), telegram, currency, rate
   - about_work, skills, image_url

3. **users_experience**
   - id, title, type_employment, designation, address
   - contract_start, contract_end, description, skills

4. **users_education**
   - id, school, degree, filed, location
   - start_date, end_date, description, distinction

5. **job_offers**
   - id, title, type_engagement, description, duration
   - rate_per_hour, budget, skills, currency

---

## Development Setup

### Environment Requirements
- **Node.js:** Recommended version compatible with Next.js 14.0.1
- **Package Manager:** pnpm (preferred based on scripts)
- **Memory:** Node configured with 4096MB max-old-space-size

### Available Scripts
```bash
# Development
pnpm dev                  # Standard dev server (port will vary)
pnpm dev:fast            # Turbopack-enabled dev server

# Build & Deploy
pnpm build               # Production build (no lint)
pnpm build-no-check      # Build without type checking
pnpm vercel-build        # Vercel-specific build

# Other
pnpm start               # Start production server
pnpm lint                # Run ESLint
pnpm migrate             # Run database migrations
pnpm migrate:otp         # Run OTP-specific migrations
```

### Environment Variables Needed
Check `.env.local` for:
- `NEXT_PUBLIC_GA_ID` - Google Analytics measurement ID
- Database connection strings
- AWS S3 credentials
- Sanity CMS credentials
- Resend API key for emails
- Thirdweb configuration
- Any authentication secrets

---

## Key Features & Components

### 1. User/Talent System
- Profile management (`/app/talents/my-profile/`)
- Education history
- Work experience
- Skills and portfolio
- CV/Resume handling

### 2. Company System
- Company profiles
- Job posting creation
- Applicant management
- Company dashboard

### 3. Job Marketplace
- Job listings
- Search and filters
- Application system
- Skills matching

### 4. Authentication & Session
- Iron Session for session management
- JWT tokens
- User and company authentication flows

### 5. File Management
- AWS S3 integration
- File upload handling
- Image optimization
- PDF processing (CV parsing)

### 6. Email System
- Contact forms
- Job application notifications
- Company contact emails
- Uses Resend for email delivery

### 7. Analytics
- Google Analytics GA4 integration
- Vercel Analytics
- Custom event tracking

---

## Known Configuration

### Build Configuration
- **Memory Allocation:** 4096MB for Node processes
- **Experimental Features:** Worker threads enabled
- **Lint:** Disabled during build
- **Telemetry:** Disabled for Vercel builds

### Browser Compatibility
Package.json has browser field disabling:
- `tls`
- `net`
- `fs`

This is common for Next.js apps to avoid server-only modules in client bundles.

---

## Important Notes

### CI/CD
- Staging and production pipelines configured
- Recent work on deployment automation
- Check `.github/workflows/` for pipeline configurations

### Dependencies to Watch
- Large memory footprint requires 4GB Node allocation
- `esbuild` is ignored in pnpm config
- Multiple Radix UI components for consistent UI
- Thirdweb for Web3 functionality (may not be actively used)

### Database Migrations
- Migration scripts in `/app/db/`
- Two migration types: general (`migrate`) and OTP-specific (`migrate:otp`)
- Uses `tsx` to run TypeScript migration files

---

## Potential Issues & Gotchas

1. **Memory Usage**
   - Development server requires `--max-old-space-size=4096`
   - Build process memory-intensive

2. **Database**
   - Connection pooling needed for PostgreSQL
   - Check connection limits in production

3. **File Uploads**
   - S3 credentials must be configured
   - Check upload size limits

4. **Email Delivery**
   - Resend API key required
   - Test email templates before deploying

5. **TypeScript**
   - Version 5.0.4 (not latest)
   - May have compatibility considerations

---

## Next Steps / TODO Items

### If continuing development:
1. Review any open GitHub issues in the repository
2. Check staging deployment status
3. Review recent CI/CD pipeline runs
4. Verify all environment variables are set
5. Test database connections
6. Confirm email delivery works
7. Review analytics tracking setup
8. Check for any pending security updates

### Common Tasks:
- **Add new feature:** Check existing patterns in `/app/` structure
- **Update UI component:** Check Radix UI docs and existing implementations
- **Database changes:** Create migration in `/app/db/`
- **API endpoint:** Add route handler in `/app/api/`
- **Email template:** Add in `/app/email-templates/`

---

## Contact & Resources

### Documentation Links
- Next.js: https://nextjs.org/docs
- Radix UI: https://www.radix-ui.com/
- Sanity CMS: https://www.sanity.io/docs
- Resend: https://resend.com/docs
- Thirdweb: https://portal.thirdweb.com/

### Repository
- GitHub: Check for open PRs and issues
- Main branch for production
- Recent contributor: IT-Unchained-FR

---

## Quick Start for Next Session

```bash
# 1. Navigate to project
cd /Users/juhan/Developer/GoodHive/GoodHive-Web

# 2. Check git status
git status
git log --oneline -5

# 3. Install/update dependencies if needed
pnpm install

# 4. Start development server
pnpm dev
# or faster with Turbopack:
pnpm dev:fast

# 5. Check if environment variables are set
cat .env.local

# 6. Access the app
# Open http://localhost:3000 (or whatever port is shown)
```

---

## Code Quality Standards

Based on recent commits and codebase:
- TypeScript strict mode
- ESLint configured (though disabled in builds)
- Prettier likely configured (check `.prettierrc`)
- Component-based architecture
- API routes follow Next.js App Router conventions
- Database queries use parameterized statements

---

## Deployment Information

### Staging
- Recent CI/CD pipeline added for staging
- Check `.github/workflows/` for configuration

### Production
- Vercel deployment configured
- Custom build script for Vercel
- Analytics and Speed Insights enabled

---

**End of Handover Document**

Generated on: 2025-11-28
Claude Code Session Token Usage: ~95% at time of handover
