"use client";

import React, { useState } from "react";

type Direction = "across" | "down";

type GridCell = string | null; // letter or block
type Grid = GridCell[][];

interface Entry {
  id: number;
  answer: string; // normalized (no spaces, uppercase)
  clue: string;
  placed: boolean;
  row?: number;
  col?: number;
  direction?: Direction;
}

interface Clue {
  number: number;
  clue: string;
  answer: string;
}

interface CrosswordPuzzle {
  grid: Grid;
  numbers: (number | null)[][];
  acrossClues: Clue[];
  downClues: Clue[];
  unused: Entry[];
}

const GRID_SIZE = 15;

// ---------- helpers ----------

function createEmptyGrid(size: number): Grid {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizeAnswer(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ""); // remove spaces & punctuation
}

function tryPlaceWord(
  grid: Grid,
  entry: Entry,
  row: number,
  col: number,
  direction: Direction,
  indexInWord: number
): { success: boolean; row?: number; col?: number; direction?: Direction } {
  const size = grid.length;
  const word = entry.answer;
  const len = word.length;

  if (len === 0) return { success: false };

  if (direction === "across") {
    const startCol = col - indexInWord;
    const endCol = startCol + len - 1;
    if (startCol < 0 || endCol >= size) return { success: false };

    for (let j = 0; j < len; j++) {
      const c = startCol + j;
      const cell = grid[row][c];
      const ch = word[j];

      if (cell !== null && cell !== ch) {
        return { success: false };
      }
    }

    // place letters
    for (let j = 0; j < len; j++) {
      const c = startCol + j;
      grid[row][c] = word[j];
    }

    return { success: true, row, col: startCol, direction };
  } else {
    const startRow = row - indexInWord;
    const endRow = startRow + len - 1;
    if (startRow < 0 || endRow >= size) return { success: false };

    for (let i = 0; i < len; i++) {
      const r = startRow + i;
      const cell = grid[r][col];
      const ch = word[i];
      if (cell !== null && cell !== ch) {
        return { success: false };
      }
    }

    for (let i = 0; i < len; i++) {
      const r = startRow + i;
      grid[r][col] = word[i];
    }

    return { success: true, row: startRow, col, direction };
  }
}

function generateCrossword(entriesInput: Entry[]): CrosswordPuzzle {
  const size = GRID_SIZE;
  const grid = createEmptyGrid(size);

  // Sort by length descending and randomize a bit to get variety
  const sortedEntries = shuffleArray(entriesInput).sort(
    (a, b) => b.answer.length - a.answer.length
  );

  // Place first word horizontally in the middle
  const first = sortedEntries[0];
  if (!first) {
    return {
      grid,
      numbers: createEmptyNumbers(size),
      acrossClues: [],
      downClues: [],
      unused: [],
    };
  }

  const midRow = Math.floor(size / 2);
  const firstStartCol = Math.max(
    0,
    Math.floor((size - first.answer.length) / 2)
  );

  for (let i = 0; i < first.answer.length; i++) {
    grid[midRow][firstStartCol + i] = first.answer[i];
  }
  first.placed = true;
  first.row = midRow;
  first.col = firstStartCol;
  first.direction = "across";

  // Place remaining words
  for (let idx = 1; idx < sortedEntries.length; idx++) {
    const entry = sortedEntries[idx];
    const word = entry.answer;
    if (!word) continue;

    let placed = false;

    // Try to find crossings
    for (let wi = 0; wi < word.length && !placed; wi++) {
      const ch = word[wi];

      for (let r = 0; r < size && !placed; r++) {
        for (let c = 0; c < size && !placed; c++) {
          if (grid[r][c] === ch) {
            // Try across
            const tryAcross = tryPlaceWord(grid, entry, r, c, "across", wi);
            if (tryAcross.success) {
              entry.placed = true;
              entry.row = tryAcross.row;
              entry.col = tryAcross.col;
              entry.direction = "across";
              placed = true;
              break;
            }

            // Try down
            const tryDown = tryPlaceWord(grid, entry, r, c, "down", wi);
            if (tryDown.success) {
              entry.placed = true;
              entry.row = tryDown.row;
              entry.col = tryDown.col;
              entry.direction = "down";
              placed = true;
              break;
            }
          }
        }
      }
    }

    // If we couldn't place the word at all, it stays unplaced
  }

  const { numbers, acrossClues, downClues } = numberAndBuildClues(
    grid,
    sortedEntries
  );

  const unused = sortedEntries.filter((e) => !e.placed);

  return {
    grid,
    numbers,
    acrossClues,
    downClues,
    unused,
  };
}

function createEmptyNumbers(size: number): (number | null)[][] {
  return Array.from({ length: size }, () =>
    Array.from({ length: size }, () => null)
  );
}

function numberAndBuildClues(
  grid: Grid,
  entries: Entry[]
): {
  numbers: (number | null)[][];
  acrossClues: Clue[];
  downClues: Clue[];
} {
  const size = grid.length;
  const numbers = createEmptyNumbers(size);
  const acrossClues: Clue[] = [];
  const downClues: Clue[] = [];
  let clueNumber = 1;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = grid[r][c];
      if (!cell) continue;

      const leftBlocked = c === 0 || grid[r][c - 1] === null;
      const rightLetter = c + 1 < size && grid[r][c + 1] !== null;

      const topBlocked = r === 0 || grid[r - 1][c] === null;
      const bottomLetter = r + 1 < size && grid[r + 1][c] !== null;

      const startsAcross = leftBlocked && rightLetter;
      const startsDown = topBlocked && bottomLetter;

      if (startsAcross || startsDown) {
        numbers[r][c] = clueNumber;

        if (startsAcross) {
          const entry = entries.find(
            (e) =>
              e.placed &&
              e.row === r &&
              e.col === c &&
              e.direction === "across"
          );
          if (entry) {
            acrossClues.push({
              number: clueNumber,
              clue: entry.clue,
              answer: entry.answer,
            });
          }
        }

        if (startsDown) {
          const entry = entries.find(
            (e) =>
              e.placed &&
              e.row === r &&
              e.col === c &&
              e.direction === "down"
          );
          if (entry) {
            downClues.push({
              number: clueNumber,
              clue: entry.clue,
              answer: entry.answer,
            });
          }
        }

        clueNumber++;
      }
    }
  }

  return { numbers, acrossClues, downClues };
}

// ---------- React component ----------

export default function CrosswordPage() {
  const [titleInput, setTitleInput] = useState("Crossword Puzzle");
  const [puzzleTitle, setPuzzleTitle] = useState("Crossword Puzzle");

  const [entriesInput, setEntriesInput] = useState(
    "CAT | Small house pet\nDOG | Man's best friend\nBIRD | Animal that can fly\nTREE | Tall plant\nGRASS | Green ground cover\nCAR | Vehicle with four wheels\nROAD | You drive on it\nMOON | Earth's natural satellite\nSUN | Star at the center\nRAIN | Falls from the sky\nSNOW | Frozen precipitation\nBOOK | You read this\nCHAIR | You sit on it\nTABLE | You eat at this\nPHONE | You call people with it"
  );

  const [puzzle, setPuzzle] = useState<CrosswordPuzzle | null>(null);
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setReveal(false);

    const lines = entriesInput
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length === 0) {
      setError("Please provide at least one answer + clue line.");
      return;
    }

    const entries: Entry[] = [];
    const badLines: string[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split("|");
      if (parts.length < 2) {
        badLines.push(line);
        return;
      }
      const answerRaw = parts[0].trim();
      const clue = parts.slice(1).join("|").trim(); // in case '|' appears in clue
      const norm = normalizeAnswer(answerRaw);

      if (!norm) {
        badLines.push(line);
        return;
      }

      entries.push({
        id: idx,
        answer: norm,
        clue,
        placed: false,
      });
    });

    if (entries.length === 0) {
      setError(
        "Could not parse any valid entries. Use the format: ANSWER | clue."
      );
      return;
    }

    if (badLines.length > 0) {
      setError(
        "Some lines could not be parsed (expected 'ANSWER | clue'):\n" +
          badLines.join("\n")
      );
      // still try generating with valid entries
    }

    const generated = generateCrossword(entries);
    setPuzzle(generated);
    setPuzzleTitle(titleInput.trim() || "Crossword Puzzle");
  };

  const handlePrint = () => {
    if (!puzzle) return;
    if (typeof window === "undefined") return;
    window.print();
  };

  return (
    <main className="min-h-screen p-8 print:p-4 print:bg-white">
      <h1 className="text-3xl font-bold mb-2 print:text-2xl">
        Crossword Generator
      </h1>
      <p className="text-gray-700 mb-6 print:hidden max-w-2xl">
        Enter answers and clues to automatically lay out a crossword. Use{" "}
        <code className="bg-gray-100 px-1 rounded text-xs">
          ANSWER | clue
        </code>{" "}
        on each line. You can hide or reveal the answers to check the layout.
      </p>

      {/* Form - hidden for print */}
      <form
        onSubmit={handleGenerate}
        className="mb-8 grid gap-6 md:grid-cols-[2fr,1.2fr] print:hidden max-w-5xl"
      >
        {/* Left: title + entries */}
        <div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Puzzle Title</label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="e.g., Classroom Animals Crossword"
            />
            <p className="text-xs text-gray-500 mt-1">
              This appears above the grid and in the print layout.
            </p>
          </div>

          <label className="block mb-1 font-medium">
            Answers &amp; Clues
          </label>
          <textarea
            value={entriesInput}
            onChange={(e) => setEntriesInput(e.target.value)}
            rows={12}
            className="w-full border rounded p-2 font-mono text-xs md:text-sm"
            placeholder={"CAT | Small house pet\nDOG | Man's best friend"}
          />
          <p className="mt-1 text-xs text-gray-500">
            Format each line as <strong>ANSWER | clue</strong>. Answers will be
            normalized to uppercase and spaces removed for the grid.
          </p>
        </div>

        {/* Right: controls */}
        <div>
          <div className="mb-4 text-sm text-gray-700">
            <p className="font-medium mb-1">Layout Notes</p>
            <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
              <li>Grid size: {GRID_SIZE}×{GRID_SIZE}</li>
              <li>Longer words are placed first to improve crossings.</li>
              <li>
                Not all words are guaranteed to fit; unplaced ones will be
                listed.
              </li>
            </ul>
          </div>

          <button
            type="submit"
            className="w-full border rounded bg-black text-white py-2 font-semibold hover:opacity-90 mb-3"
          >
            Generate Crossword
          </button>

          <button
            type="button"
            onClick={() => setReveal((prev) => !prev)}
            disabled={!puzzle}
            className="w-full border rounded py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            {reveal ? "Hide Answers" : "Reveal Answers"}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!puzzle}
            className="w-full border rounded py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Print Puzzle
          </button>

          {error && (
            <p className="mt-4 text-xs whitespace-pre-line text-red-600">
              {error}
            </p>
          )}
        </div>
      </form>

      {/* Puzzle display */}
      {puzzle && (
        <section className="mt-4 max-w-5xl">
          {/* Title in print view */}
          <h2 className="text-2xl font-bold mb-2 text-center print:text-xl">
            {puzzleTitle}
          </h2>
          <p className="text-center text-gray-600 text-sm mb-4 print:text-xs print:text-black">
            Crossword Puzzle
          </p>

          <div className="grid gap-8 md:grid-cols-[1.1fr,0.9fr] print:grid-cols-1">
            {/* Grid */}
            <div className="flex justify-center">
              <div className="inline-block border border-black">
                {puzzle.grid.map((row, rIdx) => (
                  <div key={rIdx} className="flex">
                    {row.map((cell, cIdx) => {
                      const num = puzzle.numbers[rIdx][cIdx];
                      const isBlock = cell === null;

                      if (isBlock) {
                        return (
                          <div
                            key={cIdx}
                            className="w-8 h-8 md:w-9 md:h-9 print:w-7 print:h-7 bg-black border border-black"
                          />
                        );
                      }

                      return (
                        <div
                          key={cIdx}
                          className="relative w-8 h-8 md:w-9 md:h-9 print:w-7 print:h-7 border border-black bg-white flex items-center justify-center"
                        >
                          {num && (
                            <span className="absolute top-[1px] left-[2px] text-[8px] print:text-[7px] leading-none">
                              {num}
                            </span>
                          )}
                          <span className="text-sm md:text-base print:text-xs font-semibold">
                            {reveal ? cell : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Clues */}
            <div className="text-sm print:text-xs">
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Across</h3>
                <ul className="space-y-1">
                  {puzzle.acrossClues.map((c) => (
                    <li key={`A-${c.number}`}>
                      <span className="font-semibold mr-1">
                        {c.number}.
                      </span>
                      <span>{c.clue}</span>
                      {reveal && (
                        <span className="text-gray-500 text-xs ml-1">
                          ({c.answer})
                        </span>
                      )}
                    </li>
                  ))}
                  {puzzle.acrossClues.length === 0 && (
                    <li className="text-gray-500 text-xs">
                      No across clues could be generated.
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Down</h3>
                <ul className="space-y-1">
                  {puzzle.downClues.map((c) => (
                    <li key={`D-${c.number}`}>
                      <span className="font-semibold mr-1">
                        {c.number}.
                      </span>
                      <span>{c.clue}</span>
                      {reveal && (
                        <span className="text-gray-500 text-xs ml-1">
                          ({c.answer})
                        </span>
                      )}
                    </li>
                  ))}
                  {puzzle.downClues.length === 0 && (
                    <li className="text-gray-500 text-xs">
                      No down clues could be generated.
                    </li>
                  )}
                </ul>
              </div>

              {puzzle.unused.length > 0 && (
                <div className="mt-4 text-xs text-gray-600 print:text-[9px]">
                  <p className="font-semibold mb-1">
                    Unused entries (couldn&apos;t be placed):
                  </p>
                  <ul className="list-disc list-inside">
                    {puzzle.unused.map((e) => (
                      <li key={e.id}>
                        {e.answer} – {e.clue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
