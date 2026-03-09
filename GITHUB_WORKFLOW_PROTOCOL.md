# GitHub Workflow Protocol

**Version:** 1.0  
**Last Updated:** November 18, 2025  
**Purpose:** Ensure code quality and stability by testing all changes on a secondary branch before merging to main

---

## 📋 Overview

This protocol establishes a standardized workflow for uploading code to GitHub, ensuring that all updates are thoroughly tested on a secondary branch before being merged into the main branch. This prevents breaking changes from affecting production and maintains code quality.

---

## 🔄 Workflow Steps

### **Step 1: Create a New Branch for Testing**

#### 1.1 Ensure You're on Main Branch
```bash
git checkout main
git pull origin main
```

#### 1.2 Create a New Feature/Test Branch
```bash
# For feature development
git checkout -b feature/your-feature-name

# For bug fixes
git checkout -b fix/your-bug-description

# For testing/experimentation
git checkout -b test/your-test-description

# For refactoring
git checkout -b refactor/your-refactor-description
```

#### 1.3 Push Branch to Remote
```bash
git push -u origin feature/your-feature-name
```

**Branch Naming Conventions:**
- `feature/` - New features or enhancements
- `fix/` - Bug fixes
- `test/` - Testing or experimentation
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `chore/` - Maintenance tasks

**Example Branch Names:**
- `feature/checkout-improvements`
- `fix/payment-timeout-issue`
- `test/delivery-validation`
- `refactor/cart-context`

---

### **Step 2: Develop and Test on Secondary Branch**

#### 2.1 Make Your Changes
- Write code following project standards
- Add comments where necessary
- Follow TypeScript/React best practices

#### 2.2 Commit Changes Regularly
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add delivery address validation

- Implemented Mapbox geocoding integration
- Added 8-second timeout for validation
- Added non-blocking error handling
- Updated UI with validation feedback"

# Push to remote branch
git push origin feature/your-feature-name
```

**Commit Message Format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `test:` - Adding or updating tests
- `docs:` - Documentation changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks
- `style:` - Code style changes (formatting, etc.)

#### 2.3 Run Local Tests
```bash
# Run build to check for errors
npm run build

# Run linter
npm run lint

# Run unit tests (if available)
npm run test

# Run E2E tests (if available)
npm run test:e2e
```

#### 2.4 Test Functionality Manually
- Test all affected features
- Test edge cases
- Test error scenarios
- Test on different browsers/devices (if applicable)
- Verify no regressions in existing functionality

---

### **Step 3: Verification Checklist**

Before merging to main, verify the following:

#### ✅ **Code Quality Criteria**

- [ ] **Build Success:** `npm run build` completes without errors
- [ ] **Linter Passes:** `npm run lint` shows no errors or warnings
- [ ] **TypeScript:** No type errors
- [ ] **No Console Errors:** Browser console shows no errors
- [ ] **No Console Warnings:** Browser console shows no critical warnings

#### ✅ **Functionality Criteria**

- [ ] **All New Features Work:** All implemented features function as intended
- [ ] **No Regressions:** Existing features still work correctly
- [ ] **Error Handling:** Error scenarios are handled gracefully
- [ ] **Edge Cases:** Edge cases are handled appropriately
- [ ] **User Experience:** UI/UX is intuitive and responsive

#### ✅ **Testing Criteria**

- [ ] **Manual Testing:** All affected features tested manually
- [ ] **Cross-browser Testing:** Works on Chrome, Safari, Firefox (if applicable)
- [ ] **Mobile Testing:** Works on mobile devices (if applicable)
- [ ] **Integration Testing:** Features integrate correctly with existing code
- [ ] **Performance:** No significant performance degradation

#### ✅ **Documentation Criteria**

- [ ] **Code Comments:** Complex logic is commented
- [ ] **README Updated:** If needed, README is updated
- [ ] **Changelog Updated:** If needed, changelog is updated
- [ ] **API Documentation:** If applicable, API docs are updated

#### ✅ **Security Criteria**

- [ ] **No Sensitive Data:** No API keys, passwords, or secrets in code
- [ ] **Input Validation:** All user inputs are validated
- [ ] **Error Messages:** Error messages don't leak sensitive information
- [ ] **Dependencies:** No known security vulnerabilities in dependencies

---

### **Step 4: Create Pull Request (PR)**

#### 4.1 Push Final Changes
```bash
git add .
git commit -m "feat: complete feature implementation"
git push origin feature/your-feature-name
```

#### 4.2 Create Pull Request on GitHub
1. Go to GitHub repository
2. Click "New Pull Request"
3. Select `main` as base branch
4. Select your feature branch as compare branch
5. Fill out PR template (see below)

#### 4.3 PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation
- [ ] Other (specify)

## Testing
- [ ] Build passes
- [ ] Linter passes
- [ ] Manual testing completed
- [ ] No regressions found

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated (if needed)
- [ ] No console errors/warnings
- [ ] All functionality tested

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #[issue-number]
```

---

### **Step 5: Code Review (Optional but Recommended)**

#### 5.1 Self-Review
- Review your own code before requesting review
- Check for:
  - Code quality
  - Performance implications
  - Security concerns
  - Edge cases

#### 5.2 Request Review (if team available)
- Request review from team members
- Address review comments
- Update PR with fixes

---

### **Step 6: Final Verification Before Merge**

#### 6.1 Run Final Tests
```bash
# Ensure you're on your feature branch
git checkout feature/your-feature-name

# Pull latest changes
git pull origin feature/your-feature-name

# Run all tests
npm run build
npm run lint
npm run test  # if available
npm run test:e2e  # if available
```

#### 6.2 Verify PR Status
- [ ] All CI/CD checks pass (if configured)
- [ ] All reviewers approved (if required)
- [ ] No merge conflicts
- [ ] PR description is complete

---

### **Step 7: Merge to Main**

#### 7.1 Merge Options

**Option A: Merge Commit (Recommended for feature branches)**
- Preserves branch history
- Creates a merge commit
- Use when: Working on significant features

**Option B: Squash and Merge**
- Combines all commits into one
- Cleaner main branch history
- Use when: Multiple small commits that should be one

**Option C: Rebase and Merge**
- Linear history
- No merge commit
- Use when: Simple, linear changes

#### 7.2 Merge Process
1. Click "Merge pull request" on GitHub
2. Select merge strategy
3. Confirm merge
4. Delete feature branch (optional but recommended)

#### 7.3 Post-Merge Steps
```bash
# Switch back to main
git checkout main

# Pull latest changes
git pull origin main

# Verify everything works
npm run build
npm run lint

# Delete local feature branch (optional)
git branch -d feature/your-feature-name
```

---

## 🚨 Emergency Hotfix Protocol

For critical production issues that need immediate fixes:

### Quick Fix Process
1. **Create hotfix branch from main:**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b hotfix/critical-issue-name
   ```

2. **Make minimal fix:**
   - Fix only the critical issue
   - Test thoroughly but quickly
   - Commit and push

3. **Fast-track merge:**
   - Create PR with `[HOTFIX]` prefix
   - Merge immediately after verification
   - Document in post-mortem if needed

4. **Backport to feature branches:**
   - Apply same fix to any active feature branches
   - Prevent regression when those branches merge

---

## 📊 Branch Readiness Criteria

A branch is **READY TO MERGE** when:

### ✅ **Must Have (Required)**
- [x] Build passes without errors
- [x] Linter passes without errors
- [x] All affected features tested manually
- [x] No regressions in existing functionality
- [x] No console errors in browser
- [x] Code follows project standards
- [x] Commit messages are descriptive

### ✅ **Should Have (Recommended)**
- [x] Unit tests added/updated (if applicable)
- [x] Documentation updated (if needed)
- [x] Code reviewed (if team available)
- [x] Performance tested
- [x] Security reviewed

### ✅ **Nice to Have (Optional)**
- [x] E2E tests added/updated
- [x] Screenshots/videos added to PR
- [x] Related issues linked
- [x] Changelog updated

---

## 🔍 Verification Commands

### Quick Verification Script
```bash
#!/bin/bash
# save as verify-branch.sh

echo "🔍 Verifying branch readiness..."

echo "1. Running build..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "2. Running linter..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Linter failed!"
    exit 1
fi

echo "3. Checking for uncommitted changes..."
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Warning: Uncommitted changes detected"
fi

echo "✅ Branch verification complete!"
```

### Manual Verification Checklist
```bash
# 1. Check current branch
git branch --show-current

# 2. Check for uncommitted changes
git status

# 3. Check if branch is up to date
git fetch origin
git status

# 4. Run build
npm run build

# 5. Run linter
npm run lint

# 6. Check for merge conflicts with main
git fetch origin main
git merge-base --is-ancestor origin/main HEAD && echo "✅ No conflicts" || echo "⚠️  Potential conflicts"
```

---

## 📝 Best Practices

### 1. **Branch Management**
- Keep branches focused on single features/fixes
- Keep branches up to date with main
- Delete merged branches to keep repository clean

### 2. **Commit Practices**
- Make small, logical commits
- Write clear, descriptive commit messages
- Don't commit sensitive data
- Don't commit build artifacts

### 3. **Testing Practices**
- Test locally before pushing
- Test edge cases
- Test error scenarios
- Verify no regressions

### 4. **PR Practices**
- Keep PRs focused and small
- Write clear PR descriptions
- Link related issues
- Request reviews when appropriate

---

## 🛠️ Troubleshooting

### Merge Conflicts
```bash
# If conflicts occur during merge
git checkout main
git pull origin main
git checkout feature/your-feature-name
git merge main
# Resolve conflicts
git add .
git commit -m "fix: resolve merge conflicts"
git push origin feature/your-feature-name
```

### Branch Out of Date
```bash
# Update feature branch with latest main
git checkout feature/your-feature-name
git fetch origin
git merge origin/main
# Resolve any conflicts
git push origin feature/your-feature-name
```

### Build Fails After Merge
```bash
# If build fails after merging to main
git checkout main
git pull origin main
npm install  # Reinstall dependencies
npm run build
# Fix issues and commit
git add .
git commit -m "fix: resolve build issues"
git push origin main
```

---

## 📚 Additional Resources

- [Git Branching Strategies](https://www.atlassian.com/git/tutorials/comparing-workflows)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

---

## ✅ Summary

**Always follow this workflow:**
1. ✅ Create feature branch from main
2. ✅ Develop and test on feature branch
3. ✅ Verify all criteria are met
4. ✅ Create PR with complete description
5. ✅ Review and address feedback
6. ✅ Merge to main only after verification
7. ✅ Clean up merged branches

**Never:**
- ❌ Push directly to main
- ❌ Merge untested code
- ❌ Skip verification steps
- ❌ Merge with failing builds
- ❌ Merge with known bugs

---

**Protocol Version:** 1.0  
**Last Updated:** November 18, 2025  
**Maintained By:** Development Team

