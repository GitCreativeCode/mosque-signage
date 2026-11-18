# Contributing to MosqueSignage

Thank you for your interest in contributing to **MosqueSignage**! We welcome community contributions, bug reports, and enhancements to help make this digital signage appliance the best, most reliable open-source solution for community centers and mosques.

---

## 1. Contributor License Agreement (CLA)

By submitting a Pull Request, issue attachment, or code patch to this project, you certify and agree that:

1. **Authorship & Rights**: You wrote the contribution yourself or have the explicit legal right and authority to submit it.
2. **License Grant**: You grant the project maintainer (**GitCreativeCode**) a perpetual, worldwide, non-exclusive, royalty-free, irrevocable license to use, modify, distribute, copy, dual-license, or re-license your contribution under any license chosen by the project maintainer (including, but not limited to, GPLv3, MIT, Apache 2.0, or commercial/proprietary licenses).
3. **Open Source Availability**: Your contribution is also provided under the primary project license (GNU General Public License v3).

If you are contributing on behalf of an employer or organization, you represent that you have been authorized to make these representations on their behalf.

---

## 2. Development Guidelines & Code Standards

Before opening a pull request, please ensure your work complies with the project's engineering standards:

1. **Strict TypeScript**: No `any`. Strict null checks and explicit function return types are enforced.
2. **Deterministic Time Injection**: Core prayer and schedule calculations must take an injected `now: Date` parameter.
3. **Local-First Architecture**: Database models use SQLite with Drizzle ORM in WAL mode. Media assets are stored locally in `public/uploads/`.
4. **Testing Mandate**: Run the automated test suite before opening a PR:
   ```bash
   npm test
   ```
   All existing and newly added unit tests must pass 100%.

---

## 3. Pull Request Process

1. Fork the public repository at `https://github.com/GitCreativeCode/mosque-signage`.
2. Create a topical feature branch (`git checkout -b feature/my-enhancement`).
3. Commit your changes with clear, descriptive commit messages.
4. Run `npm test` and `npm run build` to ensure zero compilation or test errors.
5. Push to your fork and submit a Pull Request against the `main` branch.

Thank you for helping support open-source technology for community spaces!

