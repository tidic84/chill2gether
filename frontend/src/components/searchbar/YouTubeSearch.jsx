import { useState } from "react";

export default function YouTubeSearch({ onSelectVideo }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setVisible(true);
    
    try {
      // FIX: Correction de la syntaxe fetch
      const res = await fetch(`http://localhost:3000/api/search/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Erreur recherche YouTube :", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item) => {
    const video = {
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url  
    };
    onSelectVideo(video);  
    
    // Réinitialiser après sélection
    setVisible(false);
    setQuery("");
    setResults([]);
  };

  return (
    <div className="relative">
      {/* Barre de recherche */}
      <div className="flex gap-2 p-4 bg-gray-900">
        <input
          className="border rounded p-2 w-full text-black"
          type="text"
          placeholder="Rechercher une vidéo YouTube..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
        <button 
          onClick={handleSearch} 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 rounded transition"
          disabled={loading}
        >
          {loading ? "..." : "Rechercher"}
        </button>
      </div>

      {/* Résultats (superposés) */}
      {visible && (
        <div className="absolute z-50 top-16 left-0 w-full max-h-[70vh] overflow-y-auto bg-black bg-opacity-95 shadow-lg rounded p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-white">
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </h3>
            <button
              onClick={() => setVisible(false)}
              className="text-red-500 font-medium hover:underline"
            >
              Fermer ✕
            </button>
          </div>
          
          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {!loading && results.length === 0 && (
            <p className="text-gray-400 text-center py-8">
              Aucun résultat trouvé
            </p>
          )}
          
          <div className="mt-4 space-y-3">
            {results.map((item) => {
              // Génération d'une clé unique pour chaque résultat
              const videoId = item.id?.videoId || item.etag || Math.random();
              
              return (
                <div
                  key={videoId}
                  className="flex gap-3 items-center cursor-pointer hover:bg-gray-800 p-2 rounded transition"
                  onClick={() => handleSelect(item)}
                >
                  <img
                    src={item.snippet.thumbnails.default.url}
                    alt={item.snippet.title}
                    className="w-24 h-16 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-white line-clamp-2">
                      {item.snippet.title}
                    </p>
                    <p className="text-sm text-gray-400 mt-1">
                      {item.snippet.channelTitle}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}