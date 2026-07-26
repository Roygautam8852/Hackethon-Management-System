import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { authAPI } from "../../services/apiServices";
import toast from "react-hot-toast";
import {
  HiOutlineMail, HiOutlineLockClosed, HiOutlineUser,
  HiOutlineEye, HiOutlineEyeOff, HiOutlineShieldCheck,
  HiOutlineUserGroup, HiArrowRight,
} from "react-icons/hi";
import { RiRocketLine, RiTrophyLine } from "react-icons/ri";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["participant", "organizer", "judge"]),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const roles = [
  { value: "participant", label: "Participant" },
  { value: "organizer", label: "Organizer" },
  { value: "judge", label: "Judge" },
];

const SignupPage = () => {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: "participant" },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const { confirmPassword, ...payload } = data;
      await authAPI.signup(payload);
      toast.success("Account created successfully! Please sign in with your email & password. 🎉");
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-[#050505] flex flex-col lg:flex-row">
      {/* Left side — Product Branding */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-[#0e0e10] via-[#09090b] to-[#050505] p-8 flex-col justify-between border-r border-[#27272a]">
        <div className="blob w-80 h-80 bg-white/10 -top-20 -left-20" />
        <div className="blob w-72 h-72 bg-zinc-400/8 bottom-10 right-10" style={{ animationDelay: "4s" }} />

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-lg shadow-white/10">
            <RiRocketLine className="text-black text-lg font-bold" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-white">
            Hack<span className="text-zinc-400">lytics</span>
          </span>
        </Link>

        {/* Center Feature Callout */}
        <div className="relative z-10 max-w-md my-auto py-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-300 text-[11px] font-semibold uppercase tracking-wider mb-4">
            ✨ Production-Ready SaaS
          </div>
          <h2 className="text-2xl lg:text-3xl font-extrabold text-white leading-tight mb-3">
            Transform How Your College Runs <span className="gradient-text">Hackathons</span>
          </h2>
          <p className="text-zinc-400 text-xs leading-relaxed mb-6">
            Join thousands of developers, organizers, and judges in a centralized ecosystem designed for seamless team formation, submission tracking, and automated live leaderboards.
          </p>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="card-glass p-2.5 text-center border-zinc-800">
              <HiOutlineUserGroup className="text-lg text-white mx-auto mb-0.5" />
              <p className="text-[11px] text-zinc-400">Team Mgmt</p>
              <p className="text-[11px] font-semibold text-zinc-200 mt-0.5">Automated</p>
            </div>
            <div className="card-glass p-2.5 text-center border-zinc-800">
              <HiOutlineShieldCheck className="text-lg text-zinc-300 mx-auto mb-0.5" />
              <p className="text-[11px] text-zinc-400">Role Security</p>
              <p className="text-[11px] font-semibold text-zinc-200 mt-0.5">JWT & RBAC</p>
            </div>
            <div className="card-glass p-2.5 text-center border-zinc-800">
              <RiTrophyLine className="text-lg text-white mx-auto mb-0.5" />
              <p className="text-[11px] text-zinc-400">Leaderboard</p>
              <p className="text-[11px] font-semibold text-zinc-200 mt-0.5">Live Scores</p>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-[11px] text-zinc-500">
          © {new Date().getFullYear()} Hacklytics Platform. All rights reserved.
        </div>
      </div>

      {/* Right side — Form (Sleek Vercel Style Inputs & Buttons) */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-sm my-auto py-1"
        >
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
              <RiRocketLine className="text-black text-base font-bold" />
            </div>
            <span className="font-extrabold text-lg text-white">Hack<span className="text-zinc-400">lytics</span></span>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">Create Account</h1>
              <p className="text-zinc-400 text-xs mt-0.5">Select role and sign up.</p>
            </div>
            <Link to="/" className="text-xs font-semibold text-zinc-300 hover:text-white flex items-center gap-1 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-1 rounded-lg transition-all">
              ← Home
            </Link>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
            {/* Role Tab Selector */}
            <div>
              <label className="input-label text-[11px] mb-1">I want to join as</label>
              <div className="grid grid-cols-3 gap-1 p-1 bg-[#121215] border border-zinc-800 rounded-xl">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setValue("role", r.value)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      selectedRole === r.value
                        ? "bg-white text-black shadow-md font-bold"
                        : "text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="input-label text-[11px] mb-1" htmlFor="signup-name">Full Name</label>
              <div className="relative flex items-center">
                <HiOutlineUser className="absolute left-3 text-zinc-400 text-base pointer-events-none z-10" />
                <input
                  {...register("name")}
                  id="signup-name"
                  placeholder="Gautam Kumar"
                  className={`input-field input-with-icon-left !py-2 !text-xs bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 ${errors.name ? "error" : ""}`}
                />
              </div>
              {errors.name && <p className="input-error text-[10px]">⚠ {errors.name.message}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label className="input-label text-[11px] mb-1" htmlFor="signup-email">Email Address</label>
              <div className="relative flex items-center">
                <HiOutlineMail className="absolute left-3 text-zinc-400 text-base pointer-events-none z-10" />
                <input
                  {...register("email")}
                  type="email"
                  id="signup-email"
                  placeholder="name@college.edu"
                  className={`input-field input-with-icon-left !py-2 !text-xs bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 ${errors.email ? "error" : ""}`}
                />
              </div>
              {errors.email && <p className="input-error text-[10px]">⚠ {errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="input-label text-[11px] mb-1" htmlFor="signup-password">Password</label>
              <div className="relative flex items-center">
                <HiOutlineLockClosed className="absolute left-3 text-zinc-400 text-base pointer-events-none z-10" />
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  id="signup-password"
                  placeholder="Min 6 characters"
                  className={`input-field input-with-icon-left input-with-icon-right !py-2 !text-xs bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 ${errors.password ? "error" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 text-zinc-400 hover:text-zinc-200 z-10"
                >
                  {showPass ? <HiOutlineEyeOff size={16} /> : <HiOutlineEye size={16} />}
                </button>
              </div>
              {errors.password && <p className="input-error text-[10px]">⚠ {errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="input-label text-[11px] mb-1" htmlFor="signup-confirm">Confirm Password</label>
              <div className="relative flex items-center">
                <HiOutlineLockClosed className="absolute left-3 text-zinc-400 text-base pointer-events-none z-10" />
                <input
                  {...register("confirmPassword")}
                  type={showPass ? "text" : "password"}
                  id="signup-confirm"
                  placeholder="Re-enter password"
                  className={`input-field input-with-icon-left !py-2 !text-xs bg-[#0d0d0f] border-zinc-800 focus:border-zinc-500 ${errors.confirmPassword ? "error" : ""}`}
                />
              </div>
              {errors.confirmPassword && <p className="input-error text-[10px]">⚠ {errors.confirmPassword.message}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="signup-submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-white text-black font-extrabold text-xs rounded-xl shadow-lg shadow-white/10 hover:bg-zinc-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account <HiArrowRight className="text-sm" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-zinc-400 mt-3">
            Already registered?{" "}
            <Link to="/login" className="text-white hover:text-zinc-200 font-semibold underline underline-offset-4">
              Sign in to your account
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignupPage;
