# WebSecScan Documentation

This directory contains the complete documentation for WebSecScan, built with [MkDocs Material](https://squidfunk.github.io/mkdocs-material/).

## 📚 Documentation Structure

- **[index.md](index.md)** - Home page with project overview
- **[getting-started.md](getting-started.md)** - Installation and quick start guide
- **[features.md](features.md)** - Detailed feature descriptions
- **[testing-coverage.md](testing-coverage.md)** - What vulnerabilities we test for
- **[architecture.md](architecture.md)** - System design and technical architecture
- **[agents.md](agents.md)** - Deep dive into scanning agents
- **[development.md](development.md)** - Development setup and contribution guide
- **[testing.md](testing.md)** - Testing guide with unit and integration tests
- **[api.md](api.md)** - REST API and Server Actions documentation
- **[deployment.md](deployment.md)** - Production deployment guide
- **[security-ethics.md](security-ethics.md)** - Ethical scanning practices

## 🚀 Building Locally

### Prerequisites

**Option 1: Virtual Environment (Recommended)**
```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
# OR: venv\Scripts\activate  # Windows

# Install dependencies
pip install mkdocs-material mkdocs-minify-plugin
```

**Option 2: pipx (macOS/Linux)**
```bash
# Install pipx first
brew install pipx  # macOS
# OR: apt install pipx  # Ubuntu/Debian

# Install mkdocs with extensions
pipx install mkdocs
pipx inject mkdocs mkdocs-material mkdocs-minify-plugin
```

### Build and Serve

```bash
# Serve with live reload (for development)
mkdocs serve

# Build static site
mkdocs build

# Deploy to GitHub Pages (if you have permissions)
mkdocs gh-deploy
```

The documentation will be available at http://localhost:8000

## 🌐 Live Documentation

Once deployed, the documentation will be available at:
https://pranavraut.github.io/WebSecScan/

## 📝 Contributing to Documentation

### Adding a New Page

1. Create a new Markdown file in the `docs/` directory
2. Add it to the `nav` section in `mkdocs.yml`
3. Test locally with `mkdocs serve`
4. Submit a pull request

### Documentation Guidelines

- Use clear, concise language
- Include code examples where appropriate
- Add appropriate admonitions (tip, warning, note)
- Keep formatting consistent with existing pages
- Test all links and code snippets

### Markdown Extensions

We use several MkDocs extensions:

- **Code highlighting**: Syntax highlighting for code blocks
- **Admonitions**: Info boxes (note, tip, warning, etc.)
- **Tables**: Enhanced table support
- **Tabs**: Tabbed content for multiple options

Example:

```markdown
!!! tip "Pro Tip"
    Use the search feature to quickly find what you need.

!!! warning "Important"
    Always get authorization before scanning.
```

## 🔄 Automatic Deployment

Documentation is automatically deployed to GitHub Pages when:

- Changes are pushed to the `main` branch
- Changes are made to files in the `docs/` directory
- `mkdocs.yml` is modified
- The workflow can also be triggered manually

See [`.github/workflows/docs.yml`](../.github/workflows/docs.yml) for the deployment workflow.

## 📦 Dependencies

- **mkdocs**: Static site generator
- **mkdocs-material**: Material Design theme
- **mkdocs-minify-plugin**: HTML/CSS/JS minification

## 🐛 Troubleshooting

### Build Errors

If you encounter build errors:

```bash
# Clean previous builds
rm -rf site/

# Reinstall dependencies
pip install --upgrade mkdocs-material mkdocs-minify-plugin

# Build with verbose output
mkdocs build --verbose
```

### Broken Links

To check for broken links:

```bash
mkdocs build --strict
```

This will fail the build if there are any broken internal links.

## 📞 Need Help?

- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions
- **MkDocs Docs**: https://www.mkdocs.org/
- **Material Theme**: https://squidfunk.github.io/mkdocs-material/
