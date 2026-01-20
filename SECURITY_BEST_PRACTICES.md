# Security Best Practices & Preventive Measures
**Date**: November 25, 2025  
**Purpose**: Prevent Future Admin Profile & Security Issues  
**Audience**: Development Team, DBAs, DevOps

---

## Overview

This document outlines security best practices and preventive measures to avoid issues similar to the admin profile malfunction discovered on November 25, 2025. Following these guidelines will help maintain a secure and reliable authentication/authorization system.

---

## Table of Contents

1. [Database Migration Best Practices](#database-migration-best-practices)
2. [Role-Based Access Control (RBAC) Guidelines](#role-based-access-control-rbac-guidelines)
3. [Development vs Production Separation](#development-vs-production-separation)
4. [Code Review Checklist](#code-review-checklist)
5. [Testing Requirements](#testing-requirements)
6. [Monitoring & Alerting](#monitoring--alerting)
7. [Documentation Standards](#documentation-standards)
8. [Security Audit Schedule](#security-audit-schedule)
9. [Incident Response Plan](#incident-response-plan)

---

## Database Migration Best Practices

### 1. Migration Review Process

**Before Creating a Migration:**
- [ ] Clearly document the purpose and scope
- [ ] Identify all affected tables and functions
- [ ] Consider security implications
- [ ] Plan rollback strategy
- [ ] Test on development environment first

**Migration Naming Convention:**
```
YYYYMMDDHHMMSS_descriptive_name.sql

Examples:
✅ 20251125193000_fix_auto_admin_vulnerability.sql
✅ 20251125193100_cleanup_auto_assigned_admins.sql
❌ fix.sql
❌ update_users.sql
```

**Migration Template:**
```sql
-- Migration: [Brief Description]
-- Date: [Date]
-- Author: [Name]
-- Ticket: [Issue/Ticket Reference]
-- Rollback: [Rollback Instructions]

-- [CRITICAL/HIGH/MEDIUM/LOW] Impact Level

BEGIN;

-- Your migration code here

-- Verification queries
-- SELECT ... to verify changes

COMMIT;
```

### 2. Security-Focused Migration Rules

**🚨 NEVER:**
- Auto-assign admin or elevated roles to any user
- Grant blanket permissions (e.g., `GRANT ALL`)
- Disable security features for convenience
- Use `SECURITY DEFINER` without careful consideration
- Create backdoors or shortcuts for development

**✅ ALWAYS:**
- Use principle of least privilege
- Document security implications
- Test RLS policies thoroughly
- Validate data integrity after changes
- Create audit trails for sensitive operations

### 3. Migration Testing Checklist

Before applying to production:
- [ ] Tested on local development database
- [ ] Tested on staging environment
- [ ] Verified RLS policies work correctly
- [ ] Confirmed no circular dependencies
- [ ] Tested rollback procedure
- [ ] Documented all changes
- [ ] Peer reviewed by another developer
- [ ] Security reviewed if touching auth/authz

---

## Role-Based Access Control (RBAC) Guidelines

### 1. Role Hierarchy

**Defined Roles:**
```
admin    - Full system access, can manage other admins
kitchen  - Kitchen operations, order management
user     - Regular customer, own data only
```

**Role Assignment Rules:**
- Default role for new users: `user` (or NO role - must be explicitly granted)
- Admin role: Must be explicitly granted by existing admin
- Kitchen role: Must be granted by admin
- No auto-escalation: Users cannot self-promote

### 2. Function Security

**When to Use `SECURITY DEFINER`:**
- ✅ Breaking RLS recursion (e.g., `has_role()`)
- ✅ Controlled privilege escalation (e.g., `grant_admin_role()`)
- ✅ System maintenance functions (with admin checks)

**When NOT to Use `SECURITY DEFINER`:**
- ❌ Regular CRUD operations
- ❌ User-facing queries
- ❌ Functions without authorization checks

**Template for Secure Admin Functions:**
```sql
CREATE OR REPLACE FUNCTION public.secure_admin_function(param TYPE)
RETURNS TYPE
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Authorization check (FIRST!)
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;
  
  -- 2. Input validation
  IF param IS NULL THEN
    RAISE EXCEPTION 'Invalid input: param cannot be NULL';
  END IF;
  
  -- 3. Business logic
  -- ... your code here ...
  
  -- 4. Audit logging (optional but recommended)
  INSERT INTO audit_log (action, user_id, details)
  VALUES ('function_called', auth.uid(), jsonb_build_object('param', param));
  
  -- 5. Return result
  RETURN result;
END;
$$;

-- Grant permissions (authenticated users only)
GRANT EXECUTE ON FUNCTION public.secure_admin_function TO authenticated;

-- Document the function
COMMENT ON FUNCTION public.secure_admin_function IS 
  'Description of what this function does. Requires admin role.';
```

### 3. RLS Policy Best Practices

**Policy Design Principles:**
- Keep policies simple and readable
- Avoid checking the same table within its own policy (causes recursion)
- Use `SECURITY DEFINER` functions to break recursion
- Test policies with different user roles
- Document policy intent

**Template for RLS Policies:**
```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Policy: [Description]
-- Who: [Target users]
-- What: [What data they can access]
-- Why: [Business reason]
CREATE POLICY "policy_name"
ON table_name
FOR [SELECT|INSERT|UPDATE|DELETE|ALL]
TO [authenticated|anon|role_name]
USING (
  -- Access condition (for SELECT, UPDATE, DELETE)
  condition
)
WITH CHECK (
  -- Modification condition (for INSERT, UPDATE)
  condition
);
```

---

## Development vs Production Separation

### 1. Environment Configuration

**Environment Variables:**
```bash
# Development
ENVIRONMENT=development
AUTO_ADMIN_ENABLE=true  # Allow auto-admin for testing
DEBUG_MODE=true
STRICT_SECURITY=false

# Staging
ENVIRONMENT=staging
AUTO_ADMIN_ENABLE=false
DEBUG_MODE=true
STRICT_SECURITY=true

# Production
ENVIRONMENT=production
AUTO_ADMIN_ENABLE=false  # NEVER true in production!
DEBUG_MODE=false
STRICT_SECURITY=true
```

### 2. Feature Flags for Development

```sql
-- Create a feature flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  flag_name TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  environment TEXT NOT NULL,
  description TEXT
);

-- Example: Development-only auto-admin
INSERT INTO feature_flags VALUES
  ('auto_admin_assignment', false, 'production', 'Auto-assign admin role to new users - DEVELOPMENT ONLY'),
  ('auto_admin_assignment', true, 'development', 'Auto-assign admin role to new users - DEVELOPMENT ONLY');

-- Use in code:
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  env TEXT := current_setting('app.environment', true);
  auto_admin BOOLEAN;
BEGIN
  -- Create profile
  INSERT INTO profiles (user_id, name) VALUES (...);
  
  -- Check if auto-admin is enabled for this environment
  SELECT enabled INTO auto_admin 
  FROM feature_flags 
  WHERE flag_name = 'auto_admin_assignment' 
    AND environment = env;
  
  IF auto_admin THEN
    -- Development only!
    INSERT INTO user_roles (user_id, role) VALUES (new.id, 'admin');
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql;
```

### 3. Separate Migration Paths

**Directory Structure:**
```
supabase/
├── migrations/           # Production migrations
│   ├── 20251125193000_fix_auto_admin.sql
│   └── ...
└── dev-migrations/      # Development-only migrations
    ├── 20251125000000_dev_auto_admin.sql
    └── ...
```

**Never deploy dev-migrations to production!**

---

## Code Review Checklist

### Security-Focused Code Review

When reviewing PRs that touch auth/authz:

**Database Changes:**
- [ ] No auto-assignment of elevated roles
- [ ] RLS policies are tested and don't cause recursion
- [ ] `SECURITY DEFINER` functions have authorization checks
- [ ] Rollback procedure is documented
- [ ] Changes are environment-appropriate

**Application Code:**
- [ ] No hardcoded credentials or API keys
- [ ] Role checks happen on backend, not just frontend
- [ ] Error messages don't leak sensitive information
- [ ] Input validation is present
- [ ] No SQL injection vulnerabilities

**Frontend Code:**
- [ ] Role checks are for UI only (not security)
- [ ] Backend enforces actual authorization
- [ ] No sensitive data exposed in client code
- [ ] Auth tokens handled securely

**Documentation:**
- [ ] Changes are documented
- [ ] Security implications noted
- [ ] Migration instructions clear
- [ ] Rollback procedure included

---

## Testing Requirements

### 1. Authentication/Authorization Tests

**Required Test Cases:**
```typescript
describe('User Roles & Permissions', () => {
  test('New user does NOT get admin role', async () => {
    const user = await createTestUser();
    const roles = await getUserRoles(user.id);
    expect(roles).not.toContain('admin');
  });
  
  test('Admin can access admin pages', async () => {
    const admin = await createAdminUser();
    const canAccess = await checkAccess(admin, '/admin');
    expect(canAccess).toBe(true);
  });
  
  test('Regular user CANNOT access admin pages', async () => {
    const user = await createTestUser();
    const canAccess = await checkAccess(user, '/admin');
    expect(canAccess).toBe(false);
  });
  
  test('Cannot revoke last admin', async () => {
    const lastAdmin = await getLastAdmin();
    await expect(
      revokeAdminRole(lastAdmin.id)
    ).rejects.toThrow('Cannot revoke the last admin');
  });
  
  test('Only admins can grant admin role', async () => {
    const regularUser = await createTestUser();
    const targetUser = await createTestUser();
    
    await expect(
      grantAdminRole(targetUser.id, regularUser)
    ).rejects.toThrow('Unauthorized');
  });
});
```

### 2. Database Testing

**SQL Test Queries:**
```sql
-- Test 1: Verify no auto-admin
-- Create test user, check they don't have admin
BEGIN;
  -- Create test user (simulate)
  INSERT INTO auth.users (id, email) 
  VALUES (gen_random_uuid(), 'test@example.com');
  
  -- Verify no admin role assigned
  SELECT COUNT(*) = 0 as passes
  FROM user_roles 
  WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'test@example.com'
  ) AND role = 'admin';
  
  -- Expected: passes = true
ROLLBACK;

-- Test 2: RLS policies work
SET ROLE authenticated;
SET request.jwt.claims.sub TO 'regular-user-uuid';

-- Should only see own data
SELECT COUNT(*) FROM orders; -- Should be limited

-- Reset
RESET ROLE;

-- Test 3: Admin functions require admin
BEGIN;
  SET ROLE authenticated;
  SET request.jwt.claims.sub TO 'non-admin-uuid';
  
  -- Should fail
  SELECT grant_admin_role('target-uuid');
  -- Expected: ERROR: Only admins can grant admin role
  
ROLLBACK;
```

### 3. Integration Tests

Test full user flows:
1. User signup → Profile created, no admin role
2. Admin login → Can access admin dashboard
3. Admin grants role → Target user receives role
4. User with role → Can access role-specific features
5. Role revocation → User loses access

---

## Monitoring & Alerting

### 1. Key Metrics to Monitor

**User & Role Metrics:**
```sql
-- Dashboard queries for monitoring

-- 1. Total admin count (should be stable)
CREATE VIEW admin_count AS
SELECT COUNT(*) as total_admins
FROM user_roles
WHERE role = 'admin';

-- Alert if > expected_count

-- 2. New admins in last 24 hours
CREATE VIEW recent_admins AS
SELECT u.email, ur.created_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin'
  AND ur.created_at > NOW() - INTERVAL '24 hours';

-- Alert if > 0 (unless expected)

-- 3. Users without roles
CREATE VIEW users_without_roles AS
SELECT u.email, u.created_at
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.id IS NULL;

-- Alert if count grows unexpectedly

-- 4. Auto-assigned roles (should be 0)
CREATE VIEW auto_assigned_roles AS
SELECT u.email, 
       u.created_at as user_created,
       ur.created_at as role_created,
       ur.created_at - u.created_at as time_diff
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
WHERE ur.created_at - u.created_at < INTERVAL '5 seconds'
  AND ur.role = 'admin';

-- Alert if count > 0
```

### 2. Alert Configuration

**Recommended Alerts:**

```yaml
alerts:
  - name: "Unexpected Admin Count Increase"
    query: "SELECT COUNT(*) FROM user_roles WHERE role = 'admin'"
    threshold: 5  # Adjust to your expected admin count
    condition: "greater_than"
    severity: "critical"
    
  - name: "New Admin Created"
    query: "SELECT COUNT(*) FROM user_roles WHERE role = 'admin' AND created_at > NOW() - INTERVAL '1 hour'"
    threshold: 0
    condition: "greater_than"
    severity: "high"
    notification: "slack_security_channel"
    
  - name: "Auto-Assigned Admin Detected"
    query: "SELECT COUNT(*) FROM (SELECT u.id FROM auth.users u JOIN user_roles ur ON u.id = ur.user_id WHERE ur.role = 'admin' AND ur.created_at - u.created_at < INTERVAL '5 seconds' AND ur.created_at > NOW() - INTERVAL '1 hour') sq"
    threshold: 0
    condition: "greater_than"
    severity: "critical"
    notification: "pagerduty"
    
  - name: "Last Admin Revocation Attempt"
    query: "SELECT COUNT(*) FROM admin_action_log WHERE action = 'revoke_admin_failed' AND created_at > NOW() - INTERVAL '1 hour'"
    threshold: 0
    condition: "greater_than"
    severity: "medium"
```

### 3. Logging Best Practices

**Audit Log Table:**
```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true
);

-- Index for efficient queries
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- Log retention policy (keep 1 year)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM audit_log
  WHERE timestamp < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (using pg_cron or similar)
-- SELECT cron.schedule('cleanup-audit-logs', '0 2 * * 0', 'SELECT cleanup_old_audit_logs()');
```

**What to Log:**
- Admin role grants/revokes
- Permission changes
- Failed authorization attempts
- Suspicious activity patterns
- System configuration changes

---

## Documentation Standards

### 1. Required Documentation

For any security-related change:

**Migration Documentation:**
```markdown
# Migration: [Name]

## Purpose
[Why this change is needed]

## Changes
- Table X: [What changed]
- Function Y: [What changed]
- Policy Z: [What changed]

## Security Implications
- [Security impact 1]
- [Security impact 2]

## Testing
- [Test case 1]
- [Test case 2]

## Rollback
```sql
-- Rollback SQL here
```

## Verification
```sql
-- Verification queries
```
```

**Function Documentation:**
```sql
-- Always add COMMENT ON FUNCTION
COMMENT ON FUNCTION function_name IS 
'Purpose: [What it does]
Authorization: [Who can call it]
Parameters: [Description of params]
Returns: [Description of return value]
Security: [Security considerations]
Example: SELECT function_name(param);';
```

### 2. Security Decision Log

Maintain a log of security decisions:

**File: `SECURITY_DECISIONS.md`**
```markdown
# Security Decision Log

## Decision 001: No Auto-Admin Assignment
**Date**: 2025-11-25
**Decision**: Remove automatic admin role assignment from handle_new_user()
**Rationale**: Security vulnerability - all users were getting admin access
**Alternatives Considered**: 
- Feature flag for environment
- First-user-only auto-admin
**Chosen Solution**: No auto-assignment, explicit grants only
**Impact**: Admins must manually grant roles
**Review Date**: 2026-01-25

## Decision 002: Use SECURITY DEFINER for has_role()
**Date**: 2025-11-25
**Decision**: Use SECURITY DEFINER to break RLS recursion
**Rationale**: RLS policies were causing infinite loops
**Security Measures**: Function is read-only, no data modification
**Review Date**: 2026-01-25
```

---

## Security Audit Schedule

### 1. Regular Audits

**Monthly Audit (First Monday of each month):**
- [ ] Review list of admin users
- [ ] Check for unexpected role assignments
- [ ] Review audit logs for anomalies
- [ ] Verify RLS policies are functioning
- [ ] Check for failed authorization attempts

**Quarterly Security Review:**
- [ ] Full database permissions audit
- [ ] Review all SECURITY DEFINER functions
- [ ] Test role-based access control
- [ ] Review and update documentation
- [ ] Penetration testing of auth system

**Annual Comprehensive Audit:**
- [ ] External security audit
- [ ] Compliance review (GDPR, etc.)
- [ ] Disaster recovery test
- [ ] Security training for team
- [ ] Update security policies

### 2. Audit Checklist Template

```markdown
# Security Audit - [Date]

## Admin Users Review
- Total Admin Count: [number]
- Expected Count: [number]
- ✅/❌ Match: [yes/no]
- New Admins Since Last Audit: [list]
- Departed Staff Removed: [list]

## Role Distribution
- Admins: [count]
- Kitchen: [count]
- Users: [count]
- No Role: [count] (should be 0)

## System Health
- RLS Policies Active: ✅/❌
- Audit Logging Working: ✅/❌
- Alerts Configured: ✅/❌
- Recent Security Incidents: [count]

## Action Items
1. [Action needed]
2. [Action needed]

## Sign-off
Auditor: [Name]
Date: [Date]
Next Audit: [Date]
```

---

## Incident Response Plan

### 1. Security Incident Classification

**Level 1 - Critical:**
- Unauthorized admin access detected
- Data breach confirmed
- System compromise
- **Response Time**: Immediate (< 15 minutes)

**Level 2 - High:**
- Suspicious admin activity
- Failed intrusion attempts
- Configuration vulnerability
- **Response Time**: < 1 hour

**Level 3 - Medium:**
- Policy violations
- Unusual access patterns
- **Response Time**: < 4 hours

### 2. Incident Response Procedure

**Step 1: Detect & Alert**
```
Monitoring system detects issue
  ↓
Alert sent to security team
  ↓
Incident created in tracking system
```

**Step 2: Assess & Contain**
```
Review logs and evidence
  ↓
Determine severity level
  ↓
Contain the threat:
  - Revoke compromised credentials
  - Disable affected accounts
  - Block suspicious IPs
```

**Step 3: Investigate**
```
Document timeline of events
  ↓
Identify affected systems/data
  ↓
Determine root cause
  ↓
Collect forensic evidence
```

**Step 4: Remediate**
```
Fix vulnerability
  ↓
Test the fix
  ↓
Deploy to production
  ↓
Verify issue resolved
```

**Step 5: Document & Learn**
```
Write incident report
  ↓
Update runbooks
  ↓
Implement preventive measures
  ↓
Team debrief/training
```

### 3. Emergency Contacts

```markdown
# Security Incident Contacts

## Primary Response Team
- Security Lead: [Name] - [Phone] - [Email]
- Database Admin: [Name] - [Phone] - [Email]
- DevOps Lead: [Name] - [Phone] - [Email]

## Escalation
- CTO: [Name] - [Phone]
- CEO: [Name] - [Phone] (Critical incidents only)

## External
- Security Consultant: [Company] - [Phone]
- Legal Counsel: [Firm] - [Phone]
```

---

## Preventive Measures Summary

### Critical Preventive Measures

1. **🚨 NEVER auto-assign admin or elevated roles**
2. **✅ Always use explicit role grants by existing admins**
3. **🔒 Implement principle of least privilege**
4. **📋 Document all security-related changes**
5. **🧪 Test auth/authz changes thoroughly**
6. **👀 Monitor admin user list regularly**
7. **🔍 Audit logs for suspicious activity**
8. **📚 Maintain security decision log**
9. **⚙️ Separate development and production configs**
10. **🎓 Train team on security best practices**

### Quick Reference: Red Flags

Watch out for these warning signs:

- ❌ Migration adds auto-role assignment
- ❌ Function uses SECURITY DEFINER without auth checks
- ❌ RLS policy queries same table it's protecting
- ❌ Elevated permissions granted to anonymous users
- ❌ Production using development-only features
- ❌ Sudden increase in admin user count
- ❌ Users created and granted admin simultaneously
- ❌ Security features disabled "temporarily"

---

## Conclusion

Security is an ongoing process, not a one-time fix. By following these best practices and maintaining vigilance, we can prevent future incidents and maintain a secure system for our users.

**Remember:**
- Security is everyone's responsibility
- When in doubt, ask for a security review
- Document security decisions
- Test security controls regularly
- Learn from incidents and near-misses

---

**Document Version**: 1.0  
**Last Updated**: November 25, 2025  
**Next Review**: February 25, 2026  
**Owner**: Security Team
