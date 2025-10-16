# Repository Guidelines

## Project Structure & Module Organization
Source follows the Next.js 15 layout. Route handlers and server components live in `src/app`, while shared UI sits in `src/components`. Keep domain helpers in `src/lib`, hooks in `src/hooks`, and reusable content under `src/content`. Store global constants and types in `src/constants` and `src/types`. Static assets belong in `public/`, automation scripts in `scripts/`, and Jest tests plus mocks under `src/__tests__` and `__mocks__/`.

## Build, Test, and Development Commands
Use `npm run dev` for hot-reload development, `npm run build` to create the optimized production bundle, and `npm run start` to smoke-test the last build. Run `npm run lint` before submitting to apply the repo ESLint rules. Execute `npm run test`, `npm run test:watch`, or `npm run test:coverage` depending on whether you need a one-off run, watch mode, or coverage report.

## Coding Style & Naming Conventions
Author React components in TypeScript with PascalCase filenames (e.g., `src/components/ThemeSwitcher.tsx`) and utilities in `.ts`. Follow 2-space indentation, single quotes, and the existing ESLint/Prettier setup enforced via `npm run lint`. Tailwind classes should read layout → spacing → typography for quick scanning, and colocate component-specific helpers beside their components when practical.

## Testing Guidelines
Jest and React Testing Library power the suite. Name specs `ComponentName.test.tsx` and store them with the component or in `src/__tests__/integration` for broader flows. Prefer MSW for API seams, reuse shared fixtures, and target ≥80% line coverage on authentication, email, and Firebase-touching features. Validate coverage locally with `npm run test:coverage`.

## Commit & Pull Request Guidelines
Write imperative, sentence-case commit messages such as “Improve palette selector contrast.” Keep each commit scoped; mention affected areas in the body if needed. For PRs, add a brief summary, link related issues, document local test runs (e.g., `npm run lint`, `npm run test`), and supply screenshots or clips for UI updates inside `src/app` or `src/components`. Wait for green checks and review sign-off before merging.

## Security & Configuration Tips
Store credentials (Firebase keys, reCAPTCHA tokens, mail secrets) in `.env.local` and document new variables in `.env.example`. Capture non-obvious configuration changes in `docs/`, and flag required setup steps in PR descriptions to keep deploys smooth.
