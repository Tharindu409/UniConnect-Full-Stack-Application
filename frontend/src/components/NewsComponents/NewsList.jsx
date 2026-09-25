import React from 'react';
import NewsItem from './NewsItem';

const NewsList = ({ newsList, onEdit, onDelete, isAdminView = false }) => {
  if (!newsList || newsList.length === 0) {
    return (
      <div className="glass-card p-12 text-center bg-white shadow-sm border border-slate-100 rounded-2xl">
        <div className="text-5xl mb-4 grayscale opacity-30">📭</div>
        <h3 className="text-slate-900 font-extrabold text-2xl mb-2">No News Found</h3>
        <p className="text-slate-500 text-base max-w-xs mx-auto">There are no articles to manage yet. Use the publisher to get started!</p>
      </div>
    );
  }

  // In admin view, we use a single column list for better focus in the grid layout
  const gridClass = isAdminView 
    ? "grid gap-3 grid-cols-1" 
    : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3";

  return (
    <div className={gridClass}>
      {newsList.map((news) => (
        <NewsItem
          key={news._id}
          news={news}
          onEdit={onEdit}
          onDelete={onDelete}
          isAdminView={isAdminView}
        />
      ))}
    </div>
  );
};

export default NewsList;
