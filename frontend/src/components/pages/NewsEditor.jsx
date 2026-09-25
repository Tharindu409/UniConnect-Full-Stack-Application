import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import NewsForm from "../NewsComponents/NewsForm";
import { getNewsById, createNews, updateNews } from "../../api/newsApi";
import toast from 'react-hot-toast';

export default function NewsEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [editingNews, setEditingNews] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getNewsById(id)
        .then(res => setEditingNews(res.data))
        .catch(err => console.error('Failed to load article', err))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (payload) => {
    try {
      if (id) {
        await updateNews(id, payload);
        toast.success('Article updated');
      } else {
        await createNews(payload);
        toast.success('Article published');
      }
      navigate('/Managenews');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to save article');
    }
  };

  return (
    <div className="min-h-screen pb-16 bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 pt-10">
        <div className="glass-card p-6 bg-white shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">{id ? 'Edit Article' : 'Create Article'}</h2>
          {loading ? <div className="text-slate-500">Loading...</div> : <NewsForm onSubmit={handleSubmit} editingNews={editingNews} onCancel={() => navigate('/Managenews')} />}
        </div>
      </div>
    </div>
  );
}
