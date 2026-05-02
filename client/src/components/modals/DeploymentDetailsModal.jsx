import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  ComboboxButton,
} from "@headlessui/react";
import clsx from "clsx";
import { IoClose } from "react-icons/io5";
import { DEPLOYMENT_STATUS } from "../../utils/generalOptions";
import { MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import useUpdateDeployment from "../../hooks/useUpdateDeployment";
import { toast } from "react-toastify";
import { HiDotsHorizontal } from "react-icons/hi";
import { NumericFormat } from "react-number-format";
import { useUserContext } from "../../contexts/UserContext";
import { useSettingsContext } from "../../contexts/SettingsContext";
import {
  TbDeviceFloppy,
  TbExchange,
  TbPencilMinus,
  TbPrinter,
  TbTrash,
  TbReportMoney,
  TbArrowBarToDown,
  TbArrowBigDownLines,
  TbArrowBigDownLine,
  TbArrowBigUpLine,
  TbReceipt,
} from "react-icons/tb";
import {
  RiEditLine,
  RiDeleteBin6Line,
  RiCloseLine,
  RiCheckLine,
} from "react-icons/ri";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { PiMapPinAreaFill } from "react-icons/pi";
import jsPDF from "jspdf";
import { API_DEPLOYMENT } from "../../utils/APIRoutes";
import axios from "axios";
import { SMC_HEADER_IMAGE } from "../../consts/base_64_images";
import { useRef } from "react";
import { FaCalendar } from "react-icons/fa";
import { exportTMOToPDF } from "../../utils/exportTMOToPDF";
import { RxDragHandleDots2 } from "react-icons/rx";
import ActionButton from "../ui/ActionButton";
import React from "react";

const MAX_PICKUPS = 10;

const defaultPickup = {
  pickupSite: "",
  municipality: "",
  fieldContactPerson: "",
  fieldContactPersonNo: "",
  scheduledPickupTime: "",
  estimatedWeightKg: "",
  pickupIn: "",
  pickupOut: "",
  sacksCount: 0,
};

const DotPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern
        id="dots-deployment-details"
        x="0"
        y="0"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="2" cy="2" r="1.2" fill="white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots-deployment-details)" />
  </svg>
);

function DeploymentDetailsModal({
  isOpen,
  onClose,
  trucks,
  drivers,
  deployment,
  onUpdate,
  openDeleteModal,
  openReplacementModal,
  openReplacementHistory,
  openPaySlipModal,
  updatable,
}) {
  const { userData } = useUserContext();
  const { settings } = useSettingsContext();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isReplacementShow, setIsReplacementShow] = useState(false);
  const [activeTab, setActiveTab] = useState("info");

  const [truckQuery, setTruckQuery] = useState("");
  const [driverQuery, setDriverQuery] = useState("");
  const [replacementTruckQuery, setReplacementTruckQuery] = useState("");
  const [replacementDriverQuery, setReplacementDriverQuery] = useState("");

  const { updateDeploymentFunction, isLoading } = useUpdateDeployment();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setEditForm((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handlePickupChange = (index, e) => {
    const { name, value } = e.target;
    setEditForm((prev) => {
      const updated = [...(prev.pickups || [])];
      updated[index] = { ...updated[index], [name]: value };
      return { ...prev, pickups: updated };
    });
  };

  const handlePickupNumericChange = (index, name, floatValue) => {
    setEditForm((prev) => {
      const updated = [...(prev.pickups || [])];
      updated[index] = { ...updated[index], [name]: floatValue || "" };
      return { ...prev, pickups: updated };
    });
  };

  const addPickupStop = () => {
    if ((editForm.pickups?.length || 0) >= MAX_PICKUPS) return;
    setEditForm((prev) => ({
      ...prev,
      pickups: [...(prev.pickups || []), { ...defaultPickup }],
    }));
  };

  const removePickupStop = (index) => {
    if ((editForm.pickups?.length || 0) <= 1) return;
    setEditForm((prev) => ({
      ...prev,
      pickups: prev.pickups.filter((_, i) => i !== index),
    }));
  };

  // ── Drag-and-drop reorder ──────────────────────────────────────────────────
  const reorderPickups = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    setEditForm((prev) => {
      const updated = [...(prev.pickups || [])];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      return { ...prev, pickups: updated };
    });
  };

  const handleComboboxChange = (name, value) => {
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setEditForm((prev) => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: value },
      }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdateDeployment = async (e) => {
    e.preventDefault();
    const result = await updateDeploymentFunction(deployment._id, editForm);
    if (result.success) {
      onUpdate(result.data.deployment);
      toast.success(result.data.message);
      onClose();
    } else {
      toast.error(result.error);
    }
  };

  const capitalizeWords = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split(" ")
      .map((word) =>
        word.includes("(") || word.includes(")")
          ? word.replace(/\b\w/g, (c) => c.toUpperCase())
          : word.charAt(0).toUpperCase() + word.slice(1),
      )
      .join(" ");
  };

  const formatTruckType = (type) =>
    type ? capitalizeWords(type.replace(/-/g, " ")) : "";

  const formatNumber = (value) => {
    if (!value || value === "" || isNaN(value)) return "";
    return parseFloat(value).toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const handlePrintTMO = () =>
    exportTMOToPDF(deployment, onUpdate, setEditForm);

  const handleCloseModal = () => {
    setEditForm(deployment);
    setIsReplacementShow(false);
    setTruckQuery("");
    setDriverQuery("");
    setReplacementTruckQuery("");
    setReplacementDriverQuery("");
    onClose();
  };

  const handleCancelEditMode = () => {
    setIsEditMode(false);
    setEditForm(deployment);
    setTruckQuery("");
    setDriverQuery("");
    setReplacementTruckQuery("");
    setReplacementDriverQuery("");
  };

  useEffect(() => {
    if (isOpen && deployment) {
      setIsEditMode(false);
      setEditForm(deployment);
      setActiveTab("info");
    }
  }, [isOpen, deployment]);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = (e) => {
      if (e.matches && activeTab === "timelines") setActiveTab("info");
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [activeTab]);

  useEffect(() => {
    if (deployment?.replacement?.replacementTruckId?._id) {
      setIsReplacementShow(true);
    } else {
      setIsReplacementShow(false);
    }
  }, [deployment, isOpen]);

  const filteredTrucks =
    trucks?.filter(
      (t) =>
        t.status === "available" &&
        (t.plateNo.toLowerCase().includes(truckQuery.toLowerCase()) ||
          t.truckType.toLowerCase().includes(truckQuery.toLowerCase())),
    ) || [];

  const filteredDrivers =
    drivers?.filter(
      (d) =>
        d.status === "available" &&
        (d.firstname.toLowerCase().includes(driverQuery.toLowerCase()) ||
          d.lastname.toLowerCase().includes(driverQuery.toLowerCase())),
    ) || [];

  const filteredReplacementTrucks =
    trucks?.filter(
      (t) =>
        t.plateNo.toLowerCase().includes(replacementTruckQuery.toLowerCase()) ||
        t.truckType.toLowerCase().includes(replacementTruckQuery.toLowerCase()),
    ) || [];

  const filteredReplacementDrivers =
    drivers?.filter(
      (d) =>
        d.firstname
          .toLowerCase()
          .includes(replacementDriverQuery.toLowerCase()) ||
        d.lastname.toLowerCase().includes(replacementDriverQuery.toLowerCase()),
    ) || [];

  const currentTruckId = isReplacementShow
    ? editForm?.replacement?.replacementTruckId?._id
    : editForm?.truckId?._id;
  const currentDriverId = isReplacementShow
    ? editForm?.replacement?.replacementDriverId?._id
    : editForm?.driverId?._id;
  const currentTruck = trucks?.find((t) => t._id === currentTruckId);
  const currentDriver = drivers?.find((d) => d._id === currentDriverId);

  const pickups = editForm?.pickups || [];
  const lastPickupOut = pickups[pickups.length - 1]?.pickupOut;

  const statusColorMap = {
    preparing: "bg-orange-50 text-orange-600 border-orange-100",
    ongoing: "bg-emerald-50 text-emerald-600 border-emerald-100",
    completed: "bg-blue-50 text-blue-600 border-blue-100",
    canceled: "bg-red-50 text-red-600 border-red-100",
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleCloseModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog onClose={() => {}} className="relative z-50">
        {/* ── Backdrop ── */}
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

        <div className="fixed inset-0 flex items-center justify-center p-4 max-sm:p-2">
          {/* ── Panel slide-from-top transition (matches other modals) ── */}
          <TransitionChild
            as={React.Fragment}
            enter="duration-500 ease-out"
            enterFrom="-translate-y-full opacity-0"
            enterTo="translate-y-0 opacity-100"
            leave="duration-400 ease-in"
            leaveFrom="translate-y-0 opacity-100"
            leaveTo="-translate-y-full opacity-0"
          >
            <DialogPanel
              className={clsx(
                "font-poppins text-gray-900 w-full max-w-6xl rounded-xl bg-white shadow-lg overflow-hidden flex flex-col lg:flex-row",
                ["head_admin", "admin"].includes(userData.data.role)
                  ? "h-[80vh]"
                  : "h-[72vh]",
              )}
            >
              {/* ══ LEFT PANEL ══════════════════════════════════════════════════ */}
              <div
                className="relative flex flex-col overflow-hidden lg:w-72 shrink-0"
                style={{
                  background:
                    "linear-gradient(155deg, #020617 0%, #001e36 55%, #0f172a 100%)",
                }}
              >
                <DotPattern />

                {/* Header for small screen */}
                <div className="px-6 py-4 flex justify-between lg:hidden">
                  <div className="flex flex-col items-start">
                    <span className="text-white/50 text-xxxs max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5">
                      DP Code
                    </span>
                    <span className="text-white/90 text-xs max-md:text-[0.6rem] font-medium font-mono tracking-wide">
                      {deployment?.deploymentCode}
                    </span>
                  </div>

                  {["head_admin", "admin"].includes(userData?.data?.role) ? (
                    <>
                      <div className="flex flex-col items-start">
                        <span className="text-white/50 text-xxxs max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5">
                          TMO
                        </span>

                        <span className="text-white/90 text-xs max-md:text-[0.6rem] font-medium">
                          {deployment?.isTMOPrinted ? (
                            <span className="flex items-center max-sm:gap-1.5 gap-2">
                              Printed{" "}
                              <div className="max-sm:w-1.5 max-sm:h-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                            </span>
                          ) : (
                            <span className="flex items-center max-sm:gap-1.5 gap-2">
                              Not Printed{" "}
                              <div className="max-sm:w-1.5 max-sm:h-1.5 w-2 h-2 rounded-full bg-red-400" />
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col items-start">
                        <span className="text-white/50 text-xxxs max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5">
                          Pay Slip
                        </span>

                        <span className="text-white/90 text-xs max-md:text-[0.6rem] font-medium">
                          {deployment?.isPaySlipPrinted ? (
                            <span className="flex items-center max-sm:gap-1.5 gap-2">
                              Printed{" "}
                              <div className="max-sm:w-1.5 max-sm:h-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                            </span>
                          ) : (
                            <span className="flex items-center max-sm:gap-1.5 gap-2">
                              Not Printed{" "}
                              <div className="max-sm:w-1.5 max-sm:h-1.5 w-2 h-2 rounded-full bg-red-400" />
                            </span>
                          )}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-start">
                        <span className="text-white/50 text-xxxs max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5">
                          Pickup Stops
                        </span>

                        <span className="text-white/90 text-xs max-md:text-[0.6rem] font-medium">
                          {deployment?.pickups?.length}{" "}
                          {deployment?.pickups?.length > 1 ? "Stops" : "Stop"}
                        </span>
                      </div>

                      <div className="flex flex-col items-start">
                        <span className="text-white/50 text-xxxs max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5">
                          Status
                        </span>

                        <span className="text-white/90 text-xs max-md:text-[0.6rem] font-medium capitalize">
                          <span className="flex items-center max-sm:gap-1.5 gap-2">
                            {deployment?.status}
                            <div
                              className={clsx(
                                "max-sm:w-1.5 max-sm:h-1.5 w-2 h-2 rounded-full",
                                {
                                  "bg-orange-500":
                                    deployment?.status === "preparing",
                                  "bg-emerald-600":
                                    deployment?.status === "ongoing",
                                  "bg-blue-500":
                                    deployment?.status === "completed",
                                  "bg-red-500":
                                    deployment?.status === "canceled",
                                },
                              )}
                            />
                          </span>
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Header */}
                <div
                  className="relative z-10 max-sm:p-0 px-6 pt-6 pb-4 shrink-0 lg:border-b border-white/10 max-lg:hidden"
                  style={{
                    background:
                      "linear-gradient(155deg, #020617 0%, #001e36 55%, #0f172a 100%)",
                  }}
                >
                  <div>
                    <h2 className="text-white font-bold text-base max-sm:text-sm leading-tight">
                      Timeline Log
                    </h2>
                    <p className="text-white/40 text-xxs mt-0.5">
                      Track each event in real-time order.
                    </p>
                  </div>
                </div>

                {/* Timeline — desktop only */}
                <div className="relative z-10 flex-1 overflow-y-auto px-6 py-4 max-sm:px-4 max-sm:py-4 max-lg:hidden [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/30 [scrollbar-color:rgba(255,255,255,0.2)_transparent] scrollbar-thin">
                  <div className="flex flex-col">
                    <DarkTimelineStop
                      isActive={!!editForm.createdAt}
                      isLast={false}
                    >
                      <DarkTimelineDisplay
                        label="Assigned at"
                        value={editForm?.createdAt}
                      />
                    </DarkTimelineStop>

                    <DarkTimelineStop
                      isActive={!!editForm.departed?.trim()}
                      isLast={false}
                    >
                      {isEditMode ? (
                        <DarkInputField
                          label="Departed"
                          type="datetime-local"
                          name="departed"
                          value={editForm?.departed}
                          onChange={handleChange}
                        />
                      ) : (
                        <DarkTimelineDisplay
                          label="Departed"
                          value={deployment.departed}
                        />
                      )}
                    </DarkTimelineStop>

                    {(isEditMode
                      ? editForm.pickups
                      : deployment.pickups || []
                    ).map((pickup, index) => {
                      const prevPickupOut =
                        index === 0
                          ? isEditMode
                            ? editForm.departed
                            : deployment.departed
                          : isEditMode
                            ? editForm.pickups?.[index - 1]?.pickupOut
                            : deployment.pickups?.[index - 1]?.pickupOut;
                      const multiStop =
                        (isEditMode
                          ? editForm.pickups?.length
                          : deployment.pickups?.length) > 1;
                      return (
                        <div key={index}>
                          {multiStop && (
                            <DarkTimelineLabel
                              isActive={!!prevPickupOut}
                              label={`Stop ${index + 1}${
                                pickup.pickupSite
                                  ? ` — ${pickup.pickupSite}`
                                  : ""
                              }`}
                            />
                          )}
                          <DarkTimelineStop
                            isActive={!!pickup.pickupIn?.trim()}
                            isLast={false}
                          >
                            {isEditMode ? (
                              <DarkInputField
                                label="Pick-up In"
                                type="datetime-local"
                                name="pickupIn"
                                value={pickup.pickupIn}
                                disabled={!prevPickupOut}
                                onChange={(e) => handlePickupChange(index, e)}
                              />
                            ) : (
                              <DarkTimelineDisplay
                                label="Pick-up In"
                                value={pickup.pickupIn}
                              />
                            )}
                          </DarkTimelineStop>
                          <DarkTimelineStop
                            isActive={!!pickup.pickupOut?.trim()}
                            isLast={false}
                          >
                            {isEditMode ? (
                              <DarkInputField
                                label="Pick-up Out"
                                type="datetime-local"
                                name="pickupOut"
                                value={pickup.pickupOut}
                                disabled={!pickup.pickupIn}
                                onChange={(e) => handlePickupChange(index, e)}
                              />
                            ) : (
                              <DarkTimelineDisplay
                                label="Pick-up Out"
                                value={pickup.pickupOut}
                              />
                            )}
                          </DarkTimelineStop>
                        </div>
                      );
                    })}

                    <DarkTimelineStop
                      isActive={!!editForm.destArrival?.trim()}
                      isLast={false}
                    >
                      {isEditMode ? (
                        <DarkInputField
                          label="Dest Arrival"
                          type="datetime-local"
                          name="destArrival"
                          value={editForm?.destArrival}
                          disabled={!lastPickupOut}
                          onChange={handleChange}
                        />
                      ) : (
                        <DarkTimelineDisplay
                          label="Dest Arrival"
                          value={deployment.destArrival}
                        />
                      )}
                    </DarkTimelineStop>

                    <DarkTimelineStop
                      isActive={!!editForm.destDeparture?.trim()}
                      isLast={false}
                    >
                      {isEditMode ? (
                        <DarkInputField
                          label="Dest Departure"
                          type="datetime-local"
                          name="destDeparture"
                          value={editForm?.destDeparture}
                          disabled={!editForm?.destArrival}
                          onChange={handleChange}
                        />
                      ) : (
                        <DarkTimelineDisplay
                          label="Dest Departure"
                          value={deployment.destDeparture}
                        />
                      )}
                    </DarkTimelineStop>

                    <DarkTimelineStop
                      isActive={!!editForm.destDeparture?.trim()}
                      isLast={true}
                    >
                      <div className="flex flex-col gap-1">
                        <p className="text-white/40 text-xxs font-semibold uppercase tracking-wider">
                          Unloading Time
                        </p>
                        {editForm?.destDeparture && editForm?.destArrival ? (
                          <div className="bg-white/10 border border-white/15 px-3 py-1 rounded-md break-all">
                            <span className="text-white/80 text-xs">
                              {(() => {
                                const { days, hours, minutes } =
                                  DateTime.fromISO(editForm.destDeparture).diff(
                                    DateTime.fromISO(editForm.destArrival),
                                    ["days", "hours", "minutes"],
                                  );
                                const totalHours = days * 24 + hours;
                                const fmt = () => {
                                  const p = [];
                                  if (days > 0) p.push(`${days}d`);
                                  if (hours > 0) p.push(`${hours}h`);
                                  if (minutes > 0)
                                    p.push(`${Math.floor(minutes)}m`);
                                  return (
                                    p.join(" ") || `${Math.floor(minutes)}m`
                                  );
                                };
                                const fmtH = () =>
                                  totalHours > 0
                                    ? `${totalHours}h${
                                        minutes > 0
                                          ? ` ${Math.floor(minutes)}m`
                                          : ""
                                      }`
                                    : `${Math.floor(minutes)}m`;
                                if (totalHours >= 24)
                                  return `${fmt()} (${fmtH()})`;
                                if (hours > 0)
                                  return `${hours}h ${Math.floor(minutes)}m`;
                                return `${Math.floor(minutes)}m`;
                              })()}
                            </span>
                          </div>
                        ) : (
                          <p className="italic text-white/30 text-xs font-light bg-white/5 border border-white/10 px-3 py-2 rounded-md">
                            Pending
                          </p>
                        )}
                      </div>
                    </DarkTimelineStop>
                  </div>
                </div>
              </div>

              {/* ══ RIGHT PANEL ══════════════════════════════════════════════════ */}
              <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3 border-b border-gray-200 shrink-0">
                  <div>
                    <h2 className="text-gray-900 font-bold text-base max-sm:text-sm">
                      Deployment Details
                    </h2>
                    {isEditMode ? (
                      <p className="text-orange-500 text-xxs mt-0.5">
                        Make changes and save to update.
                      </p>
                    ) : (
                      <p className="text-gray-400 text-xxs mt-0.5">
                        View deployment information.
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={handleCloseModal}
                      disabled={isLoading}
                      className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-md text-xl transition-all cursor-pointer disabled:opacity-40"
                    >
                      <IoClose />
                    </button>
                  </div>
                </div>

                {/* Tabs row */}
                <div className="flex gap-0 border-b border-gray-200 px-6 max-sm:px-4 shrink-0 overflow-x-auto">
                  <TabButton
                    label="Deployment Info"
                    tab="info"
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                  <TabButton
                    label="Pickup Sites"
                    tab="pickups"
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                  />
                  <div className="lg:hidden">
                    <TabButton
                      label="Timelines"
                      tab="timelines"
                      activeTab={activeTab}
                      setActiveTab={setActiveTab}
                    />
                  </div>

                  {["head_admin", "admin"].includes(userData?.data?.role) && (
                    <div className="ml-auto flex items-center max-lg:hidden gap-4">
                      <p className=" text-xs font-medium tracking-wide text-gray-600 font-mono bg-gray-200 px-2 py-0.5 rounded-sm">
                        {deployment?.deploymentCode}
                      </p>

                      <div className="border-l border-gray-200 h-full"></div>

                      <div className="flex items-center gap-1.5 text-xxs font-medium text-gray-500">
                        {editForm?.isTMOPrinted
                          ? "PAYSLIP PRINTED"
                          : "PAYSLIP NOT PRINTED"}
                        <div
                          className={clsx(
                            "w-2 aspect-square rounded-full -mt-0.5",
                            {
                              "bg-emerald-500": editForm?.isPaySlipPrinted,
                              "bg-red-400": !editForm?.isPaySlipPrinted,
                            },
                          )}
                        />
                      </div>

                      <div className="border-l border-gray-200 h-full"></div>

                      <div className="flex items-center gap-1.5 text-xxs font-medium text-gray-500">
                        {editForm?.isTMOPrinted
                          ? "TMO PRINTED"
                          : "TMO NOT PRINTED"}
                        <div
                          className={clsx(
                            "w-2 aspect-square rounded-full -mt-0.5",
                            {
                              "bg-emerald-500": editForm?.isTMOPrinted,
                              "bg-red-400": !editForm?.isTMOPrinted,
                            },
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Scrollable content */}
                <form
                  onSubmit={handleUpdateDeployment}
                  className="flex-1 flex flex-col min-h-0 overflow-hidden"
                >
                  <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    {activeTab === "info" && (
                      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 max-sm:px-4 pt-4 pb-4">
                        <DeploymentInfoTab
                          isEditMode={isEditMode}
                          editForm={editForm}
                          deployment={deployment}
                          isReplacementShow={isReplacementShow}
                          trucks={trucks}
                          drivers={drivers}
                          currentTruck={currentTruck}
                          currentDriver={currentDriver}
                          filteredTrucks={filteredTrucks}
                          filteredDrivers={filteredDrivers}
                          filteredReplacementTrucks={filteredReplacementTrucks}
                          filteredReplacementDrivers={
                            filteredReplacementDrivers
                          }
                          truckQuery={truckQuery}
                          driverQuery={driverQuery}
                          replacementTruckQuery={replacementTruckQuery}
                          replacementDriverQuery={replacementDriverQuery}
                          setTruckQuery={setTruckQuery}
                          setDriverQuery={setDriverQuery}
                          setReplacementTruckQuery={setReplacementTruckQuery}
                          setReplacementDriverQuery={setReplacementDriverQuery}
                          handleChange={handleChange}
                          handleComboboxChange={handleComboboxChange}
                          openReplacementModal={openReplacementModal}
                          openReplacementHistory={openReplacementHistory}
                        />
                      </div>
                    )}
                    {activeTab === "pickups" && (
                      <PickupSitesTab
                        isEditMode={isEditMode}
                        editForm={editForm}
                        handlePickupChange={handlePickupChange}
                        handlePickupNumericChange={handlePickupNumericChange}
                        addPickupStop={addPickupStop}
                        removePickupStop={removePickupStop}
                        reorderPickups={reorderPickups}
                      />
                    )}
                    {activeTab === "timelines" && (
                      <TimelineTab
                        isEditMode={isEditMode}
                        editForm={editForm}
                        deployment={deployment}
                        handleChange={handleChange}
                        handlePickupChange={handlePickupChange}
                        lastPickupOut={lastPickupOut}
                      />
                    )}
                  </div>

                  {/* ── Action buttons ── */}
                  {updatable && (
                    <div className="flex items-center gap-2 px-6 py-4 max-sm:px-4 border-t border-gray-200 shrink-0 overflow-x-auto">
                      {isEditMode ? (
                        <>
                          <ActionButton
                            icon={RiCloseLine}
                            color="gray"
                            onClick={handleCancelEditMode}
                            title="Cancel"
                          />
                          <ActionButton
                            icon={RiCheckLine}
                            color="green"
                            type="submit"
                            title="Save changes"
                            isLoading={isLoading}
                          />
                        </>
                      ) : (
                        <>
                          <ActionButton
                            icon={RiEditLine}
                            color="blue"
                            onClick={() => setIsEditMode(true)}
                            title="Update"
                          />
                          <ActionButton
                            icon={TbPrinter}
                            color="green"
                            onClick={handlePrintTMO}
                            title="Print TMO"
                          />
                          <ActionButton
                            icon={TbReceipt}
                            color="orange"
                            onClick={() => openPaySlipModal()}
                            title="Pay Slip"
                          />

                          <div className="ml-auto">
                            <ActionButton
                              icon={RiDeleteBin6Line}
                              color="red"
                              onClick={openDeleteModal}
                              title="Delete"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </form>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

// ── DARK TIMELINE HELPERS ──────────────────────────────────────────────────────

const DarkTimelineLabel = ({ isActive, label }) => (
  <div className="flex gap-4">
    <div className="relative w-4 shrink-0">
      <div
        className={clsx(
          "w-0.5 h-full absolute top-0 left-1/2 -translate-x-1/2",
          { "bg-emerald-500": isActive, "bg-[#263e54]": !isActive },
        )}
      />
    </div>
    <div className="mb-1 flex-1 bg-emerald-500/15 px-2 rounded-sm flex items-center p-1">
      <span className="text-xxs font-semibold text-emerald-400 uppercase tracking-wide">
        {label}
      </span>
    </div>
  </div>
);

const DarkTimelineStop = ({ isActive, isLast, children }) => (
  <div className="flex gap-4">
    <div className="relative w-4 shrink-0">
      {!isLast && (
        <div
          className={clsx(
            "w-0.5 h-full absolute top-0 left-1/2 -translate-x-1/2",
            { "bg-emerald-500": isActive, "bg-[#263e54]": !isActive },
          )}
        />
      )}
      <div
        className={clsx(
          "w-3.5 aspect-square rounded-full absolute z-10 left-1/2 -translate-x-1/2",
          {
            "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]": isActive,
            "bg-[#263e54]": !isActive,
          },
        )}
      />
    </div>
    <div
      className={clsx("flex-1 min-w-0", {
        "pb-5": !isLast,
      })}
    >
      {children}
    </div>
  </div>
);

const DarkTimelineDisplay = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <p className="text-white/40 text-xxs font-semibold uppercase tracking-wider">
      {label}
    </p>
    {value ? (
      <p className="bg-white/10 border border-white/15 text-white/80 text-xs px-3 py-2 rounded-md break-all">
        {DateTime.fromISO(value)
          .setZone("Asia/Manila")
          .toFormat("MMM d, yyyy - hh:mm a")}
      </p>
    ) : (
      <p className="italic text-white/30 text-xs font-light bg-white/5 border border-white/10 px-3 py-2 rounded-md">
        Pending
      </p>
    )}
  </div>
);

const DarkInputField = ({ label, type, name, value, onChange, disabled }) => {
  const inputRef = useRef(null);
  return (
    <div className="flex flex-col gap-1">
      <p className="text-white/40 text-xxs font-semibold uppercase tracking-wider">
        {label}
      </p>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className={clsx(
            "text-xs px-3 py-2 pr-8 rounded-md border focus:outline-none transition-colors w-full",
            "[&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-0 [&::-webkit-calendar-picker-indicator]:w-8 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer",
            disabled
              ? "bg-white/5 border-white/10 text-white/30 cursor-not-allowed"
              : "bg-white/10 border-white/15 text-white/80 focus:border-emerald-500/60 focus:bg-white/15",
          )}
        />
        <FaCalendar
          onClick={() => !disabled && inputRef.current?.showPicker()}
          className={clsx(
            "absolute right-2.5 text-xs pointer-events-none",
            disabled ? "text-white/20" : "text-white/40",
          )}
        />
      </div>
    </div>
  );
};

// ── TAB BUTTON ─────────────────────────────────────────────────────────────────

const TabButton = ({ label, tab, activeTab, setActiveTab }) => (
  <button
    type="button"
    onClick={() => setActiveTab(tab)}
    className={clsx(
      "px-4 py-3 text-xs max-sm:text-xxs font-medium transition-colors relative text-nowrap",
      {
        "text-emerald-600": activeTab === tab,
        "text-gray-500 hover:text-gray-700": activeTab !== tab,
      },
    )}
  >
    {label}
    {activeTab === tab && (
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
    )}
  </button>
);

// ── TIMELINE TAB ───────────────────────────────────────────────────────────────

const TimelineTab = ({
  isEditMode,
  editForm,
  deployment,
  handleChange,
  handlePickupChange,
  lastPickupOut,
}) => {
  const pickups = isEditMode
    ? editForm.pickups || []
    : deployment.pickups || [];
  const multiStop = pickups.length > 1;

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-5 py-5 max-sm:px-4">
      <div className="flex flex-col">
        <LightTimelineStop isActive={!!editForm.createdAt} isLast={false}>
          <LightTimelineDisplay
            label="Assigned at"
            value={editForm?.createdAt}
          />
        </LightTimelineStop>

        <LightTimelineStop
          isActive={
            !!(isEditMode ? editForm.departed : deployment.departed)?.trim()
          }
          isLast={false}
        >
          {isEditMode ? (
            <LightInputField
              label="Departed"
              type="datetime-local"
              name="departed"
              value={editForm?.departed}
              onChange={handleChange}
            />
          ) : (
            <LightTimelineDisplay
              label="Departed"
              value={deployment.departed}
            />
          )}
        </LightTimelineStop>

        {pickups.map((pickup, index) => {
          const prevPickupOut =
            index === 0
              ? isEditMode
                ? editForm.departed
                : deployment.departed
              : isEditMode
                ? editForm.pickups?.[index - 1]?.pickupOut
                : deployment.pickups?.[index - 1]?.pickupOut;

          return (
            <div key={index}>
              {multiStop && (
                <LightTimelineLabel
                  isActive={!!prevPickupOut}
                  label={`Stop ${index + 1}${
                    pickup.pickupSite ? ` — ${pickup.pickupSite}` : ""
                  }`}
                />
              )}
              <LightTimelineStop
                isActive={!!pickup.pickupIn?.trim()}
                isLast={false}
              >
                {isEditMode ? (
                  <LightInputField
                    label="Pick-up In"
                    type="datetime-local"
                    name="pickupIn"
                    value={pickup.pickupIn}
                    disabled={!prevPickupOut}
                    onChange={(e) => handlePickupChange(index, e)}
                  />
                ) : (
                  <LightTimelineDisplay
                    label="Pick-up In"
                    value={pickup.pickupIn}
                  />
                )}
              </LightTimelineStop>
              <LightTimelineStop
                isActive={!!pickup.pickupOut?.trim()}
                isLast={false}
              >
                {isEditMode ? (
                  <LightInputField
                    label="Pick-up Out"
                    type="datetime-local"
                    name="pickupOut"
                    value={pickup.pickupOut}
                    disabled={!pickup.pickupIn}
                    onChange={(e) => handlePickupChange(index, e)}
                  />
                ) : (
                  <LightTimelineDisplay
                    label="Pick-up Out"
                    value={pickup.pickupOut}
                  />
                )}
              </LightTimelineStop>
            </div>
          );
        })}

        <LightTimelineStop
          isActive={
            !!(
              isEditMode ? editForm.destArrival : deployment.destArrival
            )?.trim()
          }
          isLast={false}
        >
          {isEditMode ? (
            <LightInputField
              label="Dest Arrival"
              type="datetime-local"
              name="destArrival"
              value={editForm?.destArrival}
              disabled={!lastPickupOut}
              onChange={handleChange}
            />
          ) : (
            <LightTimelineDisplay
              label="Dest Arrival"
              value={deployment.destArrival}
            />
          )}
        </LightTimelineStop>

        <LightTimelineStop
          isActive={
            !!(
              isEditMode ? editForm.destDeparture : deployment.destDeparture
            )?.trim()
          }
          isLast={false}
        >
          {isEditMode ? (
            <LightInputField
              label="Dest Departure"
              type="datetime-local"
              name="destDeparture"
              value={editForm?.destDeparture}
              disabled={!editForm?.destArrival}
              onChange={handleChange}
            />
          ) : (
            <LightTimelineDisplay
              label="Dest Departure"
              value={deployment.destDeparture}
            />
          )}
        </LightTimelineStop>

        <LightTimelineStop
          isActive={!!(editForm?.destDeparture && editForm?.destArrival)}
          isLast={true}
        >
          <div className="flex flex-col gap-1">
            <p className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
              Unloading Time
            </p>
            {editForm?.destDeparture && editForm?.destArrival ? (
              <p className="text-emerald-700 text-xs max-sm:text-xxs font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-2 rounded-md">
                {(() => {
                  const dep = isEditMode
                    ? editForm.destDeparture
                    : deployment.destDeparture;
                  const arr = isEditMode
                    ? editForm.destArrival
                    : deployment.destArrival;
                  const { days, hours, minutes } = DateTime.fromISO(dep).diff(
                    DateTime.fromISO(arr),
                    ["days", "hours", "minutes"],
                  );
                  const totalHours = days * 24 + hours;
                  const fmt = () => {
                    const p = [];
                    if (days > 0) p.push(`${days}d`);
                    if (hours > 0) p.push(`${hours}h`);
                    if (minutes > 0) p.push(`${Math.floor(minutes)}m`);
                    return p.join(" ") || `${Math.floor(minutes)}m`;
                  };
                  const fmtH = () =>
                    totalHours > 0
                      ? `${totalHours}h${
                          minutes > 0 ? ` ${Math.floor(minutes)}m` : ""
                        }`
                      : `${Math.floor(minutes)}m`;
                  if (totalHours >= 24) return `${fmt()} (${fmtH()})`;
                  if (hours > 0) return `${hours}h ${Math.floor(minutes)}m`;
                  return `${Math.floor(minutes)}m`;
                })()}
              </p>
            ) : (
              <p className="italic text-gray-400 text-xs max-sm:text-xxs font-light bg-gray-50 border border-gray-200 px-2.5 py-2 rounded-md">
                Pending
              </p>
            )}
          </div>
        </LightTimelineStop>
      </div>
    </div>
  );
};

// ── LIGHT TIMELINE PRIMITIVES ─────────────────────────────────────────────────

const LightTimelineStop = ({ isActive, isLast, children }) => (
  <div className="flex gap-4">
    <div className="relative w-3 shrink-0">
      {!isLast && (
        <div
          className={clsx(
            "w-px h-full absolute top-0 left-1/2 -translate-x-1/2",
            isActive ? "bg-emerald-500" : "bg-gray-200",
          )}
        />
      )}
      <div
        className={clsx(
          "w-2.5 aspect-square rounded-full absolute z-10 left-1/2 -translate-x-1/2",
          isActive ? "bg-emerald-500" : "bg-gray-200",
        )}
      />
    </div>
    <div className="pb-5 flex-1 min-w-0">{children}</div>
  </div>
);

const LightTimelineLabel = ({ isActive, label }) => (
  <div className="flex gap-4">
    <div className="relative w-3 shrink-0">
      <div
        className={clsx(
          "w-px h-full absolute top-0 left-1/2 -translate-x-1/2",
          isActive ? "bg-emerald-500" : "bg-gray-200",
        )}
      />
    </div>
    <div className="mb-1 flex-1 bg-emerald-500/10 px-2 rounded-sm flex items-center p-1">
      <span className="text-xxxs md:text-xxs font-semibold text-emerald-600 uppercase tracking-wide">
        {label}
      </span>
    </div>
  </div>
);

const LightTimelineDisplay = ({ label, value }) => (
  <div className="flex flex-col gap-1">
    <p className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
      {label}
    </p>
    {value ? (
      <p className="bg-white border border-gray-200 text-gray-700 text-xs max-sm:text-xxs px-3 py-2 rounded-md">
        {DateTime.fromISO(value)
          .setZone("Asia/Manila")
          .toFormat("MMM d, yyyy — hh:mm a")}
      </p>
    ) : (
      <p className="italic text-gray-400 text-xs max-sm:text-xxs font-light bg-gray-50 border border-gray-200 px-3 py-2 rounded-md">
        Pending
      </p>
    )}
  </div>
);

const LightInputField = ({ label, type, name, value, onChange, disabled }) => {
  const inputRef = useRef(null);
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
        {label}
      </p>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value || ""}
          onChange={onChange}
          disabled={disabled}
          className={clsx(
            "text-xs max-sm:text-xxs px-3 py-[7px] rounded-md border focus:outline-none transition-colors w-full",
            "appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-clear-button]:hidden",
            disabled
              ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-white border-gray-200 text-gray-800 focus:border-gray-400",
          )}
        />
        <FaCalendar
          onClick={() => !disabled && inputRef.current?.showPicker()}
          className={clsx(
            "absolute right-2.5 max-sm:text-xxs text-xs",
            disabled
              ? "text-gray-300 pointer-events-none"
              : "text-gray-400 cursor-pointer",
          )}
        />
      </div>
    </div>
  );
};

// ── DEPLOYMENT INFO TAB ────────────────────────────────────────────────────────

const DeploymentInfoTab = ({
  isEditMode,
  editForm,
  deployment,
  isReplacementShow,
  trucks,
  drivers,
  currentTruck,
  currentDriver,
  filteredTrucks,
  filteredDrivers,
  filteredReplacementTrucks,
  filteredReplacementDrivers,
  truckQuery,
  driverQuery,
  replacementTruckQuery,
  replacementDriverQuery,
  setTruckQuery,
  setDriverQuery,
  setReplacementTruckQuery,
  setReplacementDriverQuery,
  handleChange,
  handleComboboxChange,
  openReplacementModal,
  openReplacementHistory,
}) => {
  const { settings } = useSettingsContext();

  const activeTruckId = isReplacementShow
    ? typeof editForm?.replacement?.replacementTruckId === "object"
      ? editForm?.replacement?.replacementTruckId?._id
      : editForm?.replacement?.replacementTruckId
    : typeof editForm?.truckId === "object"
      ? editForm?.truckId?._id
      : editForm?.truckId;

  const activeDriverId = isReplacementShow
    ? typeof editForm?.replacement?.replacementDriverId === "object"
      ? editForm?.replacement?.replacementDriverId?._id
      : editForm?.replacement?.replacementDriverId
    : typeof editForm?.driverId === "object"
      ? editForm?.driverId?._id
      : editForm?.driverId;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="relative flex justify-between">
          <h3 className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
            Truck & Driver Details
          </h3>
          <div className="flex items-center gap-2">
            {isReplacementShow && (
              <p className="text-xxs max-sm:text-xxxs text-red-500 font-medium">
                *Truck replaced.{" "}
                <span
                  className="underline cursor-pointer"
                  onClick={openReplacementHistory}
                >
                  {" "}
                  Click to view
                </span>
              </p>
            )}
            {isEditMode && !isReplacementShow && (
              <button
                type="button"
                onClick={openReplacementModal}
                className="flex items-center gap-1.5 text-xxxs md:text-xxs font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <TbExchange className="text-xxs md:text-xs" /> Replace Truck
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-4 gap-y-4 max-sm:gap-x-3 max-sm:gap-y-3 border border-gray-200 rounded-md p-5 max-sm:p-4">
          <InfoField label="Plate No.">
            {isEditMode ? (
              <Combobox
                value={activeTruckId}
                onChange={(v) =>
                  handleComboboxChange(
                    isReplacementShow
                      ? "replacement.replacementTruckId"
                      : "truckId",
                    v,
                  )
                }
              >
                <div className="relative flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 focus-within:border-gray-400 transition-all">
                  <ComboboxInput
                    className="w-full bg-transparent text-xs max-sm:text-xxs text-gray-800 placeholder-gray-400 focus:outline-none uppercase min-w-0"
                    displayValue={(id) =>
                      trucks?.find((t) => t._id === id)?.plateNo || ""
                    }
                    onChange={(e) =>
                      isReplacementShow
                        ? setReplacementTruckQuery(e.target.value)
                        : setTruckQuery(e.target.value)
                    }
                    required
                  />
                  <ComboboxButton className="absolute right-4 max-sm:right-3 text-gray-400">
                    <MdKeyboardArrowDown className="text-base" />
                  </ComboboxButton>
                </div>
                <ComboboxOptions
                  portal
                  anchor={{ to: "bottom start", gap: 8 }}
                  className="z-999 max-h-60 w-(--input-width) overflow-auto rounded-md bg-white border border-gray-200 py-1 text-xs focus:outline-none"
                >
                  {(isReplacementShow
                    ? filteredReplacementTrucks
                    : filteredTrucks
                  ).map((t) => (
                    <ComboboxOption
                      key={t._id}
                      value={t._id}
                      className={({ focus }) =>
                        clsx(
                          "px-4 py-2 cursor-default select-none uppercase transition-colors",
                          { "bg-gray-50": focus },
                        )
                      }
                    >
                      {t.plateNo}
                    </ComboboxOption>
                  ))}
                </ComboboxOptions>
              </Combobox>
            ) : (
              <InfoValue className="uppercase">
                {isReplacementShow
                  ? editForm?.replacement?.replacementTruckId?.plateNo
                  : currentTruck?.plateNo}
              </InfoValue>
            )}
          </InfoField>

          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Truck Type">
              {isEditMode ? (
                <SelectWrapper
                  name={
                    isReplacementShow
                      ? "replacement.replacementTruckType"
                      : "truckType"
                  }
                  value={
                    isReplacementShow
                      ? editForm?.replacement?.replacementTruckType
                      : editForm?.truckType
                  }
                  onChange={handleChange}
                >
                  {settings.trucksDrivers.truckType.map((item, i) => (
                    <option key={i} value={item}>
                      {item}
                    </option>
                  ))}
                </SelectWrapper>
              ) : (
                <InfoValue className="capitalize">
                  {isReplacementShow
                    ? editForm?.replacement?.replacementTruckType
                    : editForm?.truckType}
                </InfoValue>
              )}
            </InfoField>
            <InputField
              label="Helper Count"
              type="number"
              name="helperCount"
              value={editForm?.helperCount}
              disabled={!isEditMode}
              onChange={handleChange}
              formatNumber
            />
          </div>

          <InfoField label="Driver">
            {isEditMode ? (
              <Combobox
                value={activeDriverId}
                onChange={(v) =>
                  handleComboboxChange(
                    isReplacementShow
                      ? "replacement.replacementDriverId"
                      : "driverId",
                    v,
                  )
                }
              >
                <div className="relative flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 focus-within:border-gray-400 transition-all">
                  <ComboboxInput
                    className="w-full bg-transparent text-xs max-sm:text-xxs text-gray-800 placeholder-gray-400 focus:outline-none capitalize min-w-0"
                    displayValue={(id) => {
                      const d = drivers?.find((d) => d._id === id);
                      return d ? `${d.firstname} ${d.lastname}` : "";
                    }}
                    onChange={(e) =>
                      isReplacementShow
                        ? setReplacementDriverQuery(e.target.value)
                        : setDriverQuery(e.target.value)
                    }
                    required
                  />
                  <ComboboxButton className="absolute right-4 max-sm:right-3 text-gray-400">
                    <MdKeyboardArrowDown className="text-base" />
                  </ComboboxButton>
                </div>
                <ComboboxOptions
                  portal
                  anchor={{ to: "bottom start", gap: 8 }}
                  className="z-999 max-h-60 w-(--input-width) overflow-auto rounded-md bg-white border border-gray-200 py-1 text-xs focus:outline-none"
                >
                  {(isReplacementShow
                    ? filteredReplacementDrivers
                    : filteredDrivers
                  ).map((d) => (
                    <ComboboxOption
                      key={d._id}
                      value={d._id}
                      className={({ focus }) =>
                        clsx(
                          "px-4 py-2 cursor-default select-none capitalize transition-colors",
                          { "bg-gray-50": focus },
                        )
                      }
                    >
                      {d.firstname} {d.lastname}
                    </ComboboxOption>
                  ))}
                </ComboboxOptions>
              </Combobox>
            ) : (
              <InfoValue className="capitalize">
                {isReplacementShow
                  ? editForm?.replacement?.replacementDriverId
                    ? `${editForm.replacement.replacementDriverId.firstname} ${editForm.replacement.replacementDriverId.lastname}`
                    : "N/A"
                  : editForm?.driverId?._id
                    ? `${editForm.driverId.firstname} ${editForm.driverId.lastname}`
                    : "N/A"}
              </InfoValue>
            )}
          </InfoField>

          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Total Sacks"
              type="number"
              name="totalSacksCount"
              value={editForm?.totalSacksCount}
              disabled
              formatNumber
              thousandSeparator
              decimalScale={0}
              isRequired={false}
              onChange={handleChange}
            />
            <InputField
              label="Total Load Wt. (kg)"
              type="number"
              name="totalWeightKg"
              value={
                editForm?.pickups?.reduce(
                  (sum, p) => sum + (parseFloat(p.fieldWeightKg) || 0),
                  0,
                ) || ""
              }
              disabled
              formatNumber
              thousandSeparator
              decimalScale={2}
              isRequired={false}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
          Delivery Details
        </h3>
        <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-4 gap-y-4 max-sm:gap-x-3 max-sm:gap-y-3 border border-gray-200 rounded-md p-5 max-sm:p-4">
          <InputField
            label="Receiving Contact Person"
            type="text"
            name="receivingContactPerson"
            placeholder="Contact Person"
            value={editForm?.receivingContactPerson}
            disabled={!isEditMode}
            onChange={handleChange}
          />
          <InputField
            label="Receiving Contact No."
            type="text"
            name="receivingContactPersonNo"
            placeholder="Contact Number"
            value={editForm?.receivingContactPersonNo}
            disabled={!isEditMode}
            onChange={handleChange}
            maxLength={11}
          />

          <InfoField label="Destination">
            {isEditMode ? (
              <SelectWrapper
                name="destination"
                value={editForm?.destination}
                onChange={handleChange}
              >
                {settings.deployments.destination.map((item, i) => (
                  <option key={i} value={item}>
                    {item}
                  </option>
                ))}
              </SelectWrapper>
            ) : (
              <InfoValue className="capitalize">
                {editForm?.destination}
              </InfoValue>
            )}
          </InfoField>

          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Territory">
              {isEditMode ? (
                <SelectWrapper
                  name="territory"
                  value={editForm?.territory}
                  onChange={handleChange}
                >
                  {settings.deployments.territory.map((item, i) => (
                    <option key={i} value={item}>
                      {item}
                    </option>
                  ))}
                </SelectWrapper>
              ) : (
                <InfoValue className="capitalize">
                  {editForm?.territory}
                </InfoValue>
              )}
            </InfoField>
            <InfoField label="Hybrid">
              {isEditMode ? (
                <SelectWrapper
                  name="hybrid"
                  value={editForm?.hybrid}
                  onChange={handleChange}
                >
                  {settings.deployments.hybrid.map((item, i) => (
                    <option key={i} value={item}>
                      {item}
                    </option>
                  ))}
                </SelectWrapper>
              ) : (
                <InfoValue className="capitalize">{editForm?.hybrid}</InfoValue>
              )}
            </InfoField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Flagging">
              {isEditMode ? (
                <SelectWrapper
                  name="flagging"
                  value={editForm?.flagging}
                  onChange={handleChange}
                >
                  {settings.deployments.flagging.map((item, i) => (
                    <option key={i} value={item}>
                      {item}
                    </option>
                  ))}
                </SelectWrapper>
              ) : (
                <InfoValue className="capitalize">
                  {editForm?.flagging || "N/A"}
                </InfoValue>
              )}
            </InfoField>
            <InputField
              label="Flagging Remarks"
              type="text"
              name="flaggingRemarks"
              placeholder=""
              maxLength={50}
              value={editForm?.flaggingRemarks}
              disabled={!isEditMode}
              onChange={handleChange}
              isRequired={false}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Status">
              {isEditMode ? (
                <SelectWrapper
                  name="status"
                  value={editForm?.status}
                  onChange={handleChange}
                >
                  {DEPLOYMENT_STATUS.map((item, i) => (
                    <option key={i} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </SelectWrapper>
              ) : (
                <InfoValue className="capitalize">{editForm?.status}</InfoValue>
              )}
            </InfoField>
            <InputField
              label="Cancellation Reason"
              type="text"
              name="cancellationReason"
              placeholder=""
              maxLength={50}
              value={editForm?.cancellationReason}
              disabled={!isEditMode || editForm?.status !== "canceled"}
              onChange={handleChange}
              isRequired={false}
              isCapitalize={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ── PICKUP SITES TAB ───────────────────────────────────────────────────────────

const PickupSitesTab = ({
  isEditMode,
  editForm,
  handlePickupChange,
  handlePickupNumericChange,
  addPickupStop,
  removePickupStop,
  reorderPickups,
}) => {
  const { settings } = useSettingsContext();
  const pickups = editForm?.pickups || [];
  const lastStopRef = useRef(null);
  const prevLengthRef = useRef(pickups.length);

  const dragIndexRef = useRef(null);
  const dragOverIndexRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  useEffect(() => {
    if (pickups.length > prevLengthRef.current && lastStopRef.current) {
      lastStopRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    prevLengthRef.current = pickups.length;
  }, [pickups.length]);

  const handleDragStart = (e, index) => {
    dragIndexRef.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (dragIndexRef.current === index) return;
    dragOverIndexRef.current = index;
    setDragOverIndex(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    if (from !== null && from !== index) {
      reorderPickups(from, index);
    }
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragIndexRef.current = null;
    dragOverIndexRef.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const canReorder = isEditMode && pickups.length > 1;

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      <div className="flex items-start justify-between shrink-0 px-6 max-sm:px-4 pt-4 pb-2">
        <div className="relative flex justify-between gap-2">
          <h3 className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
            Pickup Stops
          </h3>
          <span className="text-xxxs md:text-xxs text-gray-400">
            ({pickups.length}/{MAX_PICKUPS})
          </span>
        </div>
        {isEditMode && (
          <button
            type="button"
            onClick={addPickupStop}
            disabled={pickups.length >= MAX_PICKUPS}
            className="flex items-center gap-1.5 text-xxxs md:text-xxs font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <FiPlus className="text-xxs md:text-xs" /> Add Stop
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-3 min-h-0 px-6 max-sm:px-4 pb-4">
        {pickups.map((pickup, index) => {
          return (
            <div
              key={index}
              ref={index === pickups.length - 1 ? lastStopRef : null}
              className="border border-gray-200 rounded-md p-4 max-sm:p-3 bg-gray-50/50 relative"
            >
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xxs sm:text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                  Stop {index + 1} —{" "}
                  <span className="font-mono">{pickup.tmoNo}</span>
                </p>
              </div>

              {canReorder && (
                <div className="flex shrink-0 absolute right-0 top-0 border-b border-l border-gray-200 rounded-bl-md overflow-hidden">
                  <button
                    type="button"
                    onClick={() => reorderPickups(index, index - 1)}
                    disabled={index === 0}
                    className="py-2 px-2.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <TbArrowBigUpLine className="text-sm md:text-base" />
                  </button>
                  <button
                    type="button"
                    onClick={() => reorderPickups(index, index + 1)}
                    disabled={index === pickups.length - 1}
                    className="py-2 px-2.5 text-gray-600 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer border-l border-gray-200"
                  >
                    <TbArrowBigDownLine className="text-sm md:text-base" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removePickupStop(index)}
                    className="py-2 px-2.5 text-red-400 hover:text-red-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer border-l border-gray-200"
                  >
                    <FiTrash2 className="text-sm md:text-base" />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4 max-sm:gap-x-3 max-sm:gap-y-3">
                {/* ── Pick-up Site: select in edit mode, InfoValue in view mode ── */}
                <InfoField label="Pick-up Site">
                  {isEditMode ? (
                    <PickupSelectWrapper
                      name="pickupSite"
                      value={pickup.pickupSite}
                      onChange={(e) => handlePickupChange(index, e)}
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {(settings.deployments?.pickupSite || []).map(
                        (item, i) => (
                          <option key={i} value={item}>
                            {item}
                          </option>
                        ),
                      )}
                    </PickupSelectWrapper>
                  ) : (
                    <InfoValue>{pickup.pickupSite}</InfoValue>
                  )}
                </InfoField>

                {/* ── Municipality: select in edit mode, InfoValue in view mode ── */}
                <InfoField label="Municipality">
                  {isEditMode ? (
                    <PickupSelectWrapper
                      name="municipality"
                      value={pickup.municipality}
                      onChange={(e) => handlePickupChange(index, e)}
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {(settings.deployments?.municipality || []).map(
                        (item, i) => (
                          <option key={i} value={item}>
                            {item}
                          </option>
                        ),
                      )}
                    </PickupSelectWrapper>
                  ) : (
                    <InfoValue>{pickup.municipality}</InfoValue>
                  )}
                </InfoField>

                {/* ── Scheduled Pickup Time ── */}
                {isEditMode ? (
                  <InputField
                    label="Scheduled Pickup Time"
                    type="datetime-local"
                    name="scheduledPickupTime"
                    value={pickup.scheduledPickupTime}
                    onChange={(e) => handlePickupChange(index, e)}
                    isCapitalize={false}
                    isRequired={false}
                  />
                ) : (
                  <InfoField label="Scheduled Pickup Time">
                    {pickup.scheduledPickupTime ? (
                      <InfoValue>
                        {DateTime.fromISO(pickup.scheduledPickupTime)
                          .setZone("Asia/Manila")
                          .toFormat("MMM d, yyyy - hh:mm a")}
                      </InfoValue>
                    ) : (
                      <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5">
                        <p className="italic text-gray-400 text-xs max-sm:text-xxs">
                          Not set
                        </p>
                      </div>
                    )}
                  </InfoField>
                )}

                {/* ── Field Contact Person: select in edit mode ── */}
                <InfoField label="Field Contact Person">
                  {isEditMode ? (
                    <PickupSelectWrapper
                      name="fieldContactPerson"
                      value={pickup.fieldContactPerson}
                      onChange={(e) => {
                        handlePickupChange(index, e);
                        // Auto-fill contact no from settings if available
                        const persons =
                          settings.deployments?.fieldContactPersons || [];
                        const selected = persons.find(
                          (p) => p.name === e.target.value,
                        );
                        if (selected) {
                          handlePickupChange(index, {
                            target: {
                              name: "fieldContactPersonNo",
                              value: selected.contactNo || "",
                            },
                          });
                        }
                      }}
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {(settings.deployments?.fieldContactPersons || []).map(
                        (person, i) => (
                          <option key={i} value={person.name ?? person}>
                            {person.name ?? person}
                          </option>
                        ),
                      )}
                    </PickupSelectWrapper>
                  ) : (
                    <InfoValue>{pickup.fieldContactPerson}</InfoValue>
                  )}
                </InfoField>

                <InputField
                  label="Field Contact No."
                  type="text"
                  name="fieldContactPersonNo"
                  placeholder="Contact Number"
                  value={pickup.fieldContactPersonNo}
                  disabled={!isEditMode}
                  onChange={(e) => handlePickupChange(index, e)}
                  maxLength={11}
                  isRequired={false}
                />

                <div className="flex flex-col gap-1.5">
                  <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider text-nowrap">
                    Sacks Count
                  </span>
                  <div
                    className={clsx(
                      "flex items-center border rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 transition-all",
                      !isEditMode
                        ? "bg-gray-50 border-gray-200"
                        : "bg-white border-gray-200 focus-within:border-gray-400",
                    )}
                  >
                    <NumericFormat
                      thousandSeparator={false}
                      decimalScale={0}
                      allowNegative={false}
                      value={pickup.sacksCount}
                      onValueChange={(v) =>
                        handlePickupNumericChange(
                          index,
                          "sacksCount",
                          v.floatValue,
                        )
                      }
                      disabled={!isEditMode}
                      className="flex-1 text-xs max-sm:text-xxs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none min-w-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 col-span-full gap-x-4 gap-y-4 max-sm:gap-x-3 max-sm:gap-y-3">
                  {[
                    {
                      label: "Est. Wt (Kg)",
                      field: "estimatedWeightKg",
                      req: true,
                    },
                    {
                      label: "Field Wt (Kg)",
                      field: "fieldWeightKg",
                      req: false,
                    },
                    {
                      label: "Plant Wt (Kg)",
                      field: "plantWeightKg",
                      req: false,
                    },
                  ].map(({ label, field, req }) => (
                    <div key={field} className="flex flex-col gap-1.5">
                      <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider text-nowrap">
                        {label}
                      </span>
                      <div
                        className={clsx(
                          "flex items-center border rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 transition-all",
                          !isEditMode
                            ? "bg-gray-50 border-gray-200"
                            : "bg-white border-gray-200 focus-within:border-gray-400",
                        )}
                      >
                        <NumericFormat
                          thousandSeparator
                          decimalScale={2}
                          allowNegative={false}
                          value={pickup[field]}
                          onValueChange={(v) =>
                            handlePickupNumericChange(
                              index,
                              field,
                              v.floatValue,
                            )
                          }
                          disabled={!isEditMode}
                          required={req}
                          className="flex-1 text-xs max-sm:text-xxs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none min-w-0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {isEditMode && pickups.length >= MAX_PICKUPS && (
          <p className="text-xs text-gray-400 text-center mt-2">
            Maximum of {MAX_PICKUPS} pickup stops reached.
          </p>
        )}
      </div>
    </div>
  );
};

// ── SHARED UI HELPERS ──────────────────────────────────────────────────────────

const InfoField = ({ label, children }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider truncate">
      {label}
    </span>
    {children}
  </div>
);

const InfoValue = ({ children, className = "" }) => (
  <div
    className={clsx(
      "flex items-center bg-gray-50 border border-gray-200 rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 text-xs max-sm:text-xxs text-gray-700 truncate capitalize",
      className,
    )}
  >
    {children || (
      <span className="text-gray-400 italic text-xs max-sm:text-xxs">—</span>
    )}
  </div>
);

const SelectWrapper = ({ name, value, onChange, children }) => (
  <div className="relative flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 focus-within:border-gray-400 transition-all">
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full h-full appearance-none bg-transparent text-xs max-sm:text-xxs text-gray-800 focus:outline-none capitalize"
    >
      {children}
    </select>
    <MdKeyboardArrowDown className="absolute right-4 max-sm:right-3 text-gray-400 text-base pointer-events-none" />
  </div>
);

// ── Pickup-specific select wrapper (matches CreateDeploymentModal style) ──────
const PickupSelectWrapper = ({ name, value, onChange, children }) => (
  <div className="relative flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 focus-within:border-gray-400 transition-all">
    <select
      name={name}
      value={value || ""}
      onChange={onChange}
      className="w-full h-full appearance-none bg-transparent text-xs max-sm:text-xxs text-gray-800 focus:outline-none capitalize"
    >
      {children}
    </select>
    <MdKeyboardArrowDown className="absolute right-4 max-sm:right-3 text-gray-400 text-base pointer-events-none" />
  </div>
);

const InputField = ({
  colSpan = 1,
  label,
  type,
  name,
  placeholder = "",
  value,
  onChange,
  disabled,
  maxLength,
  isRequired = true,
  isCapitalize = true,
  isUpperCase = false,
  formatNumber = false,
  thousandSeparator = true,
  decimalScale = 0,
  allowNegative = false,
}) => {
  const labelEl = (
    <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider text-nowrap truncate">
      {label} {isRequired && <span className="text-red-400">*</span>}
    </span>
  );
  const wrapperClass = clsx(
    "flex items-center border rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 transition-all duration-200",
    disabled
      ? "bg-gray-50 border-gray-200"
      : "bg-white border-gray-200 focus-within:border-gray-400",
  );
  const inputClass = clsx(
    "flex-1 min-w-0 text-xs max-sm:text-xxs placeholder-gray-400 bg-transparent focus:outline-none",
    disabled ? "text-gray-500" : "text-gray-800",
    {
      capitalize: isCapitalize && type !== "datetime-local",
      uppercase: isUpperCase,
    },
  );

  if (formatNumber && type === "number") {
    return (
      <label className={`col-span-${colSpan} flex flex-col gap-1.5`}>
        {labelEl}
        <div className={wrapperClass}>
          <NumericFormat
            thousandSeparator={thousandSeparator}
            decimalScale={decimalScale}
            allowNegative={allowNegative}
            value={value}
            onValueChange={(v) =>
              onChange({ target: { name, value: v.floatValue || "" } })
            }
            placeholder={placeholder}
            disabled={disabled}
            required={isRequired}
            className={inputClass}
          />
        </div>
      </label>
    );
  }

  // ← add this block
  if (type === "datetime-local") {
    return (
      <label className={`col-span-${colSpan} flex flex-col gap-1.5 `}>
        {labelEl}
        <div
          className={clsx(
            "flex items-center border rounded-md px-4 py-3 max-sm:px-2 max-sm:py-1 transition-all duration-200",
            disabled
              ? "bg-gray-50 border-gray-200"
              : "bg-white border-gray-200 focus-within:border-gray-400",
            "relative flex-1",
          )}
        >
          <input
            type="datetime-local"
            name={name}
            value={value || ""}
            onChange={onChange}
            disabled={disabled}
            required={isRequired}
            className={clsx(
              inputClass,
              "appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-inner-spin-button]:hidden [&::-webkit-clear-button]:hidden",
            )}
          />
          <FaCalendar
            onClick={() => !disabled && inputRef.current?.showPicker()}
            className={clsx(
              "absolute right-2.5 max-sm:text-xxs text-xs pointer-events-none",
              disabled ? "text-gray-300" : "text-gray-400",
            )}
          />
        </div>
      </label>
    );
  }

  return (
    <label className={`col-span-${colSpan} flex flex-col gap-1.5`}>
      {labelEl}
      <div className={wrapperClass}>
        <input
          type={type}
          name={name}
          value={value || ""}
          minLength={2}
          maxLength={maxLength || 50}
          onChange={onChange}
          disabled={disabled}
          required={isRequired}
          placeholder={placeholder}
          className={inputClass}
        />
      </div>
    </label>
  );
};

export default DeploymentDetailsModal;
