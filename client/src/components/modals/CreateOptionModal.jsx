import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { IoClose } from "react-icons/io5";
import { MdKeyboardArrowDown } from "react-icons/md";
import { TbCheck } from "react-icons/tb";
import clsx from "clsx";
import ActionButton from "../ui/ActionButton";

/* ─── Category / field meta ──────────────────────────────────────────────── */
const CATEGORY_META = {
  trucksDrivers: {
    label: "Trucks & Drivers",
    fields: [
      { value: "truckType", label: "Truck Type" },
      { value: "status", label: "Status" },
      { value: "subcon", label: "Subcon" },
    ],
  },
  deployments: {
    label: "Deployments",
    fields: [
      { value: "hybrid", label: "Hybrid" },
      { value: "territory", label: "Territory" },
      { value: "flagging", label: "Flagging" },
      { value: "destination", label: "Destination" },
      { value: "pickupSite", label: "Pickup Site" },
      { value: "municipality", label: "Municipality" },
      {
        value: "fieldContactPersons",
        label: "Field Contact Persons",
        isContactPerson: true,
      },
      {
        value: "receivingContactPersons",
        label: "Receiving Contact Persons",
        isContactPerson: true,
      },
    ],
  },
};

const CONTACT_PERSON_FIELDS = [
  "fieldContactPersons",
  "receivingContactPersons",
];
const isContactPersonField = (field) => CONTACT_PERSON_FIELDS.includes(field);

const emptyForm = {
  category: "trucksDrivers",
  field: "truckType",
  value: "",
  name: "",
  contactNo: "",
};

function CreateOptionModal({ isOpen, onClose, onCreate, isLoading }) {
  const [formData, setFormData] = useState(emptyForm);

  const handleCloseModal = () => {
    setFormData(emptyForm);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) setFormData(emptyForm);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") handleCloseModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const category = e.target.value;
    const defaultField = CATEGORY_META[category].fields[0].value;
    setFormData({ ...emptyForm, category, field: defaultField });
  };

  const handleFieldChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      field: e.target.value,
      value: "",
      name: "",
      contactNo: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isContact = isContactPersonField(formData.field);
    if (isContact) {
      if (!formData.name.trim() || !formData.contactNo.trim()) return;
    } else {
      if (!formData.value.trim()) return;
    }

    const payload = {
      category: formData.category,
      field: formData.field,
      value: isContact
        ? { name: formData.name.trim(), contactNo: formData.contactNo.trim() }
        : formData.value,
    };

    const success = await onCreate(payload);
    if (success) handleCloseModal();
  };

  const isContact = isContactPersonField(formData.field);

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
            <DialogPanel className="font-poppins w-full max-w-lg rounded-xl bg-white shadow-lg overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3 border-b border-gray-200 shrink-0">
                <div>
                  <h2 className="text-gray-900 font-bold text-base max-md:text-sm">
                    Add New Option
                  </h2>
                  <p className="text-gray-400 text-xxs mt-0.5">
                    Extend a dropdown list in the system.
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
                <div className="px-6 py-5 max-md:px-4 max-md:pt-4 grid grid-cols-2 gap-x-4 gap-y-4 max-md:gap-x-3 max-md:gap-y-3">
                  <SelectField
                    label="Category"
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    disabled={isLoading}
                  >
                    <option value="trucksDrivers">Trucks &amp; Drivers</option>
                    <option value="deployments">Deployments</option>
                  </SelectField>

                  <SelectField
                    label="Field"
                    name="field"
                    value={formData.field}
                    onChange={handleFieldChange}
                    disabled={isLoading}
                  >
                    {CATEGORY_META[formData.category].fields.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.label}
                      </option>
                    ))}
                  </SelectField>

                  {!isContact && (
                    <div className="col-span-2">
                      <InputField
                        label="Option Value"
                        type="text"
                        name="value"
                        placeholder="Enter new option..."
                        value={formData.value}
                        onChange={handleChange}
                        disabled={isLoading}
                        autoFocus
                      />
                    </div>
                  )}

                  {isContact && (
                    <>
                      <div className="col-span-2">
                        <InputField
                          label="Full Name"
                          type="text"
                          name="name"
                          placeholder="Enter full name..."
                          value={formData.name}
                          onChange={handleChange}
                          disabled={isLoading}
                          autoFocus
                        />
                      </div>
                      <div className="col-span-2">
                        <InputField
                          label="Contact Number"
                          type="tel"
                          name="contactNo"
                          placeholder="09XXXXXXXXX"
                          value={formData.contactNo}
                          onChange={handleChange}
                          disabled={isLoading}
                          isUppercase={false}
                          maxLength={11}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Actions */}
                <div className="px-6 pb-5 pt-4 max-md:px-4 max-md:pb-4 border-t border-gray-100 shrink-0">
                  <ActionButton
                    icon={TbCheck}
                    color="green"
                    type="submit"
                    title="Add option"
                    text="Add Option"
                    loadingText="Adding"
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

/* ─── InputField ─────────────────────────────────────────────────────────── */
const InputField = ({
  label,
  type,
  name,
  placeholder,
  value,
  onChange,
  disabled,
  autoFocus,
  maxLength,
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
        onChange={onChange}
        disabled={disabled}
        required={isRequired}
        autoFocus={autoFocus}
        maxLength={maxLength || 50}
        className={clsx(
          "flex-1 text-xs max-md:text-xxs placeholder-gray-400 bg-transparent focus:outline-none capitalize min-w-0",
          disabled ? "text-gray-500" : "text-gray-800",
          { uppercase: isUppercase },
        )}
      />
    </div>
  </label>
);

/* ─── SelectField ────────────────────────────────────────────────────────── */
const SelectField = ({
  label,
  name,
  value,
  onChange,
  disabled,
  isRequired = true,
  children,
}) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
      {label} {isRequired && <span className="text-red-400">*</span>}
    </span>
    <div className="relative flex items-center bg-white border border-gray-200 rounded-md px-4 py-3 max-md:px-3 max-md:py-2.5 focus-within:border-gray-400 transition-all">
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={isRequired}
        className="w-full appearance-none bg-transparent text-xs max-md:text-xxs text-gray-800 focus:outline-none capitalize"
      >
        {children}
      </select>
      <MdKeyboardArrowDown className="absolute right-3 text-gray-400 text-base pointer-events-none" />
    </div>
  </div>
);

export default CreateOptionModal;
