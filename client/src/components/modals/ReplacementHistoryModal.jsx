import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import React, { useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { DateTime } from "luxon";
import clsx from "clsx";

function ReplacementHistoryModal({ isOpen, onClose, deployment }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown, true); // capture phase
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [isOpen]);

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
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3 border-b border-gray-200 shrink-0">
                <div>
                  <h2 className="text-gray-900 font-bold text-base max-md:text-sm">
                    Replacement History
                  </h2>
                  <p className="text-gray-400 text-xxs mt-0.5">
                    Original vs. replacement assignment details.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-md text-lg transition-all cursor-pointer shrink-0 ml-4"
                >
                  <IoClose />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
                <div className="px-6 py-5 max-md:px-4 max-md:py-4 flex flex-col gap-5">
                  {/* Original vs Replacement */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Original Assignment */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                        <h3 className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
                          Original Assignment
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
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
                        <div className="col-span-2">
                          <StaticField
                            label="Driver"
                            value={`${deployment?.driverId?.firstname} ${deployment?.driverId?.lastname}`}
                            isCapitalize
                          />
                        </div>
                      </div>
                    </div>

                    {/* Replacement Assignment */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <h3 className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
                          Replacement Assignment
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <StaticField
                          label="Plate No."
                          value={
                            deployment?.replacement?.replacementTruckId?.plateNo
                          }
                          isUppercase
                        />
                        <StaticField
                          label="Truck Type"
                          value={deployment?.replacement?.replacementTruckType}
                          isCapitalize
                        />
                        <div className="col-span-2">
                          <StaticField
                            label="Driver"
                            value={`${deployment?.replacement?.replacementDriverId?.firstname} ${deployment?.replacement?.replacementDriverId?.lastname}`}
                            isCapitalize
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Replacement Details */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-gray-400 shrink-0" />
                      <h3 className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
                        Replacement Details
                      </h3>
                    </div>
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-4">
                        <StaticField
                          label="Reason for Replacement"
                          value={deployment?.replacement?.reason?.replace(
                            /_/g,
                            " ",
                          )}
                          isCapitalize
                        />
                        <StaticField
                          label="Replaced At"
                          value={DateTime.fromISO(
                            deployment?.replacement?.replacedAt,
                          )
                            .setZone("Asia/Manila")
                            .toFormat("MMM d, yyyy - hh:mm a")}
                        />
                      </div>

                      {/* Remarks */}
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xxxs md:text-xxs font-semibold text-gray-500 uppercase tracking-wider">
                          Remarks
                        </span>
                        <div className="flex-1 bg-white border border-gray-200 rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5 min-h-16">
                          <p className="text-xs max-md:text-xxs text-gray-700 leading-relaxed">
                            {deployment?.replacement?.remarks || (
                              <span className="text-gray-400 italic">
                                No remarks provided.
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

/* ─── StaticField ───────────────────────────────────────────────────────── */
const StaticField = ({
  label,
  value,
  isCapitalize = false,
  isUppercase = false,
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xxxs md:text-xxs font-semibold text-gray-500 uppercase tracking-wider">
      {label}
    </span>
    <div
      className={clsx(
        "bg-white border border-gray-200 rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5 text-xs max-md:text-xxs font-medium text-gray-700",
        { capitalize: isCapitalize, uppercase: isUppercase },
      )}
    >
      {value || "N/A"}
    </div>
  </div>
);

export default ReplacementHistoryModal;
