"use client";

import React, { useState } from "react";

type Grid = string[][];
type Difficulty = "easy" | "medium" | "hard" | "custom";

function createEmptyGrid(size: number): Grid {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => "")
  );
}

function randomLetter(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const index = Math.floor(Math.random() * alphabet.length);
  return alphabet[index];
}

function canPlaceWord(
  grid: Grid,
  word: string,
  row: number,
  col: number,
  dx: number,
  dy: number
): boolean {
  const size = grid.length;

  for (let i = 0; i < word.length; i++) {
    const r = row + dx * i;
    const c = col + dy * i;

    if (r < 0 || r >= size || c < 0 || c >= size) return false;

    const cell = grid[r][c];
    if (cell !== "" && cell !== word[i]) return false;
  }

  return true;
}

function placeWord(
  grid: Grid,
  word: string,
  directions: Array<[number, number]>
): boolean {
  const size = grid.length;
  if (directions.length === 0) return false;

  for (let attempt = 0; attempt < 200; attempt++) {
    const [dx, dy] = directions[Math.floor(Math.random() * directions.length)];
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);

    if (canPlaceWord(grid, word, row, col, dx, dy)) {
      for (let i = 0; i < word.length; i++) {
        const r = row + dx * i;
        const c = col + dy * i;
        grid[r][c] = word[i];
      }
      return true;
    }
  }

  return false;
}

function buildDirections(options: {
  horizontal: boolean;
  vertical: boolean;
  diagonal: boolean;
  backwards: boolean;
}): Array<[number, number]> {
  const { horizontal, vertical, diagonal, backwards } = options;
  const dirs: Array<[number, number]> = [];

  if (horizontal) {
    dirs.push([0, 1]); // right
    if (backwards) dirs.push([0, -1]); // left
  }

  if (vertical) {
    dirs.push([1, 0]); // down
    if (backwards) dirs.push([-1, 0]); // up
  }

  if (diagonal) {
    dirs.push([1, 1], [1, -1]); // down-right, down-left
    if (backwards) {
      dirs.push([-1, 1], [-1, -1]); // up-right, up-left
    }
  }

  return dirs;
}

function generatePuzzle(
  rawWords: string[],
  size: number,
  directionOptions: {
    horizontal: boolean;
    vertical: boolean;
    diagonal: boolean;
    backwards: boolean;
  }
) {
  const words = rawWords
    .map((w) => w.trim().toUpperCase())
    .filter((w) => w.length > 0 && w.length <= size);

  const directions = buildDirections(directionOptions);
  const grid = createEmptyGrid(size);

  words.forEach((word) => {
    placeWord(grid, word, directions);
  });

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) {
        grid[r][c] = randomLetter();
      }
    }
  }

  return { grid, words };
}

export default function WordSearchPage() {
  const [wordInput, setWordInput] = useState("CAT\nDOG\nBIRD");
  const [size, setSize] = useState<number>(10);
  const [puzzle, setPuzzle] = useState<{ grid: Grid; words: string[] } | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [horizontal, setHorizontal] = useState(true);
  const [vertical, setVertical] = useState(true);
  const [diagonal, setDiagonal] = useState(false);
  const [backwards, setBackwards] = useState(false);
  const [titleInput, setTitleInput] = useState("Word Search");
  const [puzzleTitle, setPuzzleTitle] = useState("Word Search");



  const applyDifficulty = (value: Difficulty) => {
    setDifficulty(value);

    if (value === "easy") {
      setHorizontal(true);
      setVertical(true);
      setDiagonal(false);
      setBackwards(false);
    } else if (value === "medium") {
      setHorizontal(true);
      setVertical(true);
      setDiagonal(true);
      setBackwards(false);
    } else if (value === "hard") {
      setHorizontal(true);
      setVertical(true);
      setDiagonal(true);
      setBackwards(true);
    }
  };

  const markCustom = () => {
    if (difficulty !== "custom") {
      setDifficulty("custom");
    }
  };

  const handleGenerate = (event: React.FormEvent) => {
    event.preventDefault();

    const words = wordInput.split(/\n|,/);
    const gridSize = Math.max(8, Math.min(20, Number(size) || 10));

    if (!horizontal && !vertical && !diagonal) {
      setError(
        "Please select at least one direction (horizontal, vertical, or diagonal)."
      );
      return;
    }

    if (words.every((w) => w.trim() === "")) {
      setError("Please enter at least one word.");
      return;
    }

    setError(null);

    const result = generatePuzzle(words, gridSize, {
      horizontal,
      vertical,
      diagonal,
      backwards,
    });
    setPuzzleTitle(titleInput.trim() || "Word Search");
    setPuzzle(result);
  };

  const handlePrint = () => {
    if (!puzzle) return;
    if (typeof window === "undefined") return;
    window.print();
  };

  return (
    <main className="min-h-screen p-8 print:min-h-0 print:p-4 print:bg-white">
      <h1 className="text-3xl font-bold mb-2 print:hidden">
        Word Search
      </h1>
      <p className="text-gray-700 mb-6 print:hidden">
        Enter a list of words, choose difficulty and directions, and generate a
        word search.
      </p>

      {/* Form - hidden when printing */}
      <form
        onSubmit={handleGenerate}
        className="mb-8 grid gap-6 md:grid-cols-[2fr,1.2fr] print:hidden"
      >
        {/* Puzzle Title */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Puzzle Title</label>
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="e.g., Animals Word Search"
          />
          <p className="text-xs text-gray-500 mt-1">
            This will appear above the generated puzzle and on the printed worksheet.
          </p>
        </div>

        {/* Words + Grid Size */}
        <div>
          <label className="block mb-1 font-medium">Words</label>
          <textarea
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            rows={8}
            className="w-full border rounded p-2 font-mono text-sm"
            placeholder={"One word per line\nor separated by commas"}
          />
          <p className="mt-1 text-xs text-gray-500">
            Tip: Keep each word shorter than or equal to the grid size.
          </p>

          <div className="mt-4">
            <label className="block mb-1 font-medium">Grid Size</label>
            <input
              type="number"
              value={size}
              min={8}
              max={20}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-32 border rounded p-2"
            />
            <p className="mt-1 text-xs text-gray-500">
              Between 8 and 20. Larger grids fit longer words and more words.
            </p>
          </div>
        </div>

        {/* Difficulty & Direction Controls */}
        <div>
          <label className="block mb-1 font-medium">Difficulty</label>
          <select
            value={difficulty}
            onChange={(e) => applyDifficulty(e.target.value as Difficulty)}
            className="w-full border rounded p-2 mb-4"
          >
            <option value="easy">
              Easy (horizontal &amp; vertical only)
            </option>
            <option value="medium">
              Medium (add diagonals, no backwards)
            </option>
            <option value="hard">
              Hard (diagonals + backwards words)
            </option>
            <option value="custom">Custom</option>
          </select>
          {/* Toggles */}
          <fieldset className="border rounded p-3 mb-4">
            <legend className="text-sm font-medium px-1">Directions</legend>
            <div className="space-y-1 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={horizontal}
                  onChange={(e) => {
                    setHorizontal(e.target.checked);
                    markCustom();
                  }}
                />
                <span>Horizontal (left ↔ right)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={vertical}
                  onChange={(e) => {
                    setVertical(e.target.checked);
                    markCustom();
                  }}
                />
                <span>Vertical (up ↕ down)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={diagonal}
                  onChange={(e) => {
                    setDiagonal(e.target.checked);
                    markCustom();
                  }}
                />
                <span>Diagonal</span>
              </label>
              <label className="flex items-center gap-2 text-sm mb-4">
                <input
                  type="checkbox"
                  checked={backwards}
                  onChange={(e) => {
                    setBackwards(e.target.checked);
                    markCustom();
                  }}
                />
                <span>Allow backwards words (reversed text)</span>
              </label>
            </div>
          </fieldset>

          <button
            type="submit"
            className="w-full border rounded bg-black text-white py-2 font-semibold hover:opacity-90"
          >
            Generate Puzzle
          </button>

          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </div>
      </form>

      {puzzle && (
        <section
          className="
            grid gap-8 md:grid-cols-[2fr,1fr] items-start
            print:grid-cols-1 print:gap-4 print:mt-4
          "
        >
          <div>
            {/* Print button - not printed */}
            <div className="flex gap-3 mb-4 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="border rounded px-4 py-2 text-sm font-medium hover:bg-gray-100"
              >
                Print Puzzle
              </button>
            </div>

            <h2 className="
              text-2xl font-bold mb-3
              print:text-xl print:font-bold print:mb-2
            ">
              {puzzleTitle}
            </h2>
            <div className="inline-block border border-black print:border-[1px]">
              {puzzle.grid.map((row, rIdx) => (
                <div key={rIdx} className="flex">
                  {row.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      className="
                        w-8 h-8 md:w-8 md:h-8
                        print:w-6 print:h-6
                        flex items-center justify-center
                        border border-black
                        text-sm md:text-sm print:text-xs
                        font-mono
                      "
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2 print:text-base print:mb-1">
              Word List
            </h2>
            <ul className="list-disc list-inside text-sm print:text-xs">
              {puzzle.words.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
