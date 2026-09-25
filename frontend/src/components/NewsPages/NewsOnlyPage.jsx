import React, { useEffect, useState } from 'react';
import { getAllNews } from '../../api/newsApi.js';
import NewsList from "../../components/NewsComponents/NewsList.jsx";

const parseNewsDate = (value) => {
  if (!value) return 0;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
};

const NewsOnlyPage = () => {
  const [newsList, setNewsList]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Workshop', 'Event', 'Seminar', 'Club-Activity', 'Competition', 'Career'];

  const fetchNews = async () => {
    try {
      const res = await getAllNews();
      setNewsList(res.data.data);
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNews(); }, []);

  const filtered = newsList.filter((n) => {
    const matchCategory = activeCategory === 'All' || n.category === activeCategory;
    const matchSearch   = n.title?.toLowerCase().includes(search.toLowerCase()) ||
                          n.content?.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const sortedFiltered = [...filtered].sort((a, b) => {
    const dateDiff = parseNewsDate(b.publishedDate) - parseNewsDate(a.publishedDate);
    if (dateDiff !== 0) return dateDiff;
    return parseNewsDate(b.createdAt) - parseNewsDate(a.createdAt);
  });

  return (
    <div className="min-h-screen pb-16 bg-slate-50">

      {/* Hero Banner */}
      <div className="relative py-8 px-4 text-center overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute top-0 left-1/4 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-sky-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
            News & <span className="gradient-text">Announcements</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">
            Stay informed with the latest updates, tech news, and club announcements.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-10">

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm transition shadow-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        )}

        {/* Results count */}
        {!loading && (
          <p className="text-slate-500 text-sm mb-6">
            Showing <span className="text-indigo-600 font-medium">{filtered.length}</span> articles
          </p>
        )}

        {/* News Grid */}
        {!loading && <NewsList newsList={sortedFiltered} />}
      </div>
    </div>
  );
};

export default NewsOnlyPage;