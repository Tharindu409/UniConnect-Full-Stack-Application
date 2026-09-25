import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getComments,
  deleteComment,
} from "../../api/projectApi";
import AdminPagesTopBar from "../AdminPagesTopBar";
import toast from 'react-hot-toast';

export default function UploadProject() {
  const navigate = useNavigate();
  const [expandedProjects, setExpandedProjects] = useState([]);
  const today = new Date();
  const todayLocal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const initialForm = {
    projectName: "",
    description: "",
    category: "",
    clubName: "",
    projectDate: "",
    status: "",
  };

  const PREVIEW_LENGTH = 250;

  const toggleExpanded = (id) => {
    setExpandedProjects((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  };

  const [view, setView] = useState('list'); // 'list' or 'form'
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([null, null, null]);
  const [existingImages, setExistingImages] = useState([]); // track images on server
  const [errors, setErrors] = useState({});
  const [projects, setProjects] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [commentsModalProject, setCommentsModalProject] = useState(null);
  const [modalComments, setModalComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to load projects", err);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(initialForm);
    setImages([null, null, null]);
    setExistingImages([]);
    setEditingId(null);
    setErrors({});
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    // client-side validation
    const errs = {};
    if (!form.projectName || form.projectName.trim().length < 5) errs.projectName = 'Please enter a project name (min 5 characters).';
    if (!form.description || form.description.trim().length < 20) errs.description = 'Please provide a description (min 20 characters).';
    if (form.description && form.description.length > 5000) errs.description = 'Description must be under 5000 characters.';
    if (!form.category || form.category.trim().length === 0) errs.category = 'Please enter a category.';
    if (!form.clubName || form.clubName.trim().length === 0) errs.clubName = 'Please enter the club name.';
    if (!form.projectDate) errs.projectDate = 'Please select the project date.';
    else if (form.projectDate !== todayLocal) errs.projectDate = 'Project date must be today.';
    if (!form.status) errs.status = 'Please select a project status.';
    // images: when creating require at least 1 image; when editing allow none
    const newImagesCount = images.filter(Boolean).length;
    const existingCount = existingImages.filter(Boolean).length;
    if (!editingId && newImagesCount + existingCount === 0) errs.images = 'Please upload at least one image (max 3).';
    if (images.filter(Boolean).length + existingCount > 3) errs.images = 'Maximum 3 images allowed.';

    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    try {
      if (editingId) {
        const selectedFiles = images.filter(Boolean);
        const keptExistingImages = existingImages.filter(Boolean);

        const data = new FormData();
        Object.keys(form).forEach((key) => data.append(key, form[key]));
        data.append("existingImages", JSON.stringify(keptExistingImages));
        selectedFiles.forEach((img) => data.append("images", img));

        await updateProject(editingId, data);
        toast.success('Project updated');
      } else {
        const data = new FormData();
        Object.keys(form).forEach((key) => data.append(key, form[key]));
        images.filter(Boolean).forEach((img) => data.append("images", img));
        await createProject(data);
        toast.success('Project published successfully');
      }
      resetForm();
      setView('list');
      fetchProjects();
    } catch (error) {
      console.error("Submit error", error);
      toast.error(error?.response?.data?.message || 'Failed to save project');
    }
  };

  const startEdit = (project) => {
    setView('form');
    setEditingId(project._id);
    setForm({
      projectName: project.projectName || "",
      description: project.description || "",
      category: project.category || "",
      clubName: project.clubName || "",
      projectDate: project.projectDate
        ? new Date(project.projectDate).toISOString().substring(0, 10)
        : "",
      status: project.status || "",
    });
    setExistingImages([
      project?.images?.[0] || null,
      project?.images?.[1] || null,
      project?.images?.[2] || null,
    ]);
    setImages([null, null, null]);
  };

  const handlePickImage = (idx, file) => {
    if (!file) return;

    const newImgs = [...images];
    newImgs[idx] = file;
    setImages(newImgs);

    if (editingId) {
      const updatedExisting = [...existingImages];
      updatedExisting[idx] = null;
      setExistingImages(updatedExisting);
    }
  };

  const handleRemoveImage = (idx) => {
    const newImgs = [...images];
    newImgs[idx] = null;
    setImages(newImgs);

    if (editingId) {
      const updatedExisting = [...existingImages];
      updatedExisting[idx] = null;
      setExistingImages(updatedExisting);
    }
  };

  const openComments = async (projectId) => {
    try {
      setCommentsLoading(true);
      setCommentsModalProject(projectId);
      const res = await getComments(projectId);
      setModalComments(res.data || []);
    } catch (err) {
      console.error("Failed to load comments", err);
      toast.error('Failed to load comments');
      setModalComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const closeComments = () => {
    setCommentsModalProject(null);
    setModalComments([]);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteComment(commentId);
      if (commentsModalProject) {
        const res = await getComments(commentsModalProject);
        setModalComments(res.data || []);
      }
    } catch (err) {
      console.error("Failed to delete comment", err);
      toast.error(err?.response?.data?.message || 'Failed to delete comment');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteProject(id);
        fetchProjects();
        toast.success('Project deleted');
      } catch (err) {
        console.error("Delete failed", err);
        toast.error(err?.response?.data?.message || 'Failed to delete project');
      }
    }
  };

  const handleCancel = () => {
    resetForm();
    setView('list');
  };

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm transition shadow-sm";
  const labelClass = "block mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider";

  // Stats calculation
  const totalProjects = projects.length;
  const totalLikes = projects.reduce((acc, curr) => acc + (curr.likes || 0), 0);
  const activeProjects = projects.filter(p => p.status === 'Ongoing').length;

  return (
    <div className="flex min-h-screen bg-slate-50" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8">
          <AdminPagesTopBar
            title="Admin Project Control Panel"
            subtitle="Upload, edit, and moderate student projects."
          />

          {view === 'list' ? (
            <>
              {/* ── ACTIONS BAR ── */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manage Projects</h2>
                 
                </div>
                <button 
                  onClick={() => { resetForm(); setView('form'); }} 
                  className="group flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all"
                >
                  <span className="text-lg group-hover:rotate-90 transition-transform duration-300">＋</span>
                  Upload Project
                </button>
              </div>

              {/* ── STATS OVERVIEW ── */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-2xl">🚀</div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Projects</p>
                    <p className="text-2xl font-black text-slate-800">{totalProjects}</p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-2xl">❤️</div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Likes</p>
                    <p className="text-2xl font-black text-slate-800">{totalLikes}</p>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-2xl">⚡</div>
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Ongoing</p>
                    <p className="text-2xl font-black text-slate-800">{activeProjects}</p>
                  </div>
                </div>
              </div>

              {/* ── LIST CONTAINER ── */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <span>📑</span> Project List
                  </h3>
                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-md border border-slate-200">
                    {projects.length} Entries
                  </span>
                </div>
            
                <div className="p-6">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-500 animate-spin mb-4" />
                      <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Content...</p>
                    </div>
                  ) : projects.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-3 grayscale opacity-30">🚀</div>
                      <p className="text-slate-500 font-medium">No projects uploaded yet.</p>
                      <button onClick={() => setView('form')} className="text-indigo-600 text-sm font-bold mt-2 hover:underline">Get started now</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 2xl:grid-cols-2 gap-5">
                      {projects.map((p) => {
                        const imageUrls = Array.isArray(p.images)
                          ? p.images
                              .filter(Boolean)
                              .map((img) => `http://localhost:5000/uploads/${img}`)
                          : [];

                        return (
                        <div key={p._id} className="bg-white rounded-xl p-0 min-h-[220px] hover:shadow-lg transition-all duration-300 border border-slate-100 overflow-hidden group">
                          <div className="flex flex-col sm:flex-row h-full">
                            
                            {/* Thumbnail section */}
                            <div className="w-full sm:w-48 h-40 sm:h-40 bg-slate-100 flex-shrink-0 relative overflow-hidden">
                              {imageUrls.length > 0 ? (
                                <div className={`grid w-full h-full gap-1 p-1 ${imageUrls.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                                  {imageUrls.slice(0, 3).map((url, idx) => (
                                    <div
                                      key={`${p._id}-img-${idx}`}
                                      className={`relative overflow-hidden rounded-md ${imageUrls.length >= 3 && idx === 0 ? "row-span-2" : ""}`}
                                    >
                                      <img
                                        src={url}
                                        alt={`project-${idx + 1}`}
                                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                      />
                                      {imageUrls.length > 3 && idx === 2 && (
                                        <div className="absolute inset-0 bg-slate-900/55 text-white text-xs font-bold flex items-center justify-center">
                                          +{imageUrls.length - 3}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 text-2xl font-bold">IT</div>
                              )}
                            </div>

                            {/* Content section */}
                            <div className="flex-1 min-w-0 p-6 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between gap-4 mb-2 min-w-0">
                                  <h3 className="min-w-0 font-extrabold text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors uppercase tracking-tight line-clamp-1 break-words">
                                    {p.projectName}
                                  </h3>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                    p.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    p.status === 'Ongoing' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-sky-50 text-sky-600 border-sky-100'
                                  }`}>
                                    {p.status || 'Planned'}
                                  </span>
                                </div>
                                
                                {
                                  (() => {
                                    const desc = p.description || '';
                                    const isLong = desc.length > PREVIEW_LENGTH;
                                    const isExpanded = expandedProjects.includes(p._id);
                                    return (
                                      <div>
                                        <p className="text-slate-500 text-sm mb-3 leading-relaxed font-medium break-words overflow-hidden">
                                          {isLong && !isExpanded ? `${desc.slice(0, PREVIEW_LENGTH)}...` : desc}
                                        </p>
                                        {isLong && (
                                          <button onClick={() => toggleExpanded(p._id)} className="text-xs text-indigo-600 font-semibold hover:underline">
                                            {isExpanded ? 'Show less' : 'Read more'}
                                          </button>
                                        )}
                                      </div>
                                    );
                                  })()
                                }
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-50">
                                <div className="flex items-center gap-3">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold bg-slate-50 px-2 py-1 rounded-lg">
                                    <span className="text-sky-500">📎</span> {p.category || 'General'}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                                    <span className="text-rose-400">❤️</span> {p.likes || 0}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => startEdit(p)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                    title="Edit Project"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => openComments(p._id)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-all shadow-sm"
                                    title="Manage Comments"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDelete(p._id)}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm"
                                    title="Delete Project"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            /* ── FORM PANEL (Full Width) ── */
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={handleCancel} className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition shadow-sm">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                </button>

                <div>
                  <h2 className="text-2xl font-bold text-slate-800">{editingId ? "Edit Project" : "New Project"}</h2>
                  <p className="text-slate-500 text-xs">Fill in the details below to publish.</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <form onSubmit={submit} className="p-8 space-y-6">
                  
                  <div>
                    <label className={labelClass}>Project Name</label>
                    <input
                      type="text"
                      placeholder="E.g. Smart Library System"
                      value={form.projectName}
                      onChange={(e) => updateField("projectName", e.target.value)}
                      required
                      className={inputClass}
                    />
                    {errors.projectName && <p className="mt-1 text-sm text-red-600">{errors.projectName}</p>}
                  </div>

                  <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                      rows="6"
                      placeholder="Describe your project..."
                      value={form.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      required
                      className={`${inputClass} resize-y`}
                    />
                    <div className="flex items-center justify-between">
                      {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
                      <p className="mt-1 text-sm text-slate-400">{form.description.length}/5000</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Category</label>
                      <input
                        type="text"
                        placeholder="E.g. Environment, Education, Health"
                        value={form.category}
                        onChange={(e) => updateField("category", e.target.value)}
                        className={inputClass}
                      />
                      {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Club Name</label>
                      <input
                        type="text"
                        placeholder="E.g. LEO Club"
                        value={form.clubName}
                        onChange={(e) => updateField("clubName", e.target.value)}
                        className={inputClass}
                      />
                      {errors.clubName && <p className="mt-1 text-sm text-red-600">{errors.clubName}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Project Post Upload Date</label>
                      <input
                        type="date"
                        value={form.projectDate}
                        min={todayLocal}
                        max={todayLocal}
                        onChange={(e) => updateField("projectDate", e.target.value)}
                        className={`${inputClass} [color-scheme:light]`}
                      />
                      {errors.projectDate && <p className="mt-1 text-sm text-red-600">{errors.projectDate}</p>}
                    </div>
                    <div>
                      <label className={labelClass}>Status</label>
                      <select
                        value={form.status}
                        onChange={(e) => updateField("status", e.target.value)}
                        required
                        className={`${inputClass} appearance-none`}
                      >
                        <option value="">Select status</option>
                        <option value="Planned">Planned</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                      </select>
                      {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
                    </div>
                  </div>

                  {/* Images Preview / Selector */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <label className={labelClass}>
                      {editingId ? "Project Images (Existing & New)" : "Project Images (Max 3)"}
                    </label>
                    <div className="flex gap-4 mt-3">
                      {[0, 1, 2].map((idx) => (
                        <div key={idx} className="relative">
                        <div 
                          className="w-28 h-28 rounded-xl bg-white border border-slate-200 border-dashed flex items-center justify-center relative hover:bg-slate-50 transition cursor-pointer overflow-hidden shadow-sm" 
                          onClick={() => document.getElementById(`img-input-${idx}`).click()}
                        >
                          {/* Priority: New selected image blob > Existing image URL > Placeholder */}
                          {images[idx] ? (
                            <div className="relative w-full h-full">
                              <img
                                src={URL.createObjectURL(images[idx])}
                                alt="preview"
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[8px] font-bold px-1 rounded-bl">NEW</div>
                            </div>
                          ) : existingImages[idx] ? (
                            <div className="relative w-full h-full">
                              <img
                                src={`http://localhost:5000/uploads/${existingImages[idx]}`}
                                alt="existing"
                                className="w-full h-full object-cover opacity-80"
                              />
                              <div className="absolute top-0 right-0 bg-slate-500 text-white text-[8px] font-bold px-1 rounded-bl">OLD</div>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-3xl text-slate-200 leading-none">+</span>
                              <span className="text-[10px] text-slate-400 font-medium uppercase">Image {idx + 1}</span>
                            </div>
                          )}
                          
                          <input
                            id={`img-input-${idx}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              handlePickImage(idx, file);
                              e.target.value = "";
                            }}
                          />
                        </div>

                        {(images[idx] || existingImages[idx]) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveImage(idx);
                            }}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 text-white text-xs font-bold shadow hover:bg-rose-600"
                            title="Remove image"
                          >
                            ×
                          </button>
                        )}
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-400">
                      Click a slot to choose a photo. Use × to remove a selected photo.
                    </p>
                    {errors.images && <p className="mt-2 text-sm text-red-600">{errors.images}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <button type="submit" className="flex-1 py-3.5 rounded-xl glow-btn font-bold text-sm shadow-md">
                      {editingId ? "Save Changes" : "🚀 Publish Project"}
                    </button>
                    <button type="button" onClick={handleCancel} className="px-6 py-3.5 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold text-sm hover:bg-slate-50 transition shadow-sm">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ── COMMENTS MODAL ─────────────────────────────── */}
      {commentsModalProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col max-h-[85vh] border border-slate-100">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                  <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-lg shadow-inner">💬</span>
                  Moderation
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-13">Manage Project Feedback</p>
              </div>
              <button
                onClick={closeComments}
                className="w-10 h-10 flex items-center justify-center rounded-2xl text-slate-300 hover:bg-slate-100 hover:text-slate-600 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto bg-slate-50/30">
              {commentsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                  <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Loading Feed...</p>
                </div>
              ) : modalComments.length === 0 ? (
                <div className="text-center py-20">
                  <div className="text-4xl mb-4 grayscale opacity-20">💬</div>
                  <p className="text-slate-400 text-sm font-semibold italic">Silence is golden. No comments found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modalComments.map((c) => (
                    <div key={c._id} className="p-4 bg-white border border-slate-200/60 rounded-2xl shadow-sm relative group hover:border-indigo-200 transition-all duration-300">
                      <div className="flex justify-between items-center mb-2 pr-8">
                        <div className="flex items-center gap-2">
                           <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-[10px] font-black uppercase">
                             {(c.userName && c.userName.length > 0) ? c.userName.charAt(0) : "?"}
                           </div>
                           <span className="font-extrabold text-slate-800 text-xs tracking-tight">{c.userName || 'Anonymous'}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold">
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-medium pl-9">{c.text}</p>
                      
                      {/* Delete comment btn */}
                      <button
                        onClick={() => handleDeleteComment(c._id)}
                        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg bg-rose-50 text-rose-400 hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                        title="Delete comment"
                      >
                        <svg className="w-3.3 h-3.3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex justify-end">
              <button
                onClick={closeComments}
                className="px-8 py-3 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-lg"
              >
                Close View
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}