import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { reviewAPI } from "../../services/apiServices";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { HiOutlineClipboardList, HiOutlineCheckCircle, HiOutlinePencilAlt } from "react-icons/hi";

const JudgeCompletedPage = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewAPI.getMy()
      .then(r => setReviews(r.data.data.reviews || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b border-zinc-800 pb-4">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <HiOutlineClipboardList className="text-zinc-400" /> Completed Reviews
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            All team project submissions you have evaluated · {reviews.length} completed
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-16 flex justify-center"><div className="spinner" /></div>
        ) : reviews.length === 0 ? (
          <div className="empty-state py-16 card">
            <HiOutlineClipboardList className="text-4xl text-zinc-600" />
            <p className="text-zinc-400 text-sm mt-2">No completed reviews yet</p>
            <Link to="/judge/projects" className="btn-primary btn-sm mt-3">Review Projects →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile Stacked Responsive Cards (< md) */}
            <div className="grid grid-cols-1 gap-3.5 md:hidden">
              {reviews.map(r => (
                <div key={r._id} className="card p-4 space-y-3 border-zinc-800 bg-[#0d0d0f] rounded-2xl shadow-xl">
                  <div className="flex items-start justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                    <div>
                      <h3 className="text-base font-extrabold text-white">{r.submission?.projectName || "Unnamed Project"}</h3>
                      <p className="text-xs text-indigo-400 font-semibold mt-0.5">{r.hackathon?.title || "Hackathon Event"}</p>
                    </div>
                    <span className="badge badge-success text-xs font-black px-2.5 py-1 flex-shrink-0">
                      {r.totalScore ?? 0} pts
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-zinc-400">
                    <div className="flex items-center justify-between">
                      <span>Evaluated On:</span>
                      <span className="text-zinc-300 font-semibold">
                        {r.createdAt ? format(new Date(r.createdAt), "MMM d, yyyy") : "Recently"}
                      </span>
                    </div>
                    {r.feedback && (
                      <div className="pt-1 text-zinc-300 italic text-[11px] bg-zinc-900/70 p-2.5 rounded-xl border border-zinc-800/80">
                        "{r.feedback}"
                      </div>
                    )}
                  </div>

                  <div className="pt-1">
                    <Link
                      to={`/judge/projects/${r.submission?._id}/review?hackathon=${r.hackathon?._id || ""}`}
                      className="btn-secondary text-xs py-2.5 w-full flex items-center justify-center gap-1.5 font-bold rounded-xl cursor-pointer"
                    >
                      <HiOutlinePencilAlt className="text-indigo-400 text-sm" /> View / Edit Evaluation
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block card p-0 overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Hackathon</th>
                    <th>Total Score</th>
                    <th>Reviewed</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map(r => (
                    <tr key={r._id}>
                      <td className="font-semibold text-white">
                        {r.submission?.projectName || "—"}
                      </td>
                      <td className="text-zinc-400 text-sm">
                        {r.hackathon?.title || "—"}
                      </td>
                      <td>
                        <span className="text-emerald-400 font-bold text-sm">{r.totalScore ?? "—"}</span>
                        <span className="text-zinc-500 text-xs ml-1">pts</span>
                      </td>
                      <td className="text-zinc-500 text-xs">
                        {r.createdAt ? format(new Date(r.createdAt), "MMM d, yyyy") : "—"}
                      </td>
                      <td>
                        <Link
                          to={`/judge/projects/${r.submission?._id}/review?hackathon=${r.hackathon?._id || ""}`}
                          className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <HiOutlineCheckCircle className="text-sm" /> View / Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JudgeCompletedPage;
