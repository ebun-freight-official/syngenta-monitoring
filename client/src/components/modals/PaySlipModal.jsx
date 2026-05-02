import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from "@headlessui/react";
import clsx from "clsx";
import { IoClose } from "react-icons/io5";
import { useEffect, useState } from "react";
import { exportDriverPaymentToPDF } from "../../utils/exportDriverPaymentToPDF";
import { TbPrinter } from "react-icons/tb";
import { toast } from "react-toastify";
import useUpdateDeployment from "../../hooks/useUpdateDeployment";
import ActionButton from "../ui/ActionButton";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) =>
  parseFloat(n || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const defaultPaymentForm = {
  location: "",
  driverRate: "600",
  netWeight: "",
  helperRate: "0.10",
  allowance: "450",
};

// ── Decorative dot pattern ────────────────────────────────────────────────────
const DotPattern = () => (
  <svg
    className="absolute inset-0 w-full h-full opacity-10 pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <pattern
        id="dots-payslip"
        x="0"
        y="0"
        width="20"
        height="20"
        patternUnits="userSpaceOnUse"
      >
        <circle cx="2" cy="2" r="1.5" fill="white" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#dots-payslip)" />
  </svg>
);

// ── PaySlipModal ──────────────────────────────────────────────────────────────
function PaySlipModal({ isOpen, onClose, deployment, onSuccess }) {
  const [paymentForm, setPaymentForm] = useState(defaultPaymentForm);
  const { updateDeploymentFunction } = useUpdateDeployment();

  const hasReplacement = deployment?.replacement?.replacementTruckId?._id;
  const activeDriver = hasReplacement
    ? deployment?.replacement?.replacementDriverId
    : deployment?.driverId;
  const activeTruck = hasReplacement
    ? deployment?.replacement?.replacementTruckId
    : deployment?.truckId;
  const activeTruckType = hasReplacement
    ? deployment?.replacement?.replacementTruckType
    : deployment?.truckType;

  const driverName = activeDriver
    ? `${activeDriver.firstname} ${activeDriver.lastname}`
    : "—";

  // ── Computations ─────────────────────────────────────────────────────────────
  const driverAmount = parseFloat(paymentForm.driverRate) || 0;
  const helperAmount =
    (parseFloat((paymentForm.netWeight || "").replace(/,/g, "")) || 0) *
    (parseFloat(paymentForm.helperRate) || 0);
  const allowanceAmount = parseFloat(paymentForm.allowance) || 0;
  const total = driverAmount + helperAmount + allowanceAmount;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    exportDriverPaymentToPDF(deployment, paymentForm);

    // Mark as printed in the DB
    const result = await updateDeploymentFunction(deployment._id, {
      isPaySlipPrinted: true,
    });

    if (result?.success) {
      onSuccess?.(result.data.deployment);
      toast.success("Pay slip printed successfully!");
    } else {
      onSuccess?.();
    }
  };

  useEffect(() => {
    if (isOpen && deployment) {
      const fieldWeight =
        deployment?.pickups
          ?.slice()
          .reverse()
          .find((p) => p.fieldWeightKg != null && p.fieldWeightKg !== "")
          ?.fieldWeightKg ??
        deployment?.totalWeightKg ??
        "";

      // Format netWeight with commas (e.g. 1000.45 → "1,000.45")
      const formattedWeight = fieldWeight
        ? parseFloat(fieldWeight).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : "";

      setPaymentForm({
        location:
          deployment?.territory || deployment?.pickups?.[0]?.municipality || "",
        driverRate: "600",
        netWeight: formattedWeight,
        helperRate: "0.10",
        allowance: "450",
      });
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
    <Dialog open={isOpen} onClose={() => {}} className="relative z-50">
      <TransitionChild
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
          enter="duration-500 ease-out"
          enterFrom="-translate-y-full opacity-0"
          enterTo="translate-y-0 opacity-100"
          leave="duration-400 ease-in"
          leaveFrom="translate-y-0 opacity-100"
          leaveTo="-translate-y-full opacity-0"
        >
          <DialogPanel className="font-poppins w-full max-w-4xl rounded-xl bg-white shadow-lg overflow-hidden flex flex-col md:flex-row max-h-[88vh]">
            {/* ══ LEFT PANEL ══════════════════════════════════════════════════ */}
            <div
              className="relative flex flex-col overflow-hidden md:w-72 shrink-0 p-6 max-md:p-4"
              style={{
                background:
                  "linear-gradient(155deg, #020617 0%, #001e36 55%, #0f172a 100%)",
              }}
            >
              <DotPattern />

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

              {/* ── LEFT HEADER ── */}
              <div className="relative z-10 pb-4 max-md:pb-3">
                <p className="text-white font-bold text-base max-md:text-sm capitalize">
                  {driverName}
                </p>
                <div className="inline-flex items-center gap-1.5 bg-white/10 rounded-full px-2.5 py-0.5">
                  <span className="text-white/60 text-xxxs md:text-xxs uppercase tracking-wider font-semibold">
                    {`${deployment.helperCount} helper${deployment.helperCount !== 1 ? "s" : ""}`}
                  </span>
                </div>
              </div>

              {/* Summary stats — desktop stacked */}
              <div className="relative z-10 py-5 max-md:hidden flex flex-col gap-1.5">
                <LeftStatRow
                  label="DP Code"
                  value={deployment.deploymentCode}
                />
                <LeftStatRow
                  label="Plate No."
                  value={activeTruck?.plateNo?.toUpperCase() || "—"}
                />
                <LeftStatRow
                  label="Truck Type"
                  value={activeTruckType || "—"}
                  capitalize
                />
              </div>

              {/* Summary stats — mobile horizontal */}
              <div className="relative z-10 md:hidden flex flex-wrap gap-x-4 gap-y-2.5 mt-3">
                <MobileStatChip
                  label="DP Code"
                  value={deployment.deploymentCode}
                />
                <MobileStatChip
                  label="Plate No."
                  value={activeTruck?.plateNo?.toUpperCase() || "—"}
                />
                <MobileStatChip
                  label="Truck Type"
                  value={activeTruckType || "—"}
                  capitalize
                />
              </div>

              {/* ── SUMMARY CARD — desktop ── */}
              <div className="relative z-10 mt-auto max-md:hidden rounded-md bg-white/5 border border-white/10 p-4 flex flex-col gap-1.5">
                <p className="text-white/40 text-xxs uppercase tracking-wider font-semibold mb-1">
                  Summary
                </p>
                <LeftStatRow label="Driver" value={`₱ ${fmt(driverAmount)}`} />
                <LeftStatRow label="Helpers" value={`₱ ${fmt(helperAmount)}`} />
                <LeftStatRow
                  label="Allowance"
                  value={`₱ ${fmt(allowanceAmount)}`}
                />
                <div className="mt-1 pt-2.5 border-t border-white/10 flex items-center justify-between gap-2">
                  <span className="text-white/40 text-xxs uppercase tracking-wider font-semibold shrink-0">
                    Total
                  </span>
                  <span className="text-emerald-400 font-bold text-base">
                    ₱ {fmt(total)}
                  </span>
                </div>
              </div>

              {/* Summary — mobile */}
              <div className="relative z-10 md:hidden mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-x-4 gap-y-2.5">
                <MobileStatChip
                  label="Driver Pay"
                  value={`₱ ${fmt(driverAmount)}`}
                />
                <MobileStatChip
                  label="Helper Pay"
                  value={`₱ ${fmt(helperAmount)}`}
                />
                <MobileStatChip
                  label="Allowance"
                  value={`₱ ${fmt(allowanceAmount)}`}
                />
                <div className="w-full flex items-center gap-3 pt-1 border-t border-white/10">
                  <span className="text-white/40 text-xxxs uppercase tracking-wider font-semibold">
                    Total
                  </span>
                  <span className="text-emerald-400 font-bold text-sm">
                    ₱ {fmt(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* ══ RIGHT PANEL ══════════════════════════════════════════════════ */}
            <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
              {/* ── RIGHT HEADER ── */}
              <div className="flex items-start justify-between px-6 pt-5 pb-4 max-md:px-4 max-md:pt-4 max-md:pb-3 border-b border-gray-200 shrink-0">
                <div>
                  <h2 className="text-gray-900 font-bold text-base max-md:text-sm leading-tight">
                    Rate & Computation
                  </h2>
                  <p className="text-gray-400 text-xxs mt-0.5">
                    Fill in rates to generate the pay slip.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-md text-lg transition-all cursor-pointer shrink-0 ml-4"
                >
                  <IoClose />
                </button>
              </div>

              {/* Scrollable form body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 max-md:px-4 max-md:pt-4 flex flex-col gap-5 min-h-0">
                {/* ── Driver Section ── */}
                <div className="space-y-2">
                  <SectionLabel label="Driver" />
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4 max-md:gap-x-3 max-md:gap-y-3">
                    <InputField
                      label="Location"
                      type="text"
                      name="location"
                      value={paymentForm.location}
                      disabled
                    />
                    <InputField
                      label="Rate (₱)"
                      type="number"
                      name="driverRate"
                      placeholder="0"
                      value={paymentForm.driverRate}
                      onChange={handleChange}
                      min={0}
                      isRequired={false}
                    />
                  </div>
                </div>

                {/* ── Helpers Section ── */}
                <div className="space-y-2">
                  <SectionLabel label="Helpers" />
                  <div className="grid grid-cols-3 gap-x-4 gap-y-4 max-md:gap-x-3 max-md:gap-y-3">
                    <InputField
                      label="Field Wt (kg)"
                      type="text"
                      name="netWeight"
                      value={paymentForm.netWeight}
                      disabled
                    />
                    <InputField
                      label="Rate / kg"
                      type="number"
                      name="helperRate"
                      placeholder="0.10"
                      value={paymentForm.helperRate}
                      onChange={handleChange}
                      min={0}
                      step={0.01}
                      isRequired={false}
                    />
                    <InputField
                      label="Allowance (₱)"
                      type="number"
                      name="allowance"
                      placeholder="0"
                      value={paymentForm.allowance}
                      onChange={handleChange}
                      min={0}
                      step={0.01}
                      isRequired={false}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 pb-5 pt-4 max-md:px-4 max-md:pb-4 border-t border-gray-200 shrink-0">
                <ActionButton
                  icon={TbPrinter}
                  color="green"
                  onClick={handleGenerate}
                  title="Print Pay Slip"
                  text="Print Pay Slip"
                  loadingText="Printing"
                  isLoading={false}
                />
              </div>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  );
}

// ── LEFT PANEL STAT ROW (desktop) ─────────────────────────────────────────────
const LeftStatRow = ({ label, value, capitalize }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-white/40 text-xxs uppercase tracking-wider font-semibold shrink-0">
      {label}
    </span>
    <span
      className={clsx(
        "text-white/70 text-xs font-medium truncate max-w-28 text-right",
        { capitalize },
      )}
    >
      {value}
    </span>
  </div>
);

// ── MOBILE STAT CHIP ──────────────────────────────────────────────────────────
const MobileStatChip = ({ label, value, capitalize }) => (
  <div className="flex-1 flex flex-col gap-0.5">
    <span className="text-white/40 text-xxxs uppercase tracking-wider font-semibold">
      {label}
    </span>
    <span
      className={clsx("text-white/70 text-xxs font-medium truncate", {
        capitalize,
      })}
    >
      {value}
    </span>
  </div>
);

// ── SECTION LABEL ─────────────────────────────────────────────────────────────
const SectionLabel = ({ label }) => (
  <h3 className="text-xxxs md:text-xxs font-semibold text-gray-600 uppercase tracking-wider">
    {label}
  </h3>
);

// ── INPUT FIELD ───────────────────────────────────────────────────────────────
const InputField = ({
  label,
  type,
  name,
  placeholder = "",
  value,
  onChange,
  disabled,
  min,
  step,
  isRequired = true,
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
        value={value || ""}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        required={isRequired}
        min={min}
        step={step}
        className={clsx(
          "flex-1 text-xs max-md:text-xxs placeholder-gray-400 bg-transparent focus:outline-none capitalize min-w-0",
          disabled ? "text-gray-500" : "text-gray-800",
        )}
      />
    </div>
  </label>
);

export default PaySlipModal;
