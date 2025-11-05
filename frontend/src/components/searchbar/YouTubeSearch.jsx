import { useState } from "react";

export default function YouTubeSearch({ onSelectVideo }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);

    try {
      const res = await fetch(`http://localhost:5173/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      console.log("Résultats de la recherche YouTube :", data);
      setResults(data);
    } catch (err) {
      console.error("Erreur recherche YouTube :", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex gap-2">
        <input
          className="border rounded p-2 w-full"
          type="text"
          placeholder="Rechercher une vidéo YouTube..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 text-white px-4 rounded"
        >
          Rechercher
        </button>
      </div>

      {loading && <p>Chargement...</p>}

      <div className="mt-4 space-y-3">
        {results.map((item) => (
          <div
            key={item.id.videoId}
            className="flex gap-3 items-center cursor-pointer hover:bg-gray-100 p-2 rounded"
            onClick={() => onSelectVideo(`https://www.youtube.com/watch?v=${item.id.videoId}`)}
          >
            <img
              src={item.snippet.thumbnails.default.url}
              alt={item.snippet.title}
              className="w-24 h-16 rounded"
            />
            <div>
              <p className="font-medium">{item.snippet.title}</p>
              <p className="text-sm text-gray-500">{item.snippet.channelTitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
