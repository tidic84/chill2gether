import { useState, useRef, useEffect } from "react";

export default function YouTubeSearch({ onSelectVideo }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const containerRef = useRef(null);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setVisible(true); // on affiche les résultats
    try {
      const res = await fetch(`http://localhost:3000/api/search/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Erreur recherche YouTube :", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (videoUrl) => {
    onSelectVideo(videoUrl);
    setVisible(false); // on cache la liste
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Barre de recherche */}
      <div className="flex gap-2 p-4 bg-gray-900">
        <input
          className="border rounded p-2 w-full"
          type="text"
          placeholder="Rechercher une vidéo YouTube..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setVisible(true)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button onClick={handleSearch} className="bg-blue-500 text-white px-4 rounded">
          Rechercher
        </button>
      </div>

      {/* Résultats (superposés) */}
      {visible && (
        <div className="absolute z-50 top-16 left-0 w-full max-h-[70vh] overflow-y-auto  bg-black bg-opacity-95 shadow-lg rounded p-4 ">
          <div className="flex justify-between items-center mb-2 ">
            <h3 className="font-semibold text-white">Résultats</h3>
            <button
              onClick={() => setVisible(false)}
              className="text-red-500 font-medium hover:underline"
            >
              Fermer ✕
            </button>
          </div>

          {loading && <p className="text-white">Chargement...</p>}
          <div className="mt-4 space-y-3 ">
            {results.map((item) => (
              <div
                key={item.id.videoId}
                className="flex gap-3 items-center cursor-pointer hover:bg-gray-100 p-2 rounded"
                onClick={() => handleSelect(`https://www.youtube.com/watch?v=${item.id.videoId}`)}
              >
                <img
                  src={item.snippet.thumbnails.default.url}
                  alt={item.snippet.title}
                  className="w-24 h-16 rounded"
                />
                <div>
                  <p className="font-medium text-red-600">{item.snippet.title}</p>
                  <p className="text-sm text-gray-500">{item.snippet.channelTitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}