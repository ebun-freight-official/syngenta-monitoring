import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { TbCheck, TbUpload } from "react-icons/tb";
import { toast } from "react-toastify";
import useCreateTruck from "../../hooks/useCreateTruck";
import { useSettingsContext } from "../../contexts/SettingsContext";
import ActionButton from "../ui/ActionButton";
import InputField from "../ui/InputField";
import SelectField from "../ui/SelectField";

/* ─── Decorative dot pattern ────────────────────────────────────────────── */
const DotPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern
        id="dots-create-truck"
        x="0"
        y="0"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="2" cy="2" r="1.5" fill="white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots-create-truck)" />
  </svg>
);

function CreateTruckModal({ isOpen, onClose, onCreate }) {
  const { settings } = useSettingsContext();

  const emptyForm = {
    plateNo: "",
    truckType: "",
    status: "available",
    subcon: "",
    maxLoad: "",
    image: {},
  };

  const [formData, setFormData] = useState(emptyForm);
  const [previewImage, setPreviewImage] = useState(null);
  const { createTruckFunction, isLoading } = useCreateTruck();

  const handleCloseModal = () => {
    if (previewImage) URL.revokeObjectURL(previewImage);
    onClose();
    setPreviewImage(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, image: file }));
    } else {
      setPreviewImage(null);
      setFormData((prev) => ({ ...prev, image: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await createTruckFunction(formData);
    if (result.truck) {
      toast.success(result.message);
      onCreate(result.truck);
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
            <DialogPanel className="font-poppins w-full max-w-4xl rounded-xl bg-white shadow-lg overflow-hidden flex flex-col md:flex-row">
              {/* ══ LEFT PANEL ══════════════════════════════════════════════════ */}
              <div
                className="relative flex justify-start flex-col md:justify-center overflow-hidden md:w-64 shrink-0 p-6 max-md:p-4"
                style={{
                  background:
                    "linear-gradient(155deg, #020617 0%, #001e36 55%, #0f172a 100%)",
                }}
              >
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

                <p className="text-xxxs md:text-xxs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Upload Image
                </p>

                <div className="relative z-10 w-full max-md:w-18 aspect-square rounded-md overflow-hidden cursor-pointer group border border-white/20 hover:border-white/30 transition-all">
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div
                      className="h-full w-full rounded-md"
                      style={{
                        background:
                          "linear-gradient(155deg, #020617 0%, #001e36 55%, #0f172a 100%)",
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 group-hover:transition-opacity text-white/40 gap-1">
                    <TbUpload className="text-xl max-md:text-base" />
                    <span className="text-xxs font-medium max-md:hidden">
                      Upload Photo
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {/* ══ RIGHT PANEL ═════════════════════════════════════════════════ */}
              <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* Header */}
                <div className="flex items-start justify-between px-6 pt-5 pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3 border-b border-gray-200 shrink-0">
                  <div>
                    <h2 className="text-gray-900 font-bold text-base max-md:text-sm">
                      Create New Truck
                    </h2>
                    <p className="text-gray-400 text-xxs mt-0.5">
                      Fill in the details to add a new truck.
                    </p>
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
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                  <div className="flex-1 px-6 py-5 max-md:px-4 max-md:pt-4 grid grid-cols-2 gap-x-4 gap-y-4 max-md:gap-x-3 max-md:gap-y-3 content-start">
                    <InputField
                      label="Plate No."
                      name="plateNo"
                      placeholder="Plate No."
                      value={formData.plateNo}
                      onChange={handleChange}
                      disabled={isLoading}
                      maxLength={7}
                    />
                    <SelectField
                      label="Type"
                      name="truckType"
                      value={formData.truckType}
                      onChange={handleChange}
                      disabled={isLoading}
                    >
                      <option value="" disabled>
                        Select type
                      </option>
                      {settings.trucksDrivers.truckType.map((item, i) => (
                        <option key={i} value={item}>
                          {item}
                        </option>
                      ))}
                    </SelectField>
                    <InputField
                      label="Max Load (kg)"
                      name="maxLoad"
                      placeholder="0"
                      value={formData.maxLoad}
                      onChange={handleChange}
                      disabled={isLoading}
                      numeric
                      thousandSep
                      decimalScale={0}
                      allowNegative={false}
                    />
                    <SelectField
                      label="Status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      disabled={isLoading}
                    >
                      {settings.trucksDrivers.status.map((item, i) => (
                        <option key={i} value={item}>
                          {item}
                        </option>
                      ))}
                    </SelectField>
                    <div className="col-span-2">
                      <SelectField
                        label="Subcon"
                        name="subcon"
                        value={formData.subcon}
                        onChange={handleChange}
                        disabled={isLoading}
                      >
                        <option value="" disabled>
                          Select subcon
                        </option>
                        {settings.trucksDrivers.subcon.map((item, i) => (
                          <option key={i} value={item}>
                            {item}
                          </option>
                        ))}
                      </SelectField>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-6 pb-5 pt-4 max-md:px-4 max-md:pb-4 border-t border-gray-200 shrink-0">
                    <ActionButton
                      icon={TbCheck}
                      color="green"
                      type="submit"
                      title="Create truck"
                      text="Create"
                      loadingText="Creating"
                      isLoading={isLoading}
                    />
                  </div>
                </form>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

export default CreateTruckModal;