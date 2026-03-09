# GitHub Workflow - Quick Reference

**Quick guide for the branch-based development workflow**

---

## 🚀 Quick Start

### 1. Create Feature Branch
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
git push -u origin feature/your-feature-name
```

### 2. Make Changes & Commit
```bash
# Make your changes, then:
git add .
git commit -m "feat: description of changes"
git push origin feature/your-feature-name
```

### 3. Verify Before Merge
```bash
# Run verification script
./verify-branch.sh

# Or manually:
npm run build
npm run lint
```

### 4. Create Pull Request
1. Go to GitHub → "New Pull Request"
2. Select `main` ← `feature/your-feature-name`
3. Fill out PR template
4. Submit for review

### 5. Merge After Approval
- Merge on GitHub
- Delete feature branch
- Pull latest main: `git checkout main && git pull origin main`

---

## ✅ Pre-Merge Checklist

**Must Have:**
- [ ] Build passes (`npm run build`)
- [ ] Linter passes (`npm run lint`)
- [ ] All features tested manually
- [ ] No regressions
- [ ] No console errors

**Should Have:**
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Performance checked

---

## 📋 Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `test/` - Testing
- `refactor/` - Refactoring
- `docs/` - Documentation
- `chore/` - Maintenance

---

## 🔥 Emergency Hotfix

```bash
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue
# Fix issue
git add . && git commit -m "fix: critical issue"
git push origin hotfix/critical-issue
# Create PR with [HOTFIX] prefix
# Merge immediately after verification
```

---

## 🛠️ Common Commands

```bash
# Check current branch
git branch --show-current

# Check status
git status

# Update branch with main
git fetch origin main
git merge origin/main

# View commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Discard local changes
git checkout -- .
```

---

## 📚 Full Documentation

See `GITHUB_WORKFLOW_PROTOCOL.md` for complete details.

---

**Remember:** Never push directly to main. Always use feature branches!

