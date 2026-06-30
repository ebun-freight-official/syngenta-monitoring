const mongoose = require("mongoose");

const deploymentSchema = new mongoose.Schema(
  {
    deploymentCode: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
      maxlength: [20, "Deployment code cannot exceed 20 characters"],
    },
    company: {
      type: String,
      required: [true, "Company is required"],
      trim: true,
      lowercase: true,
      maxlength: [100, "Company name cannot exceed 100 characters"],
    },

    // ------------- pickup details ------------- //
    pickups: [
      {
        tmoNo: {
          type: String,
          trim: true,
          uppercase: true,
          unique: false,
          sparse: true,
          index: true,
          maxlength: [20, "TMO No. cannot exceed 20 characters"],
        },
        pickupSite: {
          type: String,
          required: [true, "Pick-up site is required"],
          trim: true,
          maxlength: [100, "Pick-up site cannot exceed 100 characters"],
        },
        address: {
          type: String,
          trim: true,
          maxlength: [100, "Address cannot exceed 200 characters"],
        },
        municipality: {
          type: String,
          trim: true,
          maxlength: [100, "Municipality cannot exceed 100 characters"],
        },
        province: {
          type: String,
          trim: true,
          maxlength: [100, "Province cannot exceed 100 characters"],
        },
        fieldContactPerson: {
          type: String,
          required: [true, "Field Contact Person is required"],
          trim: true,
          maxlength: [100, "Field Contact Person cannot exceed 100 characters"],
          match: [
            /^[a-zA-Z\s'.,-]+$/,
            "Field Contact Person must contain letters only",
          ],
        },
        fieldContactPersonNo: {
          type: String,
          required: [true, "Field Contact Person's No. is required"],
          trim: true,
          match: [/^(?:\+639|09)\d{9}$/, "Invalid contact number format"],
        },
        scheduledPickupTime: {
          type: String,
          required: [true, "Scheduled Pickup Time is required"],
          trim: true,
          match: [
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/,
            "Invalid scheduled pickup time format (expected ISO datetime)",
          ],
        },
        estimatedWeightKg: {
          type: String,
          required: [true, "Estimated Quantity is required"],
          trim: true,
          match: [
            /^\d+(\.\d{1,2})?$/,
            "Estimated weight must be a valid number",
          ],
        },
        fieldWeightKg: {
          type: String,
          trim: true,
          default: "0",
          match: [/^\d+(\.\d{1,2})?$/, "Plant weight must be a valid number"],
        },
        plantWeightKg: {
          type: String,
          trim: true,
          default: "0",
          match: [/^\d+(\.\d{1,2})?$/, "Plant weight must be a valid number"],
        },
        sacksCount: {
          type: Number,
          default: 0,
          min: [0, "Sacks count cannot be negative"],
          validate: {
            validator: Number.isInteger,
            message: "Sacks count must be a whole number",
          },
        },
        pickupIn: {
          type: String,
          trim: true,
          default: "",
          match: [
            /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?)?$/,
            "Invalid pickup-in time format",
          ],
        },
        pickupOut: {
          type: String,
          trim: true,
          default: "",
          match: [
            /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?)?$/,
            "Invalid pickup-out time format",
          ],
        },
        hybrid: {
          type: String,
          trim: true,
          maxlength: [100, "Hybrid cannot exceed 100 characters"],
        },
        territory: {
          type: String,
          trim: true,
          maxlength: [100, "Territory cannot exceed 100 characters"],
        },
        flagging: {
          type: String,
          trim: true,
          maxlength: [50, "Flagging cannot exceed 50 characters"],
        },
        flaggingRemarks: {
          type: String,
          trim: true,
          maxlength: [300, "Flagging remarks cannot exceed 300 characters"],
          default: "",
        },

        // new added
        productType: {
          type: String,
          trim: true,
          maxlength: [100, "Product Type cannot exceed 100 characters"],
        },
        ports: [
          {
            portName: {
              type: String,
              trim: true,
              maxlength: [100, "Port name cannot exceed 100 characters"],
            },
            portIn: {
              type: String,
              trim: true,
              default: "",
              match: [
                /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?)?$/,
                "Invalid port-in time format",
              ],
            },
            portOut: {
              type: String,
              trim: true,
              default: "",
              match: [
                /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?)?$/,
                "Invalid port-out time format",
              ],
            },
          },
        ],
      },
    ],

    // ------------- truck & driver details ------------- //
    // truckId and driverId are optional — a deployment can be created without
    // them when no truck/driver is available, and assigned later via update.
    truckId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Truck",
      default: null,
    },
    truckType: {
      type: String,
      required: [true, "Truck type is required"],
      trim: true,
      lowercase: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },
    helperCount: {
      type: String,
      required: [true, "Helper count is required"],
      trim: true,
      match: [/^\d+$/, "Helper count must be a non-negative whole number"],
    },

    // ------------- delivery details ------------- //
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
      maxlength: [150, "Destination cannot exceed 150 characters"],
    },
    receivingContactPerson: {
      type: String,
      required: [true, "Receiving Contact Person is required"],
      trim: true,
      maxlength: [100, "Receiving Contact Person cannot exceed 100 characters"],
      match: [
        /^[a-zA-Z\s'.,-]+$/,
        "Receiving Contact Person must contain letters only",
      ],
    },
    receivingContactPersonNo: {
      type: String,
      required: [true, "Receiving Contact Person's No. is required"],
      trim: true,
      match: [/^(?:\+639|09)\d{9}$/, "Invalid contact number format"],
    },
    totalSacksCount: {
      type: Number,
      default: 0,
      min: [0, "Total sacks count cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Total sacks count must be a whole number",
      },
    },

    // ------------- load details ------------- //
    totalWeightKg: {
      type: Number,
      default: 0,
      min: [0, "Total weight cannot be negative"],
    },

    // ------------- replacement details ------------- //
    replacements: [
      {
        replacementTruckId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Truck",
        },
        replacementDriverId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Driver",
        },
        replacementTruckType: {
          type: String,
          trim: true,
          lowercase: true,
        },
        replacedAt: {
          type: String,
          trim: true,
          match: [
            /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?)?$/,
            "Invalid replacedAt time format",
          ],
        },
        reason: {
          type: String,
          trim: true,
          maxlength: [200, "Replacement reason cannot exceed 200 characters"],
        },
        remarks: {
          type: String,
          trim: true,
          maxlength: [300, "Replacement remarks cannot exceed 300 characters"],
        },
      },
    ],

    // ------------- timeline details ------------- //
    departed: {
      type: String,
      trim: true,
      default: "",
      match: [
        /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?)?$/,
        "Invalid departed time format",
      ],
    },
    destArrival: {
      type: String,
      trim: true,
      default: "",
      match: [
        /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?)?$/,
        "Invalid destination arrival time format",
      ],
    },
    destDeparture: {
      type: String,
      trim: true,
      default: "",
      match: [
        /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?)?$/,
        "Invalid destination departure time format",
      ],
    },

    // ------------- other tags ------------- //
    status: {
      type: String,
      trim: true,
      lowercase: true,
      default: "preparing",
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "Cancellation reason cannot exceed 300 characters"],
    },
    isTMOPrinted: {
      type: Boolean,
      default: false,
    },
    isPaySlipPrinted: {
      type: Boolean,
      default: false,
    },
    isSoftDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

// ─── counters ──────────────────────────────────────────────────────────────────

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: Number,
});

const Counter = mongoose.model("Counter", counterSchema);

/**
 * Generate the next code for a given counter key.
 * @param {string} prefix        - e.g. 'DP' or 'TMO'
 * @param {string} monthKey      - e.g. '2502'
 * @param {string} counterPrefix - e.g. 'deployment' or 'tmo'
 */
const generateCode = async (prefix, monthKey, counterPrefix) => {
  const counterId = `${counterPrefix}-${monthKey}`;
  const counter = await Counter.findByIdAndUpdate(
    counterId,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return `${prefix}${monthKey}${String(counter.seq).padStart(5, "0")}`;
};

// ─── pre-save hook ─────────────────────────────────────────────────────────────

deploymentSchema.pre("save", async function (next) {
  try {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const monthKey = `${year}${month}`;

    if (!this.deploymentCode) {
      this.deploymentCode = await generateCode("DP", monthKey, "deployment");
    }

    for (const pickup of this.pickups) {
      if (!pickup.tmoNo) {
        pickup.tmoNo = await generateCode("TMO", monthKey, "tmo");
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

const Deployment = mongoose.model("Deployment", deploymentSchema);
module.exports = Deployment;
