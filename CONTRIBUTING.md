# Contributing Guide

Thank you for considering contributing to the Restaurant SaaS project!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/restaurant-saas.git
cd restaurant-saas

# Run setup
./setup.sh

# Start development
npm run dev
```

## Code Style

### TypeScript
- Use TypeScript strict mode
- Define interfaces for all data structures
- Avoid `any` type
- Use meaningful variable names

### Naming Conventions
- Files: `camelCase.ts` or `PascalCase.tsx`
- Classes: `PascalCase`
- Functions: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Interfaces: `IPascalCase` (for repositories)

### Code Organization
```
domain/          # Business logic (no framework dependencies)
infrastructure/  # External services (database, cache, etc.)
api/            # HTTP layer (controllers, routes, middleware)
```

## Commit Messages

Follow conventional commits:
```
feat: add menu management API
fix: resolve session expiry bug
docs: update API documentation
refactor: improve order service
test: add guest session tests
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Request review from maintainers

## Testing

```bash
# Run tests
npm test

# Run specific test
npm test -- GuestSessionService

# Run with coverage
npm run test:coverage
```

## Areas for Contribution

### High Priority
- [ ] Admin dashboard UI
- [ ] Menu management API
- [ ] Payment integration (Stripe)
- [ ] Real-time WebSocket updates
- [ ] Mobile app (React Native)

### Medium Priority
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Analytics dashboard
- [ ] Loyalty program
- [ ] Multi-language support

### Low Priority
- [ ] Dark mode
- [ ] Accessibility improvements
- [ ] Performance optimizations
- [ ] Documentation improvements

## Questions?

Open an issue or contact the maintainers.
