import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { IoClose } from "react-icons/io5";
import { useSettingsContext } from "../../contexts/SettingsContext";
import CreateOptionModal from "../../components/modals/CreateOptionModal";
import DeleteOptionModal from "../../components/modals/DeleteOptionModal";
import clsx from "clsx";
import { TableLoading } from "../../components/TablesState";
import PageHeader from "../../components/PageHeader";

function SystemSettingsPage() {
  const {
    settings,
    isLoadingSettings,
    isAdding,
    isRemoving,
    addOption,
    removeOption,
  } = useSettingsContext();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    category: null,
    field: null,
    value: null,
  });

  const openDeleteModal = (category, field, value) => {
    setDeleteModal({ isOpen: true, category, field, value });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, category: null, field: null, value: null });
  };

  const handleConfirmDelete = async () => {
    const { category, field, value } = deleteModal;
    await removeOption({ category, field, value });
    closeDeleteModal();
  };

  const handleCreateOption = async (formData) => {
    return await addOption({
      category: formData.category,
      field: formData.field,
      value: formData.value,
    });
  };

  const btnBase =
    "flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed";

  // Renders a list of plain string options
  const renderOptionsList = (category, field, fieldLabel, options) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xxxs md:text-xxs font-semibold text-gray-500 uppercase tracking-widest">
          {fieldLabel}
        </h4>
        <span className="text-xxxs md:text-xxs text-gray-500 tabular-nums">
          {options.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.length === 0 ? (
          <p className="text-xxs text-gray-300 italic self-center">
            No options yet
          </p>
        ) : (
          options.map((option, index) => (
            <div
              key={index}
              className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-md text-xxs capitalize group pl-2.5"
            >
              <span>{option}</span>
              <button
                type="button"
                onClick={() => openDeleteModal(category, field, option)}
                disabled={isRemoving}
                className="text-gray-300 hover:text-gray-600 transition-colors disabled:opacity-40 px-2 py-1 border-l border-gray-200 hover:bg-gray-100 cursor-pointer text-xs rounded-r-md"
              >
                <IoClose className="text-xs" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Renders contact person options
  const renderContactPersonList = (category, field, fieldLabel, persons) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xxxs md:text-xxs font-semibold text-gray-500 uppercase tracking-widest">
          {fieldLabel}
        </h4>
        <span className="text-xxxs md:text-xxs text-gray-500 tabular-nums">
          {persons.length}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {persons.length === 0 ? (
          <p className="text-xxs text-gray-300 italic">No contacts yet</p>
        ) : (
          persons.map((person, index) => (
            <div
              key={index}
              className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-200 rounded-md pl-3 pr-1 py-1"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xxs text-gray-700 capitalize font-medium truncate">
                  {person.name}
                </span>
                <span className="text-xxxs text-gray-400 shrink-0">
                  {person.contactNo}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openDeleteModal(category, field, person.name)}
                disabled={isRemoving}
                className="text-gray-300 hover:text-gray-600 transition-colors disabled:opacity-40 px-2 py-1 border-l border-gray-200 hover:bg-gray-100 cursor-pointer rounded-r-md shrink-0"
              >
                <IoClose className="text-xs" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (isLoadingSettings) {
    return <TableLoading />;
  }

  return (
    <>
      <div className="flex-1 flex flex-col gap-2 sm:gap-4 lg:gap-6">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap justify-between items-start gap-2">
          <div className="flex justify-between flex-1 items-center md:items-start">
            <PageHeader
              header={"System Settings"}
              subheader={"Manage dropdown options used across the platform"}
            />

            <div className="flex gap-2 xl:hidden">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                disabled={isLoadingSettings}
                className={clsx(
                  btnBase,
                  "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100",
                )}
              >
                <FaPlus className="text-xxs" />
                <span>Create New</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 max-xl:hidden">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={isLoadingSettings}
              className={clsx(
                btnBase,
                "bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100",
              )}
            >
              <FaPlus className="text-xxs" />
              <span>Create New</span>
            </button>
          </div>
        </div>

        {/* ── Options panels ──────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col md:flex-row gap-5">
          {/* Trucks & Drivers */}
          <div className="flex-1 flex flex-col bg-white rounded-md border border-gray-200 overflow-auto">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-800">
                Trucks &amp; Drivers
              </h2>
              <p className="text-xxs text-gray-400 mt-0.5 max-md:hidden">
                Options for truck and driver forms
              </p>
            </div>

            <div className="flex-1 relative overflow-y-auto scrollbar-thin">
              <div className="absolute top-0 left-0 right-0 px-6 py-5">
                {settings.trucksDrivers &&
                Object.keys(settings.trucksDrivers).length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {renderOptionsList(
                      "trucksDrivers",
                      "truckType",
                      "Truck Type",
                      settings.trucksDrivers.truckType || [],
                    )}
                    <div className="border-t border-gray-100" />
                    {renderOptionsList(
                      "trucksDrivers",
                      "status",
                      "Status",
                      settings.trucksDrivers.status || [],
                    )}
                    <div className="border-t border-gray-100" />
                    {renderOptionsList(
                      "trucksDrivers",
                      "subcon",
                      "Subcon",
                      settings.trucksDrivers.subcon || [],
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-gray-400 text-xs">
                      No options available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Deployments */}
          <div className="flex-1 flex flex-col bg-white rounded-md border border-gray-200 overflow-auto">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-xs font-semibold text-gray-800">
                Deployments
              </h2>
              <p className="text-xxs text-gray-400 mt-0.5 max-md:hidden">
                Options used in deployment forms
              </p>
            </div>

            <div className="flex-1 relative overflow-y-auto scrollbar-thin">
              <div className="absolute top-0 left-0 right-0 px-6 py-5">
                {settings.deployments &&
                Object.keys(settings.deployments).length > 0 ? (
                  <div className="flex flex-col gap-6">
                    {renderOptionsList(
                      "deployments",
                      "hybrid",
                      "Hybrid",
                      settings.deployments.hybrid || [],
                    )}
                    <div className="border-t border-gray-100" />
                    {renderOptionsList(
                      "deployments",
                      "territory",
                      "Territory",
                      settings.deployments.territory || [],
                    )}
                    <div className="border-t border-gray-100" />
                    {renderOptionsList(
                      "deployments",
                      "flagging",
                      "Flagging",
                      settings.deployments.flagging || [],
                    )}
                    <div className="border-t border-gray-100" />
                    {renderOptionsList(
                      "deployments",
                      "destination",
                      "Destination",
                      settings.deployments.destination || [],
                    )}
                    <div className="border-t border-gray-100" />
                    {renderOptionsList(
                      "deployments",
                      "pickupSite",
                      "Pickup Site",
                      settings.deployments.pickupSite || [],
                    )}
                    <div className="border-t border-gray-100" />
                    {renderOptionsList(
                      "deployments",
                      "municipality",
                      "Municipality",
                      settings.deployments.municipality || [],
                    )}
                    <div className="border-t border-gray-100" />
                    {renderContactPersonList(
                      "deployments",
                      "fieldContactPersons",
                      "Field Contact Persons",
                      settings.deployments.fieldContactPersons || [],
                    )}
                    <div className="border-t border-gray-100" />
                    {renderContactPersonList(
                      "deployments",
                      "receivingContactPersons",
                      "Receiving Contact Persons",
                      settings.deployments.receivingContactPersons || [],
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-gray-400 text-xs">
                      No options available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateOptionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateOption}
        isLoading={isAdding}
      />

      <DeleteOptionModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        itemName={deleteModal.value}
        isDeleting={isRemoving}
      />
    </>
  );
}

export default SystemSettingsPage;
