import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { hackathonAPI } from "../../services/apiServices";
import toast from "react-hot-toast";
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePhotograph } from "react-icons/hi";

const schema = z
  .object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    description: z.string().min(20, "Description must be at least 20 characters"),
    theme: z.string().min(2, "Theme is required"),
    mode: z.enum(["online", "offline", "hybrid"]),
    venue: z.string().optional(),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    registrationDeadline: z.string().min(1, "Registration deadline is required"),
    prizePool: z.string().optional(),
    maxTeamSize: z.coerce.number().min(1, "Max size must be at least 1").max(20, "Max size cannot exceed 20"),
    minTeamSize: z.coerce.number().min(1, "Min size must be at least 1"),
    website: z.string().optional(),
    contactEmail: z.string().email("Invalid email address").or(z.literal("")).optional(),
    tags: z.string().optional(),
  })
  .refine((data) => data.minTeamSize <= data.maxTeamSize, {
    message: "Min team size cannot exceed max team size",
    path: ["minTeamSize"],
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
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { mode: "online", maxTeamSize: 4, minTeamSize: 1 },
  });

  const handleNextStep1 = async () => {
    const isValid = await trigger(["title", "theme", "description"]);
    if (isValid) {
      setActiveStep(2);
    } else {
      toast.error("Please fill in all required fields on Step 1");
    }
  };

  const handleNextStep2 = async () => {
    const isValid = await trigger([
      "mode",
      "startDate",
      "endDate",
      "registrationDeadline",
      "minTeamSize",
      "maxTeamSize",
      "contactEmail",
    ]);
    if (isValid) {
      setActiveStep(3);
    } else {
      toast.error("Please fill in all required fields on Step 2");
    }
  };

  const handleStepClick = async (targetStep) => {
    if (targetStep === activeStep) return;
    if (targetStep > activeStep) {
      if (activeStep === 1 || targetStep >= 2) {
        const step1Valid = await trigger(["title", "theme", "description"]);
        if (!step1Valid) {
          setActiveStep(1);
          toast.error("Please complete Step 1 first");
          return;
        }
      }
      if (targetStep === 3) {
        const step2Valid = await trigger([
          "mode",
          "startDate",
          "endDate",
          "registrationDeadline",
          "minTeamSize",
          "maxTeamSize",
          "contactEmail",
        ]);
        if (!step2Valid) {
          setActiveStep(2);
          toast.error("Please complete Step 2 first");
          return;
        }
      }
    }
    setActiveStep(targetStep);
  };

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) formData.append(k, v);
      });

      const filteredRules = rules.filter((r) => r.trim());
      formData.append("rules", JSON.stringify(filteredRules));

      const filteredCriteria = criteria.filter((c) => c.criterion && c.criterion.trim());
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

  const onError = (formErrors) => {
    console.error("Form Validation Errors:", formErrors);
    const step1Keys = ["title", "theme", "description"];
    const step2Keys = [
      "mode",
      "venue",
      "startDate",
      "endDate",
      "registrationDeadline",
      "minTeamSize",
      "maxTeamSize",
      "prizePool",
      "website",
      "contactEmail",
      "tags",
    ];

    const hasStep1Error = Object.keys(formErrors).some((k) => step1Keys.includes(k));
    const hasStep2Error = Object.keys(formErrors).some((k) => step2Keys.includes(k));

    if (hasStep1Error) {
      setActiveStep(1);
      toast.error("Please fix validation errors in Step 1 (Basic Info)");
    } else if (hasStep2Error) {
      setActiveStep(2);
      toast.error("Please fix validation errors in Step 2 (Details & Dates)");
    } else {
      toast.error("Please fix form validation errors before submitting");
    }
  };

  const steps = ["Basic Info", "Details & Dates", "Rules & Criteria"];
  const currentMode = watch("mode");

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto pb-24 sm:pb-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">Create Hackathon</h1>
          <p className="text-slate-500 text-xs sm:text-sm">Fill in the details to launch your hackathon.</p>
        </div>

        {/* Step indicator - Touch friendly & responsive horizontal scroll */}
        <div className="flex items-center gap-1 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto pb-2 scrollbar-none">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center flex-shrink-0">
              <button
                type="button"
                onClick={() => handleStepClick(i + 1)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeStep === i + 1
                    ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                    : activeStep > i + 1
                    ? "text-emerald-400 hover:text-emerald-300"
                    : "text-slate-500 hover:text-slate-400"
                }`}
              >
                <span
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full text-[10px] sm:text-xs font-bold flex items-center justify-center ${
                    activeStep > i + 1
                      ? "bg-emerald-500 text-white"
                      : activeStep === i + 1
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {activeStep > i + 1 ? "✓" : i + 1}
                </span>
                {s}
              </button>
              {i < steps.length - 1 && <div className="w-4 sm:w-8 h-px bg-slate-800 mx-1 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4 sm:space-y-6">
          {/* Step 1: Basic Info */}
          <div className={activeStep === 1 ? "card space-y-4 sm:space-y-5 p-4 sm:p-6" : "hidden"}>
            {/* Banner */}
            <div>
              <label className="input-label">Banner Image</label>
              <div
                className="relative h-32 sm:h-40 rounded-xl border-2 border-dashed border-slate-700 bg-slate-900 flex items-center justify-center cursor-pointer hover:border-indigo-500/50 transition-colors overflow-hidden"
                onClick={() => document.getElementById("banner-input").click()}
              >
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-3">
                    <HiOutlinePhotograph className="text-2xl sm:text-3xl text-slate-600 mx-auto mb-1" />
                    <p className="text-xs sm:text-sm text-slate-500">Click to upload banner image</p>
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
              <input
                {...register("title")}
                className={`input-field ${errors.title ? "border-red-500 focus:border-red-500" : ""}`}
                placeholder="e.g. InnovateFest 2025"
              />
              {errors.title && <p className="input-error mt-1 text-xs text-red-400">⚠ {errors.title.message}</p>}
            </div>

            {/* Theme */}
            <div>
              <label className="input-label">Theme *</label>
              <input
                {...register("theme")}
                className={`input-field ${errors.theme ? "border-red-500 focus:border-red-500" : ""}`}
                placeholder="e.g. AI for Social Good"
              />
              {errors.theme && <p className="input-error mt-1 text-xs text-red-400">⚠ {errors.theme.message}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="input-label">Description *</label>
              <textarea
                {...register("description")}
                rows={4}
                className={`input-field resize-none ${errors.description ? "border-red-500 focus:border-red-500" : ""}`}
                placeholder="Describe your hackathon, its goals, and what participants can expect..."
              />
              {errors.description && <p className="input-error mt-1 text-xs text-red-400">⚠ {errors.description.message}</p>}
            </div>

            <div className="pt-2 flex justify-end">
              <button type="button" onClick={handleNextStep1} className="btn-primary w-full sm:w-auto justify-center text-xs sm:text-sm py-3 px-5">
                Next: Details →
              </button>
            </div>
          </div>

          {/* Step 2: Details & Dates */}
          <div className={activeStep === 2 ? "card space-y-4 sm:space-y-5 p-4 sm:p-6" : "hidden"}>
            {/* Mode */}
            <div>
              <label className="input-label">Mode *</label>
              <div className="grid grid-cols-3 gap-2">
                {["online", "offline", "hybrid"].map((m) => (
                  <label key={m} className="cursor-pointer">
                    <input type="radio" value={m} {...register("mode")} className="hidden" />
                    <div
                      className={`border rounded-lg px-2 sm:px-3 py-2.5 text-center text-xs sm:text-sm capitalize transition-colors ${
                        currentMode === m
                          ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 font-semibold"
                          : "border-slate-700 text-slate-400 hover:border-indigo-500/50 bg-slate-900/50"
                      }`}
                    >
                      {m}
                    </div>
                  </label>
                ))}
              </div>
              {errors.mode && <p className="input-error mt-1 text-xs text-red-400">⚠ {errors.mode.message}</p>}
            </div>

            {/* Venue */}
            <div>
              <label className="input-label">Venue / Location</label>
              <input {...register("venue")} className="input-field" placeholder="e.g. Mumbai, IIT Campus / Online via Discord" />
            </div>

            {/* Dates - Responsive grid to prevent truncating date strings on mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="input-label">Start Date *</label>
                <input
                  type="date"
                  {...register("startDate")}
                  className={`input-field ${errors.startDate ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.startDate && <p className="input-error mt-1 text-xs text-red-400">⚠ {errors.startDate.message}</p>}
              </div>
              <div>
                <label className="input-label">End Date *</label>
                <input
                  type="date"
                  {...register("endDate")}
                  className={`input-field ${errors.endDate ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.endDate && <p className="input-error mt-1 text-xs text-red-400">⚠ {errors.endDate.message}</p>}
              </div>
            </div>

            <div>
              <label className="input-label">Registration Deadline *</label>
              <input
                type="date"
                {...register("registrationDeadline")}
                className={`input-field ${errors.registrationDeadline ? "border-red-500 focus:border-red-500" : ""}`}
              />
              {errors.registrationDeadline && (
                <p className="input-error mt-1 text-xs text-red-400">⚠ {errors.registrationDeadline.message}</p>
              )}
            </div>

            {/* Team size - Responsive grid */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="input-label">Min Team Size</label>
                <input
                  type="number"
                  {...register("minTeamSize")}
                  min={1}
                  max={20}
                  className={`input-field ${errors.minTeamSize ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.minTeamSize && <p className="input-error mt-1 text-xs text-red-400">⚠ {errors.minTeamSize.message}</p>}
              </div>
              <div>
                <label className="input-label">Max Team Size</label>
                <input
                  type="number"
                  {...register("maxTeamSize")}
                  min={1}
                  max={20}
                  className={`input-field ${errors.maxTeamSize ? "border-red-500 focus:border-red-500" : ""}`}
                />
                {errors.maxTeamSize && <p className="input-error mt-1 text-xs text-red-400">⚠ {errors.maxTeamSize.message}</p>}
              </div>
            </div>

            {/* Prize */}
            <div>
              <label className="input-label">Prize Pool</label>
              <input {...register("prizePool")} className="input-field" placeholder="e.g. ₹1,00,000 / $5000" />
            </div>

            {/* Contact - Responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="input-label">Website</label>
                <input {...register("website")} className="input-field" placeholder="https://..." />
              </div>
              <div>
                <label className="input-label">Contact Email</label>
                <input
                  {...register("contactEmail")}
                  type="email"
                  className={`input-field ${errors.contactEmail ? "border-red-500 focus:border-red-500" : ""}`}
                  placeholder="organizer@email.com"
                />
                {errors.contactEmail && (
                  <p className="input-error mt-1 text-xs text-red-400">⚠ {errors.contactEmail.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="input-label">Tags (comma separated)</label>
              <input {...register("tags")} className="input-field" placeholder="ai, machine-learning, web3" />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
              <button type="button" onClick={() => setActiveStep(1)} className="btn-secondary w-full sm:w-auto justify-center text-xs sm:text-sm py-3 px-5">
                ← Back
              </button>
              <button type="button" onClick={handleNextStep2} className="btn-primary w-full sm:flex-1 justify-center text-xs sm:text-sm py-3 px-5">
                Next: Rules →
              </button>
            </div>
          </div>

          {/* Step 3: Rules & Judging Criteria */}
          <div className={activeStep === 3 ? "space-y-4 sm:space-y-5" : "hidden"}>
            {/* Rules */}
            <div className="card space-y-3 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-200 text-sm sm:text-base">Rules</h3>
                <button type="button" onClick={() => setRules([...rules, ""])} className="btn-ghost btn-sm">
                  <HiOutlinePlus /> Add Rule
                </button>
              </div>
              {rules.map((r, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <span className="w-5 text-center text-slate-500 text-xs sm:text-sm font-semibold">{i + 1}.</span>
                  <input
                    value={r}
                    onChange={(e) => {
                      const updated = [...rules];
                      updated[i] = e.target.value;
                      setRules(updated);
                    }}
                    placeholder={`Rule ${i + 1}`}
                    className="input-field flex-1 text-xs sm:text-sm"
                  />
                  {rules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setRules(rules.filter((_, idx) => idx !== i))}
                      className="btn-ghost btn-sm text-red-400 hover:text-red-300 min-w-[36px] px-2"
                    >
                      <HiOutlineTrash />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Judging Criteria */}
            <div className="card space-y-3 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-200 text-sm sm:text-base">Judging Criteria</h3>
                <button
                  type="button"
                  onClick={() => setCriteria([...criteria, { criterion: "", maxMarks: 20, description: "" }])}
                  className="btn-ghost btn-sm"
                >
                  <HiOutlinePlus /> Add Criterion
                </button>
              </div>
              {criteria.map((c, i) => (
                <div key={i} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex gap-2 items-center">
                    <input
                      value={c.criterion}
                      onChange={(e) => {
                        const u = [...criteria];
                        u[i].criterion = e.target.value;
                        setCriteria(u);
                      }}
                      placeholder="e.g. Innovation"
                      className="input-field flex-1 text-xs sm:text-sm"
                    />
                    <div className="w-20 sm:w-24 flex-shrink-0">
                      <input
                        type="number"
                        value={c.maxMarks}
                        onChange={(e) => {
                          const u = [...criteria];
                          u[i].maxMarks = Number(e.target.value);
                          setCriteria(u);
                        }}
                        min={1}
                        className="input-field text-xs sm:text-sm px-2 text-center"
                        placeholder="Pts"
                      />
                    </div>
                    {criteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setCriteria(criteria.filter((_, idx) => idx !== i))}
                        className="btn-ghost btn-sm text-red-400 hover:text-red-300 min-w-[36px] px-2"
                      >
                        <HiOutlineTrash />
                      </button>
                    )}
                  </div>
                  <input
                    value={c.description}
                    onChange={(e) => {
                      const u = [...criteria];
                      u[i].description = e.target.value;
                      setCriteria(u);
                    }}
                    placeholder="Optional description..."
                    className="input-field text-xs"
                  />
                </div>
              ))}
              <div className="text-right text-xs sm:text-sm text-slate-400 font-medium">
                Total: {criteria.reduce((s, c) => s + (c.maxMarks || 0), 0)} pts
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
              <button type="button" onClick={() => setActiveStep(2)} className="btn-secondary w-full sm:w-auto justify-center text-xs sm:text-sm py-3 px-5">
                ← Back
              </button>
              <button type="submit" disabled={submitting} className="btn-primary w-full sm:flex-1 justify-center text-xs sm:text-sm py-3 px-4 text-center">
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  "🚀 Create & Publish Hackathon"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default CreateHackathonPage;
