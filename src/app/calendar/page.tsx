"use client";

import { useEffect, useState, useMemo } from "react";
import { AppShell } from "@/components/app-shell";
import { ProtectedPage } from "@/components/protected-page";
import { DataService, CalendarEvent } from "@/services/dataService";
import { CalendarModal } from "@/components/calendar-modal";
import { CalendarEventDetailsModal } from "@/components/calendar-event-details-modal";
import { TaskModal } from "@/components/task-modal";
import { ConfirmModal } from "@/components/confirm-modal";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast";
import { SearchableSelect, SelectOption } from "@/components/searchable-select";

export default function CalendarPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Calendar view navigation
  const [viewDate, setViewDate] = useState(() => new Date());
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [query, setQuery] = useState("");

  // Modals
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedDateForNewEvent, setSelectedDateForNewEvent] = useState<string>("");
  const [selectedTypeForNewEvent, setSelectedTypeForNewEvent] = useState<"Meeting" | "Task" | "Content Deadline" | "Launch">("Meeting");
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<CalendarEvent | null>(null);

  const loadData = async () => {
    try {
      const data = await DataService.getEvents();
      setEvents(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener("insightone_storage_changed", handleStorageChange);
    window.addEventListener("insightone_supabase_changed", handleStorageChange);
    return () => {
      window.removeEventListener("insightone_storage_changed", handleStorageChange);
      window.removeEventListener("insightone_supabase_changed", handleStorageChange);
    };
  }, []);

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesQuery =
        !query.trim() ||
        `${ev.title} ${ev.client || ""} ${ev.description || ""}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesType = typeFilter === "ALL" || ev.type === typeFilter;
      return matchesQuery && matchesType;
    });
  }, [events, query, typeFilter]);

  // Calendar month calculation
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  const daysArray = useMemo(() => {
    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

    // Leading padding days from previous month
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevDate = new Date(year, month - 1, d);
      days.push({
        dateStr: prevDate.toISOString().split("T")[0],
        dayNum: d,
        isCurrentMonth: false,
      });
    }

    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
      const currDate = new Date(year, month, d);
      // Format as YYYY-MM-DD
      const mm = String(month + 1).padStart(2, "0");
      const dd = String(d).padStart(2, "0");
      days.push({
        dateStr: `${year}-${mm}-${dd}`,
        dayNum: d,
        isCurrentMonth: true,
      });
    }

    // Trailing padding days to fill 5 or 6 rows of 7
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      days.push({
        dateStr: nextDate.toISOString().split("T")[0],
        dayNum: i,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [year, month, daysInMonth, firstDayOfWeek]);

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setViewDate(new Date());
  };

  const handleCellClick = (dateStr: string) => {
    setSelectedDateForNewEvent(dateStr);
    setSelectedTypeForNewEvent("Meeting");
    setIsEventModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    try {
      const success = await DataService.deleteEvent(deletingEvent.id);
      if (success) {
        toast.success(`Event "${deletingEvent.title}" removed.`);
        setEvents((prev) => prev.filter((ev) => ev.id !== deletingEvent.id));
      } else {
        toast.error("Failed to delete event.");
      }
    } catch {
      toast.error("Failed to delete event.");
    } finally {
      setDeletingEvent(null);
    }
  };

  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "Meeting":
        return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
      case "Content Deadline":
        return "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100";
      case "Task":
        return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
      case "Launch":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
    }
  };

  return (
    <ProtectedPage>
      <AppShell
        title="Calendar"
        subtitle="Manage meetings, launches, tasks, and content deadlines across workspaces."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedDateForNewEvent(new Date().toISOString().split("T")[0]);
                setSelectedTypeForNewEvent("Content Deadline");
                setIsEventModalOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <span>+</span>
              <span>Content Deadline</span>
            </button>
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <span>+</span>
              <span>Add Task</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDateForNewEvent(new Date().toISOString().split("T")[0]);
                setSelectedTypeForNewEvent("Meeting");
                setIsEventModalOpen(true);
              }}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 shadow-sm transition"
            >
              <span>+</span>
              <span>Add Event</span>
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Calendar Toolbar */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Month Navigation */}
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-slate-900 min-w-[150px]">{monthName}</h2>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    aria-label="Previous month"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={handleToday}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    aria-label="Next month"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    →
                  </button>
                </div>
              </div>

              {/* Search & Filters */}
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter events..."
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400"
                />

                <SearchableSelect
                  placeholder="All Event Types"
                  options={[
                    { value: "ALL", label: "All Event Types" },
                    { value: "Meeting", label: "Meeting" },
                    { value: "Content Deadline", label: "Content Deadline" },
                    { value: "Task", label: "Task" },
                    { value: "Launch", label: "Launch" },
                  ] as SelectOption[]}
                  value={typeFilter}
                  onChange={(val: string) => setTypeFilter(val ?? "ALL")}
                  isClearable={false}
                  className="w-44"
                />

                {(query || typeFilter !== "ALL") && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setTypeFilter("ALL");
                    }}
                    className="rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Calendar Month Grid */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {/* Days of Week Header */}
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 py-3">
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Grid Cells */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-100">
              {daysArray.map((dayItem, index) => {
                const dayEvents = filteredEvents.filter((ev) => ev.date === dayItem.dateStr);

                return (
                  <div
                    key={`${dayItem.dateStr}-${index}`}
                    onClick={() => handleCellClick(dayItem.dateStr)}
                    className={`min-h-[110px] p-2 transition cursor-pointer flex flex-col justify-between group ${
                      dayItem.isCurrentMonth ? "bg-white hover:bg-blue-50/20" : "bg-slate-50/50 text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                          dayItem.isCurrentMonth ? "text-slate-800" : "text-slate-400"
                        }`}
                      >
                        {dayItem.dayNum}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold text-slate-400 transition">
                        + Add
                      </span>
                    </div>

                    {/* Events pills inside the date cell */}
                    <div className="mt-1 space-y-1 flex-1 overflow-y-auto max-h-[80px]">
                      {dayEvents.map((ev) => (
                        <div
                          key={String(ev.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingEvent(ev);
                          }}
                          className={`rounded-lg border px-1.5 py-0.5 text-[10px] font-medium leading-tight truncate transition cursor-pointer shadow-2xs ${getEventBadgeColor(
                            ev.type
                          )}`}
                          title={`${ev.title} (${ev.type})`}
                        >
                          <span className="font-bold mr-1">
                            {ev.startTime ? ev.startTime.slice(0, 5) : "•"}
                          </span>
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Schedule List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900 mb-3">All Scheduled Events ({filteredEvents.length})</h3>
            {filteredEvents.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredEvents.map((ev) => (
                  <div
                    key={String(ev.id)}
                    className="flex flex-col justify-between rounded-xl border border-slate-200 p-3.5 hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <StatusBadge status={ev.type} />
                        <span className="text-xs font-medium text-slate-500">{ev.date}</span>
                      </div>
                      <h4
                        onClick={() => setViewingEvent(ev)}
                        className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition cursor-pointer mt-1"
                      >
                        {ev.title}
                      </h4>
                      {ev.client && <div className="text-xs text-slate-400 mt-0.5">Client: {ev.client}</div>}
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-500">
                        {ev.startTime} - {ev.endTime}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setEditingEvent(ev)}
                          className="rounded px-2 py-0.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingEvent(ev)}
                          className="rounded px-2 py-0.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
                No events found matching your filter. Click any day on the calendar or "+ Add Event" to schedule.
              </div>
            )}
          </div>
        </div>

        {/* Add / Edit Calendar Event Modal */}
        <CalendarModal
          isOpen={isEventModalOpen || Boolean(editingEvent)}
          onClose={() => {
            setIsEventModalOpen(false);
            setEditingEvent(null);
          }}
          eventToEdit={editingEvent}
          initialDate={selectedDateForNewEvent}
          initialType={selectedTypeForNewEvent}
          onSaved={() => loadData()}
        />

        {/* Task Modal for Calendar "+ Add Task" button */}
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSaved={() => {
            loadData();
            toast.success("Task added to schedule and task list");
          }}
        />

        {/* View Calendar Event Details Modal */}
        <CalendarEventDetailsModal
          isOpen={Boolean(viewingEvent)}
          onClose={() => setViewingEvent(null)}
          event={viewingEvent}
          onEdit={(ev) => setEditingEvent(ev)}
          onDelete={(ev) => setDeletingEvent(ev)}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={Boolean(deletingEvent)}
          onClose={() => setDeletingEvent(null)}
          onConfirm={handleDelete}
          title="Delete Event"
          message={`Are you sure you want to delete event "${deletingEvent?.title}" from the calendar?`}
          confirmLabel="Delete Event"
        />
      </AppShell>
    </ProtectedPage>
  );
}
