# Invisible Maze

A tiny browser game where the maze exists but is mostly invisible — you explore it using the arrow keys.

This repository contains a single-page static implementation with:

- An invisible maze generated procedurally (DFS-based perfect maze).
- Fog-of-war / "visibility" that reveals nearby tiles as you move (with falloff so distant tiles remain faint).
- A debug toggle to reveal the full maze while testing.
- Externalized assets: `styles.css` and `scripts.js` (no inline CSS/JS).

Files

- `index.html` — main page. Includes the canvas and UI controls (Reset, Show maze). Loads `styles.css` and `scripts.js`.
- `styles.css` — all styling for the page.
- `scripts.js` — game logic: maze generator, player movement, fog-of-war rendering, and UI hooks.

How to play

- Open `index.html` in your browser (double-click or File → Open). A local HTTP server is not required but recommended for some browsers.
- Use the arrow keys to move the player (green dot).
- The goal is the far bottom-right cell; reaching it displays a small win message.
- "Show maze" toggles a full reveal useful for debugging/level checking.
- Reset generates a new random maze and clears discovered areas.

Fog-of-war / visibility details

- The game stores a numeric visibility value per cell (0..1). When the player moves, nearby cells are assigned visibility values using a linear falloff so close tiles are clear and farther tiles appear faint.
- The visibility radius is controlled by the `SIGHT` constant in `scripts.js`. Increasing it reveals more area around the player.
- The debug toggle shows the entire maze regardless of visibility.

Developer notes / customization

- Maze size: adjust the `rows` and `cols` variables in `scripts.js` (they are set to 21 by default). For best results, use odd numbers so the generator's cell/wall pattern works as intended.
- Sight radius: change `SIGHT` in `scripts.js` to increase/decrease how much is revealed.
- Line-of-sight: current visibility ignores LOS (walls don't block vision). If you want walls to block light, we can add a simple raycasting or BFS visibility pass.

Running a local server (optional)
Some browsers restrict certain features for file:// URIs. If you want to run a server, from the project folder you can run a tiny Python HTTP server:

```bash
# using Python 3
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

Troubleshooting

- If styles look missing, try a hard refresh (Ctrl+F5) or clear cache.
- If controls don't respond, make sure the page has focus - click the canvas or page body and try again.

Ideas / next steps (optional)

- Add line-of-sight blocking so walls occlude visibility.
- Add mobile/touch controls (swipe or on-screen D-pad).
- Make sight radius and maze size adjustable from the UI.
- Add levels, timers, or leaderboards.

License

- This project is small and intended for learning/experimentation. Use it freely.

Enjoy exploring the invisible maze! 🎮
