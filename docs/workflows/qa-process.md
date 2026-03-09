# QA Process

## Purpose
This workflow defines the required QA process before every production deployment.

## Deployment Rule
Before every production deployment, a preview deploy must be live and tested.

## QA Participants
Every QA session should include:
- Benoit
- Juhan
- Sharon (when available)

## QA Checklist Template
Use this checklist for each release on the preview URL:

- [ ] All changed features tested on preview URL
- [ ] Admin panel: talent list loads, approve/reject works
- [ ] Talent profile: save, submit for review, email received
- [ ] Company profile: save, jobs visible
- [ ] Messenger: send message, notification received
- [ ] Email notifications: all 4 triggers verified (talent submit, admin notify, job apply, message)
- [ ] No console errors on key pages

## Deployment Flow
Always follow this sequence:
1. Preview deployment
2. Live QA session
3. Production deployment

Never deploy directly to production.

## Rollback Procedure
If a production issue is found after deployment:
1. Open the Vercel dashboard
2. Use instant rollback to the previous stable deployment
3. Re-run QA on a fresh preview before attempting another production release
