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
        <div className="p-4 mx-10">
            <div className="flex gap-2">
                <input
                    className=" rounded p-2 w-full bg-gray-800 text-gray-400 placeholder-gray-400 outline-none"
                    type="text"
                    placeholder="Rechercher une vidéo YouTube..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <button
                    onClick={handleSearch}
                    className="bg-gray-200 hover:bg-gray-400  transition-colors text-black text-sm font-medium px-4 py-1 rounded shadow-sm"
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