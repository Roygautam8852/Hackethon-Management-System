import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { reviewAPI } from "../../services/apiServices";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { HiOutlineClipboardList, HiOutlineCheckCircle } from "react-icons/hi";

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
      <div className="space-y-6 max-w-4xl">
        <div className="border-b border-zinc-800 pb-4">
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <HiOutlineClipboardList className="text-zinc-400" /> Completed Reviews
          </h1>
          <p className="text-zinc-400 text-xs mt-1">All submissions you have already scored</p>
        </div>

        {loading ? (
          <div className="py-16 flex justify-center"><div className="spinner" /></div>
        ) : reviews.length === 0 ? (
          <div className="empty-state py-16 card">
            <HiOutlineClipboardList className="text-4xl text-zinc-600" />
            <p className="text-zinc-400 text-sm mt-2">No completed reviews yet</p>
            <Link to="/judge/projects" className="btn-primary btn-sm mt-3">Review Projects →</Link>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="data-table">
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
                        className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-1"
                      >
                        <HiOutlineCheckCircle /> View / Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JudgeCompletedPage;
