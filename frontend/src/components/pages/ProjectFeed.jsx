import { useEffect, useState } from "react";
import { getProjects } from "../../api/projectApi";
import ProjectCard from "../ProjectCard";
import { useNavigate } from "react-router-dom";

export default function ProjectFeed() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.projectName?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.clubName?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "All" ? true : p.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen pb-20 bg-slate-50">
      <div className="relative py-8 px-4 text-center overflow-hidden border-b border-slate-200 bg-white">
        <div className="absolute top-0 left-1/3 w-80 h-80 bg-purple-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-sky-100/50 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-4">
            Project <span className="text-indigo-600">Feed</span>
          </h1>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">
            Explore innovative projects from our members. Like, comment, and get inspired.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-10">
        <div className="relative mb-8">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 text-sm transition shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {["All", "Planned", "Ongoing", "Completed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-sm rounded-full font-medium ${
                statusFilter === s
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center items-center py-24">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        )}

        {!loading && (
          <p className="text-slate-500 text-sm mb-5">
            <span className="text-indigo-600 font-medium">{filtered.length}</span> projects found
          </p>
        )}

        {!loading && filtered.length === 0 && (
          <div className="p-16 text-center bg-white shadow-sm rounded-2xl border border-slate-200">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-slate-800 font-semibold text-xl mb-2">No Projects Yet</h2>
            <p className="text-slate-500 mb-6">
              Be the first to share a project with the community!
            </p>
            <button
              onClick={() => navigate("/upload-project")}
              className="px-8 py-3 rounded-xl font-semibold shadow-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Upload Now
            </button>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            {filtered.map((p) => (
              <ProjectCard key={p._id} project={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}