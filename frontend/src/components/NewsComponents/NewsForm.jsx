import React, { useState, useEffect } from "react";
import { FaNewspaper, FaUser, FaTag } from "react-icons/fa";

const toLocalDateInput = (dateValue) => {
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const NewsForm = ({ onSubmit, editingNews, onCancel }) => {
  const today = new Date();
  const todayLocal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const [title, setTitle]               = useState("");
  const [content, setContent]           = useState("");
  const [author, setAuthor]             = useState("");
  const [category, setCategory]         = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editingNews) {
      setTitle(editingNews.title || "");
      setContent(editingNews.content || "");
      setAuthor(editingNews.author || "");
      setCategory(editingNews.category || "");

      let dateVal = "";
      if (editingNews.publishedDate) {
        dateVal = toLocalDateInput(editingNews.publishedDate);
      }
      setPublishedDate(dateVal);
    } else {
      setTitle(""); setContent(""); setAuthor(""); setCategory(""); setPublishedDate("");
    }
  }, [editingNews]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // validation
    const errs = {};
    if (!title || title.trim().length < 5) errs.title = "Please enter a title longer than 5 characters.";
    if (!content || content.trim().length === 0) errs.content = "Article content cannot be empty.";
    else if (content.trim().length < 10) errs.content = "Content must be at least 10 characters.";
    else if (content && content.length > 5000) errs.content = "Article content must be under 5000 characters.";
    if (!category) errs.category = "Please select a category for this news item.";
    if (publishedDate && publishedDate !== todayLocal) errs.publishedDate = "Publish date must be today.";

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = { title, content, author, category };
    if (publishedDate) payload.publishedDate = publishedDate;
    onSubmit(payload);
    if (!editingNews) {
      setTitle(""); setContent(""); setAuthor(""); setCategory(""); setPublishedDate("");
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm transition duration-150 shadow-sm";

  const labelClass = "block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
        <FaNewspaper className="text-indigo-600" />
        {editingNews ? "Update Article" : "Add a News"}
      </h2>

      {/* Title */}
      <div>
        <label className={labelClass}>Title</label>
        <input
          type="text"
          placeholder="Enter article title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className={inputClass}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      {/* Content */}
      <div>
        <label className={labelClass}>Content</label>
        <textarea
          rows="5"
          placeholder="Write article content..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          className={`${inputClass} resize-y`}
        />
        <div className="flex items-center justify-between">
          {errors.content && <p className="mt-1 text-sm text-red-600">{errors.content}</p>}
          <p className="mt-1 text-sm text-slate-400">{content.length}/5000</p>
        </div>
      </div>

      {/* Author / Category / Date */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelClass}>Author</label>
          <div className="relative">
            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder="Author name"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className={`${inputClass} pl-8`}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <div className="relative">
            <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${inputClass} pl-8 appearance-none`}
            >
              <option value="">Select...</option>
              <option value="Workshop">Workshop</option>
              <option value="Event">Event</option>
              <option value="Seminar">Seminar</option>
              <option value="Club-Activity">Club-Activity</option>
              <option value="Competition">Competition</option>
              <option value="Career">Career</option>
            </select>
          </div>
          {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
        </div>

        <div>
          <label className={labelClass}>Publish Date</label>
          <input
            type="date"
            value={publishedDate}
            min={todayLocal}
            max={todayLocal}
            onChange={(e) => setPublishedDate(e.target.value)}
            className={`${inputClass} [color-scheme:light]`}
          />
          {errors.publishedDate && <p className="mt-1 text-sm text-red-600">{errors.publishedDate}</p>}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex-1 py-3 rounded-xl glow-btn font-semibold text-sm shadow-md"
        >
          {editingNews ? "✏️ Update Article" : "📤 Publish Article"}
        </button>
        {editingNews && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold text-sm hover:bg-slate-50 transition shadow-sm"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default NewsForm;
