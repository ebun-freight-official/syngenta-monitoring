import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import { FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import { API_USER } from "../../utils/APIRoutes";
import ActionButton from "../ui/ActionButton";
import { RiDeleteBin6Line } from "react-icons/ri";

function DeleteUserModal({ user, isOpen, onClose, onDelete }) {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);

  const handleDelete = async () => {
    setIsDeleteLoading(true);
    try {
      const token = sessionStorage.getItem("userToken");
      const response = await axios.delete(
        `${API_USER}/soft-delete/${user._id}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(response.data.message);
      onDelete(user._id);
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong!");
    } finally {
      setIsDeleteLoading(false);
    }
  };

  const handleClose = () => {
    if (isDeleteLoading) return;
    onClose();
  };

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
            <DialogPanel className="font-poppins w-full max-w-md rounded-xl bg-white shadow-lg overflow-hidden flex flex-col">
              {/* ── Header ─────────────────────────────────────────────── */}
              <div
                className="relative flex items-start justify-between px-6 pt-5 pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3 border-b border-gray-200 shrink-0 overflow-hidden"
                style={{
                  background:
                    "linear-gradient(155deg, #1a0000 0%, #3b0000 55%, #1c0a0a 100%)",
                }}
              >
                <svg
                  className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern
                      id="dots-del-user"
                      x="0"
                      y="0"
                      width="20"
                      height="20"
                      patternUnits="userSpaceOnUse"
                    >
                      <circle cx="2" cy="2" r="1.2" fill="white" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#dots-del-user)" />
                </svg>
                <div className="relative z-10">
                  <h2 className="text-white font-bold text-base max-md:text-sm">
                    Delete User
                  </h2>
                  <p className="text-white/50 text-xxs mt-0.5">
                    This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isDeleteLoading}
                  className="relative z-10 text-white/40 hover:text-white hover:bg-white/10 p-1.5 rounded-md text-lg transition-all cursor-pointer disabled:opacity-40 shrink-0 ml-4"
                >
                  <IoClose />
                </button>
              </div>

              {/* ── Body ───────────────────────────────────────────────── */}
              <div className="px-6 py-5 max-md:px-4 max-md:py-4">
                <p className="text-xs max-md:text-xxs text-gray-600 leading-relaxed">
                  Are you sure you want to delete user{" "}
                  <span className="font-bold capitalize">
                    {user?.firstname} {user?.lastname}
                  </span>
                  ? This record will be permanently deleted and cannot be
                  recovered.
                </p>
              </div>

              {/* ── Footer ─────────────────────────────────────────────── */}
              <div className="px-6 pb-5 pt-4 max-md:px-4 max-md:pb-4 border-t border-gray-200 shrink-0 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isDeleteLoading}
                  className="px-5 py-2.5 rounded-lg font-semibold text-xxs uppercase tracking-wide bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800 cursor-pointer active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <ActionButton
                  icon={RiDeleteBin6Line}
                  color="red"
                  type="button"
                  title="Delete deployment"
                  text="Yes, Delete it"
                  loadingText="Deleting"
                  isLoading={isDeleteLoading}
                  onClick={handleDelete}
                />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}

export default DeleteUserModal;
