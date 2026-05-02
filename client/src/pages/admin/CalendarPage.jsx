import React, { useState, useEffect } from "react";
import {
  MdOutlineKeyboardArrowLeft,
  MdOutlineKeyboardArrowRight,
} from "react-icons/md";
import DeploymentDetailsModal from "../../components/modals/DeploymentDetailsModal";
import useGetAllTruck from "../../hooks/useGetAllTruck";
import useGetAllDriver from "../../hooks/useGetAllDriver";
import ReplacementHistoryModal from "../../components/modals/ReplacementHistoryModal";
import useGetAllDeployment from "../../hooks/useGetAllDeployment";
import clsx from "clsx";
import { TableError, TableLoading } from "../../components/TablesState";

/* ── Shared button base (mirrors Deployments page) ─────────────────────── */
const btnBase =
  "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium cursor-pointer active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed";

function CalendarPage() {
  const { getAllDeploymentFunction, isLoading: isDeploymentsLoading } =
    useGetAllDeployment();
  const { getAllTruckFunction, isLoading: isTruckLoading } = useGetAllTruck();
  const { getAllDriverFunction, isLoading: isDriverLoading } =
    useGetAllDriver();

  const [allDeployments, setAllDeployments] = useState([]);
  const [allTrucks, setAllTrucks] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [deploymentsError, setDeploymentsError] = useState(null);
  const [truckError, setTruckError] = useState(null);
  const [driverError, setDriverError] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDeployment, setSelectedDeployment] = useState({});
  const [view, setView] = useState("month");
  const [isDeploymentDetailsModalOpen, setIsDeploymentDetailsModalOpen] =
    useState(false);
  const [isReplacementModalOpen, setIsReplacementModalOpen] = useState(false);
  const [showReplacementHistory, setShowReplacementHistory] = useState(false);

  useEffect(() => {
    const handleGetAllDeployments = async () => {
      const { deployments, error } = await getAllDeploymentFunction({
        sort: "latest",
        perPage: 99999,
      });
      if (error) setDeploymentsError(error);
      setAllDeployments(deployments || []);
    };
    const handleGetAllTrucks = async () => {
      const { trucks, error } = await getAllTruckFunction({});
      if (error) setTruckError(error);
      setAllTrucks(trucks || []);
    };
    const handleGetAllDrivers = async () => {
      const { drivers, error } = await getAllDriverFunction({});
      if (error) setDriverError(error);
      setAllDrivers(drivers || []);
    };
    handleGetAllDeployments();
    handleGetAllTrucks();
    handleGetAllDrivers();
  }, []);

  const handleDeploymentSelect = (deployment) => {
    setSelectedDeployment(deployment);
    setIsDeploymentDetailsModalOpen(true);
  };

  // ─── helpers ───────────────────────────────────────────────────────────────

  const toManilaDateStr = (date) =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);

  const formatTime = (date) =>
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Manila",
    });

  const capitalize = (str) =>
    str
      ? str
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")
      : str;

  // ─── color based on event type, not current deployment status ─────────────
  const getStatusColor = (deployment, eventType) => {
    if (deployment.status === "canceled") return "red";

    if (eventType === "created") return "orange";
    if (eventType === "departed") return "emerald";
    if (eventType?.startsWith("pickupIn")) return "emerald";
    if (eventType?.startsWith("pickupOut")) return "emerald";
    if (eventType === "destArrival") return "emerald";
    if (eventType === "destDeparture") return "blue";

    const map = {
      preparing: "orange",
      ongoing: "emerald",
      completed: "blue",
      canceled: "red",
    };
    return map[deployment.status] || "emerald";
  };

  const colorKeyToStatus = (colorKey) => {
    const map = {
      orange: "preparing",
      emerald: "ongoing",
      blue: "completed",
      red: "canceled",
    };
    return map[colorKey] || "ongoing";
  };

  /* Status badge */
  const StatusBadge = ({ colorKey }) => {
    const label = colorKeyToStatus(colorKey);
    return (
      <span
        className={clsx(
          "px-1.5 py-0.5 rounded-full text-[9px] font-medium w-fit capitalize leading-none",
          {
            "bg-orange-50 text-orange-500": colorKey === "orange",
            "bg-emerald-50 text-emerald-600": colorKey === "emerald",
            "bg-blue-50 text-blue-500": colorKey === "blue",
            "bg-red-50 text-red-500": colorKey === "red",
          },
        )}
      >
        {label}
      </span>
    );
  };

  const getTruckPlate = (deployment) => {
    if (!deployment) return "UNKNOWN TRUCK";
    return (
      deployment.replacement?.replacementTruckId?.plateNo?.toUpperCase() ||
      deployment.truckId?.plateNo?.toUpperCase() ||
      "UNKNOWN TRUCK"
    );
  };

  const getDriverName = (deployment) => {
    if (!deployment) return "Unknown Driver";
    if (deployment.replacement?.replacementDriverId) {
      const d = deployment.replacement.replacementDriverId;
      return capitalize(`${d.firstname} ${d.lastname}`);
    }
    return (
      capitalize(
        `${deployment.driverId?.firstname ?? ""} ${
          deployment.driverId?.lastname ?? ""
        }`.trim(),
      ) || "Unknown Driver"
    );
  };

  // ─── color maps ────────────────────────────────────────────────────────────

  const colorMap = {
    orange: {
      border: "border-l-orange-400",
      bg: "bg-orange-50",
      text: "text-orange-600",
      dot: "bg-orange-400",
      timeText: "text-orange-500",
      badge: "bg-orange-100 text-orange-600",
    },
    emerald: {
      border: "border-l-emerald-500",
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      dot: "bg-emerald-400",
      timeText: "text-emerald-600",
      badge: "bg-emerald-100 text-emerald-700",
    },
    blue: {
      border: "border-l-blue-500",
      bg: "bg-blue-50",
      text: "text-blue-600",
      dot: "bg-blue-400",
      timeText: "text-blue-500",
      badge: "bg-blue-100 text-blue-600",
    },
    red: {
      border: "border-l-red-400",
      bg: "bg-red-50",
      text: "text-red-500",
      dot: "bg-red-400",
      timeText: "text-red-500",
      badge: "bg-red-100 text-red-500",
    },
  };

  // ─── build calendar events ─────────────────────────────────────────────────

  const getCalendarEvents = () => {
    const events = [];

    const makeEvent = (deployment, timestamp, eventType, title) => {
      if (!timestamp) return null;
      const eventDate =
        timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(eventDate.getTime())) return null;
      return {
        id: `${deployment._id}-${eventType}`,
        deploymentId: deployment._id,
        title,
        shortTitle: title,
        deploymentCode: deployment.deploymentCode || "",
        truckPlate: getTruckPlate(deployment),
        formattedTime: formatTime(eventDate),
        start: eventDate,
        end: eventDate,
        type: eventType,
        deployment,
        colorKey: getStatusColor(deployment, eventType),
        rawTimestamp: timestamp,
      };
    };

    allDeployments.forEach((deployment) => {
      // ── Deployment created / canceled ──
      const pickupSites = (deployment.pickups || [])
        .map((p) => p.pickupSite)
        .filter(Boolean)
        .map((s) => capitalize(s))
        .join(", ");

      const createdTitle =
        deployment.status === "canceled"
          ? "Deployment Canceled"
          : `Assigned at ${pickupSites || "Unknown Site"}`;

      const createdEvent = makeEvent(
        deployment,
        deployment.createdAt,
        "created",
        createdTitle,
      );
      if (createdEvent) events.push(createdEvent);

      // ── Departed from station ──
      const departedEvent = makeEvent(
        deployment,
        deployment.departed,
        "departed",
        "Departed from Station",
      );
      if (departedEvent) events.push(departedEvent);

      // ── Per-stop pickup events ──
      (deployment.pickups || []).forEach((stop, index) => {
        const isMultiStop = (deployment.pickups || []).length >= 2;
        const stopSuffix = isMultiStop ? ` (Stop #${index + 1})` : "";
        const siteName = capitalize(
          stop.pickupSite || `Pickup Site${stopSuffix}`,
        );

        if (stop.pickupIn) {
          const ev = makeEvent(
            deployment,
            stop.pickupIn,
            `pickupIn-${index}`,
            `Arrived at ${siteName}${isMultiStop ? ` (Stop #${index + 1})` : ""}`,
          );
          if (ev) events.push(ev);
        }
        if (stop.pickupOut) {
          const ev = makeEvent(
            deployment,
            stop.pickupOut,
            `pickupOut-${index}`,
            `Departed from ${siteName}${isMultiStop ? ` (Stop #${index + 1})` : ""}`,
          );
          if (ev) events.push(ev);
        }
      });

      // ── Destination events ──
      const destName = capitalize(deployment.destination || "Destination");

      const destArrivalEvent = makeEvent(
        deployment,
        deployment.destArrival,
        "destArrival",
        `Arrived at ${destName}`,
      );
      if (destArrivalEvent) events.push(destArrivalEvent);

      const destDepartureEvent = makeEvent(
        deployment,
        deployment.destDeparture,
        "destDeparture",
        `Departed from ${destName}`,
      );
      if (destDepartureEvent) events.push(destDepartureEvent);
    });

    return events
      .filter((e) => e.start instanceof Date && !isNaN(e.start.getTime()))
      .sort((a, b) => b.start - a.start);
  };

  // ─── navigation ────────────────────────────────────────────────────────────

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() + 1);
    else if (view === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (view === "month") d.setMonth(d.getMonth() - 1);
    else if (view === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const handleDateCellClick = (date) => {
    setCurrentDate(date);
    setView("day");
  };

  // ─── date helpers ──────────────────────────────────────────────────────────

  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getMonthYearString = () =>
    currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

  const getWeekRangeString = () => {
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const fmt = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString(
      "en-US",
      fmt,
    )} – ${end.toLocaleDateString("en-US", fmt)}`;
  };

  // ─── EventChip (month / week) ─────────────────────────────────────────────

  const EventChip = ({ event }) => {
    const c = colorMap[event.colorKey] || colorMap.emerald;

    return (
      <div
        className={clsx(
          "flex items-start pl-2 pr-1.5 py-1 rounded-md cursor-pointer",
          "border-l-2 shadow-sm hover:brightness-95 active:scale-[0.99] transition-all",
          c.border,
          c.bg,
        )}
        onClick={() => handleDeploymentSelect(event.deployment)}
        title={`${event.deploymentCode} · ${event.truckPlate} · ${event.shortTitle} at ${event.formattedTime}`}
      >
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center justify-between gap-1">
            <span
              className={clsx(
                "text-[10px] font-bold leading-none truncate tracking-wide",
                c.text,
              )}
            >
              {event.deploymentCode}
            </span>
            <span className="text-[10px] text-gray-400 shrink-0 leading-none font-medium">
              {event.formattedTime}
            </span>
          </div>
          <div className="text-[10px] text-gray-500">
            {/* truncate added, driver name appended */}
            <span className="font-semibold text-gray-600 block truncate">
              {event.truckPlate} · {getDriverName(event.deployment)}
            </span>
            <span className="text-gray-300">·</span>
            {event.shortTitle}
          </div>
        </div>
      </div>
    );
  };

  // ─── month view ────────────────────────────────────────────────────────────

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const events = getCalendarEvents();
    const weeks = [];
    let currentWeek = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      currentWeek.push(
        <td
          key={`pre-${i}`}
          className="bg-gray-50 border border-gray-100 relative p-0"
        >
          <div style={{ paddingBottom: "100%" }} />
        </td>,
      );
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        day,
      );
      const dayEvents = events.filter(
        (e) => toManilaDateStr(e.start) === toManilaDateStr(date),
      );
      const isToday = toManilaDateStr(date) === toManilaDateStr(new Date());

      currentWeek.push(
        <td
          key={day}
          className={clsx(
            "border border-gray-100 transition-colors cursor-pointer relative p-0",
            isToday
              ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
              : "bg-white hover:bg-gray-50",
          )}
          onClick={() => handleDateCellClick(date)}
        >
          <div style={{ paddingBottom: "100%" }} />
          <div className="absolute inset-0 flex flex-col overflow-hidden">
            <div
              className={clsx(
                "text-[11px] font-bold pt-1.5 pl-2 shrink-0",
                isToday ? "text-blue-600" : "text-gray-600",
              )}
            >
              {day}
            </div>
            <div
              className="flex-1 overflow-y-auto scrollbar-thin p-1 space-y-1.5 min-h-0"
              onClick={(e) => e.stopPropagation()}
            >
              {dayEvents.map((event) => (
                <EventChip key={event.id} event={event} />
              ))}
            </div>
          </div>
        </td>,
      );

      if (currentWeek.length === 7) {
        weeks.push(<tr key={`week-${weeks.length}`}>{currentWeek}</tr>);
        currentWeek = [];
      }
    }

    while (currentWeek.length > 0 && currentWeek.length < 7) {
      currentWeek.push(
        <td
          key={`post-${currentWeek.length}`}
          className="bg-gray-50 border border-gray-100 relative p-0"
        >
          <div style={{ paddingBottom: "100%" }} />
        </td>,
      );
    }

    if (currentWeek.length > 0) {
      weeks.push(<tr key={`week-${weeks.length}`}>{currentWeek}</tr>);
    }

    return weeks;
  };

  // ─── week view ─────────────────────────────────────────────────────────────

  const renderWeekView = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    const events = getCalendarEvents();

    const headers = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const isToday = toManilaDateStr(date) === toManilaDateStr(new Date());
      return (
        <th
          key={i}
          className={clsx(
            "w-[14.28%] p-3 text-center border-b border-gray-200",
            isToday ? "bg-blue-50" : "bg-white",
          )}
        >
          <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
            {date.toLocaleDateString("en-US", { weekday: "short" })}
          </div>
          <div
            className={clsx(
              "text-base font-bold mt-0.5",
              isToday ? "text-blue-600" : "text-gray-700",
            )}
          >
            {date.getDate()}
          </div>
        </th>
      );
    });

    const cells = Array.from({ length: 7 }).map((_, i) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayEvents = events.filter(
        (e) => toManilaDateStr(e.start) === toManilaDateStr(date),
      );
      const isToday = toManilaDateStr(date) === toManilaDateStr(new Date());

      return (
        <td
          key={i}
          className={clsx(
            "border border-gray-100 transition-colors align-top",
            isToday
              ? "bg-blue-50 ring-1 ring-inset ring-blue-200"
              : "bg-white hover:bg-gray-50",
          )}
          style={{ minHeight: "300px", height: "100%" }}
        >
          <div
            className="p-1.5 cursor-pointer h-full"
            style={{ minHeight: "300px" }}
            onClick={() => handleDateCellClick(date)}
          >
            <div onClick={(e) => e.stopPropagation()} className="space-y-1.5">
              {dayEvents.length > 0 ? (
                dayEvents.map((event) => (
                  <EventChip key={event.id} event={event} />
                ))
              ) : (
                <p className="text-[10px] italic text-gray-300 text-center py-4">
                  No events
                </p>
              )}
            </div>
          </div>
        </td>
      );
    });

    return (
      <>
        <thead className="sticky top-0 z-30 bg-white">
          <tr>{headers}</tr>
        </thead>
        <tbody className="h-full">
          <tr className="h-full">{cells}</tr>
        </tbody>
      </>
    );
  };

  // ─── day view ──────────────────────────────────────────────────────────────

  const renderDayView = () => {
    const events = getCalendarEvents().filter(
      (e) => toManilaDateStr(e.start) === toManilaDateStr(currentDate),
    );

    if (events.length === 0) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs italic text-gray-400 font-light mt-6">
            No deployment events for this day
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2">
        {events.map((event) => {
          const deployment = event.deployment;
          const c = colorMap[event.colorKey] || colorMap.emerald;
          const pickupSites = (deployment.pickups || [])
            .map((p) => p.pickupSite)
            .filter(Boolean)
            .map((s) => capitalize(s))
            .join(", ");

          return (
            <div
              key={event.id}
              onClick={() => handleDeploymentSelect(deployment)}
              className={clsx(
                "bg-white border border-gray-100 rounded-xl px-4 py-3",
                "cursor-pointer hover:bg-gray-50 hover:shadow-sm transition-all duration-150",
                "border-l-4",
                c.border,
                /* desktop: single row, mobile: 3-row block */
                "flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3",
              )}
            >
              {/* ── Row 1 (mobile) / single col (desktop): badge + time ── */}
              <div className="flex items-center justify-between sm:contents gap-2">
                <span
                  className={clsx(
                    "text-[10px] font-bold tracking-wide shrink-0 py-0.5 px-2 rounded-full",
                    c.badge,
                  )}
                >
                  {event.deploymentCode}
                </span>

                {/* Divider — desktop only */}
                <div className="hidden sm:block w-px h-6 bg-gray-100 shrink-0" />

                {/* Time — top-right on mobile, right col on desktop */}
                <p
                  className={clsx(
                    "sm:hidden text-[10px] font-semibold leading-none shrink-0",
                    c.timeText,
                  )}
                >
                  {event.formattedTime}
                </p>
              </div>

              {/* ── Row 2 (mobile): title ── */}
              <p className="text-xs font-semibold text-gray-700 leading-none truncate capitalize sm:flex-1 sm:min-w-0">
                {event.shortTitle}
              </p>

              {/* ── Row 3 (mobile): truck · driver · sites + status badge ── */}
              <div className="flex items-center justify-between sm:contents gap-2">
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-light min-w-0">
                  <span className="font-medium text-gray-500 uppercase tracking-wide shrink-0">
                    {event.truckPlate}
                  </span>
                  <span className="text-gray-200 shrink-0">·</span>
                  <span className="truncate">{getDriverName(deployment)}</span>
                  {pickupSites && (
                    <>
                      <span className="text-gray-200 shrink-0">·</span>
                      <span className="truncate">{pickupSites}</span>
                    </>
                  )}
                </div>
                <StatusBadge colorKey={event.colorKey} />
              </div>

              {/* Time + status — desktop right col */}
              <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
                <p
                  className={clsx(
                    "text-[10px] font-semibold leading-none",
                    c.timeText,
                  )}
                >
                  {event.formattedTime}
                </p>
                <StatusBadge colorKey={event.colorKey} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ─── loading / error states ────────────────────────────────────────────────

  if (isDeploymentsLoading || isDriverLoading || isTruckLoading) {
    return <TableLoading />;
  }

  if (deploymentsError || truckError || driverError) {
    return <TableError />;
  }

  // ─── render ────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="flex-1 flex flex-col gap-2 sm:gap-4 lg:gap-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap max-sm:flex-col justify-between xl:items-start gap-y-2">
          <div className="flex justify-between flex-1 items-center">
            <div className="flex flex-col max-sm:flex-row max-sm:items-center max-sm:gap-2 w-full max-sm:justify-between">
              <h1 className="font-semibold text-base xs:text-lg sm:text-xl text-gray-800">
                Calendar
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {view === "month" && getMonthYearString()}
                {view === "week" && getWeekRangeString()}
                {view === "day" &&
                  currentDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
              </p>
            </div>
          </div>

          <div className="max-sm:flex-1 flex max-sm:flex-col justify-between gap-2 sm:gap-4">
            <div className="hidden xl:block flex-1" />
            <div className="flex gap-2 max-sm:justify-between max-sm:w-full">
              {/* Prev / Today / Next */}
              <div className="flex items-center bg-white border border-gray-200 rounded-md overflow-hidden text-xs">
                <button
                  onClick={prevPeriod}
                  className="p-2 py-1 text-xl hover:bg-gray-50 cursor-pointer border-r border-gray-200 transition-colors"
                >
                  <MdOutlineKeyboardArrowLeft />
                </button>
                <button
                  onClick={goToToday}
                  className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer active:scale-95"
                >
                  Today
                </button>
                <button
                  onClick={nextPeriod}
                  className="p-2 py-1 text-xl hover:bg-gray-50 cursor-pointer border-l border-gray-200 transition-colors"
                >
                  <MdOutlineKeyboardArrowRight />
                </button>
              </div>

              {/* View switcher */}
              <div className="flex items-center bg-white border border-gray-200 rounded-md p-1 gap-0.5">
                {["month", "week", "day"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={clsx(
                      "px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 cursor-pointer capitalize",
                      view === v
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Calendar container ──────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col relative bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Month */}
          {view === "month" && (
            <div className="absolute inset-0 overflow-auto scrollbar-thin">
              <table
                className="border-collapse table-fixed w-full"
                style={{ minWidth: "1200px" }}
              >
                <colgroup>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <col key={i} style={{ width: "14.2857%" }} />
                  ))}
                </colgroup>
                <thead className="sticky top-0 z-30 bg-white">
                  <tr>
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <th
                          key={day}
                          className="p-3 text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200"
                        >
                          {day}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>{renderMonthView()}</tbody>
              </table>
            </div>
          )}

          {/* Week */}
          {view === "week" && (
            <div className="absolute inset-0 overflow-auto scrollbar-thin">
              <table
                className="border-collapse table-fixed w-full h-full"
                style={{ minWidth: "1200px", minHeight: "100%" }}
              >
                <colgroup>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <col key={i} style={{ width: "14.2857%" }} />
                  ))}
                </colgroup>
                {renderWeekView()}
              </table>
            </div>
          )}

          {/* Day */}
          {view === "day" && (
            <div className="absolute inset-0 overflow-y-auto scrollbar-thin bg-gray-50/50 p-3 sm:p-4">
              {renderDayView()}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <DeploymentDetailsModal
        isOpen={isDeploymentDetailsModalOpen}
        onClose={() => setIsDeploymentDetailsModalOpen(false)}
        deployment={selectedDeployment}
        drivers={allDrivers}
        trucks={allTrucks}
        openReplacementModal={() => setIsReplacementModalOpen(true)}
        openReplacementHistory={() => setShowReplacementHistory(true)}
        updatable={false}
      />
      <ReplacementHistoryModal
        isOpen={showReplacementHistory}
        onClose={() => setShowReplacementHistory(false)}
        deployment={selectedDeployment}
      />
    </>
  );
}

export default CalendarPage;
