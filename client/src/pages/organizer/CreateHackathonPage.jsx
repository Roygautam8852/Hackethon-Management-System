import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI } from "../../services/apiServices";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePhotograph } from "react-icons/hi";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  theme: z.string().min(2, "Theme is required"),
  mode: z.enum(["online", "offline", "hybrid"]),
  venue: z.string().optional(),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().min(1, "End date required"),
  registrationDeadline: z.string().min(1, "Registration deadline required"),
  prizePool: z.string().optional(),
  maxTeamSize: z.coerce.number().min(1).max(10),
  minTeamSize: z.coerce.number().min(1),
  website: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  tags: z.string().optional(),
});

const CreateHackathonPage = () => {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [rules, setRules] = useState([""]);
  const [criteria, setCriteria] = useState([{ criterion: "", maxMarks: 20, description: "" }]);
  const [activeStep, setActiveStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { mode: "online", maxTeamSize: 4, minTeamSize: 1 } });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) formData.append(k, v);
      });

      const filteredRules = rules.filter(r => r.trim());
      formData.append("rules", JSON.stringify(filteredRules));

      const filteredCriteria = criteria.filter(c => c.criterion.trim());
      formData.append("judgingCriteria", JSON.stringify(filteredCriteria));
      formData.append("isPublished", "true");

      if (banner) formData.append("bannerImage", banner);

      await hackathonAPI.create(formData);
      toast.success("Hackathon created and published! 🎉");
      navigate("/organizer/hackathons");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create hackathon");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = ["Basic Info", "Details & Dates", "Rules & Criteria"];

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-100">Create Hackathon</h1>
          <p className="text-slate-500 text-sm">Fill in the details to launch your hackathon.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <button
                onClick={() => setActiveStep(i + 1)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeStep === i + 1
                    ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                    : activeStep > i + 1
                    ? "text-emerald-400"
                    : "text-slate-500"
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center ${
                  activeStep > i + 1 ? "bg-emerald-500 text-white" : activeStep === i + 1 ? "bg-indigo-500 text-white" : "bg-slate-700 text-slate-400"
                }`}>{activeStep > i + 1 ? "✓" : i + 1}</span>
                {s}
              </button>
              {i < steps.length - 1 && <div className="w-8 h-px bg-slate-800 mx-1" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Basic Info */}
          {activeStep === 1 && (
            <div className="card space-y-5">
              {/* Banner */}
              <div>
                <label className="input-label">Banner Image</label>
                <div
                  className="relative h-40 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900 flex items-center justify-center cursor-pointer hover:border-indigo-500/50 transition-colors overflow-hidden"
                  onClick={() => document.getElementById("banner-input").click()}
                >
                  {bannerPreview ? (
                    <img src={bannerPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                      <HiOutlinePhotograph className="text-3xl text-slate-600 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">Click to upload banner image</p>
                    </div>
                  )}
                </div>
                <input
                  id="banner-input"
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const f = e.target.files[0];
                    if (f) {
                      setBanner(f);
                      setBannerPreview(URL.createObjectURL(f));
                    }
                  }}
                />
              </div>

              {/* Title */}
              <div>
                <label className="input-label">Hackathon Title *</label>
                <input {...register("title")} className={`input-field ${errors.title ? "error" : ""}`} placeholder="e.g. InnovateFest 2025" />
                {errors.title && <p className="input-error">⚠ {errors.title.message}</p>}
              </div>

              {/* Theme */}
              <div>
                <label className="input-label">Theme *</label>
                <input {...register("theme")} className={`input-field ${errors.theme ? "error" : ""}`} placeholder="e.g. AI for Social Good" />
                {errors.theme && <p className="input-error">⚠ {errors.theme.message}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="input-label">Description *</label>
                <textarea
                  {...register("description")}
                  rows={5}
                  className={`input-field resize-none ${errors.description ? "error" : ""}`}
                  placeholder="Describe your hackathon, its goals, and what participants can expect..."
                />
                {errors.description && <p className="input-error">⚠ {errors.description.message}</p>}
              </div>

              <button type="button" onClick={() => setActiveStep(2)} className="btn-primary">
                Next: Details →
              </button>
            </div>
          )}

          {/* Step 2: Details & Dates */}
          {activeStep === 2 && (
            <div className="card space-y-5">
              {/* Mode */}
              <div>
                <label className="input-label">Mode *</label>
                <div className="grid grid-cols-3 gap-2">
                  {["online", "offline", "hybrid"].map(m => (
                    <label key={m} className="cursor-pointer">
                      <input type="radio" value={m} {...register("mode")} className="hidden" />
                      <div className="border border-slate-700 rounded-lg px-3 py-2 text-center text-sm capitalize text-slate-400 hover:border-indigo-500/50 cursor-pointer">
                        {m}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="input-label">Venue / Location</label>
                <input {...register("venue")} className="input-field" placeholder="e.g. Mumbai, IIT Campus / Online via Discord" />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Start Date *</label>
                  <input type="date" {...register("startDate")} className={`input-field ${errors.startDate ? "error" : ""}`} />
                  {errors.startDate && <p className="input-error">⚠ {errors.startDate.message}</p>}
                </div>
                <div>
                  <label className="input-label">End Date *</label>
                  <input type="date" {...register("endDate")} className={`input-field ${errors.endDate ? "error" : ""}`} />
                  {errors.endDate && <p className="input-error">⚠ {errors.endDate.message}</p>}
                </div>
              </div>

              <div>
                <label className="input-label">Registration Deadline *</label>
                <input type="date" {...register("registrationDeadline")} className={`input-field ${errors.registrationDeadline ? "error" : ""}`} />
                {errors.registrationDeadline && <p className="input-error">⚠ {errors.registrationDeadline.message}</p>}
              </div>

              {/* Team size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Min Team Size</label>
                  <input type="number" {...register("minTeamSize")} min={1} max={10} className="input-field" />
                </div>
                <div>
                  <label className="input-label">Max Team Size</label>
                  <input type="number" {...register("maxTeamSize")} min={1} max={10} className="input-field" />
                </div>
              </div>

              {/* Prize */}
              <div>
                <label className="input-label">Prize Pool</label>
                <input {...register("prizePool")} className="input-field" placeholder="e.g. ₹1,00,000 / $5000" />
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Website</label>
                  <input {...register("website")} className="input-field" placeholder="https://..." />
                </div>
                <div>
                  <label className="input-label">Contact Email</label>
                  <input {...register("contactEmail")} type="email" className="input-field" placeholder="organizer@email.com" />
                </div>
              </div>

              <div>
                <label className="input-label">Tags (comma separated)</label>
                <input {...register("tags")} className="input-field" placeholder="ai, machine-learning, web3" />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setActiveStep(1)} className="btn-secondary">← Back</button>
                <button type="button" onClick={() => setActiveStep(3)} className="btn-primary">Next: Rules →</button>
              </div>
            </div>
          )}

          {/* Step 3: Rules & Judging Criteria */}
          {activeStep === 3 && (
            <div className="space-y-5">
              {/* Rules */}
              <div className="card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-200">Rules</h3>
                  <button type="button" onClick={() => setRules([...rules, ""])} className="btn-ghost btn-sm">
                    <HiOutlinePlus /> Add Rule
                  </button>
                </div>
                {rules.map((r, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="w-6 text-center text-slate-500 text-sm pt-2.5">{i + 1}.</span>
                    <input
                      value={r}
                      onChange={e => {
                        const updated = [...rules];
                        updated[i] = e.target.value;
                        setRules(updated);
                      }}
                      placeholder={`Rule ${i + 1}`}
                      className="input-field flex-1"
                    />
                    {rules.length > 1 && (
                      <button type="button" onClick={() => setRules(rules.filter((_, idx) => idx !== i))} className="btn-ghost btn-sm text-red-400">
                        <HiOutlineTrash />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Judging Criteria */}
              <div className="card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-200">Judging Criteria</h3>
                  <button
                    type="button"
                    onClick={() => setCriteria([...criteria, { criterion: "", maxMarks: 20, description: "" }])}
                    className="btn-ghost btn-sm"
                  >
                    <HiOutlinePlus /> Add Criterion
                  </button>
                </div>
                {criteria.map((c, i) => (
                  <div key={i} className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex gap-2">
                      <input
                        value={c.criterion}
                        onChange={e => {
                          const u = [...criteria]; u[i].criterion = e.target.value; setCriteria(u);
                        }}
                        placeholder="e.g. Innovation"
                        className="input-field flex-1"
                      />
                      <div className="w-24">
                        <input
                          type="number"
                          value={c.maxMarks}
                          onChange={e => {
                            const u = [...criteria]; u[i].maxMarks = Number(e.target.value); setCriteria(u);
                          }}
                          min={1}
                          className="input-field"
                          placeholder="Max pts"
                        />
                      </div>
                      {criteria.length > 1 && (
                        <button type="button" onClick={() => setCriteria(criteria.filter((_, idx) => idx !== i))} className="btn-ghost btn-sm text-red-400">
                          <HiOutlineTrash />
                        </button>
                      )}
                    </div>
                    <input
                      value={c.description}
                      onChange={e => {
                        const u = [...criteria]; u[i].description = e.target.value; setCriteria(u);
                      }}
                      placeholder="Optional description..."
                      className="input-field text-xs"
                    />
                  </div>
                ))}
                <div className="text-right text-sm text-slate-400">
                  Total: {criteria.reduce((s, c) => s + (c.maxMarks || 0), 0)} pts
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setActiveStep(2)} className="btn-secondary">← Back</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</>
                    : "🚀 Create & Publish Hackathon"
                  }
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateHackathonPage;
