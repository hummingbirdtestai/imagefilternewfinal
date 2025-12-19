import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const SUBJECTS = [
  { subject: 'Anatomy' },
  { subject: 'Anesthesia' },
  { subject: 'Biochemistry' },
  { subject: 'Community Medicine' },
  { subject: 'Dermatology' },
  { subject: 'ENT' },
  { subject: 'Forensic Medicine' },
  { subject: 'General Medicine' },
  { subject: 'General Surgery' },
  { subject: 'Microbiology' },
  { subject: 'Obstetrics and Gynaecology' },
  { subject: 'Ophthalmology' },
  { subject: 'Orthopedics' },
  { subject: 'Pathology' },
  { subject: 'Pediatrics' },
  { subject: 'Pharmacology' },
  { subject: 'Physiology' },
  { subject: 'Psychiatry' },
  { subject: 'Radiology' },
];

interface ImageResult {
  image_search: string;
  react_order_final: number;
  image_url: string | null;
}

interface StoredImage {
  image_url: string;
}

function App() {
  const [activeSubject, setActiveSubject] = useState('Anatomy');
  const [results, setResults] = useState<ImageResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [urlInputs, setUrlInputs] = useState<Record<string, string>>({});
  const [storedImages, setStoredImages] = useState<Record<string, StoredImage>>({});
  const [storing, setStoring] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'not-added' | 'added'>('not-added');

  useEffect(() => {
    fetchResults();
  }, [activeSubject]);

  const fetchResults = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('gemini_v3', {
        p_subject: activeSubject,
      });

      if (error) throw error;

      setResults(data || []);
      setUrlInputs({});
      setStoredImages({});
    } catch (error) {
      console.error('Error fetching results:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchGoogle = (imageSearch: string) => {
    const searchUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(
      imageSearch
    )}`;
    window.open(searchUrl, '_blank');
  };

  const handleUrlChange = (key: string, url: string) => {
    setUrlInputs((prev) => ({ ...prev, [key]: url }));
  };

  const handleStoreUrl = async (
    key: string,
    react_order_final: number
  ) => {
    const url = urlInputs[key];
    if (!url || !url.trim()) return;

    setStoring((prev) => ({ ...prev, [key]: true }));
    try {
      const { data, error } = await supabase.rpc('moon_v3', {
        p_subject: activeSubject,
        p_react_order_final: react_order_final,
        p_url: url,
      });

      if (error) throw error;

      if (data && data.length > 0) {
        setStoredImages((prev) => ({
          ...prev,
          [key]: { image_url: data[0].image_url },
        }));
      }
    } catch (error) {
      console.error('Error storing URL:', error);
    } finally {
      setStoring((prev) => ({ ...prev, [key]: false }));
    }
  };

  const getCurrentImageUrl = (result: ImageResult): string | null => {
    const key = String(result.react_order_final);
    return storedImages[key]?.image_url || result.image_url || null;
  };

  const notAddedResults = results.filter((r) => {
    const key = String(r.react_order_final);
    return !r.image_url && !storedImages[key];
  });

  const addedResults = results.filter((r) => {
    const key = String(r.react_order_final);
    return r.image_url || storedImages[key];
  });

  const displayResults =
    activeTab === 'not-added' ? notAddedResults : addedResults;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] overflow-hidden">
      <div className="bg-[#121212] border-b border-[#1f1f1f] overflow-x-auto scrollbar-hide">
        <div className="flex gap-2.5 px-4 py-3 min-w-max">
          {SUBJECTS.map((item) => (
            <button
              key={item.subject}
              onClick={() => setActiveSubject(item.subject)}
              className={`px-5 py-2.5 rounded-3xl font-semibold text-sm whitespace-nowrap transition-all duration-200 active:scale-95 ${
                activeSubject === item.subject
                  ? 'bg-[#1a1a1a] border-[1.5px] border-[#25D366] text-[#25D366]'
                  : 'bg-[#121212] border-[1.5px] border-[#404040] text-[#808080]'
              }`}
            >
              {item.subject}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-6 pb-4">
          <p className="text-sm text-[#808080] font-medium mb-1.5">
            Showing results for:
          </p>
          <h1 className="text-[26px] text-white font-bold mb-4">
            {activeSubject}
          </h1>

          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('not-added')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm ${
                activeTab === 'not-added'
                  ? 'bg-[#1a1a1a] border border-[#25D366] text-[#25D366]'
                  : 'bg-[#121212] border border-[#404040] text-[#808080]'
              }`}
            >
              Not Added ({notAddedResults.length})
            </button>
            <button
              onClick={() => setActiveTab('added')}
              className={`px-4 py-2 rounded-xl font-semibold text-sm ${
                activeTab === 'added'
                  ? 'bg-[#1a1a1a] border border-[#25D366] text-[#25D366]'
                  : 'bg-[#121212] border border-[#404040] text-[#808080]'
              }`}
            >
              Added ({addedResults.length})
            </button>
          </div>
        </div>

        <div className="px-5 pb-8 space-y-4">
          {loading ? (
            <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#2a2a2a]">
              <p className="text-sm text-[#b0b0b0]">Loading...</p>
            </div>
          ) : displayResults.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#2a2a2a]">
              <p className="text-sm text-[#b0b0b0]">
                No image descriptions found.
              </p>
            </div>
          ) : (
            displayResults.map((result) => {
              const key = String(result.react_order_final);

              return (
                <div
                  key={key}
                  className="bg-[#1a1a1a] rounded-2xl p-5 border border-[#2a2a2a]"
                >
                  <p className="text-xs text-[#606060] mb-2 font-mono">
                    Order: {result.react_order_final}
                  </p>

                  <p className="text-sm text-[#b0b0b0] mb-4">
                    {result.image_search}
                  </p>

                  <button
                    onClick={() => handleSearchGoogle(result.image_search)}
                    className="bg-[#25D366] text-[#0a0a0a] text-xs font-bold px-3 py-1.5 rounded-xl mb-3"
                  >
                    Search Google Images
                  </button>

                  <input
                    type="text"
                    placeholder="Paste image URL here…"
                    value={urlInputs[key] || ''}
                    onChange={(e) => handleUrlChange(key, e.target.value)}
                    className="w-full bg-[#121212] border border-[#404040] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#606060] mb-3"
                  />

                  <button
                    onClick={() =>
                      handleStoreUrl(
                        key,
                        result.react_order_final
                      )
                    }
                    disabled={storing[key]}
                    className="w-full border border-[#25D366] text-[#25D366] text-xs font-bold px-3 py-2.5 rounded-xl"
                  >
                    {storing[key] ? 'Storing...' : 'Store URL'}
                  </button>

                  {(() => {
                    const currentImageUrl = getCurrentImageUrl(result);
                    return currentImageUrl ? (
                      <div className="mt-4">
                        <img
                          src={currentImageUrl}
                          className="w-full rounded-lg"
                        />
                        <p className="text-xs text-white mt-2 break-all">
                          {currentImageUrl}
                        </p>
                      </div>
                    ) : null;
                  })()}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
