import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import clsx from "clsx";
import { MdKeyboardArrowDown } from "react-icons/md";
import { toast } from "react-toastify";
import { RiFolderUploadLine } from "react-icons/ri";
import { DateTime } from "luxon";
import { no_image } from "../../consts/images";
import useUpdateTruck from "../../hooks/useUpdateTruck";
import { NumericFormat } from "react-number-format";
import { useUserContext } from "../../contexts/UserContext";
import { useSettingsContext } from "../../contexts/SettingsContext";
import {
  RiEditLine,
  RiDeleteBin6Line,
  RiCloseLine,
  RiCheckLine,
} from "react-icons/ri";
import ActionButton from "../ui/ActionButton";
import { getAvatarColor } from "../../utils/avatarColors";

/* ─── DotPattern component ───────────────────────────────────────────────── */
const DotPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern
        id="dots-modal"
        x="0"
        y="0"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="2" cy="2" r="1.5" fill="white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots-modal)" />
  </svg>
);

/* ─── Status badge colours ──────────────────────────────────────────────── */
const statusStyles = {
  available: "bg-emerald-50 text-emerald-600 border-emerald-100",
  deployed: "bg-blue-50 text-blue-500 border-blue-100",
  unavailable: "bg-red-50 text-red-500 border-red-100",
};

function TruckDetailsModal({
  isOpen,
  onClose,
  truck,
  onUpdate,
  openDeleteModal,
}) {
  const { userData } = useUserContext();
  const { settings } = useSettingsContext();

  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [subconQuery, setSubconQuery] = useState("");

  const { updateTruckFunction, isLoading } = useUpdateTruck();

  const filteredSubcons = settings.trucksDrivers.subcon.filter((s) =>
    s.toLowerCase().includes(subconQuery.toLowerCase()),
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleComboboxChange = (name, value) => {
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
      setEditForm((prev) => ({ ...prev, image: file }));
    }
  };

  const handleUpdateTruck = async (e) => {
    e.preventDefault();
    const result = await updateTruckFunction(truck._id, editForm);
    if (result.success) {
      onUpdate(result.data.truck);
      toast.success(result.data.message);
      setIsEditMode(false);
      onClose();
    } else {
      toast.error(result.error);
    }
  };

  const handleCloseModal = () => onClose();

  const handleCancelEditMode = () => {
    setIsEditMode(false);
    setEditForm(truck);
    setSelectedFile(null);
    setPreviewImage(null);
  };

  useEffect(() => {
    if (isOpen && truck) {
      setEditForm(truck);
      setIsEditMode(false);
      setSelectedFile(null);
      setPreviewImage(null);
    }
  }, [isOpen, truck]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleCloseModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const isAdmin = ["head_admin", "admin"].includes(userData.data.role);

  // — same pattern as UserDetailsModal —
  const plateNo = truck?.plateNo ?? "";
  const initials = plateNo.replace(/\s/g, "").slice(0, 2).toUpperCase() || "TR";
  const avatarColor = getAvatarColor(plateNo);
  const hasImage = previewImage || truck?.imageUrl;

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
            <DialogPanel
              className={clsx(
                "font-poppins w-full max-w-4xl rounded-xl bg-white shadow-lg overflow-hidden flex flex-col md:flex-row md:max-h-none",
              )}
            >
              {/* ══ LEFT PANEL — avatar + meta info ══════════════════════════════ */}
              <div
                className="relative flex flex-col md:items-center md:justify-center overflow-hidden md:w-64 shrink-0 p-6 max-md:p-4"
                style={{
                  background:
                    "linear-gradient(155deg, #020617 0%, #001e36 55%, #0f172a 100%)",
                }}
              >
                {/* Radial glows */}
                <div
                  className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-10 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, #475569 0%, transparent 70%)",
                  }}
                />
                <div
                  className="absolute -bottom-12 -left-12 w-44 h-44 rounded-full opacity-10 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(circle, #334155 0%, transparent 70%)",
                  }}
                />

                <DotPattern />

                {/* Container: row on mobile, column on desktop */}
                <div className="relative z-10 w-full flex flex-row md:flex-col md:items-center gap-4">
                  {/* Avatar */}
                  <div
                    className={clsx(
                      "relative aspect-square rounded-md overflow-hidden transition-all shrink-0",
                      "w-18 md:w-full md:max-w-none",
                      isEditMode ? "cursor-pointer group" : "",
                    )}
                  >
                    {hasImage ? (
                      <img
                        src={previewImage || truck?.imageUrl || no_image}
                        alt={truck?.plateNo}
                        className={clsx(
                          "w-full h-full object-cover object-center transition-opacity",
                          { "opacity-10": !previewImage && !truck?.imageUrl },
                        )}
                      />
                    ) : (
                      <div
                        className={clsx(
                          "w-full h-full flex items-center justify-center border-2",
                          avatarColor.bg,
                          avatarColor.border,
                        )}
                      >
                        <span
                          className={clsx(
                            "font-bold text-4xl md:text-5xl",
                            avatarColor.text,
                          )}
                        >
                          {initials}
                        </span>
                      </div>
                    )}
                    {isEditMode && (
                      <>
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 group-hover:transition-opacity text-white gap-1">
                          <RiFolderUploadLine className="text-xl max-md:text-base" />
                          <span className="text-xxs font-medium max-md:hidden">
                            Change
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </>
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="flex-1 w-full grid grid-cols-2 items-end place-content-stretch md:gap-y-3 md:gap-x-2">
                    {/* Created */}
                    <div className="flex flex-col items-start">
                      <span className="text-white/50 text-[0.5rem] max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5">
                        Created
                      </span>
                      <span className="text-white/90 text-xs max-md:text-[0.6rem] font-medium">
                        {truck?.createdAt
                          ? DateTime.fromISO(truck.createdAt).toFormat(
                              "MMM d, yyyy",
                            )
                          : "—"}
                      </span>
                    </div>

                    {/* Updated At */}
                    <div className="flex flex-col items-end">
                      <span className="text-white/50 text-[0.5rem] max-md:text-[0.4rem] uppercase tracking-wider font-semibold mb-0.5">
                        Updated
                      </span>
                      <span className="text-white/90 text-xs max-md:text-[0.6rem] font-medium">
                        {truck?.updatedAt
                          ? DateTime.fromISO(truck.updatedAt).toFormat(
                              "MMM d, yyyy",
                            )
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ══ RIGHT PANEL — form fields ════════════════════════════════════ */}
              <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3 border-b border-gray-200 shrink-0">
                  <div>
                    <h2 className="text-gray-900 font-bold text-base max-md:text-sm">
                      Truck Details
                    </h2>
                    {isEditMode ? (
                      <p className="text-orange-500 text-xxs mt-0.5">
                        Make changes and save to update.
                      </p>
                    ) : (
                      <p className="text-gray-400 text-xxs mt-0.5">
                        View this truck's information.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleCloseModal}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-md text-lg transition-all cursor-pointer disabled:opacity-40 shrink-0 ml-4"
                  >
                    <IoClose />
                  </button>
                </div>

                {/* Form */}
                <form
                  onSubmit={handleUpdateTruck}
                  className="flex-1 flex flex-col"
                >
                  <div className="flex-1 px-6 py-5 max-md:px-4 max-md:pt-4 grid grid-cols-2 gap-x-4 gap-y-4 max-md:gap-x-3 max-md:gap-y-3 content-start">
                    {/* Plate No. */}
                    <InputField
                      label="Plate No."
                      type="text"
                      name="plateNo"
                      placeholder="Plate No."
                      value={editForm?.plateNo || ""}
                      disabled={!isEditMode || isLoading}
                      isUppercase
                      onChange={handleChange}
                    />

                    {/* Truck Type */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
                        Type <span className="text-red-400">*</span>
                      </span>
                      {isEditMode ? (
                        <div className="relative flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5 focus-within:border-gray-400 transition-all">
                          <select
                            name="truckType"
                            value={editForm?.truckType || ""}
                            onChange={handleChange}
                            className="w-full appearance-none bg-transparent text-xs max-md:text-xxs text-gray-800 focus:outline-none capitalize"
                          >
                            {settings.trucksDrivers.truckType.map((item, i) => (
                              <option key={i} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                          <MdKeyboardArrowDown className="absolute right-4 max-md:right-3 text-gray-400 text-base pointer-events-none" />
                        </div>
                      ) : (
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5">
                          <p className="text-xs max-md:text-xxs text-gray-500 capitalize">
                            {editForm?.truckType || "—"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Max Load */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
                        Max Load <span className="text-red-400">*</span>
                      </span>
                      {isEditMode ? (
                        <div className="flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5 focus-within:border-gray-400 transition-all">
                          <NumericFormat
                            thousandSeparator
                            decimalScale={0}
                            allowNegative={false}
                            value={editForm?.maxLoad || ""}
                            onValueChange={(values) => {
                              handleChange({
                                target: {
                                  name: "maxLoad",
                                  value: values.floatValue || "",
                                },
                              });
                            }}
                            placeholder="Max Load"
                            disabled={isLoading}
                            className="flex-1 text-xs max-md:text-xxs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none min-w-0"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5">
                          <p className="text-xs max-md:text-xxs text-gray-500">
                            {editForm?.maxLoad
                              ? Number(editForm.maxLoad).toLocaleString()
                              : "—"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </span>
                      {isEditMode ? (
                        <div className="relative flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5 focus-within:border-gray-400 transition-all">
                          <select
                            name="status"
                            value={editForm?.status || ""}
                            onChange={handleChange}
                            className="w-full appearance-none bg-transparent text-xs max-md:text-xxs text-gray-800 focus:outline-none capitalize"
                          >
                            {settings.trucksDrivers.status.map((item, i) => (
                              <option key={i} value={item}>
                                {item}
                              </option>
                            ))}
                          </select>
                          <MdKeyboardArrowDown className="absolute right-4 max-md:right-3 text-gray-400 text-base pointer-events-none" />
                        </div>
                      ) : (
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5">
                          <p className="text-xs max-md:text-xxs text-gray-500 capitalize">
                            {editForm?.status}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Trip Count */}
                    <InputField
                      label="Trip Count"
                      type="number"
                      name="tripCount"
                      placeholder="0"
                      value={editForm?.tripCount ?? ""}
                      disabled={!isEditMode || isLoading}
                      onChange={handleChange}
                      isRequired={false}
                    />

                    {/* Subcon */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
                        Subcon
                      </span>
                      {isEditMode ? (
                        <Combobox
                          value={editForm?.subcon || ""}
                          onChange={(v) => handleComboboxChange("subcon", v)}
                        >
                          <div className="relative flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5 focus-within:border-gray-400 transition-all">
                            <ComboboxInput
                              className="w-full bg-transparent text-xs max-md:text-xxs text-gray-800 placeholder-gray-400 focus:outline-none capitalize min-w-0"
                              displayValue={(v) => v || ""}
                              onChange={(e) => setSubconQuery(e.target.value)}
                              placeholder="Search subcon..."
                              autoComplete="off"
                            />
                            <ComboboxButton className="absolute right-4 max-md:right-3 text-gray-400">
                              <MdKeyboardArrowDown className="text-base" />
                            </ComboboxButton>
                          </div>
                          <ComboboxOptions
                            portal
                            anchor={{ to: "bottom start", gap: 8 }}
                            className="z-999 max-h-48 w-(--input-width) overflow-auto rounded-md bg-white border border-gray-200 py-1 text-xs focus:outline-none"
                          >
                            {filteredSubcons.length === 0 ? (
                              <div className="px-4 py-2 text-gray-400 italic">
                                Nothing found.
                              </div>
                            ) : (
                              filteredSubcons.map((subcon, i) => (
                                <ComboboxOption
                                  key={i}
                                  value={subcon}
                                  className={({ focus }) =>
                                    clsx(
                                      "px-4 py-2 cursor-default select-none capitalize transition-colors",
                                      {
                                        "bg-gray-50": focus,
                                        "bg-gray-100 font-medium":
                                          editForm?.subcon === subcon,
                                      },
                                    )
                                  }
                                >
                                  {subcon}
                                </ComboboxOption>
                              ))
                            )}
                          </ComboboxOptions>
                        </Combobox>
                      ) : (
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5">
                          <p className="text-xs max-md:text-xxs text-gray-700 capitalize truncate">
                            {editForm?.subcon?.replace(/_/g, " ") ||
                              "Not assigned"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ── Actions ── */}
                  {isAdmin && (
                    <div className="px-6 pb-5 pt-4 max-md:px-4 max-md:pb-4 border-t border-gray-200 shrink-0">
                      {isEditMode ? (
                        <div className="flex gap-2">
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
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <ActionButton
                            icon={RiEditLine}
                            color="blue"
                            onClick={() => setIsEditMode(true)}
                            title="Edit"
                          />
                          <ActionButton
                            icon={RiDeleteBin6Line}
                            color="red"
                            onClick={openDeleteModal}
                            title="Delete"
                          />
                        </div>
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

/* ─── Reusable InputField ───────────────────────────────────────────────── */
const InputField = ({
  label,
  type,
  name,
  placeholder,
  value,
  onChange,
  disabled,
  isRequired = true,
  isUppercase = false,
}) => (
  <label className="flex flex-col gap-1.5">
    <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
      {label} {isRequired && <span className="text-red-400">*</span>}
    </span>
    <div
      className={clsx(
        "flex items-center border rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5 transition-all duration-200",
        disabled
          ? "bg-gray-50 border-gray-200"
          : "bg-white border-gray-200 focus-within:border-gray-400",
      )}
    >
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={value}
        minLength={type === "number" ? undefined : 2}
        maxLength={type === "number" ? undefined : 50}
        onChange={onChange}
        disabled={disabled}
        required={isRequired}
        className={clsx(
          "flex-1 text-xs max-md:text-xxs placeholder-gray-400 bg-transparent focus:outline-none min-w-0",
          disabled ? "text-gray-500" : "text-gray-800",
          isUppercase ? "uppercase" : "capitalize",
        )}
      />
    </div>
  </label>
);

export default TruckDetailsModal;
