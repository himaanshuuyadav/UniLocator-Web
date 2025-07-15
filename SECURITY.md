# 🔒 Security Setup Guide

## 🚨 IMPORTANT: Sensitive Data Protection

This repository contains sensitive Firebase credentials that must be protected. Follow these steps before committing to GitHub.

## 📋 Quick Setup

1. **Run the security setup script:**
   ```bash
   python setup_security.py
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify .env file exists:**
   ```bash
   # Check if .env file was created
   ls -la .env
   ```

## 🛡️ What's Protected

The following sensitive data is now secured with environment variables:

- **Firebase API Key**: `AIzaSyDJKLcI6OdqXmgkzn1bhpgMOhkUzIu5VnU`
- **Firebase Project Configuration**
- **Service Account References**
- **Database URLs**
- **Flask Secret Keys**

## 📁 Files Protected by .gitignore

- `.env` - Contains all sensitive environment variables
- `service-account-key.json` - Firebase service account credentials
- `instance/` - Database files
- `**/*service-account*.json` - Any service account files

## 🚀 Deployment Notes

### For Production:
1. Set environment variables in your hosting platform
2. Generate a strong SECRET_KEY
3. Use production Firebase project if different
4. Enable HTTPS for secure cookies

### Environment Variables Required:
```bash
FLASK_ENV=production
SECRET_KEY=<strong-random-key>
FIREBASE_API_KEY=<your-firebase-api-key>
FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
FIREBASE_PROJECT_ID=<your-project-id>
# ... other Firebase config
```

## ⚠️ Security Checklist

- ✅ `.env` file is in `.gitignore`
- ✅ Service account keys are in `.gitignore`
- ✅ Firebase config loaded from environment variables
- ✅ No hardcoded API keys in source code
- ✅ Database files excluded from version control

## 🔧 Troubleshooting

If you see placeholders like `FIREBASE_API_KEY_PLACEHOLDER`:
1. Check if `.env` file exists
2. Verify `python-dotenv` is installed
3. Restart the Flask application
4. Check environment variable loading in config.py
