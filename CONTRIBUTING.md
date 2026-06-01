# Contributing to OpenCLI

Thank you for your interest in contributing! OpenCLI is an Apache 2.0 licensed project.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/open-cli/opencli.git
cd opencli

# Install dependencies
npm install

# Run build
npm run build

# Run tests
npm test

# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## Code Style

- Use TypeScript for all new code
- Follow ESLint rules (run `npm run lint` to check)
- Format with Prettier (run `npm run format` to fix)
- Write tests for new functionality (Vitest)
- Keep functions small and focused

## License Headers

All source files should include the Apache 2.0 license header:

```typescript
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
```

## Submitting Changes

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m "feat: add my feature"`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## Commit Message Convention

We follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Test changes
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

## Testing

Run tests before committing:

```bash
npm test
```

Ensure CI passes before opening a PR.
