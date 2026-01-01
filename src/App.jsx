import React, { useEffect, useMemo, useState } from "react";
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
  Search
} from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

/** WEEKLY MODEL (Horizontal Bar) */
const WEEK = [
  { id: "mon", label: "Mon", theme: "Orient & Plan" },
  { id: "tue", label: "Tue", theme: "Execute & Decide" },
  { id: "wed", label: "Wed", theme: "Review & Align" },
  { id: "thu", label: "Thu", theme: "Deepwork: Be a Builder", slot: "Thu AM • 2h Deepwork" },
  { id: "fri", label: "Fri", theme: "Inspect & Learn" }
];

/** DAILY MODEL (Vertical Blocks) */
const BLOCKS = [
  {
    id: "orient",
    title: "Morning Triage",
    time: "10:00–10:30",
    intent: "Orient",
    icon: Sparkles,
    ai: [
      "Aggregate signals from calendar, messages, dashboards, incidents, OKRs",
      "Cluster into Urgent & Important / Important-Not-Urgent / Noise",
      "Draft Today’s 3 Outcomes (suggested)"
    ],
    human: [
      "Confirm/edit Today’s 3 Outcomes",
      "Select top 3 Urgent & Important items",
      "Mark what will NOT be done today"
    ],
    outputs: ["Today’s 3 Outcomes", "Top 3 U&I items", "Parked list (deprioritized)"],
    artifacts: ["Outcome Log", "Priority Queue"]
  },
  {
    id: "resolve",
    title: "Resolve Urgent & Important",
    time: "10:30–11:30",
    intent: "Decide",
    icon: AlertTriangle,
    ai: [
      "Generate decision briefs (options, tradeoffs, risks, reversible vs irreversible)",
      "Draft stakeholder messages & escalation notes",
      "Convert blockers into actions with owners + deadlines"
    ],
    human: [
      "Make decisions OR delegate with clear owner + time",
      "Send 1–3 crisp messages (ask, context, deadline)",
      "Log decisions and commitments"
    ],
    outputs: ["Decisions made or owned", "Blockers cleared / escalations sent", "Owners + deadlines set"],
    artifacts: ["Decision Log", "Commitment Log"]
  },
  {
    id: "meetings1",
    title: "Meeting Block 1",
    time: "11:30–13:00",
    intent: "Align",
    icon: Calendar,
    ai: [
      "Auto-generate meeting brief (purpose, agenda, decisions expected)",
      "Summarize relevant metrics/threads",
      "Capture notes → decisions, actions, risks"
    ],
    human: [
      "Start with intent: what decision/outcome is needed",
      "Drive to decisions + actions (not updates)",
      "Confirm owners and dates"
    ],
    outputs: ["Decisions logged", "Actions captured", "Stakeholders aligned"],
    artifacts: ["Meeting Briefs", "Action Register"]
  },
  {
    id: "meetings2",
    title: "Meeting Block 2",
    time: "14:00–16:00",
    intent: "Execute",
    icon: Layers,
    ai: [
      "Detect dependency conflicts & slippage signals",
      "Suggest key questions and agenda cuts",
      "Draft follow-ups for owners"
    ],
    human: [
      "Bias toward unblock/decide rather than status",
      "Resolve conflicts and dependencies",
      "Kill low-value discussions"
    ],
    outputs: ["Dependencies unblocked", "Course corrections agreed", "Execution momentum"],
    artifacts: ["Dependency Map (lightweight)", "Risk Register"]
  },
  {
    id: "future",
    title: "Important, Not Urgent",
    time: "16:00–17:00",
    intent: "Build",
    icon: Target,
    ai: [
      "Recap context to reduce re-loading",
      "Act as thought partner (synthesize, challenge, structure)",
      "Generate first drafts (strategy note, framework, narrative)"
    ],
    human: [
      "Focus on one strategic theme",
      "Produce one tangible artifact",
      "Optional: one talent/coaching touch"
    ],
    outputs: ["One artifact produced", "Strategic clarity increment", "Future work protected"],
    artifacts: ["Strategy Notes", "Architecture/Program Artifacts"]
  },
  {
    id: "inspect",
    title: "Checkpoint",
    time: "17:00–18:00",
    intent: "Inspect",
    icon: ShieldCheck,
    ai: [
      "Compare intent vs reality (outcomes, commitments, signals)",
      "Flag new risks/quality signals",
      "Suggest minimal interventions"
    ],
    human: ["Decide: intervene / defer / escalate", "Update commitments", "Protect tomorrow’s plan"],
    outputs: ["1–2 course corrections", "Updated risk/commitment view", "Fewer surprises tomorrow"],
    artifacts: ["Daily Summary", "Updated Commitment Log"]
  },
  {
    id: "close",
    title: "Night Closure",
    time: "30 min (night)",
    intent: "Close",
    icon: Moon,
    ai: [
      "Draft tomorrow’s top outcomes",
      "Prepare briefs for tomorrow’s meetings",
      "Summarize decisions pending and open loops"
    ],
    human: ["Capture 1–2 learnings", "Confirm tomorrow’s first action", "Shutdown mentally"],
    outputs: ["Tomorrow draft plan", "Learning captured", "Calm closure"],
    artifacts: ["Learning Log", "Tomorrow Brief Pack"]
  }
];

function Pill({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    ai: "bg-slate-900 text-white border-slate-900",
    human: "bg-white text-slate-800 border-slate-200",
    out: "bg-emerald-50 text-emerald-800 border-emerald-200"
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone] || tones.neutral
      )}
    >
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
        <div
          className={cn(
            "grid h-9 w-9 place-items-center rounded-xl",
            tone === "ai"
              ? "bg-slate-900 text-white"
              : tone === "out"
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-700"
          )}
        >
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
        active ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:border-slate-300"
      )}
      aria-pressed={active}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={cn("grid h-10 w-10 place-items-center rounded-xl", active ? "bg-white/10" : "bg-slate-100")}>
            <Icon className={cn("h-5 w-5", active ? "text-white" : "text-slate-700")} />
          </div>
          <div>
            <div className={cn("text-sm font-semibold", active ? "text-white" : "text-slate-900")}>{block.title}</div>
            <div className={cn("mt-1 flex items-center gap-2 text-xs", active ? "text-white/80" : "text-slate-500")}>
              <Clock className="h-3.5 w-3.5" />
              <span>{block.time}</span>
              <span className="mx-1">•</span>
              <span>{block.intent}</span>
            </div>
          </div>
        </div>
        <ChevronRight className={cn("h-5 w-5 transition", active ? "text-white" : "text-slate-300 group-hover:text-slate-400")} />
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
  const [selectedDay, setSelectedDay] = useState("thu"); // default highlight
  const [activeId, setActiveId] = useState(BLOCKS[0].id);
  const [query, setQuery] = useState("");

  // Optional: Thursday “Builder Mode” label tweak (no schedule changes)
  const blocksBaseForDay = useMemo(() => {
    if (selectedDay !== "thu") return BLOCKS;
    return BLOCKS.map((b) =>
      b.id === "future" ? { ...b, title: "Deepwork — Builder Mode" } : b
    );
  }, [selectedDay]);

  // Search filters the *current* day’s blocks
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return blocksBaseForDay;

    return blocksBaseForDay.filter((b) => {
      const hay = [
        b.title,
        b.time,
        b.intent,
        ...b.ai,
        ...b.human,
        ...b.outputs,
        ...(b.artifacts || [])
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [query, blocksBaseForDay]);

  const active = useMemo(() => {
    return filtered.find((b) => b.id === activeId) || filtered[0] || blocksBaseForDay[0];
  }, [activeId, filtered, blocksBaseForDay]);

  // If filtering removes the active block, fall back
  useEffect(() => {
    if (!filtered.some((b) => b.id === activeId) && filtered.length) {
      setActiveId(filtered[0].id);
    }
  }, [filtered, activeId]);

  // When switching day, reset to first block (clean UX)
  useEffect(() => {
    setActiveId(blocksBaseForDay[0].id);
  }, [selectedDay, blocksBaseForDay]);

  const selectedTheme = WEEK.find((x) => x.id === selectedDay);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Weekly → Daily • Leader AI OS
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Weekly themes. Daily execution blocks.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 leading-relaxed">
              Pick a day to set context. Then click a block to see what <span className="font-medium text-slate-900">AI prepares</span>,
              what the <span className="font-medium text-slate-900">leader decides</span>, and the <span className="font-medium text-slate-900">outputs</span>.
            </p>
          </div>

          {/* Search */}
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
                <Sparkles className="h-3.5 w-3.5" /> AI
              </Pill>
              <Pill tone="human">
                <User className="h-3.5 w-3.5" /> Human
              </Pill>
              <Pill tone="out">
                <CheckCircle2 className="h-3.5 w-3.5" /> Outputs
              </Pill>
            </div>
          </div>
        </div>

        {/* Weekly Horizontal Bar */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            {WEEK.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDay(d.id)}
                className={cn(
                  "rounded-2xl border px-4 py-3 text-left transition",
                  selectedDay === d.id
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="text-xs opacity-80">{d.label}</div>
                <div className="text-sm font-semibold">{d.theme}</div>
                {d.slot && <div className="mt-1 text-xs opacity-80">{d.slot}</div>}
              </button>
            ))}

            <div className="ml-auto hidden md:block text-sm text-slate-600">
              <span className="font-medium text-slate-900">Selected:</span>{" "}
              {selectedTheme?.theme}
            </div>
          </div>
        </div>

        {/* Daily View */}
        <div className="mt-6 grid gap-6 md:grid-cols-12">
          {/* Left: Blocks */}
          <div className="md:col-span-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">
                Daily Blocks
                {selectedTheme?.theme ? (
                  <span className="ml-2 text-xs font-medium text-slate-500">
                    • {selectedTheme.theme}
                  </span>
                ) : null}
              </div>
            </div>

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

          {/* Right: Details */}
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
                    <div className="text-lg font-semibold text-slate-900">{active.title}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
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
                  <SectionCard title="AI prepares" icon={Sparkles} tone="ai">
                    <List items={active.ai} />
                  </SectionCard>
                  <SectionCard title="Leader decides" icon={User}>
                    <List items={active.human} />
                  </SectionCard>
                  <SectionCard title="Outputs" icon={CheckCircle2} tone="out">
                    <List items={active.outputs} />
                  </SectionCard>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Artifacts</div>
                      <div className="mt-1 text-sm text-slate-600">
                        Lightweight logs that make leadership work traceable.
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(active.artifacts || []).map((a) => (
                        <Pill key={a}>{a}</Pill>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500">
          Weekly sets context. Daily blocks execute. Deepwork builds the future.
        </div>
      </div>
    </div>
  );
}
