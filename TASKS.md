# Next tasks

## 1. Create the game mascot

- Design a cute dragon with wings, glasses, a friendly face, and contrasting pastel colors.
- Use the dragon as the recognizable face of Stillmind.
- Show the dragon beside Sudoku lessons and contextual hints, with expressions or poses that support teaching.
- Keep the character art and reusable component separate from puzzle logic.

## 2. Reshape the home screen into a four-game hub

- Keep the greeting at the top of the home screen.
- Show a grid with space for four games. Sudoku is the available game; the other three can be clearly marked as coming later and need not be clickable.
- Selecting Sudoku opens its own game overview with its progress, last-played date, and relevant stats, then lets the player continue.
- Give the upper-right button a clear purpose and accessible label. Proposed purpose: open the player’s progress/profile, including the fresh-start skill check.

## 3. Show incorrect entries immediately

- When a player enters a digit that conflicts with the puzzle’s solution, display it in red immediately so the player can correct it before continuing.
- Keep visual feedback calm and readable, and make sure it does not rely on color alone (for example, add a small error marker or accessible description).

## 4. Make mistake checking a real, clear feature

- Define the “Check mistakes” control’s behavior and explain it in the UI.
- Ensure it works consistently with immediate error feedback, can be turned on or off, and updates the board as expected.
- Keep the solution-checking rules in one shared place so entry feedback and the mistake-check control cannot disagree.

## Suggested order

Start tasks 1 and 2 as separate design/UI work only if they use separate files or components. Tasks 3 and 4 should be implemented together because both depend on the same Sudoku validation behavior. Integrate the mascot into the teaching UI after its reusable component is ready. Review the combined changes on a phone-sized screen before saving a new Git checkpoint.
