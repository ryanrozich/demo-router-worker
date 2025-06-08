# Security Configuration Guide

This demo router includes multiple layers of security. Here's how to configure them:

## 🛡️ Built-in Worker Security Features

### 1. Security Headers (Automatic)
The worker automatically adds these headers to all responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy` (customizable in `src/security.ts`)

### 2. Rate Limiting (Automatic)
- **Default**: 100 requests per minute per IP
- Configurable in `src/index.ts`:
  ```typescript
  const rateLimiter = new RateLimiter({
    requests: 100,    // number of requests
    windowMs: 60000,  // time window in ms
  });
  ```

### 3. CORS Configuration
- Configure allowed origins in `src/security.ts`
- Default: Same-origin only
- Add your domains to `allowedOrigins` array

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

### 3. Firewall Rules (5 free rules)
Go to **Security** → **WAF** → **Custom rules**

#### Rule 1: Block Known Bad IPs
```
(ip.src in {1.2.3.4 5.6.7.8})
Action: Block
```

#### Rule 2: Challenge High-Risk Countries (if needed)
```
(ip.geoip.country in {"XX" "YY"})
Action: Managed Challenge
```

#### Rule 3: Rate Limit API Endpoints
```
(http.request.uri.path contains "/api/")
Action: Managed Challenge
Rate: 10 requests per 10 seconds
```

#### Rule 4: Block Bad User Agents
```
(http.user_agent contains "bot" and not http.user_agent contains "googlebot")
Action: Block
```

#### Rule 5: Protect Against Path Traversal
```
(http.request.uri.path contains ".." or http.request.uri.path contains "//")
Action: Block
```

### 4. Page Rules (3 free rules)
Go to **Rules** → **Page Rules**

#### Rule 1: Cache Static Assets
```
URL: demo.yourdomain.com/*/assets/*
Settings:
- Cache Level: Cache Everything
- Edge Cache TTL: 1 month
```

#### Rule 2: Disable Caching for API
```
URL: demo.yourdomain.com/api/*
Settings:
- Cache Level: Bypass
```

### 5. IP Access Rules
Go to **Security** → **Tools** → **IP Access Rules**
- Block known malicious IPs
- Whitelist your development IPs (optional)

## 🚀 Advanced Security (Pro Plan Features)

If you upgrade to Pro plan ($25/month), you get:

### WAF (Web Application Firewall)
- OWASP Core Ruleset
- Cloudflare Managed Ruleset
- Protection against SQLi, XSS, etc.

### Advanced Rate Limiting
- More granular control
- Custom rate limit rules
- By cookie, header, or JWT

### Advanced Bot Management
- JavaScript detections
- Machine learning-based detection

## 📊 Monitoring

### 1. Analytics
- Go to **Analytics** → **Security**
- Monitor blocked threats
- Review firewall events

### 2. Logs (Enterprise only)
For free plan, use Worker logs:
```typescript
console.log('Security event:', {
  ip: request.headers.get('CF-Connecting-IP'),
  country: request.headers.get('CF-IPCountry'),
  path: url.pathname,
});
```

## 🔑 Best Practices

1. **Regular Updates**
   - Keep dependencies updated
   - Review security rules monthly

2. **Sensitive Data**
   - Never log sensitive information
   - Use environment variables for secrets

3. **Demo Isolation**
   - Each demo runs in its own context
   - No shared cookies between demos

4. **Content Security**
   - Review CSP settings for each demo
   - Adjust based on demo requirements

## 🚨 Incident Response

If you detect an attack:

1. **Immediate Actions**
   - Enable "Under Attack Mode" in Cloudflare
   - Block malicious IPs
   - Review recent logs

2. **Investigation**
   - Check Analytics for patterns
   - Review Worker logs
   - Identify attack vectors

3. **Mitigation**
   - Update firewall rules
   - Adjust rate limits
   - Consider upgrading plan if needed

## 📚 Additional Resources

- [Cloudflare Security Documentation](https://developers.cloudflare.com/security/)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
- [Workers Security Best Practices](https://developers.cloudflare.com/workers/platform/security/)

Remember: Security is a continuous process. Regularly review and update your security configuration!