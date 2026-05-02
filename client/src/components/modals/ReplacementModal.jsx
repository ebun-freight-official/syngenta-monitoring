import React, { useEffect, useState } from "react";
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
import { TRUCK_REPLACEMENT_REASONS } from "../../utils/generalOptions";
import clsx from "clsx";
import { PiMapPinAreaFill } from "react-icons/pi";
import useUpdateDeployment from "../../hooks/useUpdateDeployment";
import { useSettingsContext } from "../../contexts/SettingsContext";
import ActionButton from "../ui/ActionButton";

function ReplacementModal({
  isOpen,
  onClose,
  deployment,
  drivers,
  trucks,
  updateSelectedDeployment,
  onUpdate,
}) {
  const [formData, setFormData] = useState({
    truckId: "",
    driverId: "",
    truckType: "",
    replacedAt: "",
    reason: "",
    remarks: "",
  });

  const [truckQuery, setTruckQuery] = useState("");
  const [driverQuery, setDriverQuery] = useState("");

  const { updateDeploymentFunction, isLoading } = useUpdateDeployment();
  const { settings } = useSettingsContext();

  const filteredTrucks =
    trucks?.filter(
      (truck) =>
        truck.plateNo.toLowerCase().includes(truckQuery.toLowerCase()) &&
        truck.status === "available" &&
        truck._id !== deployment?.truckId?._id,
    ) || [];

  const filteredDrivers =
    drivers?.filter(
      (driver) =>
        (driver.firstname.toLowerCase().includes(driverQuery.toLowerCase()) ||
          driver.lastname.toLowerCase().includes(driverQuery.toLowerCase())) &&
        driver.status === "available" &&
        driver._id !== deployment?.driverId?._id,
    ) || [];

  const selectedTruck = trucks?.find((truck) => truck._id === formData.truckId);
  const selectedDriver = drivers?.find(
    (driver) => driver._id === formData.driverId,
  );

  const handleClose = () => {
    onClose();
    setTruckQuery("");
    setDriverQuery("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const replacement = {
      replacementTruckId: formData.truckId,
      replacementDriverId: formData.driverId,
      replacementTruckType: formData.truckType,
      replacedAt: formData.replacedAt,
      reason: formData.reason,
      remarks: formData.remarks,
    };

    const result = await updateDeploymentFunction(deployment._id, {
      replacement,
    });

    if (result.success) {
      toast.success(result.data.message);
      onUpdate(result.data.deployment);
      handleClose();
    } else {
      toast.error(result.error);
    }
  };

  useEffect(() => {
    if (isOpen && deployment) {
      setFormData({
        truckId: "",
        driverId: "",
        truckType: "",
        replacedAt: "",
        reason: "",
        remarks: "",
      });
      setTruckQuery("");
      setDriverQuery("");
    }
  }, [isOpen, deployment]);

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
            <DialogPanel className="font-poppins w-full max-w-2xl rounded-xl bg-white shadow-lg overflow-hidden flex flex-col max-h-[88vh] max-md:max-h-[80vh]">
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3 border-b border-gray-200 shrink-0">
                <div>
                  <h2 className="text-gray-900 font-bold text-base max-md:text-sm">
                    Replacement Truck
                  </h2>
                  <p className="text-gray-400 text-xxs mt-0.5">
                    Assign a new truck and driver to this deployment.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isLoading}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-md text-lg transition-all cursor-pointer disabled:opacity-40 shrink-0 ml-4"
                >
                  <IoClose />
                </button>
              </div>

              {/* Scrollable form body */}
              <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
                <form
                  id="replacement-form"
                  onSubmit={handleSubmit}
                  className="flex-1 flex flex-col"
                >
                  <div className="px-6 py-5 max-md:px-4 max-md:py-4 grid grid-cols-2 gap-x-4 gap-y-4 max-md:gap-x-3 max-md:gap-y-3 content-start">
                    {/* Replacement Truck */}
                    <ComboboxField
                      label="Replacement Truck"
                      value={formData.truckId}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, truckId: value }))
                      }
                      displayValue={() =>
                        selectedTruck ? selectedTruck.plateNo.toUpperCase() : ""
                      }
                      onQueryChange={(e) => setTruckQuery(e.target.value)}
                      options={filteredTrucks.map((t) => ({
                        value: t._id,
                        label: t.plateNo.toUpperCase(),
                      }))}
                      placeholder="Search plate no."
                      isUppercase
                    />

                    {/* Truck Type */}
                    <SelectField
                      label="Truck Type"
                      name="truckType"
                      value={formData.truckType}
                      onChange={handleChange}
                      options={settings.trucksDrivers.truckType}
                    />

                    {/* Replacement Driver */}
                    <div className="col-span-2">
                      <ComboboxField
                        label="Replacement Driver"
                        value={formData.driverId}
                        onChange={(value) =>
                          setFormData((prev) => ({ ...prev, driverId: value }))
                        }
                        displayValue={() =>
                          selectedDriver
                            ? `${selectedDriver.firstname} ${selectedDriver.lastname}`
                            : ""
                        }
                        onQueryChange={(e) => setDriverQuery(e.target.value)}
                        options={filteredDrivers.map((d) => ({
                          value: d._id,
                          label: `${d.firstname} ${d.lastname}`,
                        }))}
                        placeholder="Search driver name"
                      />
                    </div>

                    {/* Replaced At */}
                    <InputField
                      label="Replaced At"
                      type="datetime-local"
                      name="replacedAt"
                      value={formData.replacedAt}
                      onChange={handleChange}
                      isCapitalize={false}
                    />

                    {/* Reason */}
                    <SelectField
                      label="Reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      options={TRUCK_REPLACEMENT_REASONS}
                    />

                    {/* Remarks */}
                    <div className="col-span-2 flex flex-col gap-1.5">
                      <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
                        Remarks
                      </span>
                      <div className="flex items-start bg-white border border-gray-200 rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5 focus-within:border-gray-400 transition-all duration-200">
                        <textarea
                          name="remarks"
                          value={formData.remarks}
                          onChange={handleChange}
                          rows={3}
                          placeholder="Write a message here..."
                          className="flex-1 text-xs max-md:text-xxs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              {/* Action bar */}
              <div className="px-6 pb-5 pt-4 max-md:px-4 max-md:pb-4 border-t border-gray-200 shrink-0">
                <ActionButton
                  icon={PiMapPinAreaFill}
                  color="green"
                  type="submit"
                  form="replacement-form"
                  title="Deploy replacement truck"
                  text="Deploy Truck"
                  loadingText="Deploying"
                  isLoading={isLoading}
                />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

/* ─── ComboboxField ─────────────────────────────────────────────────────── */
const ComboboxField = ({
  label,
  value,
  onChange,
  displayValue,
  onQueryChange,
  options,
  placeholder,
  required = true,
  isUppercase = false,
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
      {label} {required && <span className="text-red-400">*</span>}
    </span>
    <Combobox value={value} onChange={onChange}>
      <div className="relative flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5 focus-within:border-gray-400 transition-all duration-200">
        <ComboboxInput
          className={clsx(
            "w-full bg-transparent text-xs max-md:text-xxs text-gray-800 placeholder-gray-400 focus:outline-none",
            isUppercase ? "uppercase" : "capitalize",
          )}
          displayValue={displayValue}
          onChange={onQueryChange}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
        />
        <ComboboxButton className="absolute right-3 flex items-center text-gray-400 transition-colors">
          <MdKeyboardArrowDown className="text-base" />
        </ComboboxButton>
        <ComboboxOptions className="absolute z-50 top-full left-0 mt-1.5 max-h-48 w-full overflow-auto rounded-md bg-white border border-gray-200 shadow-md py-1 text-xs focus:outline-none">
          {options.length === 0 ? (
            <div className="px-4 py-2 text-gray-400 text-xs italic">
              Nothing found.
            </div>
          ) : (
            options.map((opt) => (
              <ComboboxOption
                key={opt.value}
                value={opt.value}
                className={({ focus }) =>
                  clsx(
                    "px-4 py-2 cursor-default select-none transition-colors",
                    isUppercase ? "uppercase" : "capitalize",
                    {
                      "bg-gray-50": focus,
                      "bg-gray-100 font-medium": value === opt.value,
                    },
                  )
                }
              >
                {opt.label}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  </div>
);

/* ─── SelectField ───────────────────────────────────────────────────────── */
const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  required = true,
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
      {label} {required && <span className="text-red-400">*</span>}
    </span>
    <div className="relative flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5 focus-within:border-gray-400 transition-all duration-200">
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full appearance-none bg-transparent text-xs max-md:text-xxs text-gray-800 focus:outline-none capitalize"
      >
        <option value="" disabled>
          Select
        </option>
        {options.map((item, index) => {
          const isObj = typeof item === "object" && item !== null;
          return (
            <option key={index} value={isObj ? item.value : item}>
              {isObj ? item.label : item}
            </option>
          );
        })}
      </select>
      <MdKeyboardArrowDown className="absolute right-3 text-gray-400 text-base pointer-events-none" />
    </div>
  </div>
);

/* ─── InputField ────────────────────────────────────────────────────────── */
const InputField = ({
  label,
  type,
  name,
  placeholder,
  value,
  onChange,
  disabled,
  maxLength,
  isRequired = true,
  isCapitalize = true,
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
        maxLength={maxLength || 50}
        onChange={onChange}
        disabled={disabled}
        required={isRequired}
        className={clsx(
          "flex-1 text-xs max-md:text-xxs placeholder-gray-400 bg-transparent focus:outline-none min-w-0",
          disabled ? "text-gray-500" : "text-gray-800",
          { capitalize: isCapitalize && type !== "datetime-local" },
        )}
      />
    </div>
  </label>
);

export default ReplacementModal;
