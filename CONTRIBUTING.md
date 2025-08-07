# Contributing to OrderBook247 🤝

Thank you for your interest in contributing to OrderBook247! This document provides guidelines and information for contributors.

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch** for your changes
4. **Make your changes** following the coding standards
5. **Test your changes** thoroughly
6. **Submit a pull request**

## 📋 Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/orderbook247.git
cd orderbook247

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Start development server
npm run dev
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📝 Coding Standards

### JavaScript/Node.js
- Use **ES6+** features
- Follow **camelCase** for variables and functions
- Use **PascalCase** for classes
- Use **UPPER_SNAKE_CASE** for constants
- Add **JSDoc comments** for public functions
- Keep functions **small and focused**
- Use **async/await** instead of callbacks when possible

### Code Style
```javascript
// ✅ Good
class OrderBookManager {
  async updateOrderBook(symbol, data) {
    const orderbook = this.orderbooks.get(symbol);
    if (!orderbook) {
      return false;
    }
    return orderbook.update(data);
  }
}

// ❌ Avoid
class orderbookmanager {
  updateorderbook(symbol,data){
    var orderbook=this.orderbooks.get(symbol)
    if(!orderbook)return false
    return orderbook.update(data)
  }
}
```

### Error Handling
- Always handle errors gracefully
- Use try-catch blocks for async operations
- Log errors with appropriate context
- Return meaningful error messages

### Logging
- Use the Winston logger for all logging
- Include relevant context in log messages
- Use appropriate log levels (error, warn, info, debug)

## 🏗️ Project Structure

```
orderbook247/
├── src/
│   ├── config/          # Configuration files
│   ├── models/          # Data models
│   ├── services/        # Business logic
│   ├── utils/           # Utility functions
│   └── server.js        # Main server
├── examples/            # Client examples
├── test/               # Test files
└── docs/               # Documentation
```

## 🔧 Adding New Features

### 1. API Endpoints
When adding new API endpoints:
- Follow RESTful conventions
- Include proper error handling
- Add input validation
- Document the endpoint in README.md
- Add tests for the endpoint

### 2. WebSocket Features
When adding WebSocket features:
- Define message types clearly
- Include proper error handling
- Add connection management
- Document message formats

### 3. Orderbook Features
When adding orderbook features:
- Maintain data integrity
- Consider performance implications
- Add sequence number validation
- Include proper error handling

## 🧪 Writing Tests

### Test Structure
```javascript
describe('OrderBook', () => {
  let orderbook;

  beforeEach(() => {
    orderbook = new OrderBook('btcusdt');
  });

  describe('update', () => {
    it('should update bid levels correctly', () => {
      // Test implementation
    });

    it('should handle invalid data gracefully', () => {
      // Test implementation
    });
  });
});
```

### Test Guidelines
- Test both **success** and **failure** cases
- Test **edge cases** and **boundary conditions**
- Use **descriptive test names**
- Keep tests **independent** and **isolated**
- Mock external dependencies

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for all public functions
- Include parameter types and return values
- Provide usage examples for complex functions

### API Documentation
- Update README.md with new endpoints
- Include request/response examples
- Document all parameters and options

## 🔍 Pull Request Process

### Before Submitting
1. **Test your changes** thoroughly
2. **Update documentation** if needed
3. **Add tests** for new features
4. **Check code style** and formatting
5. **Ensure all tests pass**

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
- [ ] Added tests for new functionality
- [ ] All existing tests pass
- [ ] Manual testing completed

## Documentation
- [ ] Updated README.md
- [ ] Added JSDoc comments
- [ ] Updated API documentation

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No console.log statements left
- [ ] Error handling implemented
```

## 🐛 Reporting Issues

When reporting issues:
1. **Check existing issues** first
2. **Provide detailed information**:
   - OS and Node.js version
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages and logs
3. **Include minimal reproduction** if possible

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Code Review**: Ask for help in pull requests

## 🎯 Areas for Contribution

### High Priority
- Performance optimizations
- Additional trading pairs
- Enhanced error handling
- More comprehensive tests

### Medium Priority
- Additional API endpoints
- WebSocket improvements
- Documentation enhancements
- Example applications

### Low Priority
- UI/UX improvements
- Additional analysis tools
- Integration examples
- Performance monitoring

## 📄 License

By contributing to OrderBook247, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to OrderBook247! 🚀
