import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../../components/layout/Navbar";
import { hackathonAPI, registrationAPI, teamAPI } from "../../services/apiServices";
import { useAuth } from "../../context/AuthContext";
import { format, isPast, isFuture } from "date-fns";
import toast from "react-hot-toast";
import {
  HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineUsers,
  HiOutlineCurrencyDollar, HiOutlineGlobe, HiOutlineMail,
  HiOutlineStar, HiOutlineChevronDown, HiOutlineChevronRight,
} from "react-icons/hi";
import { RiTrophyLine } from "react-icons/ri";

const statusColors = {
  upcoming: "badge-info",
  registration_open: "badge-success",
  registration_closed: "badge-danger",
  ongoing: "badge-primary",
  completed: "badge-gray",
};

const HackathonDetailsPage = () => {
  const { id } = useParams();
  const { user, isAuthenticated, isParticipant } = useAuth();
  const navigate = useNavigate();
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [myTeam, setMyTeam] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await hackathonAPI.getById(id);
        setHackathon(res.data.data.hackathon);

        if (isParticipant) {
          try {
            const teamRes = await teamAPI.getMy(id);
            setMyTeam(teamRes.data.data.team);
          } catch (_) {}
        }
      } catch (e) {
        toast.error("Hackathon not found");
        navigate("/hackathons");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, isParticipant, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505]">
        <Navbar />
        <div className="pt-24 max-w-5xl mx-auto px-4 space-y-4">
          <div className="skeleton h-64 rounded-2xl" />
          <div className="skeleton h-8 w-1/2" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
    );
  }

  if (!hackathon) return null;

  const h = hackathon;
  const regDeadlinePast = isPast(new Date(h.registrationDeadline));
  const canRegister = isParticipant && h.registrationOpen && !regDeadlinePast && !myTeam;

  const tabs = ["overview", "rules", "judging", "prizes"];

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />
      <div className="pt-16">
        {/* Banner */}
        <div className="relative h-72 md:h-96 bg-gradient-to-br from-indigo-900/60 to-violet-900/60 overflow-hidden">
          {h.bannerImage ? (
            <img src={h.bannerImage} alt={h.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <RiTrophyLine className="text-8xl text-indigo-300/20" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 max-w-5xl mx-auto px-4 pb-6">
            <div className="flex flex-wrap gap-2 mb-3">
              {(() => {
                const effectiveStatus =
                  regDeadlinePast && h.status === "registration_open"
                    ? "registration_closed"
                    : h.status;
                return (
                  <span className={`badge ${statusColors[effectiveStatus] || "badge-gray"}`}>
                    {effectiveStatus?.replace(/_/g, " ")}
                  </span>
                );
              })()}
              <span className="badge badge-gray capitalize">{h.mode}</span>
              {h.theme && <span className="badge badge-primary">{h.theme}</span>}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white">{h.title}</h1>
            <p className="text-slate-300 text-sm mt-1">
              by <span className="text-indigo-300 font-medium">{h.organizer?.name}</span>
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs */}
              <div className="flex gap-1 border-b border-slate-800">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-sm font-medium capitalize border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-indigo-500 text-indigo-400"
                        : "border-transparent text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "overview" && (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-slate-300 leading-relaxed whitespace-pre-line">{h.description}</p>
                    {h.assignedJudges?.length > 0 && (
                      <div className="mt-6">
                        <h3 className="text-slate-200 font-semibold mb-3">Judges</h3>
                        <div className="flex flex-wrap gap-3">
                          {h.assignedJudges.map(j => (
                            <div key={j._id} className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2">
                              <div className="w-7 h-7 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400">
                                {j.name?.[0]}
                              </div>
                              <span className="text-sm text-slate-300">{j.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "rules" && (
                  <div>
                    {h.rules?.length > 0 ? (
                      <ul className="space-y-3">
                        {h.rules.map((rule, i) => (
                          <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {i + 1}
                            </span>
                            {rule}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="empty-state py-8">No rules specified</div>
                    )}
                  </div>
                )}

                {activeTab === "judging" && (
                  <div>
                    {h.judgingCriteria?.length > 0 ? (
                      <div className="space-y-3">
                        {h.judgingCriteria.map((c, i) => (
                          <div key={i} className="card py-3 px-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-slate-200">{c.criterion}</span>
                              <span className="badge badge-primary">{c.maxMarks} pts</span>
                            </div>
                            {c.description && <p className="text-sm text-slate-400">{c.description}</p>}
                          </div>
                        ))}
                        <div className="flex justify-end">
                          <span className="text-sm text-slate-400 font-medium">
                            Total: {h.judgingCriteria.reduce((s, c) => s + c.maxMarks, 0)} pts
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state py-8">No judging criteria specified</div>
                    )}
                  </div>
                )}

                {activeTab === "prizes" && (
                  <div>
                    {h.prizePool ? (
                      <div className="text-center py-8">
                        <RiTrophyLine className="text-5xl text-yellow-400 mx-auto mb-3" />
                        <p className="text-2xl font-bold gradient-text">{h.prizePool}</p>
                        <p className="text-slate-400 text-sm mt-1">Total Prize Pool</p>
                        {h.winners?.length > 0 && (
                          <div className="mt-6 space-y-3">
                            {h.winners.map(w => (
                              <div key={w.position} className="flex items-center gap-3 justify-center">
                                <span className="badge badge-warning">#{w.position}</span>
                                <span className="text-slate-300">{w.prize}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="empty-state py-8">Prize info not specified</div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Registration CTA */}
              <div className="card">
                <h3 className="font-semibold text-slate-200 mb-4">Registration</h3>
                <div className="space-y-2.5 text-sm mb-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <HiOutlineCalendar className="text-indigo-400 flex-shrink-0" />
                    <span>Deadline: <span className="text-slate-300">{format(new Date(h.registrationDeadline), "MMM d, yyyy")}</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <HiOutlineUsers className="text-indigo-400 flex-shrink-0" />
                    <span>Team: <span className="text-slate-300">{h.minTeamSize}–{h.maxTeamSize} members</span></span>
                  </div>
                  {h.venue && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <HiOutlineLocationMarker className="text-indigo-400 flex-shrink-0" />
                      <span className="text-slate-300">{h.venue}</span>
                    </div>
                  )}
                </div>

                {/* Registration Action Buttons */}
                {!h.registrationOpen || regDeadlinePast ? (
                  <button disabled className="btn-secondary w-full justify-center opacity-50 cursor-not-allowed text-xs font-semibold py-2.5">
                    {regDeadlinePast ? "Registration Closed (Deadline Passed)" : "Registration Closed"}
                  </button>
                ) : !isAuthenticated ? (
                  <Link to="/login" className="btn-primary w-full justify-center text-sm py-2.5">
                    Sign In to Register
                  </Link>
                ) : user?.role === "organizer" && (h.organizer?._id || h.organizer)?.toString() === user?._id?.toString() ? (
                  <Link to={`/organizer/hackathons/${id}`} className="btn-primary w-full justify-center text-sm py-2.5 flex items-center gap-1.5">
                    Manage Hackathon →
                  </Link>
                ) : myTeam ? (
                  <div className="space-y-2">
                    <div className="badge badge-success w-full justify-center py-2 text-xs font-bold">
                      ✓ Registered (Team: {myTeam.name})
                    </div>
                    <Link to={`/leaderboard?hackathon=${id}`} className="btn-secondary btn-sm w-full justify-center">
                      View Leaderboard
                    </Link>
                  </div>
                ) : isParticipant ? (
                  <Link to={`/participant/team?hackathon=${id}`} className="btn-primary w-full justify-center text-sm py-2.5">
                    Create / Join Team
                  </Link>
                ) : (
                  <div className="card-glass p-3 text-center space-y-1">
                    <span className="badge badge-success w-full justify-center py-1.5 text-xs font-bold">
                      Registration Open
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Logged in as {user?.role || "user"}. Only participants can register teams.
                    </p>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="card">
                <h3 className="font-semibold text-slate-200 mb-4">Timeline</h3>
                <div className="space-y-3">
                  {[
                    { label: "Registration Deadline", date: h.registrationDeadline },
                    { label: "Hackathon Start", date: h.startDate },
                    { label: "Hackathon End", date: h.endDate },
                  ].map(e => (
                    <div key={e.label} className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">{e.label}</span>
                      <span className="text-slate-300 font-medium">{format(new Date(e.date), "MMM d, yyyy")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact */}
              {(h.website || h.contactEmail) && (
                <div className="card">
                  <h3 className="font-semibold text-slate-200 mb-3">Contact</h3>
                  {h.website && (
                    <a href={h.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-400 hover:underline mb-2">
                      <HiOutlineGlobe /> {h.website}
                    </a>
                  )}
                  {h.contactEmail && (
                    <a href={`mailto:${h.contactEmail}`} className="flex items-center gap-2 text-sm text-indigo-400 hover:underline">
                      <HiOutlineMail /> {h.contactEmail}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HackathonDetailsPage;
