// utils/validateDeploymentTimeline.js
const validateDeploymentTimeline = (data) => {
  const toDate = (str) => (str && str.trim() ? new Date(str) : null);
  const errors = [];

  const departed = toDate(data.departed);
  const destArrival = toDate(data.destArrival);
  const destDeparture = toDate(data.destDeparture);

  const sequence = [];

  if (departed) sequence.push({ label: "Departed", date: departed });

  for (let i = 0; i < (data.pickups || []).length; i++) {
    const pickup = data.pickups[i];
    const stopLabel = data.pickups.length > 1 ? ` (Stop ${i + 1})` : "";
    const pickupIn = toDate(pickup.pickupIn);
    const pickupOut = toDate(pickup.pickupOut);

    if (pickupIn)
      sequence.push({ label: `Pick-up In${stopLabel}`, date: pickupIn });
    if (pickupOut)
      sequence.push({ label: `Pick-up Out${stopLabel}`, date: pickupOut });
  }

  if (destArrival)
    sequence.push({ label: "Destination Arrival", date: destArrival });
  if (destDeparture)
    sequence.push({ label: "Destination Departure", date: destDeparture });

  for (let i = 1; i < sequence.length; i++) {
    const prev = sequence[i - 1];
    const curr = sequence[i];
    if (curr.date <= prev.date) {
      errors.push(`"${curr.label}" must be after "${prev.label}"`);
    }
  }

  return errors; // empty array = valid
};

module.exports = validateDeploymentTimeline;
