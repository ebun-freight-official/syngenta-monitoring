import React, { useState, useEffect } from "react";
import dayjs from "dayjs";

function LiveClock() {
  const [currentTime, setCurrentTime] = useState(dayjs());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex flex-col items-start gap-[1px]">
      <p className="text-[11px] font-medium text-gray-400 tracking-wide uppercase">
        {currentTime.format("dddd, MMMM D, YYYY")}
      </p>
      <p className="text-[20px] font-semibold text-gray-800 leading-none tracking-tight">
        {currentTime.format("h:mm")}
        <span className="text-[13px] font-medium text-gray-400 ml-1">
          {currentTime.format("A")}
        </span>
      </p>
    </div>
  );
}

export default React.memo(LiveClock);
