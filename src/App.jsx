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
const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

/* ================= WEEK ================= */
const WEEK = [
  { id: "mon", label: "Mon", theme: "Orient & Plan" },
  { id: "tue", label: "Tue", theme: "Decide & Execute" },
  { id: "wed", label: "Wed", theme: "Decide & Execute" },
  { id: "thu", label: "Thu", theme: "Deepwork: Be a Builder" },
  { id: "fri", label: "Fri", theme: "Inspect & Learn" }
];

/* ================= BASE BLOCKS ================= */
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
      "Draft Today’s 3 Outcomes"
    ],
    human: [
      "Confirm Today’s 3 Outcomes",
      "Select top Urgent & Important items",
      "Explicitly mark what will NOT be done today"
    ],
    outputs: ["Today’s 3 Outcomes", "Top priorities", "Deprioritized list"],
    artifacts: ["Outcome Log"]
  },
  {
    id: "resolve",
    title: "Resolve Urgent & Important",
    time: "10:30–11:30",
    intent: "Decide",
    icon: AlertTriangle,
    ai: [
      "Prepare decision briefs (options, risks, tradeoffs)",
      "Draft escalation or stakeholder messages"
    ],
    human: [
      "Decide or delegate with owner + deadline",
      "Send crisp messages",
      "Log commitments"
    ],
    outputs: ["Decisions made", "Blockers cleared"],
    artifacts: ["Decision Log"]
  },
  {
    id: "meetings1",
    title: "People & Leadership Meetings",
    time: "11:30–13:00",
    intent: "People",
    icon: Calendar,
    meetingTypes: ["1:1s / Coaching", "Team Rituals", "Hiring / Talent", "Decision (Quick)"],
    meetingPlaybooks: {
      "1:1s / Coaching": {
        ai: ["Recap prior commitments", "Surface themes and growth signals"],
        human: ["Listen deeply", "Agree on one growth action"],
        outputs: ["Commitments updated", "Growth action"]
      },
      "Team Rituals": {
        ai: ["Prepare wins/risks summary", "Draft agenda"],
        human: ["Align priorities", "Resolve friction"],
        outputs: ["Team alignment", "Clear actions"]
      },
      "Hiring / Talent": {
        ai: ["Summarize feedback", "Highlight risks"],
        human: ["Decide hire/no-hire", "Assign next steps"],
        outputs: ["Talent decisions"]
      },
      "Decision (Quick)": {
        ai: ["One-page decision brief"],
        human: ["Decide quickly", "Log decision"],
        outputs: ["Decision logged"]
      }
    },
    artifacts: ["1:1 Notes", "Talent Decisions"]
  },
  {
    id: "meetings2",
    title: "Execution Meetings",
    time: "14:00–16:00",
    intent: "Execute",
    icon: Layers,
    meetingTypes: ["Planning", "Review", "Escalation"],
    meetingPlaybooks: {
      Planning: {
        ai: ["Plan options", "Dependency map", "Risks"],
        human: ["Commit plan", "Assign owners"],
        outputs: ["Plan + milestones"]
      },
      Review: {
        ai: ["What changed", "Top risks"],
        human: ["Course-correct"],
        outputs: ["Updated actions"]
      },
      Escalation: {
        ai: ["Context + options"],
        human: ["Decide or escalate"],
        outputs: ["Escalation resolved"]
      }
    },
    artifacts: ["Program Plan", "Risk Register"]
  },
  {
    id: "parking",
    title: "Checkpoint / Parking Lot",
    time: "16:00–17:00",
    intent: "Stabilize",
    icon: ShieldCheck,
    ai: [
      "Surface unplanned work",
      "Suggest handle vs park",
      "Draft follow-ups"
    ],
    human: [
      "Handle true urgencies",
      "Park remaining work explicitly",
      "Protect tomorrow"
    ],
    outputs: ["Unplanned work contained", "Tomorrow protected"],
    artifacts: ["Parking Lot"]
  },

  /* ---------- OPTIONAL NIGHT ---------- */
  {
    id: "global",
    title: "Optional: Global / Cross-functional Meetings",
    time: "21:00–22:00",
    intent: "Collaborate",
    icon: Globe,
    optional: true,
    ai: [
      "Prepare crisp narrative",
      "Draft key asks",
      "Anticipate questions"
    ],
    human: [
      "Align across time zones",
      "Make or influence decisions"
    ],
    outputs: ["Global alignment", "Decisions / next steps"]
  },
  {
    id: "close",
    title: "Night Closure",
    time: "22:00–22:15",
    intent: "Close",
    icon: Moon,
    optional: true,
    ai: [
      "Draft tomorrow’s outcomes",
      "Summarize open loops"
    ],
    human: [
      "Capture learnings",
      "Mentally shut down"
    ],
    outputs: ["Calm closure"]
  }
];

/* ================= APP ================= */
export default function LeaderDayOSInteractive() {
  const [selectedDay, setSelectedDay] = useState("thu");
  const [activeId, setActiveId] = useState("orient");
  const [meetingType, setMeetingType] = useState("");
  const [query, setQuery] = useState("");

  const blocks = BASE_BLOCKS;
  const active = blocks.find(b => b.id === activeId) || blocks[0];

  useEffect(() => {
    if (active?.meetingTypes && !meetingType) {
      setMeetingType(active.meetingTypes[0]);
    }
  }, [active, meetingType]);

  const aiItems =
    active?.meetingPlaybooks?.[meetingType]?.ai || active.ai || [];
  const humanItems =
    active?.meetingPlaybooks?.[meetingType]?.human || active.human || [];
  const outItems =
    active?.meetingPlaybooks?.[meetingType]?.outputs || active.outputs || [];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">

        {/* WEEK BAR */}
        <div className="flex gap-3 mb-6">
          {WEEK.map(d => (
            <button
              key={d.id}
              onClick={() => setSelectedDay(d.id)}
              className={cn(
                "rounded-xl border px-4 py-2 text-left",
                selectedDay === d.id ? "bg-slate-900 text-white" : "bg-white"
              )}
            >
              <div className="text-xs">{d.label}</div>
              <div className="text-sm font-semibold">{d.theme}</div>
            </button>
          ))}
        </div>

        {/* DAILY VIEW */}
        <div className="grid md:grid-cols-12 gap-6">

          {/* LEFT */}
          <div className="md:col-span-5 space-y-3">
            {blocks.map(b => (
              <button
                key={b.id}
                onClick={() => setActiveId(b.id)}
                className={cn(
                  "w-full p-4 rounded-2xl border text-left transition",
                  activeId === b.id
                    ? "bg-slate-900 text-white"
                    : b.optional
                      ? "bg-slate-100 text-slate-600"
                      : "bg-white"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{b.title}</div>
                  {b.optional && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full border">
                      Optional
                    </span>
                  )}
                </div>
                <div className="text-xs opacity-80 mt-1">
                  {b.time} • {b.intent}
                </div>
              </button>
            ))}
          </div>

          {/* RIGHT */}
          <div className="md:col-span-7">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border bg-white p-6"
            >
              <div className="text-lg font-semibold mb-3">
                {active.title}
              </div>

              {active.meetingTypes && (
                <div className="flex gap-2 mb-4">
                  {active.meetingTypes.map(t => (
                    <button
                      key={t}
                      onClick={() => setMeetingType(t)}
                      className={cn(
                        "px-3 py-1 rounded-full border text-xs",
                        meetingType === t
                          ? "bg-slate-900 text-white"
                          : "bg-white"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-4">
                <Section title="AI prepares" items={aiItems} />
                <Section title="Leader decides" items={humanItems} />
                <Section title="Outputs" items={outItems} />
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */
function Section({ title, items }) {
  return (
    <div>
      <div className="text-sm font-semibold mb-2">{title}</div>
      <ul className="text-sm space-y-1">
        {items.map((i, idx) => (
          <li key={idx}>• {i}</li>
        ))}
      </ul>
    </div>
  );
}
