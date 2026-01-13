# Contributing to Chat2Checkout

First off, thank you for considering contributing to Chat2Checkout! It's people like you that make Chat2Checkout such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Your First Code Contribution](#your-first-code-contribution)
  - [Pull Requests](#pull-requests)
- [Style Guides](#style-guides)
  - [Git Commit Messages](#git-commit-messages)
  - [TypeScript Style Guide](#typescript-style-guide)
  - [React Style Guide](#react-style-guide)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Testing Guidelines](#testing-guidelines)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [opensource@razorpay.com](mailto:opensource@razorpay.com).

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Set up the development environment (see [Development Setup](#development-setup))
4. Create a new branch for your contribution
5. Make your changes
6. Push to your fork and submit a pull request

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples to demonstrate the steps**
- **Describe the behavior you observed and what behavior you expected**
- **Include screenshots or animated GIFs if possible**
- **Include your environment details** (OS, Node.js version, etc.)

Use the [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md) when creating a new issue.

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear and descriptive title**
- **Provide a detailed description of the suggested enhancement**
- **Explain why this enhancement would be useful**
- **List any similar features in other projects**

Use the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md) when creating a new issue.

### Your First Code Contribution

Unsure where to begin? You can start by looking through these issues:

- **Good First Issue** - Issues that should only require a few lines of code
- **Help Wanted** - Issues that are a bit more involved

### Pull Requests

1. **Create a feature branch** from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our style guides

3. **Commit your changes** with clear commit messages
   ```bash
   git commit -m "feat: add new payment method support"
   ```

4. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Pull Request** using our [PR template](.github/PULL_REQUEST_TEMPLATE.md)

#### Pull Request Guidelines

- Follow the TypeScript and React style guides
- Update documentation for any changed functionality
- Add tests if applicable (though not required for this project currently)
- Ensure your code passes all linting checks
- Keep pull requests focused - one feature/fix per PR
- Link any related issues in the PR description
- Request review from maintainers

## Style Guides

### Git Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation only changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code changes that neither fix bugs nor add features
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Changes to build process or auxiliary tools

Examples:
```
feat: add support for Shopify integration
fix: resolve cart total calculation issue
docs: update deployment instructions for Railway
refactor: simplify order service logic
```

### TypeScript Style Guide

- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid using `any` type unless absolutely necessary
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Follow existing code patterns in the project

Example:
```typescript
/**
 * Creates a new order in Razorpay
 * @param amount - Order amount in smallest currency unit (paise for INR)
 * @param currency - Currency code (e.g., 'INR', 'USD')
 * @returns Promise resolving to order details
 */
export async function createOrder(
  amount: number,
  currency: string
): Promise<OrderResponse> {
  // Implementation
}
```

### React Style Guide

- Use functional components with hooks
- Keep components small and focused
- Use meaningful component and prop names
- Extract reusable logic into custom hooks
- Follow the existing component structure

Example:
```jsx
interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart 
}) => {
  // Component implementation
};
```

## Development Setup

### Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm
- Razorpay test account

### Setup Steps

1. **Clone and install dependencies**
   ```bash
   git clone https://github.com/razorpay/chat2checkout.git
   cd chat2checkout
   pnpm install
   cd razorpay_server_node && pnpm install
   ```

2. **Set up environment variables**
   ```bash
   cd razorpay_server_node
   cp .env.example .env
   # Edit .env with your test credentials
   ```

3. **Start development servers**
   
   Terminal 1 - Widgets:
   ```bash
   cd widgets
   pnpm run build && pnpm run serve
   ```
   
   Terminal 2 - MCP Server:
   ```bash
   cd razorpay_server_node
   pnpm run dev
   ```

4. **Verify setup**
   ```bash
   curl http://localhost:8000/mcp
   ```

## Project Structure

```
chat2checkout/
├── razorpay_server_node/     # Backend MCP server
│   ├── src/
│   │   ├── config/           # Configuration management
│   │   ├── mcp/              # MCP protocol implementation
│   │   ├── routes/           # API route handlers
│   │   ├── services/         # Business logic
│   │   ├── middleware/       # Express middleware
│   │   └── types/            # TypeScript type definitions
│   └── docs/                 # API documentation
│
└── widgets/                  # Frontend React widgets
    ├── product-list-widget/  # Main product listing widget
    │   ├── src/
    │   │   ├── components/   # React components
    │   │   └── hooks/        # Custom React hooks
    │   └── assets/           # Built widget bundles
    └── shared/               # Shared utilities and types
```

## Testing Guidelines

While unit tests are not currently required, please ensure:

1. **Manual testing** of your changes
2. **Test all user flows** affected by your changes
3. **Test in different browsers** if making UI changes
4. **Verify API endpoints** with curl or Postman
5. **Check console for errors** during development

### Manual Testing Checklist

- [ ] Server starts without errors
- [ ] Widgets load correctly
- [ ] Product listing displays properly
- [ ] Cart operations work (add/remove/update)
- [ ] Checkout flow completes successfully
- [ ] Payment integration works with test keys
- [ ] No console errors or warnings

## Questions?

Feel free to:
- Open a [GitHub Discussion](https://github.com/razorpay/chat2checkout/discussions)
- Reach out to maintainers
- Email us at [opensource@razorpay.com](mailto:opensource@razorpay.com)

## Recognition

Contributors will be recognized in our [Contributors](#) section. We appreciate all contributions, big or small!

---

Thank you for contributing to Chat2Checkout! 🎉

