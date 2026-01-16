# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

The Chat2Checkout team takes security bugs seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report a Security Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to:

**[security@razorpay.com](mailto:security@razorpay.com)**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

### What to Include in Your Report

Please include the following information in your report:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

This information will help us triage your report more quickly.

### What to Expect

After you submit a report, here's what you can expect:

1. **Acknowledgment**: We'll acknowledge receipt of your vulnerability report within 48 hours
2. **Investigation**: We'll investigate and validate the issue
3. **Updates**: We'll keep you informed about our progress
4. **Resolution**: We'll work on a fix and coordinate disclosure timing with you
5. **Credit**: We'll publicly acknowledge your responsible disclosure (if you wish)

### Disclosure Policy

- We'll work with you to understand and resolve the issue quickly
- We'll keep you informed of our progress
- We'll publicly disclose the issue once a fix is available
- We'll credit you for the discovery (unless you prefer to remain anonymous)

## Security Best Practices

When using Chat2Checkout, please follow these security best practices:

### API Keys and Secrets

- **Never commit API keys or secrets** to version control
- Use environment variables for all sensitive configuration
- Use **test mode keys** (`rzp_test_*`) during development
- Rotate keys regularly in production
- Use different keys for different environments

### Environment Variables

Store sensitive information in `.env` files:

```bash
# NEVER commit this file to git
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
```

Add `.env` to your `.gitignore`:

```
.env
.env.local
.env.*.local
```

### Production Deployment

- Use HTTPS for all production deployments
- Enable webhook signature verification
- Implement rate limiting on API endpoints
- Use secure session management
- Keep dependencies up to date
- Monitor logs for suspicious activity
- Implement proper CORS policies

### Payment Security

- Always validate payment signatures on the server side
- Never trust client-side payment verification
- Implement proper error handling for payment failures
- Log all payment transactions for audit purposes
- Use Razorpay's test mode for development and testing

### Code Security

- Validate and sanitize all user inputs
- Use parameterized queries to prevent SQL injection
- Implement proper authentication and authorization
- Keep all dependencies updated
- Follow OWASP security guidelines

## Security Updates

We'll announce security updates through:

- GitHub Security Advisories
- Release notes
- Email notifications to maintainers

## Vulnerability Disclosure Timeline

- **Day 0**: Vulnerability reported
- **Day 1-2**: Acknowledgment sent to reporter
- **Day 3-7**: Investigation and validation
- **Day 7-30**: Fix development and testing
- **Day 30+**: Public disclosure (coordinated with reporter)

## Bug Bounty Program

We currently do not have a formal bug bounty program, but we deeply appreciate security researchers who help us keep Chat2Checkout secure. We'll acknowledge your contribution in our release notes and security advisories.

## Security Hall of Fame

We'd like to thank the following security researchers for responsibly disclosing vulnerabilities:

<!-- Contributors will be listed here -->

*No vulnerabilities have been reported yet.*

## Contact

For any security-related questions or concerns:

- **Security Issues**: [security@razorpay.com](mailto:security@razorpay.com)
- **General Questions**: [opensource@razorpay.com](mailto:opensource@razorpay.com)

## Additional Resources

- [Razorpay Security](https://razorpay.com/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [React Security Best Practices](https://react.dev/learn/security)

---

Thank you for helping keep Chat2Checkout and our users safe!

