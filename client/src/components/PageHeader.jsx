import React from "react";

function PageHeader({ header, subheader }) {
  return (
    <div>
      <h1 className="font-semibold xs:text-lg sm:text-xl text-gray-800">
        {header}
      </h1>
      <p className="text-xs text-gray-400 mt-0.5 max-sm:hidden">{subheader}</p>
    </div>
  );
}

export default PageHeader;
