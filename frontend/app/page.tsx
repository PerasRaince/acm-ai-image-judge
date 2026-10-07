import Link from 'next/link';
import JoinCodeInput from '../components/JoinCodeInput';
import {
  Trophy,
  Sparkles,
  ShieldCheck,
  Cpu,
  ArrowRight,
  Layers,
  Eye,
  Palette,
  PlusCircle,
  Hash,
  HelpCircle,
  FileCheck2,
  Calendar,
  MapPin,
  Users,
  Compass,
  CheckCircle2,
  Lock,
  Flame
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col space-y-20 py-10 md:py-16">
      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Chapter Header Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#0085CA]/40 bg-[#0085CA]/10 text-[#00A3E0] text-xs font-semibold backdrop-blur-sm shadow-sm">
          <img src="/acm-logo-blue.png" alt="ACM" className="h-4 w-4 object-contain inline shrink-0" />
          <span>ACM Student Chapter • Government Engineering College Thrissur</span>
        </div>

        {/* Main Title */}
        <div className="space-y-4 max-w-4xl mx-auto">
          <div className="inline-block px-3 py-1 rounded-md bg-[#002B49] border border-[#0085CA]/30 text-[#00A3E0] text-[11px] font-mono uppercase tracking-widest">
            Orientation 2026 • AI Challenge Arena
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Master the Prompt.{' '}
            <span className="bg-gradient-to-r from-[#0085CA] via-[#00A3E0] to-sky-200 bg-clip-text text-transparent">
              Recreate the Vision.
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Welcome to the official AI Image Recreation Competition organized by the <strong>ACM Student Chapter at GEC Thrissur</strong>. Recreate target reference visuals through creative generative AI prompting, submit your recreations, and receive an instant, objective <strong>Reference Similarity Score (0–100)</strong> calculated by our 6-metric PyTorch vision ensemble.
          </p>
        </div>

        {/* Action Hub */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
          <div className="w-full sm:w-auto flex-1">
            <JoinCodeInput size="large" />
          </div>

          <Link
            href="/competitions/create"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#0085CA] to-[#005A8C] hover:from-[#0096E6] hover:to-[#006BA6] text-white font-semibold text-sm transition-all shadow-lg shadow-[#0085CA]/20 whitespace-nowrap active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Host Challenge</span>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs text-slate-400">
          <Link
            href="/competitions"
            className="inline-flex items-center gap-1.5 hover:text-[#00A3E0] transition-colors"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Browse Active Competitions</span>
          </Link>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 hover:text-[#00A3E0] transition-colors"
          >
            <span>Sign In to Your Account</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>

      {/* How It Works (Orientation Workflow) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0085CA]/10 border border-[#0085CA]/30 text-[#00A3E0] text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Competition Workflow</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How the Orientation Challenge Works
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            From benchmark revelation to real-time leaderboard ranking in 4 transparent steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/70 space-y-3 relative group hover:border-[#0085CA]/50 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-[#0085CA]/20 border border-[#0085CA]/40 flex items-center justify-center text-xs font-bold font-mono text-[#00A3E0]">
              01
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Examine Benchmark Visual</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upon joining a competition room with your code, inspect the official target reference image provided by the GEC Thrissur ACM orientation coordinators.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/70 space-y-3 relative group hover:border-[#0085CA]/50 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-[#0085CA]/20 border border-[#0085CA]/40 flex items-center justify-center text-xs font-bold font-mono text-[#00A3E0]">
              02
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Engineer Generative Prompts</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use any generative AI platform (Midjourney, Stable Diffusion, DALL-E, Flux, Adobe Firefly) to formulate prompts matching scene composition and style.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/70 space-y-3 relative group hover:border-[#0085CA]/50 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-[#0085CA]/20 border border-[#0085CA]/40 flex items-center justify-center text-xs font-bold font-mono text-[#00A3E0]">
              03
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Submit Recreation</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload your candidate image within the active round deadline. Each participant has an allocated submission quota to test and refine iterations.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/70 space-y-3 relative group hover:border-[#0085CA]/50 transition-colors">
            <div className="h-8 w-8 rounded-lg bg-[#0085CA]/20 border border-[#0085CA]/40 flex items-center justify-center text-xs font-bold font-mono text-[#00A3E0]">
              04
            </div>
            <h3 className="font-semibold text-slate-100 text-sm">Automated Score & Rank</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our 6-metric PyTorch vision ensemble evaluates structural, perceptual, and semantic similarity in seconds, updating the live leaderboard immediately.
            </p>
          </div>
        </div>
      </section>

      {/* Event Details & Rules Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Event Details Card */}
          <div className="p-8 rounded-3xl border border-[#002B49] bg-[#0B1D35]/80 space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#0085CA]/15 border border-[#0085CA]/30 text-[#00A3E0]">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Orientation Event Details</h3>
                <p className="text-xs text-slate-400">Government Engineering College Thrissur (GEC Thrissur)</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#040C16] border border-[#002B49]">
                <Users className="h-4 w-4 text-[#00A3E0] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Organized By</div>
                  <div className="text-slate-400 mt-0.5">
                    ACM Student Chapter, Government Engineering College Thrissur (GEC Thrissur).
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#040C16] border border-[#002B49]">
                <MapPin className="h-4 w-4 text-[#00A3E0] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Venue & Competition Platform</div>
                  <div className="text-slate-400 mt-0.5">
                    GEC Thrissur Campus & Live Online AI Image Judge Arena.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#040C16] border border-[#002B49]">
                <Calendar className="h-4 w-4 text-[#00A3E0] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Schedule, Rounds & Deadlines</div>
                  <div className="text-slate-400 mt-0.5">
                    Configured dynamically per competition round by the GEC Thrissur ACM event coordinators. Check your specific room code for exact countdown timers.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#040C16] border border-[#002B49]">
                <FileCheck2 className="h-4 w-4 text-[#00A3E0] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Eligibility</div>
                  <div className="text-slate-400 mt-0.5">
                    Open to all GEC Thrissur students and orientation participants. Accounts can be created instantly with email or Google sign-in.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Rules & Integrity Card */}
          <div className="p-8 rounded-3xl border border-[#002B49] bg-[#0B1D35]/80 space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#0085CA]/15 border border-[#0085CA]/30 text-[#00A3E0]">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Competition Rules & Integrity</h3>
                <p className="text-xs text-slate-400">Strict academic fairness standards enforced</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#040C16] border border-[#002B49]">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Authentic Prompting Only</div>
                  <div className="text-slate-400 mt-0.5">
                    All submitted visuals must be generated during the active competition round using generative AI prompt engineering. Pre-existing assets or manual Photoshop edits are prohibited.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#040C16] border border-[#002B49]">
                <Lock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Anti-Duplication Hash Verification</div>
                  <div className="text-slate-400 mt-0.5">
                    Submissions are verified against the benchmark reference using byte-level SHA-256 hashing. Uploading the exact reference image or direct copies is instantly blocked.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#040C16] border border-[#002B49]">
                <Flame className="h-4 w-4 text-[#00A3E0] shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Submission Attempt Limits</div>
                  <div className="text-slate-400 mt-0.5">
                    Organizers enforce an attempt quota (e.g. 3 attempts per contestant). Only the highest calibrated score is recorded on the live leaderboard.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#040C16] border border-[#002B49]">
                <ShieldCheck className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Screen & Clipboard Protection</div>
                  <div className="text-slate-400 mt-0.5">
                    Integrated screenshot protection interceptors and window privacy veils ensure target reference images are kept secure within the competition portal.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6-Metric Ensemble Breakdown */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0085CA]/10 border border-[#0085CA]/30 text-[#00A3E0] text-xs font-semibold">
            <Cpu className="h-3.5 w-3.5" />
            <span>Evaluation Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Transparent 6-Metric Vision Ensemble
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Zero subjective bias. Every recreation is evaluated across six calibrated computer vision models to generate a composite Reference Similarity Score (0–100).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* DreamSim */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/70 space-y-3 hover:border-[#0085CA]/50 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#0085CA]/15 text-[#00A3E0]">
                <Eye className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#0085CA]/15 text-[#00A3E0] border border-[#0085CA]/30">
                35% Weight
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">DreamSim Perceptual Similarity</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Trained on human visual preference data to evaluate holistic perceptual likeness, composition, and visual impact.
            </p>
          </div>

          {/* DINOv2 */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/70 space-y-3 hover:border-[#0085CA]/50 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-[#0075A2]/20 text-[#38BDF8]">
                <Layers className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-[#0075A2]/20 text-[#38BDF8] border border-[#0075A2]/30">
                30% Weight
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">DINOv2 Structural Correspondence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Self-supervised Vision Transformer representations matching object silhouettes, spatial layouts, and geometry.
            </p>
          </div>

          {/* CLIP */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/70 space-y-3 hover:border-[#0085CA]/50 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-sky-500/15 text-sky-400">
                <Cpu className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                15% Weight
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">OpenCLIP Semantic Alignment</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Contrastive multimodal embeddings measuring semantic conceptual match, key subjects, themes, and motifs.
            </p>
          </div>

          {/* LPIPS */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/70 space-y-3 hover:border-[#0085CA]/50 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-teal-500/15 text-teal-300">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-teal-500/15 text-teal-300 border border-teal-500/30">
                10% Weight
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">LPIPS Detail & Patch Distance</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deep feature patch distance inspecting micro-textures, edge sharpness, and local pixel consistency.
            </p>
          </div>

          {/* Color Similarity */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/70 space-y-3 hover:border-[#0085CA]/50 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-amber-500/15 text-amber-300">
                <Palette className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                5% Weight
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">Color Distribution Fidelity</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              3D HSV histogram intersection and CIE L*a*b* color centroid distance assessing atmospheric lighting and palette.
            </p>
          </div>

          {/* Technical Quality */}
          <div className="p-6 rounded-2xl border border-[#002B49] bg-[#0B1D35]/70 space-y-3 hover:border-[#0085CA]/50 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                5% Weight
              </span>
            </div>
            <h3 className="font-semibold text-slate-100 text-base">Technical Image Integrity</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Laplacian sharpness variance and dynamic range verification to penalize severe blur, artifacts, or distortion.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#002B49] bg-gradient-to-r from-[#0B1D35] via-[#071527] to-[#040C16] p-8 sm:p-12 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-3">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to Join the Orientation Challenge?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Enter the competition room code shared by your GEC Thrissur ACM orientation coordinators, or sign in to track your scores.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <div className="w-full sm:w-auto flex-1">
              <JoinCodeInput size="large" />
            </div>
            <Link
              href="/signup"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#0085CA] to-[#005A8C] hover:from-[#0096E6] hover:to-[#006BA6] text-white font-semibold text-xs transition-all shadow-md shadow-[#0085CA]/20 whitespace-nowrap active:scale-95"
            >
              Register / Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
