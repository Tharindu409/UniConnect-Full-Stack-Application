import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import API from "./Auth/axios";

const ProjectCard = ({ project }) => {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [text, setText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likes, setLikes] = useState(project?.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const description = project?.description || "No description available.";
  const shouldShowReadMore = description.length > 140;
  const projectImages = Array.isArray(project?.images) ? project.images.filter(Boolean) : [];
  const rawProjectDate = project?.createdAt || project?.projectDate || project?.uploadDate;
  const formattedProjectDate = rawProjectDate
    ? new Date(rawProjectDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not available";

  const imageUrls = projectImages.map((img) => `http://localhost:5000/uploads/${img}`);
  const hasImages = imageUrls.length > 0;
  const activeImage = hasImages ? imageUrls[Math.min(activeImageIndex, imageUrls.length - 1)] : null;

  useEffect(() => {
    setActiveImageIndex(0);
  }, [project?._id]);

  const fetchComments = async () => {
    if (!project?._id) {
      setComments([]);
      setLoadingComments(false);
      return;
    }

    try {
      const res = await axios.get(`http://localhost:5000/api/projects/comments/${project._id}`);
      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error loading comments:", error);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    let currentUserId = "";

    try {
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      currentUserId = String(storedUser?._id || "");
    } catch {
      currentUserId = "";
    }

    const likedBy = Array.isArray(project?.likedBy) ? project.likedBy : [];

    setHasLiked(
      currentUserId ? likedBy.some((id) => String(id) === currentUserId) : false
    );
    setLikes(project?.likes || 0);
    fetchComments();
  }, [project?._id, project?.likes, project?.likedBy]);

  const handleLike = async () => {
    if (!project?._id) return;

    try {
      setLiking(true);
      const res = await API.put(`/projects/like/${project._id}`);
      setLikes(res.data?.likes || 0);
      setHasLiked(Boolean(res.data?.liked));
    } catch (error) {
      console.error("Error liking project:", error);
      if (error?.response?.status === 401) {
        toast.error("Please login to like this project.");
      } else {
        toast.error("Failed to update like");
      }
    } finally {
      setLiking(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!text.trim()) {
      toast.error("Please type a comment.");
      return;
    }

    try {
      setSubmittingComment(true);
      await API.post(`/projects/comment/${project._id}`, { text });
      setText("");
      await fetchComments();
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      {hasImages && (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
          <img
            src={activeImage}
            alt={project?.projectName || "Project"}
            className="h-full w-full object-cover object-center"
          />

          {imageUrls.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setActiveImageIndex((prev) => (prev === 0 ? imageUrls.length - 1 : prev - 1))
                }
                className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-slate-900/60 text-white transition hover:bg-slate-900/80"
                aria-label="Previous image"
              >
                &#8249;
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveImageIndex((prev) => (prev === imageUrls.length - 1 ? 0 : prev + 1))
                }
                className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-slate-900/60 text-white transition hover:bg-slate-900/80"
                aria-label="Next image"
              >
                &#8250;
              </button>

              <div className="absolute bottom-2 right-2 rounded-md bg-slate-900/65 px-2 py-1 text-xs font-semibold text-white">
                {activeImageIndex + 1}/{imageUrls.length}
              </div>
            </>
          )}
        </div>
      )}

      {imageUrls.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-3 pt-3">
          {imageUrls.map((url, idx) => (
            <button
              key={url}
              type="button"
              onClick={() => setActiveImageIndex(idx)}
              className={`h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${
                activeImageIndex === idx
                  ? "border-indigo-500"
                  : "border-transparent hover:border-slate-300"
              }`}
              aria-label={`Show image ${idx + 1}`}
            >
              <img src={url} alt={`Project image ${idx + 1}`} className="h-full w-full object-cover object-center" />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-900">{project?.projectName || "Untitled Project"}</h3>

          <span className="whitespace-nowrap rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
            {project?.status || "Ongoing"}
          </span>
        </div>

        <p className={`mb-1 text-sm text-slate-600 ${showFullDescription ? "" : "line-clamp-3"}`}>
          {description}
        </p>

        {shouldShowReadMore && (
          <button
            type="button"
            onClick={() => setShowFullDescription((prev) => !prev)}
            className="mb-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            {showFullDescription ? "Read Less" : "Read More"}
          </button>
        )}

        <div className="mb-4 space-y-1 text-sm text-slate-500">
          <p>
            <span className="font-medium text-slate-700">Category:</span> {project?.category || "-"}
          </p>
          <p>
            <span className="font-medium text-slate-700">Club:</span> {project?.clubName || "-"}
          </p>
          <p>
            <span className="font-medium text-slate-700">Upload Date:</span> {formattedProjectDate}
          </p>
        </div>

        <div className="mt-auto mb-4 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={handleLike}
            disabled={liking}
            aria-pressed={hasLiked}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              hasLiked
                ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
            }`}
          >
            <svg className="h-4 w-4" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 9V5a3 3 0 00-6 0v4M5 11h14l-1 8H6l-1-8z" />
            </svg>
            <span>
              {hasLiked ? "Liked" : "Like"} ({likes})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowComments((prev) => !prev)}
            aria-expanded={showComments}
            className={`flex h-11 items-center justify-center gap-2 rounded-xl border text-sm font-semibold transition ${
              showComments
                ? "border-slate-300 bg-slate-100 text-slate-900"
                : "border-slate-200 bg-white text-slate-700 hover:border-indigo-200 hover:text-indigo-700"
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h8M8 14h5m8-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              {showComments ? "Hide" : "Comments"} ({comments.length})
            </span>
          </button>
        </div>

        {showComments && (
          <div className="border-t border-slate-200 pt-4">
            <h4 className="mb-3 text-sm font-semibold text-slate-800">Add Comment</h4>

            <form onSubmit={handleAddComment} className="mb-5 space-y-3">
              <textarea
                placeholder="Write a comment..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows="3"
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />

              <button
                type="submit"
                disabled={submittingComment}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {submittingComment ? "Posting..." : "Post Comment"}
              </button>
            </form>

            <h4 className="mb-3 text-sm font-semibold text-slate-800">Comments</h4>

            {loadingComments ? (
              <p className="text-sm text-slate-400">Loading comments...</p>
            ) : comments.length > 0 ? (
              <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
                {comments.map((comment) => (
                  <div key={comment._id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-medium text-slate-800">{comment.userName || "Anonymous"}</p>
                    <p className="mt-1 text-sm text-slate-600">{comment.text || "No comment text"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No comments yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectCard;