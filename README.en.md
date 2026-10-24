# DODGEBORN

[繁體中文](README.md) · [English](README.en.md) · [日本語](README.ja.md)

> A weekend dodgeball project that got a little carried away: dashes, jump shots, catch-and-counter plays, and special balls with opinions about straight lines.

**About the name:** the sport is spelled **dodgeball**. We typed **DODGEBORN**, noticed after the first ball was already airborne, and kept it. The ball was born; the typo got a jersey. This is still a dodgeball game, not a proposed spelling reform. 🏐

**Live demo:** after the public GitHub repository is created, you can import it into Vercel. No site has been deployed yet; the verified URL will be added here after deployment. See the [deployment guide](docs/DEPLOYMENT.md).

![DODGEBORN menu with original pixel characters](docs/media/menu.png)

| Choose a character | Take the court |
| --- | --- |
| ![Character selection with six original players](docs/media/select.png) | ![Six-on-six dodgeball match](docs/media/match.png) |

## What made it into the game

- **Six per team:** three infield and three outfield players. The first team to lose all three infield players loses.
- **Six original characters and six special shots:** run, jump, and time your release. Every shot has real collision behavior and a counter.
- **Catch, dodge, pass, counter:** a well-timed catch powers the next throw; teammates and positioning matter.
- **Solo and local versus:** Easy, Normal, and Hard AI, plus two keyboard control sets.
- **Pixel arcade style:** a 480×270 canvas, procedural art and effects, and original Web Audio music and sounds.

## Play

For a friend who just wants a match, build the [offline portable ZIP](docs/PACKAGING.md). They extract it and open `DODGEBORN.html` in desktop Chrome or Edge on Windows. They need no Node.js, account, or network connection. This is a portable browser edition, not a native installer.

To work on the code, use Node.js 22.17 or newer and run from the repository root:

```powershell
npm run dev:local
```

Open `http://127.0.0.1:4173`. This offline route does not require installing npm dependencies. The formal toolchain status is recorded in [acceptance](docs/ACCEPTANCE.md).

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Move | WASD | Arrow keys |
| Dash | Left Shift | Right Shift |
| Jump | R | I |
| Throw | F / Space | K / Enter |
| Catch | G | L |
| Dodge | Q | O |
| Pass | E | U |

`Esc` or `P` pauses; `M` or the MUSIC button toggles background music. Browsers start music after the first key press or click. Run, jump, and throw in midair for a special shot.

## How it is built

| Area | Responsibility |
| --- | --- |
| [`apps/web`](apps/web) | Canvas 2D presentation, keyboard/mouse input, UI, and Web Audio |
| [`packages/core`](packages/core) | Browser-independent, fixed 60 Hz rules, possession, swept collision, damage, and AI |
| [`packages/content`](packages/content) | Character and special-shot data, court, and balance |
| [`packages/shared`](packages/shared) | Shared types and events |
| [`tests`](tests) | Core, integration, AI, and browser checks |

The browser draws and plays sound; the core decides whether that ball really hit. See the [game design](docs/GAME_DESIGN.md). The current renderer is Canvas 2D; a Phaser migration has not been approved. The [decisions](docs/DECISIONS.md) and [known issues](docs/KNOWN_ISSUES.md) explain the tradeoffs.

## Verification and open source

```powershell
npm run test:local
npm run build:local
```

The offline build and real Chrome regression pass. Formal TypeScript, Vitest, Vite, and cross-browser checks still need the dependencies to be installed. **Playable preview is not a final release candidate.** See [acceptance](docs/ACCEPTANCE.md). The Vercel demo will serve the static `dist/` output after you import this repository in the Vercel dashboard; preparing the repo does not deploy it.

Code is [MIT licensed](LICENSE). Original procedural art, screenshots, music, and sounds are listed in the [asset license inventory](docs/ASSET_LICENSES.md). Contributions are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md) and the [security policy](SECURITY.md). Balls may leave the court; credentials should not.
