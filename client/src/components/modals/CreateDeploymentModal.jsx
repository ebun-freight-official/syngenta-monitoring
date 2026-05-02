import React, { useState, useRef, useEffect } from "react";
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
import { IoClose } from "react-icons/io5";
import { MdKeyboardArrowDown } from "react-icons/md";
import { toast } from "react-toastify";
import clsx from "clsx";
import { PiMapPinAreaFill } from "react-icons/pi";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import useCreateDeployment from "../../hooks/useCreateDeployment";
import { NumericFormat } from "react-number-format";
import { useSettingsContext } from "../../contexts/SettingsContext";
import ActionButton from "../ui/ActionButton";
import {
  TbLocation,
  TbPackage,
  TbPackageExport,
  TbPrinter,
  TbTruckDelivery,
} from "react-icons/tb";

const defaultPickup = {
  pickupSite: "",
  municipality: "",
  fieldContactPerson: "",
  fieldContactPersonNo: "",
  scheduledPickupTime: "",
  estimatedWeightKg: "",
};

const defaultValue = {
  pickups: [{ ...defaultPickup }],
  truckId: "",
  driverId: "",
  truckType: "",
  helperCount: 0,
  destination: "",
  receivingContactPerson: "",
  receivingContactPersonNo: "",
  hybrid: "",
  territory: "",
  flagging: "",
  flaggingRemarks: "",
  totalSacksCount: 0,
  totalWeightKg: 0,
  departed: "",
  destArrival: "",
  destDeparture: "",
};

const MAX_PICKUPS = 10;

function CreateDeploymentModal({ isOpen, onClose, onCreate, trucks, drivers }) {
  const { settings } = useSettingsContext();
  const [formData, setFormData] = useState(defaultValue);
  const { createDeploymentFunction, isLoading } = useCreateDeployment();

  const [truckQuery, setTruckQuery] = useState("");
  const [driverQuery, setDriverQuery] = useState("");
  const scrollRef = useRef(null);
  const lastStopRef = useRef(null);
  const prevLengthRef = useRef(1);

  const fieldContactPersons = settings.deployments?.fieldContactPersons || [];
  const receivingContactPersons =
    settings.deployments?.receivingContactPersons || [];

  const truckOptions =
    trucks
      ?.filter((truck) => truck.status === "available")
      .sort((a, b) => (a.tripCount || 0) - (b.tripCount || 0))
      .map((truck) => ({
        value: truck._id,
        label: `${truck.plateNo.toUpperCase()} (${truck.truckType}) — ${
          truck.tripCount || 0
        } trips`,
      })) || [];

  const driverOptions =
    drivers
      ?.filter((driver) => driver.status === "available")
      .sort((a, b) => (a.tripCount || 0) - (b.tripCount || 0))
      .map((driver) => ({
        value: driver._id,
        label: `${driver.firstname} ${driver.lastname} — ${
          driver.tripCount || 0
        } trips`,
      })) || [];

  const filteredTrucks =
    truckQuery === ""
      ? truckOptions
      : truckOptions.filter((t) =>
          t.label.toLowerCase().includes(truckQuery.toLowerCase()),
        );

  const filteredDrivers =
    driverQuery === ""
      ? driverOptions
      : driverOptions.filter((d) =>
          d.label.toLowerCase().includes(driverQuery.toLowerCase()),
        );

  const selectedTruck = truckOptions.find((t) => t.value === formData.truckId);
  const selectedDriver = driverOptions.find(
    (d) => d.value === formData.driverId,
  );

  useEffect(() => {
    if (isOpen) {
      const firstDestination = settings.deployments.destination?.[0] ?? "";
      setFormData((prev) => ({ ...prev, destination: firstDestination }));
    }
  }, [isOpen, settings.deployments.destination]);

  // Scroll to new stop when added
  useEffect(() => {
    if (
      formData.pickups.length > prevLengthRef.current &&
      lastStopRef.current
    ) {
      lastStopRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
    prevLengthRef.current = formData.pickups.length;
  }, [formData.pickups.length]);

  const handleCloseModal = () => {
    onClose();
    setFormData(defaultValue);
    setTruckQuery("");
    setDriverQuery("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePickupChange = (index, e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = [...prev.pickups];
      updated[index] = { ...updated[index], [name]: value };
      return { ...prev, pickups: updated };
    });
  };

  const handlePickupNumericChange = (index, name, floatValue) => {
    setFormData((prev) => {
      const updated = [...prev.pickups];
      updated[index] = { ...updated[index], [name]: floatValue || "" };
      return { ...prev, pickups: updated };
    });
  };

  const handleFieldContactPersonChange = (index, name, contactNo) => {
    setFormData((prev) => {
      const updated = [...prev.pickups];
      updated[index] = {
        ...updated[index],
        fieldContactPerson: name,
        fieldContactPersonNo: contactNo,
      };
      return { ...prev, pickups: updated };
    });
  };

  const handleReceivingContactPersonChange = (name, contactNo) => {
    setFormData((prev) => ({
      ...prev,
      receivingContactPerson: name,
      receivingContactPersonNo: contactNo,
    }));
  };

  const addPickup = () => {
    if (formData.pickups.length >= MAX_PICKUPS) return;
    setFormData((prev) => ({
      ...prev,
      pickups: [...prev.pickups, { ...defaultPickup }],
    }));
  };

  const removePickup = (index) => {
    if (formData.pickups.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      pickups: prev.pickups.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createDeploymentFunction(formData);
    if (result.deployment) {
      toast.success(result.message);
      onCreate(result.deployment);
      handleCloseModal();
    } else {
      toast.error(result);
    }
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
          {/* ── Slide-from-top transition ── */}
          <TransitionChild
            as={React.Fragment}
            enter="duration-500 ease-out"
            enterFrom="-translate-y-full opacity-0"
            enterTo="translate-y-0 opacity-100"
            leave="duration-400 ease-in"
            leaveFrom="translate-y-0 opacity-100"
            leaveTo="-translate-y-full opacity-0"
          >
            <DialogPanel className="font-poppins text-gray-900 w-full max-w-3xl rounded-xl bg-white shadow-lg overflow-hidden flex flex-col h-[80vh]">
              {/* ── Header ── */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3 border-b border-gray-200 shrink-0">
                <div>
                  <h2 className="text-gray-900 font-bold text-base max-sm:text-sm">
                    Create a Deployment
                  </h2>
                  <p className="text-gray-400 text-xxs mt-0.5">
                    Fill in the details to deploy a truck.
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-md text-xl transition-all cursor-pointer disabled:opacity-40 shrink-0 ml-4"
                >
                  <IoClose />
                </button>
              </div>

              {/* ── Scrollable form body ── */}
              <form
                id="create-deployment-form"
                onSubmit={handleSubmit}
                className="flex flex-col flex-1 min-h-0 overflow-hidden"
              >
                <div
                  ref={scrollRef}
                  className="flex-1 overflow-y-auto scrollbar-thin flex flex-col gap-6 min-h-0 px-6 max-sm:px-4 py-4"
                >
                  {/* ── PICKUP STOPS ── */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
                          Pickup Details
                        </h3>
                        <span className="text-xxxs md:text-xxs text-gray-400">
                          ({formData.pickups.length}/{MAX_PICKUPS})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={addPickup}
                        disabled={formData.pickups.length >= MAX_PICKUPS}
                        className="flex items-center gap-1.5 text-xxxs md:text-xxs font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors cursor-pointer"
                      >
                        <FiPlus className="text-xxs md:text-xs" /> Add Stop
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {formData.pickups.map((pickup, index) => (
                        <div
                          key={index}
                          ref={
                            index === formData.pickups.length - 1
                              ? lastStopRef
                              : null
                          }
                          className="border border-gray-200 rounded-md p-4 max-sm:p-3 bg-gray-50/50 relative"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xxs sm:text-xs font-semibold text-emerald-600 uppercase tracking-wide">
                              Stop #{index + 1}
                            </p>
                            {formData.pickups.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePickup(index)}
                                className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md transition-colors cursor-pointer"
                                title="Remove stop"
                              >
                                <FiTrash2 className="text-sm" />
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-4 max-sm:gap-x-3 max-sm:gap-y-3">
                            {/* Pick-up Site */}
                            <FormField label="Pick-up Site">
                              <FieldSelectWrapper
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
                              </FieldSelectWrapper>
                            </FormField>

                            {/* Municipality */}
                            <FormField label="Municipality">
                              <FieldSelectWrapper
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
                              </FieldSelectWrapper>
                            </FormField>

                            {/* Scheduled Pickup Time */}
                            <FieldInput
                              label="Scheduled Pickup Time"
                              type="datetime-local"
                              name="scheduledPickupTime"
                              value={pickup.scheduledPickupTime}
                              onChange={(e) => handlePickupChange(index, e)}
                              isRequired={false}
                            />

                            {/* Est. Weight */}
                            <FormField label="Est. Weight (kg)" required>
                              <div className="flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 focus-within:border-gray-400 transition-colors">
                                <NumericFormat
                                  thousandSeparator
                                  decimalScale={2}
                                  allowNegative={false}
                                  value={pickup.estimatedWeightKg}
                                  onValueChange={(values) =>
                                    handlePickupNumericChange(
                                      index,
                                      "estimatedWeightKg",
                                      values.floatValue,
                                    )
                                  }
                                  placeholder="0.00"
                                  required
                                  className="flex-1 text-xs max-sm:text-xxs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                                />
                              </div>
                            </FormField>

                            {/* Field Contact Person */}
                            <FormField label="Field Contact Person">
                              <FieldSelectWrapper
                                name="fieldContactPerson"
                                value={pickup.fieldContactPerson}
                                onChange={(e) => {
                                  const selected = fieldContactPersons.find(
                                    (p) => p.name === e.target.value,
                                  );
                                  handleFieldContactPersonChange(
                                    index,
                                    selected ? selected.name : "",
                                    selected ? selected.contactNo || "" : "",
                                  );
                                }}
                              >
                                <option value="" disabled>
                                  Select
                                </option>
                                {fieldContactPersons.map((person, i) => (
                                  <option key={i} value={person.name ?? person}>
                                    {person.name ?? person}
                                  </option>
                                ))}
                              </FieldSelectWrapper>
                            </FormField>

                            {/* Field Contact No */}
                            <FieldInput
                              label="Field Contact No."
                              type="text"
                              name="fieldContactPersonNo"
                              placeholder="Contact Number"
                              value={pickup.fieldContactPersonNo}
                              onChange={(e) => handlePickupChange(index, e)}
                              maxLength={11}
                              isRequired={false}
                            />
                          </div>
                        </div>
                      ))}

                      {formData.pickups.length >= MAX_PICKUPS && (
                        <p className="text-xs text-gray-400 text-center mt-1">
                          Maximum of {MAX_PICKUPS} pickup stops reached.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ── TRUCK & DRIVER DETAILS ── */}
                  <div className="space-y-2">
                    <h3 className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
                      Truck & Driver Details
                    </h3>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-4 gap-y-4 max-sm:gap-x-3 max-sm:gap-y-3 border border-gray-200 rounded-md p-5 max-sm:p-4">
                      {/* Truck Combobox */}
                      <FormField label="Select Truck" required>
                        <Combobox
                          value={formData.truckId}
                          onChange={(v) => {
                            setFormData((prev) => ({ ...prev, truckId: v }));
                            setTruckQuery("");
                          }}
                        >
                          <div className="relative flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 focus-within:border-gray-400 transition-colors">
                            <ComboboxInput
                              className="w-full bg-transparent text-xs max-sm:text-xxs text-gray-800 placeholder-gray-400 focus:outline-none uppercase min-w-0"
                              displayValue={() => selectedTruck?.label || ""}
                              onChange={(e) => setTruckQuery(e.target.value)}
                              onFocus={() => setTruckQuery("")}
                              placeholder="Search plate no."
                              required
                              autoComplete="off"
                            />
                            <ComboboxButton
                              onClick={() => setTruckQuery("")}
                              className="absolute right-4 max-sm:right-3 text-gray-400"
                            >
                              <MdKeyboardArrowDown className="text-base" />
                            </ComboboxButton>
                          </div>
                          <ComboboxOptions
                            portal
                            anchor={{ to: "bottom start", gap: 8 }}
                            className="z-999 max-h-60 w-(--input-width) overflow-auto rounded-md bg-white border border-gray-200 py-1 text-xs focus:outline-none"
                          >
                            {filteredTrucks.length === 0 ? (
                              <div className="px-4 py-2 text-gray-400 italic">
                                Nothing found.
                              </div>
                            ) : (
                              filteredTrucks.map((t) => (
                                <ComboboxOption
                                  key={t.value}
                                  value={t.value}
                                  className={({ focus }) =>
                                    clsx(
                                      "px-4 py-2 cursor-default select-none uppercase transition-colors",
                                      { "bg-gray-50": focus },
                                    )
                                  }
                                >
                                  {t.label}
                                </ComboboxOption>
                              ))
                            )}
                          </ComboboxOptions>
                        </Combobox>
                      </FormField>

                      {/* Driver Combobox */}
                      <FormField label="Select Driver" required>
                        <Combobox
                          value={formData.driverId}
                          onChange={(v) => {
                            setFormData((prev) => ({ ...prev, driverId: v }));
                            setDriverQuery("");
                          }}
                        >
                          <div className="relative flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 focus-within:border-gray-400 transition-colors">
                            <ComboboxInput
                              className="w-full bg-transparent text-xs max-sm:text-xxs text-gray-800 placeholder-gray-400 focus:outline-none capitalize min-w-0"
                              displayValue={() => selectedDriver?.label || ""}
                              onChange={(e) => setDriverQuery(e.target.value)}
                              onFocus={() => setDriverQuery("")}
                              placeholder="Search driver name"
                              required
                              autoComplete="off"
                            />
                            <ComboboxButton
                              onClick={() => setDriverQuery("")}
                              className="absolute right-4 max-sm:right-3 text-gray-400"
                            >
                              <MdKeyboardArrowDown className="text-base" />
                            </ComboboxButton>
                          </div>
                          <ComboboxOptions
                            portal
                            anchor={{ to: "bottom start", gap: 8 }}
                            className="z-999 max-h-60 w-(--input-width) overflow-auto rounded-md bg-white border border-gray-200 py-1 text-xs focus:outline-none"
                          >
                            {filteredDrivers.length === 0 ? (
                              <div className="px-4 py-2 text-gray-400 italic">
                                Nothing found.
                              </div>
                            ) : (
                              filteredDrivers.map((d) => (
                                <ComboboxOption
                                  key={d.value}
                                  value={d.value}
                                  className={({ focus }) =>
                                    clsx(
                                      "px-4 py-2 cursor-default select-none capitalize transition-colors",
                                      { "bg-gray-50": focus },
                                    )
                                  }
                                >
                                  {d.label}
                                </ComboboxOption>
                              ))
                            )}
                          </ComboboxOptions>
                        </Combobox>
                      </FormField>

                      {/* Truck Type */}
                      <FormField label="Truck Type" required>
                        <FieldSelectWrapper
                          name="truckType"
                          value={formData.truckType}
                          onChange={handleChange}
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          {settings.trucksDrivers.truckType.map((item, i) => (
                            <option key={i} value={item}>
                              {item}
                            </option>
                          ))}
                        </FieldSelectWrapper>
                      </FormField>

                      {/* Helper Count */}
                      <FieldInput
                        label="Helper Count"
                        type="number"
                        name="helperCount"
                        placeholder="0"
                        value={formData.helperCount}
                        onChange={handleChange}
                        formatNumber
                      />
                    </div>
                  </div>

                  {/* ── DELIVERY DETAILS ── */}
                  <div className="space-y-2">
                    <h3 className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
                      Delivery Details
                    </h3>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-4 gap-y-4 max-sm:gap-x-3 max-sm:gap-y-3 border border-gray-200 rounded-md p-5 max-sm:p-4">
                      {/* Receiving Contact Person */}
                      <FormField label="Receiving Contact Person" required>
                        <FieldSelectWrapper
                          name="receivingContactPerson"
                          value={formData.receivingContactPerson}
                          onChange={(e) => {
                            const selected = receivingContactPersons.find(
                              (p) => p.name === e.target.value,
                            );
                            handleReceivingContactPersonChange(
                              selected ? selected.name : "",
                              selected ? selected.contactNo || "" : "",
                            );
                          }}
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          {receivingContactPersons.map((person, i) => (
                            <option key={i} value={person.name}>
                              {person.name}
                            </option>
                          ))}
                        </FieldSelectWrapper>
                      </FormField>

                      {/* Receiving Contact No */}
                      <FieldInput
                        label="Receiving Contact No."
                        type="text"
                        name="receivingContactPersonNo"
                        placeholder="Contact Number"
                        value={formData.receivingContactPersonNo}
                        onChange={handleChange}
                        maxLength={11}
                        isRequired={false}
                      />

                      {/* Hidden destination */}
                      <input
                        type="hidden"
                        name="destination"
                        value={formData.destination}
                      />

                      {/* Hybrid */}
                      <FormField label="Hybrid" required>
                        <FieldSelectWrapper
                          name="hybrid"
                          value={formData.hybrid}
                          onChange={handleChange}
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          {settings.deployments.hybrid.map((item, i) => (
                            <option key={i} value={item}>
                              {item}
                            </option>
                          ))}
                        </FieldSelectWrapper>
                      </FormField>

                      {/* Territory */}
                      <FormField label="Territory" required>
                        <FieldSelectWrapper
                          name="territory"
                          value={formData.territory}
                          onChange={handleChange}
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          {settings.deployments.territory.map((item, i) => (
                            <option key={i} value={item}>
                              {item}
                            </option>
                          ))}
                        </FieldSelectWrapper>
                      </FormField>

                      {/* Flagging */}
                      <FormField label="Flagging" required>
                        <FieldSelectWrapper
                          name="flagging"
                          value={formData.flagging}
                          onChange={handleChange}
                        >
                          <option value="" disabled>
                            Select
                          </option>
                          {settings.deployments.flagging.map((item, i) => (
                            <option key={i} value={item}>
                              {item}
                            </option>
                          ))}
                        </FieldSelectWrapper>
                      </FormField>

                      {/* Flagging Remarks */}
                      <FieldInput
                        label="Flagging Remarks"
                        type="text"
                        name="flaggingRemarks"
                        placeholder=""
                        maxLength={50}
                        value={formData.flaggingRemarks}
                        onChange={handleChange}
                        isRequired={false}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Action Bar ── */}
                <div className="flex items-center gap-2 px-6 py-4 max-sm:px-4 border-t border-gray-200 shrink-0">
                  <ActionButton
                    type="submit"
                    icon={PiMapPinAreaFill}
                    color="green"
                    text="Deploy Truck"
                    loadingText="Deploying"
                    isLoading={isLoading}
                  />
                </div>
              </form>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

// ── SHARED UI HELPERS ──────────────────────────────────────────────────────────

const FormField = ({ label, required = false, children }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider truncate">
      {label} {required && <span className="text-red-400">*</span>}
    </span>
    {children}
  </div>
);

const FieldSelectWrapper = ({ name, value, onChange, children }) => (
  <div className="relative flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 focus-within:border-gray-400 transition-colors">
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

const FieldInput = ({
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
    "flex items-center border rounded-md px-4 py-3 max-sm:px-3 max-sm:py-2.5 transition-colors",
    disabled
      ? "bg-gray-50 border-gray-200"
      : "bg-white border-gray-200 focus-within:border-gray-400",
  );

  const inputClass = clsx(
    "flex-1 min-w-0 text-xs max-sm:text-xxs placeholder-gray-400 bg-transparent focus:outline-none",
    disabled ? "text-gray-500" : "text-gray-800",
    { capitalize: isCapitalize && type !== "datetime-local" },
  );

  if (formatNumber && type === "number") {
    return (
      <div className="flex flex-col gap-1.5">
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
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
    </div>
  );
};

export default CreateDeploymentModal;
