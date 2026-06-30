import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { IoClose } from "react-icons/io5";
import { toast } from "react-toastify";
import { PiMapPinAreaFill } from "react-icons/pi";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import useCreateDeployment from "../../hooks/useCreateDeployment";
import { useSettingsContext } from "../../contexts/SettingsContext";
import ActionButton from "../ui/ActionButton";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";
import ComboboxField from "../ui/ComboboxField";
import { COMPANY_OPTIONS } from "../../utils/userOptions";
import { useUserContext } from "../../contexts/UserContext";

const defaultPickup = {
  address: "",
  municipality: "",
  province: "",
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
  totalSacksCount: 0,
  totalWeightKg: 0,
  departed: "",
  destArrival: "",
  destDeparture: "",
  company: "advanta",
};

const MAX_PICKUPS = 10;

function CreateFGDeployment({ isOpen, onClose, onCreate, trucks, drivers }) {
  const { userData } = useUserContext();

  const { settings } = useSettingsContext();
  const [formData, setFormData] = useState(defaultValue);
  const { createDeploymentFunction, isLoading } = useCreateDeployment();

  const [truckQuery, setTruckQuery] = useState("");
  const [driverQuery, setDriverQuery] = useState("");
  const scrollRef = useRef(null);
  const lastStopRef = useRef(null);
  const prevLengthRef = useRef(1);

  const fieldContactPersons = settings.deployments?.fieldContactPersons || [];

  const truckAllOptions =
    trucks
      ?.filter((truck) => truck.status === "available")
      .sort((a, b) => (a.tripCount || 0) - (b.tripCount || 0))
      .map((truck) => ({
        id: truck._id,
        label: `${truck.plateNo.toUpperCase()} (${truck.truckType}) — ${
          truck.tripCount || 0
        } trips`,
      })) || [];

  const driverAllOptions =
    drivers
      ?.filter((driver) => driver.status === "available")
      .sort((a, b) => (a.tripCount || 0) - (b.tripCount || 0))
      .map((driver) => ({
        id: driver._id,
        label: `${driver.firstname} ${driver.lastname} — ${
          driver.tripCount || 0
        } trips`,
      })) || [];

  const filteredTrucks =
    truckQuery === ""
      ? truckAllOptions
      : truckAllOptions.filter((t) =>
          t.label.toLowerCase().includes(truckQuery.toLowerCase()),
        );

  const filteredDrivers =
    driverQuery === ""
      ? driverAllOptions
      : driverAllOptions.filter((d) =>
          d.label.toLowerCase().includes(driverQuery.toLowerCase()),
        );

  useEffect(() => {
    if (isOpen) {
      const firstDestination = settings.deployments.destination?.[0] ?? "";
      setFormData((prev) => ({ ...prev, destination: firstDestination }));
    }
  }, [isOpen, settings.deployments.destination]);

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
                    Finish Goods Deployment
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
                          Drop Off Details
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
                              Location #{index + 1}
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
                            <SelectField
                              label="Address"
                              name="address"
                              value={pickup.address}
                              onChange={(e) => handlePickupChange(index, e)}
                              required={false}
                            >
                              <option value="" disabled>
                                Select
                              </option>
                              {(settings.deployments?.address || []).map(
                                (item, i) => (
                                  <option key={i} value={item}>
                                    {item}
                                  </option>
                                ),
                              )}
                            </SelectField>

                            <SelectField
                              label="Municipality"
                              name="municipality"
                              value={pickup.municipality}
                              onChange={(e) => handlePickupChange(index, e)}
                              required={false}
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
                            </SelectField>

                            <SelectField
                              label="Province"
                              name="province"
                              value={pickup.province}
                              onChange={(e) => handlePickupChange(index, e)}
                              required={false}
                            >
                              <option value="" disabled>
                                Select
                              </option>
                              {(settings.deployments?.province || []).map(
                                (item, i) => (
                                  <option key={i} value={item}>
                                    {item}
                                  </option>
                                ),
                              )}
                            </SelectField>

                            <InputField
                              label="Scheduled Pickup Time"
                              type="datetime-local"
                              name="scheduledPickupTime"
                              value={pickup.scheduledPickupTime}
                              onChange={(e) => handlePickupChange(index, e)}
                              required={false}
                            />

                            <InputField
                              label="Product Type"
                              type="text"
                              name="estimatedWeightKg"
                              value={pickup.estimatedWeightKg}
                              onChange={(e) =>
                                handlePickupNumericChange(
                                  index,
                                  "estimatedWeightKg",
                                  e.target.value,
                                )
                              }
                              placeholder="Product Type"
                            />

                            <InputField
                              label="Est. Weight (kg)"
                              type="number"
                              name="estimatedWeightKg"
                              value={pickup.estimatedWeightKg}
                              onChange={(e) =>
                                handlePickupNumericChange(
                                  index,
                                  "estimatedWeightKg",
                                  e.target.value,
                                )
                              }
                              numeric
                              decimalScale={2}
                              placeholder="0.00"
                            />

                            <div className="col-span-full grid grid-cols-1 xs:grid-cols-2  gap-x-4 gap-y-4 max-sm:gap-x-3 max-sm:gap-y-3">
                              <SelectField
                                label="Contact Person"
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
                                required={false}
                              >
                                <option value="" disabled>
                                  Select
                                </option>
                                {fieldContactPersons.map((person, i) => (
                                  <option key={i} value={person.name ?? person}>
                                    {person.name ?? person}
                                  </option>
                                ))}
                              </SelectField>

                              <InputField
                                label="Contact No."
                                name="fieldContactPersonNo"
                                placeholder="Contact Number"
                                value={pickup.fieldContactPersonNo}
                                onChange={(e) => handlePickupChange(index, e)}
                                maxLength={11}
                                required={false}
                              />
                            </div>
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

                  {/* ── TRUCK DETAILS ── */}
                  <div className="space-y-2">
                    <h3 className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
                      Truck Details
                    </h3>
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-x-4 gap-y-4 max-sm:gap-x-3 max-sm:gap-y-3 border border-gray-200 rounded-md p-5 max-sm:p-4">
                      <ComboboxField
                        label="Select Truck"
                        value={formData.truckId}
                        onChange={(v) =>
                          setFormData((prev) => ({ ...prev, truckId: v }))
                        }
                        onQueryChange={setTruckQuery}
                        allOptions={truckAllOptions}
                        options={filteredTrucks}
                        uppercase
                        required={false}
                      />

                      <ComboboxField
                        label="Select Driver"
                        value={formData.driverId}
                        onChange={(v) =>
                          setFormData((prev) => ({ ...prev, driverId: v }))
                        }
                        onQueryChange={setDriverQuery}
                        allOptions={driverAllOptions}
                        options={filteredDrivers}
                        required={false}
                      />

                      <SelectField
                        label="Truck Type"
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
                      </SelectField>

                      <InputField
                        label="Helper Count"
                        type="number"
                        name="helperCount"
                        placeholder="0"
                        value={formData.helperCount}
                        onChange={handleChange}
                        numeric
                        decimalScale={0}
                      />

                      <input
                        type="hidden"
                        name="destination"
                        value={formData.destination}
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

export default CreateFGDeployment;
