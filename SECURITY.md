# Security Guide for Demo Sites

This demo router includes basic security features appropriate for a public demo showcase.

## 🛡️ Security Philosophy

Since this is a public demo site meant to showcase your work:
- ✅ Basic protection against common attacks
- ✅ Allow search engines and legitimate bots
- ✅ Permissive enough for demos to work properly
- ✅ Simple to configure and maintain

## 🔒 Built-in Security Features

### 1. Basic Security Headers
The worker adds these headers automatically:
- `X-Content-Type-Options: nosniff` - Prevents MIME type sniffing
- `X-Frame-Options: SAMEORIGIN` - Allows embedding on your own domain
- `Referrer-Policy: strict-origin-when-cross-origin` - Privacy-friendly referrer policy
- Permissive CSP that allows demos to function properly

### 2. Rate Limiting
- **Very permissive**: 1000 requests per minute per IP
- Only blocks extreme abuse
- Won't interfere with normal usage or crawlers

### 3. Error Handling
- Generic error messages prevent information leakage
- Errors are logged for debugging (not exposed to users)

## 🔒 Cloudflare Dashboard Settings (Free Plan)

### 1. SSL/TLS
- Go to **SSL/TLS** → **Overview**
- Set encryption mode to **Full (strict)**
- Enable **Always Use HTTPS**
- Enable **Automatic HTTPS Rewrites**

### 2. Security Settings
- Go to **Security** → **Settings**
- Enable **Bot Fight Mode**
- Set **Security Level** to Medium or High
- Enable **Challenge Passage** (30 minutes)

### 3. Recommended Firewall Rules (Optional)
If you experience abuse, add these via **Security** → **WAF** → **Custom rules**:

#### Rule 1: Block Path Traversal Attempts
```
(http.request.uri.path contains ".." or http.request.uri.path contains "//")
Action: Block
```

#### Rule 2: Challenge Suspicious Requests (if needed)
```
(cf.threat_score gt 30)
Action: Managed Challenge
```

That's it! Keep it simple for a demo site.

## 🎯 What Actually Matters for Demo Sites

### DO Focus On:
- ✅ **SSL/HTTPS** - Always enabled with Cloudflare
- ✅ **DDoS Protection** - Automatic with Cloudflare
- ✅ **Basic Headers** - Already implemented
- ✅ **Error Handling** - Don't expose stack traces

### DON'T Worry About:
- ❌ Aggressive rate limiting (you want people to use your demos!)
- ❌ Blocking bots (you want search engines to find you!)
- ❌ Complex firewall rules (keep it simple)
- ❌ WAF rules (overkill for static demos)

## 🚀 Quick Security Checklist

1. **Enable HTTPS** - ✅ Automatic with Cloudflare
2. **Hide Sensitive Info** - Don't commit API keys or secrets
3. **Monitor Abuse** - Check Analytics occasionally
4. **Keep It Simple** - Don't over-engineer security

## 🆘 If You Get Attacked

1. Enable "Under Attack Mode" temporarily
2. Block the offending IPs
3. Contact Cloudflare support if severe

## 📚 Resources

- [Cloudflare Security Center](https://dash.cloudflare.com/?to=/:account/security-center)
- [Web Security Basics](https://developer.mozilla.org/en-US/docs/Web/Security)

Remember: This is a portfolio demo site, not a banking application. Basic security is sufficient!