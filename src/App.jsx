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
  Layers,
  Moon,
  ShieldCheck,
  ChevronRight,
  Search,
  Globe
} from "lucide-react";

const cn = (...classes) => classes.filter(Boolean).join(" ");

// Auto-detect timezone (global)
const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

/** WEEKLY MODEL (Horizontal Bar) */
const WEEK = [
  { id: "mon", label: "Mon", theme: "Orient & Plan" },
  { id: "tue", label: "Tue", theme: "Decide & Execute" },
  { id: "wed", label: "Wed", theme: "Review & Align" },
  { id: "thu", label: "Thu", theme: "Deepwork: Be a Builder" },
  { id: "fri", label: "Fri", theme: "Inspect & Learn" }
];

/** BASE (non-Thursday) DAILY MODEL */
const BASE_BLOCKS = [
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
      "Select top Urgent & Important items",
      "Explicitly mark what will NOT be done today"
    ],
    outputs: ["Today’s 3 Outcomes", "Top priorities", "Parked list (deprioritized)"],
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
    outputs: [
      "Decisions made or owned",
      "Blockers cleared / escalations sent",
      "Owners + deadlines set"
    ],
    artifacts: ["Decision Log", "Commitment Log"]
  },

  // Morning meetings: People + Leadership
  {
    id: "meetings1",
    title: "Meeting Block 1: People & Leadership",
    time: "11:30–13:00",
    intent: "People",
    icon: Calendar,
    meetingTypes: ["1:1s / Coaching", "Team Rituals", "Hiring / Talent", "Decision (quick)"],
    meetingPlaybooks: {
      "1:1s / Coaching": {
        ai: [
          "Recap last commitments + progress",
          "Surface themes: motivation, blockers, growth opportunities",
          "Suggest 3 coaching questions"
        ],
        human: [
          "Listen first (signal > solutions)",
          "Remove one blocker OR agree a next step",
          "Agree 1 growth action + 1 commitment"
        ],
        outputs: ["Commitments updated", "One growth action", "Risk/sentiment signal captured"]
      },
      "Team Rituals": {
        ai: [
          "Prepare a crisp agenda (wins, risks, priorities)",
          "Summarize only deltas (what changed)",
          "Draft recognition call-outs"
        ],
        human: [
          "Reinforce outcomes for the week",
          "Resolve friction early",
          "Close with owners + dates"
        ],
        outputs: ["Team aligned", "Risks explicit", "Actions owned"]
      },
      "Hiring / Talent": {
        ai: [
          "Summarize interview signals vs rubric",
          "Highlight missing evidence / risk areas",
          "Draft role-fit summary"
        ],
        human: [
          "Make hire/no-hire decisions quickly",
          "Assign next steps (offer, follow-ups, pipeline)",
          "Calibrate bar"
        ],
        outputs: ["Hire decision + rationale", "Next steps owned", "Bar clarity improved"]
      },
      "Decision (quick)": {
        ai: [
          "One-page decision brief (options + tradeoffs)",
          "Identify what must be true / key risks",
          "Draft stakeholder message"
        ],
        human: [
          "Decide or delegate with owner + time",
          "Time-box discussion",
          "Log and communicate"
        ],
        outputs: ["Decision logged", "Owner + due date", "Stakeholders updated"]
      }
    },
    artifacts: ["1:1 Notes", "Team Actions", "Talent Decisions"]
  },

  // Afternoon meetings: Execution
  {
    id: "meetings2",
    title: "Meeting Block 2: Execution",
    time: "14:00–16:00",
    intent: "Execute",
    icon: Layers,
    meetingTypes: ["Planning", "Review", "Escalation"],
    meetingPlaybooks: {
      Planning: {
        ai: [
          "Draft plan options (scope, sequencing, tradeoffs)",
          "Dependency map (lightweight) + critical path",
          "Risks and mitigations with owners"
        ],
        human: [
          "Commit scope, sequencing, and owners",
          "Kill/merge low ROI work",
          "Lock milestones and review cadence"
        ],
        outputs: ["Plan + milestones", "Owners + dates", "Risks + mitigations"]
      },
      Review: {
        ai: [
          "Delta since last review (what changed)",
          "Top risks + top quality signals",
          "Asks needed to stay on track"
        ],
        human: [
          "Course-correct (scope, people, sequencing)",
          "Escalate dependencies if needed",
          "Lock next actions with owners"
        ],
        outputs: ["Updated actions", "Updated risk view", "Clear asks"]
      },
      Escalation: {
        ai: [
          "One-page context: problem, evidence, impact",
          "Options + tradeoffs + recommended path",
          "Draft escalation message"
        ],
        human: [
          "Decide or route to decision owner",
          "Set deadline + follow-up mechanism",
          "Communicate the ask crisply"
        ],
        outputs: ["Decision + owner", "Committed actions", "Escalation contained"]
      }
    },
    artifacts: ["Program Notes", "Risk Register", "Dependency Notes"]
  },

  // 16:00 is now Parking / Checkpoint
  {
    id: "parking",
    title: "Checkpoint / Parking Lot",
    time: "16:00–17:00",
    intent: "Stabilize",
    icon: ShieldCheck,
    ai: [
      "Surface unplanned work that landed today",
      "Suggest what to handle vs park",
      "Draft follow-ups to close loops"
    ],
    human: [
      "Handle truly urgent unplanned items",
      "Park the rest explicitly (owner + when)",
      "Protect tomorrow’s plan"
    ],
    outputs: ["Unplanned work contained", "Open loops closed or parked", "Tomorrow protected"],
    artifacts: ["Parking Lot", "Updated Commitment Log"]
  },

  // Optional night blocks
  {
    id: "global",
    title: "Global / Cross-functional",
    time: "21:00–22:00",
    intent: "Collaborate",
    icon: Globe,
    optional: true,
    ai: [
      "Prepare a crisp brief (context, ask, constraints)",
      "Draft decision options + tradeoffs",
      "Pre-write follow-ups for owners"
    ],
    human: [
      "Drive to decisions + clear asks",
      "Align across time zones",
      "Close with owners + deadlines"
    ],
    outputs: ["Global alignment", "Decisions / next steps"],
    artifacts: ["Global Decisions", "Action Register"]
  },
  {
    id: "close",
    title: "Night Closure",
    time: "22:00–22:15",
    intent: "Close",
    icon: Moon,
    optional: true,
    ai: [
      "Draft tomorrow’s top outcomes",
      "Prepare briefs for tomorrow’s key meetings",
      "Summarize open loops"
    ],
    human: ["Capture 1–2 learnings", "Confirm tomorrow’s first action", "Shutdown mentally"],
    outputs: ["Tomorrow draft plan", "Learning captured", "Calm closure"],
    artifacts: ["Learning Log", "Tomorrow Brief Pack"]
  }
];

/** ---------- Time helpers (local TZ) ---------- */
function getWeekdayId(date, timeZone) {
  const short = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone }).format(date);
  const map = { Mon: "mon", Tue: "tue", Wed: "wed", Thu: "thu", Fri: "fri", Sat: "mon", Sun: "mon" };
  return map[short] || "mon";
}

function minutesInTz(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone
  }).formatToParts(date);

  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hh * 60 + mm;
}

function parseRangeToMinutes(rangeText) {
  const m = rangeText.match(/(\d{1,2}):(\d{2})\s*–\s*(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const start = Number(m[1]) * 60 + Number(m[2]);
  const end = Number(m[3]) * 60 + Number(m[4]);
  return { start, end };
}

function pickCurrentOrNextBlock(blocks, nowMin) {
  // Include optional blocks too (night slots should highlight properly)
  const timed = blocks
    .map((b) => ({ b, r: parseRangeToMinutes(b.time) }))
    .filter((x) => x.r);

  const current = timed.find((x) => nowMin >= x.r.start && nowMin < x.r.end);
  if (current) return { mode: "now", id: current.b.id };

  const next = timed.find((x) => nowMin < x.r.start);
  if (next) return { mode: "next", id: next.b.id };

  return { mode: "after", id: timed[timed.length - 1]?.b.id };
}

/** ---------- Thursday overrides (2.5h deepwork) ---------- */
function applyThursdayOverrides(blocks) {
  // On Thu:
  // - shrink triage + urgent to 30 mins each
  // - add 11:00–13:30 deepwork
  // - keep execution 14:00–16:00
  // - keep parking 16:00–17:00
  // - keep optional night blocks

  const out = [];
  for (const b of blocks) {
    if (b.id === "orient") {
      out.push({ ...b, time: "10:00–10:30" });
      continue;
    }

    // Replace 10:30–11:30 with 10:30–11:00 + deepwork
    if (b.id === "resolve") {
      out.push({ ...b, time: "10:30–11:00" });

      out.push({
        id: "deepwork",
        title: "Deep Work — Builder Mode",
        time: "11:00–13:30",
        intent: "Build",
        icon: Sparkles,
        ai: [
          "Act as a thought partner (structure, synthesize, challenge)",
          "Generate first drafts (doc, strategy note, framework, analysis)",
          "Create crisp options + tradeoffs when decisions are needed"
        ],
        human: [
          "Work on one meaningful artifact",
          "Avoid context switching",
          "Finish with a shareable output"
        ],
        outputs: ["One tangible artifact", "Clarity and leverage gained"],
        artifacts: ["Deepwork Artifact", "Notes / Drafts"]
      });

      continue;
    }

    // People block doesn't fit in the deepwork-day core schedule; keep it optional on Thu
    if (b.id === "meetings1") {
      out.push({
        ...b,
        optional: true,
        title: "People & Leadership (optional on Thu)"
      });
      continue;
    }

    out.push(b);
  }

  return out;
}

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

function BlockTile({ block, active, onClick, tag }) {
  const Icon = block.icon;
  const isOptional = !!block.optional;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-2xl border p-4 shadow-sm transition",
        active
          ? "border-slate-900 bg-slate-900 text-white"
          : isOptional
            ? "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
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
            <div className="flex items-center gap-2">
              <div className={cn("text-sm font-semibold", active ? "text-white" : "text-slate-900")}>
                {block.title}
              </div>

              {/* Optional badge */}
              {isOptional ? (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    active ? "border-white/20 bg-white/10 text-white" : "border-slate-200 bg-white text-slate-700"
                  )}
                >
                  Optional
                </span>
              ) : null}

              {/* NOW / NEXT tag */}
              {tag ? (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    active ? "border-white/20 bg-white/10 text-white" : tag === "NOW"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  )}
                >
                  {tag}
                </span>
              ) : null}
            </div>

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
  const [selectedDay, setSelectedDay] = useState(() => getWeekdayId(new Date(), TIMEZONE));
  const [activeId, setActiveId] = useState(BASE_BLOCKS[0].id);
  const [query, setQuery] = useState("");
  const [meetingType, setMeetingType] = useState("");

  // Tick once per minute
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Keep selected day aligned to today in local TZ
  useEffect(() => {
    setSelectedDay(getWeekdayId(now, TIMEZONE));
  }, [now]);

  const blocksBaseForDay = useMemo(() => {
    return selectedDay === "thu" ? applyThursdayOverrides(BASE_BLOCKS) : BASE_BLOCKS;
  }, [selectedDay]);

  // Search filters blocks
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return blocksBaseForDay;

    return blocksBaseForDay.filter((b) => {
      const playbookText = b.meetingPlaybooks
        ? Object.values(b.meetingPlaybooks)
            .flatMap((pb) => [...(pb.ai || []), ...(pb.human || []), ...(pb.outputs || [])])
            .join(" ")
        : "";

      const hay = [
        b.title,
        b.time,
        b.intent,
        ...(b.ai || []),
        ...(b.human || []),
        ...(b.outputs || []),
        ...(b.artifacts || []),
        playbookText
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

  // When switching day, reset to first block
  useEffect(() => {
    setActiveId(blocksBaseForDay[0].id);
  }, [selectedDay, blocksBaseForDay]);

  // Ensure meetingType is valid for current active block
  useEffect(() => {
    if (!active?.meetingTypes?.length) {
      setMeetingType("");
      return;
    }
    if (!meetingType || !active.meetingTypes.includes(meetingType)) {
      setMeetingType(active.meetingTypes[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, active?.meetingTypes]);

  const selectedTheme = WEEK.find((x) => x.id === selectedDay);

  // Auto highlight NOW/NEXT (include night slots; also only when not searching)
  const focus = useMemo(() => {
    const nowMin = minutesInTz(now, TIMEZONE);
    return pickCurrentOrNextBlock(blocksBaseForDay, nowMin);
  }, [now, blocksBaseForDay]);

  useEffect(() => {
    if (query.trim()) return;
    if (focus?.id) setActiveId(focus.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus?.id, selectedDay, query]);

  const isMeeting = !!active?.meetingTypes?.length;
  const pb = isMeeting ? active.meetingPlaybooks?.[meetingType] : null;

  const aiItems = pb?.ai || active.ai || [];
  const humanItems = pb?.human || active.human || [];
  const outItems = pb?.outputs || active.outputs || [];

  // --- Layout: keep everything in one frame ---
  // Adjust these if you want even tighter fit.
  const PANEL_MAX_H = "max-h-[calc(100vh-260px)]";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-5">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              ALOS • Weekly → Daily
              <span className="text-slate-400">•</span>
              <span className="text-slate-600">{TIMEZONE}</span>
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              AI Leader Operating System (ALOS)
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-slate-600 leading-relaxed">
              A reference model for AI-enabled leadership—pick a day, then run the blocks.
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
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
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
              </button>
            ))}

            <div className="ml-auto hidden md:block text-sm text-slate-600">
              <span className="font-medium text-slate-900">Selected:</span>{" "}
              {selectedTheme?.theme}
            </div>
          </div>
        </div>

        {/* Daily View */}
        <div className="mt-4 grid gap-4 md:grid-cols-12">
          {/* Left: Blocks */}
          <div className="md:col-span-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">
                Daily Blocks
                {selectedTheme?.theme ? (
                  <span className="ml-2 text-xs font-medium text-slate-500">• {selectedTheme.theme}</span>
                ) : null}
              </div>

              {!query.trim() ? (
                <div className="text-xs text-slate-500">
                  {focus.mode === "now"
                    ? "Now"
                    : focus.mode === "next"
                      ? "Next"
                      : "After hours"}
                </div>
              ) : null}
            </div>

            {/* Scroll inside list so page stays one frame */}
            <div className={cn("space-y-3 overflow-auto pr-1", PANEL_MAX_H)}>
              {filtered.map((b) => {
                const tag =
                  !query.trim() && b.id === focus.id
                    ? focus.mode === "now"
                      ? "NOW"
                      : focus.mode === "next"
                        ? "NEXT"
                        : ""
                    : "";
                return (
                  <BlockTile
                    key={b.id}
                    block={b}
                    active={b.id === activeId}
                    tag={tag}
                    onClick={() => setActiveId(b.id)}
                  />
                );
              })}

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
                className={cn(
                  "rounded-3xl border border-slate-200 bg-white p-6 shadow-sm overflow-auto",
                  PANEL_MAX_H
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="text-lg font-semibold text-slate-900">{active.title}</div>
                      {active.optional ? (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                          Optional
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <Pill>
                        <Clock className="h-3.5 w-3.5" /> {active.time}
                      </Pill>
                      <Pill>
                        <ClipboardList className="h-3.5 w-3.5" /> {active.intent}
                      </Pill>
                    </div>

                    {/* Meeting sub-block chips */}
                    {isMeeting ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {active.meetingTypes.map((t) => (
                          <button
                            key={t}
                            onClick={() => setMeetingType(t)}
                            className={cn(
                              "rounded-full border px-3 py-1 text-xs font-semibold transition",
                              meetingType === t
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <SectionCard title="AI prepares" icon={Sparkles} tone="ai">
                    <List items={aiItems} />
                  </SectionCard>
                  <SectionCard title="Leader decides" icon={User}>
                    <List items={humanItems} />
                  </SectionCard>
                  <SectionCard title="Outputs" icon={CheckCircle2} tone="out">
                    <List items={outItems} />
                  </SectionCard>
                </div>

                {(active.artifacts || []).length ? (
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
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
          Core day ends at 17:00. Night blocks are optional and purpose-bound.
        </div>
      </div>
    </div>
  );
}
