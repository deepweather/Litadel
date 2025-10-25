# GitHub Actions Workflows

This directory contains CI/CD workflows for the TradingAgents project.

## Workflows

### `lint-and-test.yml` - Lint and Test

Runs on every pull request and push to main/master/develop branches.

**Jobs:**

1. **Python Linting (Ruff)**
   - Checks Python code formatting
   - Runs Ruff linting
   - Fails on unformatted code or linting errors

2. **Frontend Linting (ESLint)**
   - Checks TypeScript/React code
   - Runs ESLint
   - Fails on linting errors (warnings allowed)

3. **Python Smoke Tests**
   - Tests that all Python modules can be imported
   - Verifies litadel, api, and cli modules work
   - Catches breaking import errors

4. **Frontend Build Test**
   - Tests that frontend builds successfully
   - Catches TypeScript compilation errors
   - Ensures production build is valid

5. **CI Success**
   - Summary job that checks all others passed
   - Required status check for PRs

## Status Badge

Add this to your README.md to show CI status:

```markdown
![Lint and Test](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/lint-and-test.yml/badge.svg)
```

## Local Testing

Before pushing, you can run the same checks locally:

```bash
# Run all pre-commit checks (same as CI)
./lint.sh

# Auto-fix issues
./format.sh

# Run smoke tests
python tests/test_smoke.py

# Run frontend build
python tests/test_frontend_build.py
```

## Configuration

The workflows use:
- **Python 3.10** with `uv` package manager
- **Node.js 20** with npm
- **Ubuntu latest** runners
- **Caching** for faster runs (uv cache, npm cache)

## Adding New Checks

To add new checks to CI:

1. Create a test file in `tests/`
2. Add it to `.pre-commit-config.yaml` (runs locally)
3. Add a new job to `.github/workflows/lint-and-test.yml` (runs on GitHub)
4. Add the job name to the `ci-success` job's `needs` list
