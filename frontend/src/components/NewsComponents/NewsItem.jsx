import React, { useState } from 'react';

const categoryColors = {
  Workshop:    "bg-indigo-50 text-indigo-600 border-indigo-100",
  Event:       "bg-rose-50 text-rose-600 border-rose-100",
  Seminar:     "bg-emerald-50 text-emerald-600 border-emerald-100",
  "Club-Activity": "bg-amber-50 text-amber-600 border-amber-100",
  Competition: "bg-pink-50 text-pink-600 border-pink-100",
  Career:      "bg-sky-50 text-sky-600 border-sky-100",
};

const NewsItem = ({ news, onEdit, onDelete, isAdminView = false }) => {
  const [expanded, setExpanded] = useState(false);
  const content = news.content || '';
  const PREVIEW_LENGTH = 250; // chars
  const isLong = content.length > PREVIEW_LENGTH;
  const badgeClass = categoryColors[news.category] || "bg-slate-100 text-slate-600 border-slate-200";

  if (isAdminView) {
    return (
      <div className="glass-card p-6 bg-white hover:shadow-md transition-all duration-300 border border-slate-100 group relative overflow-hidden mb-3 rounded-2xl">
        {/* Left accent */}
        <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-2xl leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight">
                {news.title}
              </h3>
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <span className={`text-sm font-bold px-3 py-1 rounded-full border ${badgeClass}`}>
                  {news.category || 'Uncategorized'}
                </span>
                <span className="text-sm text-slate-500 font-semibold flex items-center gap-1">
                   <span>👤</span> {news.author}
                </span>
                <span className="text-sm text-slate-500 font-semibold flex items-center gap-1">
                   <span>📅</span> {news.publishedDate ? new Date(news.publishedDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-start">
              <button
                onClick={() => onEdit(news)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                title="Edit Article"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(news._id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                title="Delete Article"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <p className="text-slate-600 text-base leading-7 font-medium bg-slate-50/70 p-4 rounded-xl border border-slate-100/70">
            {isLong && !expanded ? `${content.slice(0, PREVIEW_LENGTH).trim()}...` : content}
          </p>
          {isLong && (
            <div className="pt-1">
              <button
                onClick={() => setExpanded((s) => !s)}
                className="text-sm text-indigo-600 font-semibold hover:underline"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Public/Standard view
  return (
    <div className="glass-card p-6 bg-white hover:shadow-lg transition-all duration-300 group relative overflow-hidden rounded-2xl border border-slate-100">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-sky-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-slate-900 font-semibold text-2xl leading-tight group-hover:text-indigo-600 transition-colors">
          {news.title}
        </h3>
        {news.category && (
          <span className={`badge flex-shrink-0 border ${badgeClass}`}>
            {news.category}
          </span>
        )}
      </div>

      <p className="text-slate-600 text-base leading-7 mb-4">
        {isLong && !expanded ? `${content.slice(0, PREVIEW_LENGTH).trim()}...` : content}
      </p>
      {isLong && (
        <div className="mb-4">
          <button
            onClick={() => setExpanded((s) => !s)}
            className="text-base text-indigo-600 font-semibold hover:underline"
          >
            {expanded ? 'Show less' : 'Read more'}
          </button>
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
        <span className="flex items-center gap-1">
          <span>👤</span> {news.author}
        </span>
        {news.publishedDate && (
          <span className="flex items-center gap-1">
            <span>📅</span>
            {new Date(news.publishedDate).toLocaleDateString("en-US", {
              year: "numeric", month: "short", day: "numeric",
            })}
          </span>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className="flex gap-2 pt-3 border-t border-slate-100">
          {onEdit && (
            <button
              onClick={() => onEdit(news)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium hover:bg-indigo-100 transition-all"
            >
              ✏️ Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(news._id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium hover:bg-rose-100 transition-all"
            >
              🗑️ Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsItem;
