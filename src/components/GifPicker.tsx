import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface GifPickerProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

// Tenor API - you can get a free API key at https://developers.google.com/tenor/guides/quickstart
const TENOR_API_KEY = 'AIzaSyAb10fABkOXb0Rlcjgdagbu_HrT1IDU88I'; // get your own at https://developers.google.com/tenor

export default function GifPicker({ onSelect, onClose }: GifPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load trending GIFs on mount
    loadTrendingGifs();
  }, []);

  const loadTrendingGifs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/featured?key=${TENOR_API_KEY}&limit=20&media_filter=gif`
      );
      const data = await response.json();
      setGifs(data.results || []);
    } catch (error) {
      console.error('Error loading trending GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      loadTrendingGifs();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=20&media_filter=gif`
      );
      const data = await response.json();
      setGifs(data.results || []);
    } catch (error) {
      console.error('Error searching GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchGifs(searchTerm);
  };

  return (
    <div className="border border-gray-200 rounded-lg bg-white p-4 shadow-lg w-80">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Choose a GIF</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-3">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search GIFs..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </form>

      {/* GIF Grid */}
      <div className="h-96 overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading GIFs...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => {
                  const gifUrl = gif.media_formats?.gif?.url || gif.url;
                  onSelect(gifUrl);
                  onClose();
                }}
                className="relative aspect-square overflow-hidden rounded-lg hover:opacity-80 transition-opacity"
              >
                <img
                  src={gif.media_formats?.tinygif?.url || gif.media_formats?.gif?.url}
                  alt={gif.content_description || 'GIF'}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 text-xs text-gray-500 text-center">
        Powered by Tenor
      </div>
    </div>
  );
}

