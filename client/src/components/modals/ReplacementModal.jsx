import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { IoClose } from "react-icons/io5";
import { toast } from "react-toastify";
import { TRUCK_REPLACEMENT_REASONS } from "../../utils/generalOptions";
import { PiMapPinAreaFill } from "react-icons/pi";
import useUpdateDeployment from "../../hooks/useUpdateDeployment";
import { useSettingsContext } from "../../contexts/SettingsContext";
import ActionButton from "../ui/ActionButton";
import SelectField from "../ui/SelectField";
import ComboboxField from "../ui/ComboboxField";
import InputField from "../ui/InputField";

function ReplacementModal({
  isOpen,
  onClose,
  deployment,
  drivers,
  trucks,
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

  // Build allOptions (full list for display value lookup)
  const allTrucks =
    trucks?.map((t) => ({ id: t._id, label: t.plateNo.toUpperCase() })) || [];

  const allDrivers =
    drivers?.map((d) => ({
      id: d._id,
      label: `${d.firstname} ${d.lastname}`,
    })) || [];

  // Build filtered options shown in the dropdown
  const filteredTrucks =
    trucks
      ?.filter(
        (t) =>
          t.plateNo.toLowerCase().includes(truckQuery.toLowerCase()) &&
          t.status === "available" &&
          t._id !== deployment?.truckId?._id,
      )
      .map((t) => ({ id: t._id, label: t.plateNo.toUpperCase() })) || [];

  const filteredDrivers =
    drivers
      ?.filter(
        (d) =>
          (d.firstname.toLowerCase().includes(driverQuery.toLowerCase()) ||
            d.lastname.toLowerCase().includes(driverQuery.toLowerCase())) &&
          d.status === "available" &&
          d._id !== deployment?.driverId?._id,
      )
      .map((d) => ({ id: d._id, label: `${d.firstname} ${d.lastname}` })) || [];

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
      isNewReplacement: true,
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
    document.addEventListener("keydown", handleKeyDown, true);
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
                      onQueryChange={setTruckQuery}
                      allOptions={allTrucks}
                      options={filteredTrucks}
                      uppercase
                    />

                    {/* Truck Type */}
                    <SelectField
                      label="Truck Type"
                      name="truckType"
                      value={formData.truckType}
                      onChange={handleChange}
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {settings.trucksDrivers.truckType.map((item, i) => {
                        const isObj = typeof item === "object" && item !== null;
                        return (
                          <option key={i} value={isObj ? item.value : item}>
                            {isObj ? item.label : item}
                          </option>
                        );
                      })}
                    </SelectField>

                    {/* Replacement Driver */}
                    <div className="col-span-2">
                      <ComboboxField
                        label="Replacement Driver"
                        value={formData.driverId}
                        onChange={(value) =>
                          setFormData((prev) => ({ ...prev, driverId: value }))
                        }
                        onQueryChange={setDriverQuery}
                        allOptions={allDrivers}
                        options={filteredDrivers}
                      />
                    </div>

                    {/* Replaced At */}
                    <InputField
                      label="Replaced At"
                      type="datetime-local"
                      name="replacedAt"
                      value={formData.replacedAt}
                      onChange={handleChange}
                    />

                    {/* Reason */}
                    <SelectField
                      label="Reason"
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                    >
                      <option value="" disabled>
                        Select
                      </option>
                      {TRUCK_REPLACEMENT_REASONS.map((item, i) => {
                        const isObj = typeof item === "object" && item !== null;
                        return (
                          <option key={i} value={isObj ? item.value : item}>
                            {isObj ? item.label : item}
                          </option>
                        );
                      })}
                    </SelectField>

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

export default ReplacementModal;
