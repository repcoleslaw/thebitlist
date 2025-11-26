import Link from "next/link";

export default function HomePage() {
  const tools = [
    { slug: "wordsearch", name: "Word Search Builder" },
  ];

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Creative Tools</h1>
      <p className="mt-2 text-gray-600">Choose a tool to get started.</p>

      <div className="grid gap-4 mt-8">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={`/bits/${tool.slug}`}
            className="border p-4 rounded hover:shadow"
          >
            {tool.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
