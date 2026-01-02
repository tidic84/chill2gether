import { useState, useRef, useEffect, useCallback } from "react";
import { Search } from "lucide-react";

// Fonction pour décoder les entités HTML
const decodeHTMLEntities = (text) => {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};
// YoutubeSearch.js
export const normalizeYouTubeInput = (input) => {
  try {
    // Si ce n'est pas une URL, on renvoie le texte tel quel
    if (!input.startsWith("http")) return input;

    const url = new URL(input);

    // youtu.be/VIDEO_ID
    if (url.hostname === "youtu.be") {
      const videoId = url.pathname.slice(1); // enlève le "/"
      if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
    }

    // youtube.com/watch?v=VIDEO_ID
    if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") {
      const videoId = url.searchParams.get("v");
      if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
    }

    // URL d'un autre site → on renvoie tel quel
    return input;
  } catch {
    // URL mal formée → on renvoie l'input brut
    return input;
  }
};

export default function YouTubeSearch({ onSelectVideo }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isResultsAnimating, setIsResultsAnimating] = useState(false);
  const [isSuggestionsAnimating, setIsSuggestionsAnimating] = useState(false);
  const containerRef = useRef(null);
  const isSearchingRef = useRef(false);

  


  // Fonction optimisée pour récupérer les suggestions
  const fetchSuggestions = useCallback((searchQuery) => {
    if (!searchQuery.trim() || isSearchingRef.current) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Créer un nom de callback unique
    const callbackName = `ytSuggestions${Date.now()}`;

    // Créer le script pour JSONP
    const script = document.createElement('script');
    script.src = `https://suggestqueries.google.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(searchQuery)}&callback=${callbackName}`;

    // Définir le callback global
    window[callbackName] = (data) => {
      if (data && data[1]) {
        const suggestionsList = data[1].map(item => decodeHTMLEntities(item[0]));
        setSuggestions(suggestionsList);
        setShowSuggestions(true);
        setVisible(false);
      }
      delete window[callbackName];
      document.body.removeChild(script);
    };

    // Gérer les erreurs
    script.onerror = () => {
      setSuggestions([]);
      delete window[callbackName];
      document.body.removeChild(script);
    };

    document.body.appendChild(script);
  }, []);

  // Animation pour les résultats
  useEffect(() => {
    if (visible) {
      setIsResultsAnimating(false);
      const timer = setTimeout(() => setIsResultsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsResultsAnimating(false);
    }
  }, [visible]);

  // Animation pour les suggestions
  useEffect(() => {
    if (showSuggestions) {
      setIsSuggestionsAnimating(false);
      const timer = setTimeout(() => setIsSuggestionsAnimating(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsSuggestionsAnimating(false);
    }
  }, [showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setVisible(false);
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch suggestions en temps réel avec debounce optimisé
  useEffect(() => {
    const timeoutId = setTimeout(() => fetchSuggestions(query), 10);
    return () => clearTimeout(timeoutId);
  }, [query, fetchSuggestions]);

  const handleSearch = async (searchQuery) => {
    // Si searchQuery est un événement ou undefined, utiliser query
    const rawInput  = typeof searchQuery === 'string' ? searchQuery : query;
    const queryToSearch = normalizeYouTubeInput(rawInput);

    if (!queryToSearch.trim()) return;

    isSearchingRef.current = true;
    setLoading(true);
    setShowSuggestions(false); // Cache les suggestions
    setVisible(true); // Affiche les résultats vidéo
    try {
      const res = await fetch(`http://localhost:3000/api/search/search?q=${encodeURIComponent(queryToSearch)}`);
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Erreur recherche YouTube :", err);
    } finally {
      setLoading(false);
      isSearchingRef.current = false;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    isSearchingRef.current = true;
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  };

  const handleSelect = (item) => {
    const video = {
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      title: decodeHTMLEntities(item.snippet.title),
      thumbnail: item.snippet.thumbnails.medium.url
    };
    onSelectVideo(video);

    // Réinitialiser après sélection
    setVisible(false);
    setQuery("");
    setResults([]);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-zen-stone dark:text-zen-dark-stone" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-3 bg-white dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border rounded-xl text-sm text-zen-text dark:text-zen-dark-text placeholder-zen-stone outline-none focus:border-zen-stone transition-all shadow-sm"
          placeholder="Coller un lien YouTube ou rechercher une vidéo..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) {
              setVisible(true);
            }
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
      </div>

      {/* Suggestions en temps réel */}
      {showSuggestions && suggestions.length > 0 && (
        <div className={`absolute z-50 mt-2 left-0 w-full max-h-[50vh] overflow-y-auto bg-white dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border shadow-lg rounded-xl transition-all duration-200 ease-out ${
          isSuggestionsAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 cursor-pointer hover:bg-zen-surface dark:hover:bg-zen-dark-surface dark:bg-zen-dark-surface text-zen-text dark:text-zen-dark-text border-b border-zen-border dark:border-zen-dark-border last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}

      {/* Results Dropdown */}
      { visible && (
        <div className={`absolute z-50 mt-1 w-full max-h-[72vh] overflow-y-auto bg-white dark:bg-zen-dark-surface border border-zen-border dark:border-zen-dark-border shadow-xl rounded-xl transition-all duration-200 ease-out ${
          isResultsAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}>
          <div className="p-4 border-b border-zen-border dark:border-zen-dark-border flex justify-between items-center">
            <h3 className="font-semibold text-zen-text dark:text-zen-dark-text">
              {results.length} résultat{results.length > 1 ? 's' : ''}
            </h3>
            <button
              onClick={() => setVisible(false)}
              className="text-zen-stone dark:text-zen-dark-stone hover:text-zen-clay dark:hover:text-zen-dark-clay dark:text-zen-dark-clay font-medium transition-colors text-sm"
            >
              Fermer ✕
            </button>
          </div>

          {loading && (
            <div className="p-2 space-y-2">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div key={i} className="flex gap-3 items-center p-3 rounded-lg animate-pulse">
                  {/* Skeleton thumbnail */}
                  <div className="w-32 h-20 bg-zen-border rounded-lg flex-shrink-0"></div>

                  {/* Skeleton content */}
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zen-border rounded w-3/4"></div>
                    <div className="h-3 bg-zen-border rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && results.length === 0 && (
            <p className="text-zen-stone dark:text-zen-dark-stone text-center py-8">
              Aucun résultat trouvé
            </p>
          )}
          {!loading &&(
            <div className="p-2 space-y-2">
              {results.map((item) => (
                <div
                  key={item.id.videoId}
                  className="flex gap-3 items-center cursor-pointer hover:bg-zen-surface dark:hover:bg-zen-dark-surface dark:bg-zen-dark-surface p-3 rounded-lg transition-all"
                  onClick={() => handleSelect(item)}
                >
                  <img
                    src={item.snippet.thumbnails.default.url}
                    alt={item.snippet.title}
                    className="w-32 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-zen-text dark:text-zen-dark-text text-sm line-clamp-2">
                      {decodeHTMLEntities(item.snippet.title)}
                    </p>
                    <p className="text-xs text-zen-stone dark:text-zen-dark-stone mt-1">
                      {decodeHTMLEntities(item.snippet.channelTitle)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
