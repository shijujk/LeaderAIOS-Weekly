import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  Sparkles,
  User,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  Calendar,
  Target,
  Layers,
  Moon,
  ShieldCheck,
  ChevronRight,
  Search,
} from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

const BLOCKS = [
  {
    id: "orient",
    title: "Morning Insight Intake & Triage",
    time: "10:00–10:30",
    intent: "See clearly before acting",
    icon: Sparkles,
    colorHint: "from-slate-50 to-slate-100",
    ai: [
      "Pull signals from calendar, mail/chat, dashboards, incidents, OKRs",
      "Cluster into Urgent & Important / Important-Not-Urgent / Noise",
      "Draft 3 outcomes for the day + suggested deprioritization",
    ],
    human: [
      "Confirm/edit Today’s 3 Outcomes",
      "Select the top 3 Urgent & Important items",
      "Explicitly mark what will NOT be done today",
    ],
    outputs: [
      "Today’s 3 Outcomes",
      "Top 3 U&I items",
      "Deprioritized list (parked)",
    ],
    artifacts: [
      "Outcome Log (today)",
      "Priority Queue",
    ],
  },
  {
    id: "resolve",
    title: "Resolve Urgent & Important",
    time: "10:30–11:30",
    intent: "Remove pressure points early",
    icon: AlertTriangle,
    colorHint: "from-amber-50 to-amber-100",
    ai: [
      "Generate decision briefs (options, tradeoffs, risks, reversible/irreversible)",
      "Draft stakeholder messages and escalation notes",
      "Convert blockers into actions with owners + deadlines",
    ],
    human: [
      "Make decisions or delegate with clear owner/time",
      "Send 1–3 crisp messages (ask, context, deadline)",
      "Lock next steps in the Decision/Commitment log",
    ],
    outputs: [
      "Decisions made OR assigned",
      "Blockers cleared / escalations sent",
      "Owner + deadline for every action",
    ],
    artifacts: [
      "Decision Log",
      "Commitment Log",
    ],
  },
  {
    id: "meetings1",
    title: "Meeting Block 1",
    time: "11:30–13:00",
    intent: "High-quality meetings, low waste",
    icon: Calendar,
    colorHint: "from-indigo-50 to-indigo-100",
    ai: [
      "Auto-generate meeting brief: purpose, agenda, decisions expected",
      "Summarize relevant metrics/threads",
      "Capture notes → decisions, actions, risks",
    ],
    human: [
      "Start with intent: what decision/outcome is needed",
      "Keep meeting to decision + action closure",
      "End by confirming owners and dates",
    ],
    outputs: [
      "Meeting outcomes (decisions/actions/risks)",
      "Aligned stakeholders",
    ],
    artifacts: [
      "Meeting Briefs",
      "Action Register",
    ],
  },
  {
    id: "meetings2",
    title: "Meeting Block 2",
    time: "14:00–16:00",
    intent: "Execution-focused alignment",
    icon: Layers,
    colorHint: "from-sky-50 to-sky-100",
    ai: [
      "Detect dependency conflicts & slippage signals",
      "Suggest agenda cuts (what to defer) and key questions",
      "Draft follow-ups for owners",
    ],
    human: [
      "Bias toward unblock/decide rather than status",
      "Confirm dependency owners + next checkpoint",
      "Kill low-value meetings",
    ],
    outputs: [
      "Dependencies unblocked",
      "Course corrections agreed",
    ],
    artifacts: [
      "Dependency Map (lightweight)",
      "Risk Register",
    ],
  },
  {
    id: "future",
    title: "Important, Not Urgent (Build the Future)",
    time: "16:00–17:00",
    intent: "Protect strategic work",
    icon: Target,
    colorHint: "from-emerald-50 to-emerald-100",
    ai: [
      "Act as thought partner: synthesize, challenge, propose structure",
      "Generate first drafts (strategy note, narrative, framework)",
      "Summarize prior context to reduce re-loading",
    ],
    human: [
      "Produce one tangible artifact",
      "Make one strategic call or alignment note",
      "Optional: 1 coaching/talent touch",
    ],
    outputs: [
      "One artifact (doc/note/plan)",
      "Strategic clarity increment",
    ],
    artifacts: [
      "Strategy Notes",
      "Architecture/Program Artifacts",
    ],
  },
  {
    id: "inspect",
    title: "Checkpoint (Inspect & Adjust)",
    time: "17:00–18:00",
    intent: "Course-correct before the day ends",
    icon: ShieldCheck,
    colorHint: "from-violet-50 to-violet-100",
    ai: [
      "Compare plan vs reality (outcomes, commitments, signals)",
      "Flag new risks/quality signals",
      "Suggest minimal interventions",
    ],
    human: [
      "Decide: intervene / defer / escalate",
      "Update commitments",
      "Protect tomorrow’s plan",
    ],
    outputs: [
      "1–2 course corrections",
      "Updated risk/commitment view",
    ],
    artifacts: [
      "Daily Summary",
      "Updated Commitment Log",
    ],
  },
  {
    id: "close",
    title: "Night Closure (Prep Tomorrow)",
    time: "30 min (night)",
    intent: "End calm, start clear",
    icon: Moon,
    colorHint: "from-zinc-50 to-zinc-100",
    ai: [
      "Draft tomorrow’s top 3 outcomes",
      "Prepare briefs for tomorrow’s meetings",
      "Summarize decisions pending and open loops",
    ],
    human: [
      "Capture 2 learnings (max)",
      "Confirm tomorrow’s first action",
      "Shutdown mentally",
    ],
    outputs: [
      "Tomorrow draft plan",
      "Learning captured",
    ],
    artifacts: [
      "Learning Log",
      "Tomorrow Brief Pack",
    ],
  },
];

function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    ai: "bg-slate-900 text-white border-slate-900",
    human: "bg-white text-slate-800 border-slate-200",
    out: "bg-emerald-50 text-emerald-800 border-emerald-200",
  };
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
      tones[tone] || tones.neutral
    )}>
      {children}
    </span>
  );
}

function SectionCard({ title, icon: Icon, tone = "neutral", children }) {
  const toneClass =
    tone === "ai"
      ? "border-slate-900/10 bg-slate-900/[0.02]"
      : tone === "out"
        ? "border-emerald-200 bg-emerald-50/40"
        : "border-slate-200 bg-white";

  return (
    <div className={cn("rounded-2xl border p-4 shadow-sm", toneClass)}>
      <div className="flex items-center gap-2">
        <div className={cn(
          "grid h-9 w-9 place-items-center rounded-xl",
          tone === "ai"
            ? "bg-slate-900 text-white"
            : tone === "out"
              ? "bg-emerald-600 text-white"
              : "bg-slate-100 text-slate-700"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="text-sm font-semibold text-slate-900">{title}</div>
      </div>
      <div className="mt-3 text-sm text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}

function BlockTile({ block, active, onClick }) {
  const Icon = block.icon;
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-2xl border p-4 shadow-sm transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white hover:border-slate-300"
      )}
      aria-pressed={active}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "grid h-10 w-10 place-items-center rounded-xl",
              active ? "bg-white/10" : "bg-slate-100"
            )}
          >
            <Icon className={cn("h-5 w-5", active ? "text-white" : "text-slate-700")} />
          </div>
          <div>
            <div className={cn("text-sm font-semibold", active ? "text-white" : "text-slate-900")}>
              {block.title}
            </div>
            <div className={cn("mt-1 flex items-center gap-2 text-xs", active ? "text-white/80" : "text-slate-500")}>
              <Clock className="h-3.5 w-3.5" />
              <span>{block.time}</span>
            </div>
          </div>
        </div>
        <ChevronRight className={cn("h-5 w-5 transition", active ? "text-white" : "text-slate-300 group-hover:text-slate-400")} />
      </div>
      <div className={cn("mt-3 text-xs leading-relaxed", active ? "text-white/80" : "text-slate-600")}>
        {block.intent}
      </div>
    </button>
  );
}

function List({ items }) {
  return (
    <ul className="mt-2 space-y-2">
      {items.map((t, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export default function LeaderDayOSInteractive() {
  const [activeId, setActiveId] = useState(BLOCKS[0].id);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BLOCKS;
    return BLOCKS.filter((b) => {
      const hay = [b.title, b.time, b.intent, ...b.ai, ...b.human, ...b.outputs, ...(b.artifacts || [])]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query]);

  const active = useMemo(
    () => (filtered.find((b) => b.id === activeId) || filtered[0] || BLOCKS[0]),
    [activeId, filtered]
  );

  // If filtering removes the active block, fall back.
  React.useEffect(() => {
    if (!filtered.some((b) => b.id === activeId) && filtered.length) {
      setActiveId(filtered[0].id);
    }
  }, [filtered, activeId]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Option 3 • Leader Day OS (Interactive)
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              A leader’s day, broken into usable blocks
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 leading-relaxed">
              Click a block to reveal what <span className="font-medium text-slate-900">AI does</span>, what the
              <span className="font-medium text-slate-900"> leader does</span>, and the
              <span className="font-medium text-slate-900"> outputs</span> that make the day auditable and calm.
            </p>
          </div>

          <div className="w-full md:w-[360px]">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search blocks, actions, outputs…"
                className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 outline-none"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <Pill tone="ai">
                <Sparkles className="h-3.5 w-3.5" /> AI actions
              </Pill>
              <Pill tone="human">
                <User className="h-3.5 w-3.5" /> Human actions
              </Pill>
              <Pill tone="out">
                <CheckCircle2 className="h-3.5 w-3.5" /> Outputs
              </Pill>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="space-y-3">
              {filtered.map((b) => (
                <BlockTile
                  key={b.id}
                  block={b}
                  active={b.id === activeId}
                  onClick={() => setActiveId(b.id)}
                />
              ))}
              {!filtered.length && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
                  No matches. Try a different search.
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold text-slate-900">{active.title}</div>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <Pill>
                        <Clock className="h-3.5 w-3.5" /> {active.time}
                      </Pill>
                      <Pill>
                        <ClipboardList className="h-3.5 w-3.5" /> {active.intent}
                      </Pill>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <SectionCard title="AI actions" icon={Sparkles} tone="ai">
                    <List items={active.ai} />
                  </SectionCard>
                  <SectionCard title="Human actions" icon={User}>
                    <List items={active.human} />
                  </SectionCard>
                  <SectionCard title="Outcomes" icon={CheckCircle2} tone="out">
                    <List items={active.outputs} />
                  </SectionCard>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Artifacts produced</div>
                      <div className="mt-1 text-sm text-slate-600">
                        These are the lightweight logs that make leadership work traceable.
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(active.artifacts || []).map((a) => (
                        <Pill key={a}>{a}</Pill>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Recommended default</div>
                    <div className="mt-2 text-sm text-slate-700 leading-relaxed">
                      <span className="font-medium">AI-first:</span> start each block by reviewing the AI brief,
                      then make human edits. Never start from blank.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">Anti-pattern to avoid</div>
                    <div className="mt-2 text-sm text-slate-700 leading-relaxed">
                      Using AI only for writing. The leverage is in
                      <span className="font-medium"> triage, decision framing, meeting closure</span>, and
                      <span className="font-medium"> inspection</span>.
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-900">How leaders adopt this</div>
              <div className="mt-1 text-sm text-slate-600">
                Progressive disclosure: Week 1 only morning + night. Add blocks weekly.
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill>
                <Sparkles className="h-3.5 w-3.5" /> AI before humans
              </Pill>
              <Pill>
                <CheckCircle2 className="h-3.5 w-3.5" /> Every block ends with an output
              </Pill>
              <Pill>
                <User className="h-3.5 w-3.5" /> Interaction = confirm/edit
              </Pill>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Tip: This component is tool-agnostic. Wire the “AI actions” list to your real systems later.
        </div>
      </div>
    </div>
  );
}
