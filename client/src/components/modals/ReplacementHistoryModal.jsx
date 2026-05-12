import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import React, { useEffect, useMemo } from "react";
import { IoClose } from "react-icons/io5";
import { DateTime } from "luxon";
import clsx from "clsx";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso) => {
  if (!iso) return "N/A";
  const dt = DateTime.fromISO(iso).setZone("Asia/Manila");
  return dt.isValid ? dt.toFormat("MMM d, yyyy – hh:mm a") : "N/A";
};

const driverName = (d) =>
  d ? `${d.firstname ?? ""} ${d.lastname ?? ""}`.trim() || "N/A" : "N/A";

// ─── Component ────────────────────────────────────────────────────────────────

function ReplacementHistoryModal({ isOpen, onClose, deployment }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen, onClose]);

  const replacementEvents = useMemo(() => {
    const list = deployment?.replacements ?? [];
    return [...list].sort((a, b) => {
      const ta = a.replacedAt ? new Date(a.replacedAt).getTime() : 0;
      const tb = b.replacedAt ? new Date(b.replacedAt).getTime() : 0;
      return tb - ta;
    });
  }, [deployment]);

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog onClose={() => {}} className="relative z-50">
        <TransitionChild
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4 max-md:p-2">
          <TransitionChild
            as={React.Fragment}
            enter="duration-500 ease-out"
            enterFrom="-translate-y-full opacity-0"
            enterTo="translate-y-0 opacity-100"
            leave="duration-400 ease-in"
            leaveFrom="translate-y-0 opacity-100"
            leaveTo="-translate-y-full opacity-0"
          >
            <DialogPanel className="font-poppins w-full max-w-3xl rounded-xl bg-white shadow-lg overflow-hidden flex flex-col max-h-[88vh] max-md:max-h-[80vh]">
              {/* ── Header ── */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3 border-b border-gray-200 shrink-0">
                <div>
                  <h2 className="text-gray-900 font-bold text-base max-md:text-sm">
                    Replacement History
                  </h2>
                  <p className="text-gray-400 text-xxs mt-0.5">
                    Latest replacements shown first, original assignment at the
                    bottom.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-md text-lg transition-all cursor-pointer shrink-0 ml-4"
                >
                  <IoClose />
                </button>
              </div>

              {/* ── Body (scrollable) ── */}
              <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
                <div className="px-6 py-5 max-md:px-4 max-md:py-4 flex flex-col gap-4">
                  <section className="flex flex-col gap-4">
                    <SectionLabel
                      color="bg-blue-400"
                      label={`History (${replacementEvents.length + 1})`}
                    />

                    {replacementEvents.map((entry, idx) => (
                      <ReplacementEntry
                        key={idx}
                        entry={entry}
                        isLatest={idx === 0}
                      />
                    ))}

                    <OriginalEntry deployment={deployment} />
                  </section>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

// ─── ReplacementEntry ─────────────────────────────────────────────────────────

function ReplacementEntry({ entry, isLatest }) {
  return (
    <div className="flex gap-3">
      {/* Card */}
      <div className="flex-1 pb-2">
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          {/* Card header — date left, badge right */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white flex-wrap gap-2">
            <span className="text-gray-500 text-xxs">
              {formatDate(entry.replacedAt)}
            </span>
            {isLatest && (
              <span className="text-xxs font-semibold px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-600 border-emerald-200">
                Current
              </span>
            )}
          </div>

          {/* Card body */}
          <div className="p-4 max-sm:p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Row 1: Truck + Driver */}
              <StaticField
                label="Plate No."
                value={entry.replacementTruckId?.plateNo}
                isUppercase
              />
              <StaticField
                label="Truck Type"
                value={entry.replacementTruckType}
                isCapitalize
              />
              <StaticField
                label="Driver"
                value={driverName(entry.replacementDriverId)}
                isCapitalize
              />

              <StaticField
                label="Reason"
                value={entry.reason?.replace(/_/g, " ")}
                isCapitalize
              />

              <div className="col-span-2">
                <StaticField
                  label="Remarks"
                  value={entry.remarks || " "}
                  isCapitalize
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── OriginalEntry ────────────────────────────────────────────────────────────

function OriginalEntry({ deployment }) {
  return (
    <div className="flex gap-3">
      {/* Card */}
      <div className="flex-1 pb-2">
        <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          {/* Card header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white">
            <span className="text-gray-500 text-xxs">Original Assignment</span>
            <span className="text-xxs font-semibold px-2 py-0.5 rounded-full border bg-orange-100 text-orange-500 border-orange-200">
              Original
            </span>
          </div>

          {/* Card body */}
          <div className="p-4 max-sm:p-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StaticField
                label="Plate No."
                value={deployment?.truckId?.plateNo}
                isUppercase
              />
              <StaticField
                label="Truck Type"
                value={deployment?.truckType}
                isCapitalize
              />
              <div className="col-span-2 sm:col-span-1">
                <StaticField
                  label="Driver"
                  value={driverName(deployment?.driverId)}
                  isCapitalize
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small reusables ──────────────────────────────────────────────────────────

const SectionLabel = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <span className={clsx("w-2 h-2 rounded-full shrink-0", color)} />
    <h3 className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
      {label}
    </h3>
  </div>
);

const StaticField = ({
  label,
  value,
  isCapitalize = false,
  isUppercase = false,
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider truncate">
      {label}
    </span>
    <div
      className={clsx(
        "bg-white border border-gray-200 rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 text-xs max-sm:text-xxs truncate transition-all",
        { capitalize: isCapitalize, uppercase: isUppercase },
      )}
    >
      {value || "N/A"}
    </div>
  </div>
);

export default ReplacementHistoryModal;
