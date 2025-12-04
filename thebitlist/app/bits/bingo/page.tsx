"use client";

import React, { useState } from "react";

type BingoGrid = string[][];

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateBingoGrid(rawWords: string[]): BingoGrid {
  const SIZE = 5;
  const USE_FREE_CENTER = true;
  const totalCells = SIZE * SIZE; // 25
  const freeCells = USE_FREE_CENTER ? 1 : 0; // 1
  const neededWords = totalCells - freeCells; // 24

  const cleanedWords = rawWords
    .map((w) => w.trim())
    .filter((w) => w.length > 0);

  if (cleanedWords.length < neededWords) {
    throw new Error(
      `You need at least ${neededWords} words for a 5×5 card (center is FREE).`
    );
  }

  const shuffled = shuffleArray(cleanedWords);
  const selected = shuffled.slice(0, neededWords);

  const grid: BingoGrid = Array.from({ length: SIZE }, () =>
    Array.from({ length: SIZE }, () => "")
  );

  const center = Math.floor(SIZE / 2); // 2
  let wordIndex = 0;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (USE_FREE_CENTER && r === center && c === center) {
        grid[r][c] = "FREE";
      } else {
        grid[r][c] = selected[wordIndex];
        wordIndex++;
      }
    }
  }

  return grid;
}

export default function BingoPage() {
  const [titleInput, setTitleInput] = useState("Bingo");
  const [cardTitle, setCardTitle] = useState("Bingo");

  const [wordInput, setWordInput] = useState(
    "Apple\nBanana\nCherry\nDate\nElderberry\nFig\nGrape\nHoneydew\nKiwi\nLemon\nMango\nNectarine\nOrange\nPapaya\nQuince\nRaspberry\nStrawberry\nTomato\nUgli Fruit\nVanilla\nWatermelon\nXigua\nYam\nZucchini"
  );

  const [grid, setGrid] = useState<BingoGrid | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastWords, setLastWords] = useState<string[] | null>(null);

  const SIZE = 5;
  const USE_FREE_CENTER = true;
  const totalCells = SIZE * SIZE; // 25
  const freeCells = USE_FREE_CENTER ? 1 : 0; // 1
  const neededWords = totalCells - freeCells; // 24

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const words = wordInput.split(/\n|,/); // newline or comma-separated

    try {
      const newGrid = generateBingoGrid(words);
      setGrid(newGrid);
      setLastWords(words);
      setCardTitle(titleInput.trim() || "Bingo");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong generating the card.");
      }
    }
  };

  const handleShuffle = () => {
    if (!lastWords) return;
    setError(null);
    try {
      const newGrid = generateBingoGrid(lastWords);
      setGrid(newGrid);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong reshuffling the card.");
      }
    }
  };

  const handlePrint = () => {
    if (!grid) return;
    if (typeof window === "undefined") return;
    window.print();
  };

  return (
    <main className="min-h-screen p-8 print:p-4 print:bg-white">
      <h1 className="text-3xl font-bold mb-2 print:text-2xl">
        Bingo Card Generator
      </h1>
      <p className="text-gray-700 mb-6 print:hidden">
        Enter a list of words and generate randomized 5×5 bingo cards with a
        FREE center.
      </p>

      {/* Form - hidden in print */}
      <form
        onSubmit={handleGenerate}
        className="mb-8 grid gap-6 md:grid-cols-[2fr,1.2fr] print:hidden"
      >
        <div>
          {/* Title */}
          <div className="mb-4">
            <label className="block mb-1 font-medium">Card Title</label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="w-full border rounded p-2"
              placeholder="e.g., Baby Shower Bingo"
            />
            <p className="text-xs text-gray-500 mt-1">
              This appears above the bingo card and on the printed page.
            </p>
          </div>

          {/* Words */}
          <label className="block mb-1 font-medium">Words</label>
          <textarea
            value={wordInput}
            onChange={(e) => setWordInput(e.target.value)}
            rows={10}
            className="w-full border rounded p-2 font-mono text-sm"
            placeholder={"One word/phrase per line\nor separated by commas"}
          />
          <p className="mt-1 text-xs text-gray-500">
            You need at least {neededWords} unique entries for a 5×5 card (center
            is FREE).
          </p>
        </div>

        {/* Actions / info */}
        <div>
          <div className="mb-4 text-sm text-gray-700">
            <p className="font-medium mb-1">Card Settings</p>
            <ul className="list-disc list-inside text-xs text-gray-600">
              <li>Fixed size: 5×5 grid</li>
              <li>Center space is always FREE</li>
              <li>Words are randomly distributed each time</li>
            </ul>
          </div>

          <button
            type="submit"
            className="w-full border rounded bg-black text-white py-2 font-semibold hover:opacity-90 mb-3"
          >
            Generate Card
          </button>

          <button
            type="button"
            onClick={handleShuffle}
            disabled={!grid}
            className="w-full border rounded py-2 text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Shuffle Layout
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-600">{error}</p>
          )}
        </div>
      </form>

      {/* Card display / print layout */}
      {grid && (
        <section className="max-w-xl mx-auto mt-4">
          {/* Actions (not printed) */}
          <div className="flex gap-3 mb-4 justify-center print:hidden">
            <button
              type="button"
              onClick={handlePrint}
              className="border rounded px-4 py-2 text-sm font-medium hover:bg-gray-100"
            >
              Print Card
            </button>
          </div>

          {/* Printable title */}
          <h2 className="text-2xl font-bold mb-2 text-center print:text-xl">
            {cardTitle}
          </h2>
          <p className="text-center text-gray-600 text-sm mb-4 print:text-xs print:text-black">
            Bingo
          </p>

          {/* Bingo grid */}
          <div className="inline-block border border-black mx-auto">
            {grid.map((row, rIdx) => (
              <div key={rIdx} className="flex">
                {row.map((cell, cIdx) => (
                  <div
                    key={cIdx}
                    className="
                      w-20 h-20 md:w-20 md:h-20
                      print:w-16 print:h-16
                      flex items-center justify-center text-center
                      border border-black
                      text-xs md:text-sm print:text-[10px]
                      px-1
                    "
                  >
                    {cell}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
