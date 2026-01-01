import { useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

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
    <div ref={containerRef} className="relative w-full">
      {/* Search Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-zen-stone" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-3 bg-white border border-zen-warm-stone rounded-xl text-sm text-zen-charcoal placeholder-zen-stone focus:outline-none focus:border-zen-sage focus:ring-2 focus:ring-zen-sage/20 transition-all shadow-sm"
          placeholder="Coller un lien YouTube ou rechercher une vidéo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setVisible(true)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
      </div>

      {/* Results Dropdown */}
      {visible && (
        <div className="absolute z-50 mt-2 left-0 w-full max-h-[70vh] overflow-y-auto bg-white border border-zen-warm-stone shadow-lg rounded-xl">
          <div className="p-4 border-b border-zen-warm-stone flex justify-between items-center">
            <h3 className="font-semibold text-zen-charcoal">Résultats de recherche</h3>
            <button
              onClick={() => setVisible(false)}
              className="text-zen-stone hover:text-zen-terracotta font-medium transition-colors text-sm"
            >
              Fermer ✕
            </button>
          </div>

          {loading && (
            <div className="p-8 text-center text-zen-stone">
              Chargement...
            </div>
          )}

          <div className="p-2 space-y-2">
            {results.map((item) => (
              <div
                key={item.id.videoId}
                className="flex gap-3 items-center cursor-pointer hover:bg-zen-light-cream p-3 rounded-lg transition-all"
                onClick={() => handleSelect(`https://www.youtube.com/watch?v=${item.id.videoId}`)}
              >
                <img
                  src={item.snippet.thumbnails.default.url}
                  alt={item.snippet.title}
                  className="w-32 h-20 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-zen-charcoal text-sm line-clamp-2">
                    {item.snippet.title}
                  </p>
                  <p className="text-xs text-zen-stone mt-1">
                    {item.snippet.channelTitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}