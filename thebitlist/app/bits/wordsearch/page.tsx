"use client";

import React, { useState } from "react";

type Grid = string[][];

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

    // Outside grid bounds
    if (r < 0 || r >= size || c < 0 || c >= size) return false;

    const cell = grid[r][c];
    // Only allow same letter or empty
    if (cell !== "" && cell !== word[i]) return false;
  }

  return true;
}

function placeWord(grid: Grid, word: string): boolean {
  const size = grid.length;

  // Directions: right, down, down-right, up-right
  const directions: Array<[number, number]> = [
    [0, 1],
    [1, 0],
    [1, 1],
    [-1, 1],
  ];

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

  // Couldn’t place the word after many tries
  return false;
}

function generatePuzzle(rawWords: string[], size: number) {
  // Clean list: uppercase, no blanks, also ignore words longer than grid
  const words = rawWords
    .map((w) => w.trim().toUpperCase())
    .filter((w) => w.length > 0 && w.length <= size);

  const grid = createEmptyGrid(size);

  words.forEach((word) => {
    placeWord(grid, word);
  });

  // Fill empty cells
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

  const handleGenerate = (event: React.FormEvent) => {
    event.preventDefault();

    const words = wordInput.split(/\n|,/); // newline or comma-separated
    const gridSize = Math.max(8, Math.min(20, Number(size) || 10)); // clamp 8–20

    const result = generatePuzzle(words, gridSize);
    setPuzzle(result);
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-2">Word Search Builder</h1>
      <p className="text-gray-700 mb-6">
        Enter a list of words and generate a printable word search puzzle.
      </p>

      <form
        onSubmit={handleGenerate}
        className="mb-8 grid gap-4 md:grid-cols-[2fr,1fr]"
      >
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
            Tip: Keep each word shorter than the grid size.
          </p>
        </div>

        <div>
          <label className="block mb-1 font-medium">Grid Size</label>
          <input
            type="number"
            value={size}
            min={8}
            max={20}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full border rounded p-2 mb-4"
          />
          <button
            type="submit"
            className="w-full border rounded bg-black text-white py-2 font-semibold hover:opacity-90"
          >
            Generate Puzzle
          </button>
        </div>
      </form>

      {puzzle && (
        <section className="grid gap-8 md:grid-cols-[2fr,1fr] items-start">
          <div>
            <h2 className="text-xl font-semibold mb-2">Puzzle</h2>
            <div className="inline-block border">
              {puzzle.grid.map((row, rIdx) => (
                <div key={rIdx} className="flex">
                  {row.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      className="w-8 h-8 flex items-center justify-center border text-sm font-mono"
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Word List</h2>
            <ul className="list-disc list-inside text-sm">
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
