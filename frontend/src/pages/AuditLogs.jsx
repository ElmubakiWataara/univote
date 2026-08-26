import { useState, useEffect, useMemo, useCallback } from "react";
import AdminLayout from "../components/AdminLayout";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import API_URL from "../config/api";
import {
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Inbox,
  AlertTriangle,
  Eye,
} from "lucide-react";

// ---------- Action → visual identity ----------
const ACTION_META = {
  VOTER_REGISTERED: { label: "Voter Registered", tone: "sky" },
  BULK_VOTER_REGISTERED: { label: "Bulk Registration", tone: "sky" },
  CANDIDATE_ADDED: { label: "Candidate Added", tone: "emerald" },
  CANDIDATE_UPDATED: { label: "Candidate Updated", tone: "emerald" },
  TOKEN_GENERATED: { label: "Token Generated", tone: "violet" },
  VOTE_CAST: { label: "Vote Cast", tone: "indigo" },
  BALLOT_SUBMITTED: { label: "Ballot Submitted", tone: "indigo" },
  ELECTION_TOGGLE: { label: "Election Toggled", tone: "amber" },
  ADMIN_CREATED: { label: "Admin Created", tone: "slate" },
  ADMIN_UPDATED: { label: "Admin Updated", tone: "slate" },
  ADMIN_DELETED: { label: "Admin Deleted", tone: "rose" },
};

const TONE_CLASSES = {
  sky: "bg-sky-50 text-sky-700 ring-1 ring-sky-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  violet: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
  indigo: "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100",
  amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
  slate: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  rose: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
};

const ActionBadge = ({ action }) => {
  const meta = ACTION_META[action] || { label: action, tone: "slate" };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${TONE_CLASSES[meta.tone]}`}
    >
      {meta.label}
    </span>
  );
};

// ---------- Details parsing ----------
const formatKey = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const parseDetails = (details) => {
  if (details == null || details === "") return null;
  if (typeof details === "string") {
    try {
      return JSON.parse(details);
    } catch {
      return details; // plain string
    }
  }
  return details;
};

// Flat text fallback, used for search-matching and for any details shape
// that isn't specifically handled by a custom renderer below.
const flattenToText = (value, depth = 0) => {
  if (value == null) return "—";

  if (Array.isArray(value)) {
    if (value.length === 0) return "None";
    return value
      .map((item) => flattenToText(item, depth + 1))
      .join(depth === 0 ? "\n" : ", ");
  }

  if (typeof value === "object") {
    return Object.entries(value)
      .map(
        ([key, val]) => `${formatKey(key)}: ${flattenToText(val, depth + 1)}`,
      )
      .join(depth === 0 ? "\n" : ", ");
  }

  return String(value);
};

const getSearchableText = (details) => {
  const parsed = parseDetails(details);
  if (parsed == null) return "";
  if (typeof parsed === "string") return parsed;
  return flattenToText(parsed);
};

// ---------- Details cell ----------
const META_FIELD_ORDER = [
  "voter_id",
  "student_id",
  "ip_address",
  "votes_cast",
  "full_skipped",
];

const MetaChip = ({ label, value }) => (
  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 text-xs ring-1 ring-slate-100">
    <span className="text-slate-400">{label}</span>
    <span className="font-medium text-slate-700">{String(value)}</span>
  </span>
);

const VotesList = ({ votes, expanded }) => {
  const visible = expanded ? votes : votes.slice(0, 2);
  return (
    <div className="rounded-xl ring-1 ring-slate-100 overflow-hidden">
      {visible.map((vote, i) => (
        <div
          key={i}
          className={`flex items-center justify-between gap-3 px-3 py-2 text-xs ${
            i % 2 === 0 ? "bg-white" : "bg-slate-50/60"
          }`}
        >
          <span className="text-slate-500 truncate">
            {vote.position || "—"}
          </span>
          <span className="font-medium text-slate-800 text-right truncate">
            {vote.candidate_name || `Candidate #${vote.candidate_id ?? "—"}`}
          </span>
        </div>
      ))}
      {!expanded && votes.length > 2 && (
        <div className="px-3 py-1.5 text-xs text-slate-400 bg-white border-t border-slate-50">
          +{votes.length - 2} more
        </div>
      )}
    </div>
  );
};

const DetailsCell = ({ details }) => {
  const [expanded, setExpanded] = useState(false);
  const parsed = parseDetails(details);

  if (parsed == null) {
    return <span className="text-slate-400 text-sm">—</span>;
  }

  if (typeof parsed === "string") {
    return <span className="text-sm text-slate-600">{parsed}</span>;
  }

  // Ballot / vote-shaped details: array of {position, candidate_name/candidate_id}
  if (Array.isArray(parsed.votes) && parsed.votes.length > 0) {
    const metaEntries = META_FIELD_ORDER.filter(
      (key) => parsed[key] !== undefined,
    ).map((key) => [key, parsed[key]]);

    return (
      <div className="max-w-sm">
        <VotesList votes={parsed.votes} expanded={expanded} />

        {metaEntries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {metaEntries.map(([key, value]) => (
              <MetaChip key={key} label={formatKey(key)} value={value} />
            ))}
          </div>
        )}

        {parsed.votes.length > 2 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-wine-600 hover:text-wine-700"
          >
            {expanded ? (
              <>
                Show less <ChevronUp size={12} strokeWidth={2.25} />
              </>
            ) : (
              <>
                <Eye size={12} strokeWidth={2.25} />
                Show all {parsed.votes.length} votes
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  // Generic object/array — flatten to readable text with a truncation toggle.
  const text = flattenToText(parsed);
  const isLong = text.length > 90 || text.includes("\n");

  return (
    <div className="max-w-md">
      <pre
        className={`font-sans whitespace-pre-wrap text-sm text-slate-600 ${expanded ? "" : "line-clamp-2"}`}
      >
        {text}
      </pre>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-wine hover:text-wine-70"
        >
          {expanded ? (
            <>
              Show less <ChevronUp size={12} strokeWidth={2.25} />
            </>
          ) : (
            <>
              Show more <ChevronDown size={12} strokeWidth={2.25} />
            </>
          )}
        </button>
      )}
    </div>
  );
};

const useDebouncedValue = (value, delayMs) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAll, setShowAll] = useState(false);

  const { token: authToken } = useAuth();
  const debouncedSearch = useDebouncedValue(search, 250);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`${API_URL}/api/super/audit-logs?limit=200`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setLogs(res.data.logs || []);
    } catch (err) {
      setError("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    const searchTerm = debouncedSearch.toLowerCase().trim();

    return logs.filter((log) => {
      let textMatch = true;
      if (searchTerm) {
        const actionLabel = (
          ACTION_META[log.action]?.label ||
          log.action ||
          ""
        ).toLowerCase();
        const detailsMatch = getSearchableText(log.details)
          .toLowerCase()
          .includes(searchTerm);

        let dateMatch = false;
        if (log.created_at) {
          const date = new Date(log.created_at);
          dateMatch =
            date.toLocaleDateString().toLowerCase().includes(searchTerm) ||
            date.toLocaleString().toLowerCase().includes(searchTerm) ||
            log.created_at.toLowerCase().includes(searchTerm);
        }

        textMatch =
          actionLabel.includes(searchTerm) || detailsMatch || dateMatch;
      }

      const actionTypeMatch = filter === "all" ? true : log.action === filter;
      return textMatch && actionTypeMatch;
    });
  }, [logs, debouncedSearch, filter]);

  const displayedLogs = showAll ? filteredLogs : filteredLogs.slice(0, 10);
  const hasActiveFilters = search.trim() !== "" || filter !== "all";

  return (
    <AdminLayout currentPage="settings">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              Audit Logs
            </h1>
            <p className="text-gray-500 mt-1.5 text-sm">
              {logs.length > 0
                ? `${logs.length} events recorded · complete system activity history`
                : "Complete system activity history"}
            </p>
          </div>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-50 hover:border-indigo-300 transition disabled:opacity-50 shadow-sm"
          >
            <RefreshCw
              size={15}
              strokeWidth={2}
              className={loading ? "animate-spin" : ""}
            />
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-6 px-5 py-4 rounded-2xl bg-rose-50 ring-1 ring-rose-100 text-rose-700 text-sm flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-medium">
              <AlertTriangle size={16} strokeWidth={2} />
              {error}
            </span>
            <button
              onClick={fetchLogs}
              className="font-semibold underline underline-offset-2 hover:opacity-80"
            >
              Try again
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-slate-100 p-5 mb-6 flex flex-col md:flex-row gap-3">
          <div className="relative w-full">
            <Search
              size={16}
              strokeWidth={2}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search action, details, or date…"
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent rounded-xl text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-3 bg-slate-50 border border-transparent rounded-xl text-sm outline-none transition focus:bg-white focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
          >
            <option value="all">All Actions</option>
            {Object.entries(ACTION_META).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
              className="px-4 py-3 text-sm font-medium text-slate-500 hover:text-indigo-600 transition whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Logs */}
        <div className="bg-white rounded-3xl shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Actor
                  </th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayedLogs.length > 0 ? (
                  displayedLogs.map((log, i) => {
                    const rowId = log.id ?? i;
                    return (
                      <tr
                        key={rowId}
                        className="hover:bg-slate-50/70 transition align-top"
                      >
                        <td className="px-8 py-5 text-sm text-slate-500 whitespace-nowrap tabular-nums">
                          {new Date(log.created_at).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-8 py-5">
                          <ActionBadge action={log.action} />
                        </td>
                        <td className="px-8 py-5 text-sm">
                          <span className="capitalize text-slate-700">
                            {log.actor_role}
                          </span>
                          <span className="text-slate-400 ml-1.5">
                            #{log.actor_id}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <DetailsCell details={log.details} />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-8 py-24 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <Inbox size={28} strokeWidth={1.5} />
                        <span className="text-sm">
                          {loading
                            ? "Loading logs…"
                            : hasActiveFilters
                              ? "No logs match your filters"
                              : "No activity yet"}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredLogs.length > 7 && (
            <div className="p-5 border-t border-slate-100 text-center">
              <button
                onClick={() => setShowAll(!showAll)}
                className="px-7 py-2.5 bg-brand-wine hover:bg-brand-wine/70 text-white text-sm font-semibold rounded-xl transition shadow-sm shadow-indigo-600/20"
              >
                {showAll ? "Show Less" : `Show All (${filteredLogs.length})`}
              </button>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AuditLogs;
