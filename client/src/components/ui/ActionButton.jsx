const ActionButton = ({
  icon: Icon,
  text = "",
  loadingText = "",
  color = "gray",
  onClick,
  type = "button",
  form,
  isLoading,
  title,
}) => {
  const colors = {
    gray: "bg-gray-200 text-gray-600 hover:bg-gray-300 hover:text-gray-800",
    blue: "bg-gradient-to-br from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 text-white",
    green:
      "bg-gradient-to-br from-emerald-400 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white",
    red: "bg-gradient-to-br from-red-400 to-red-600 hover:from-red-500 hover:to-red-700 text-white",
    slate:
      "bg-gradient-to-br from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white",
    orange:
      "bg-gradient-to-br from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white",
    yellow:
      "bg-gradient-to-br from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-white",
    purple:
      "bg-gradient-to-br from-purple-400 to-purple-600 hover:from-purple-500 hover:to-purple-700 text-white",
    pink: "bg-gradient-to-br from-pink-400 to-pink-600 hover:from-pink-500 hover:to-pink-700 text-white",
    cyan: "bg-gradient-to-br from-cyan-400 to-cyan-600 hover:from-cyan-500 hover:to-cyan-700 text-white",
    indigo:
      "bg-gradient-to-br from-indigo-400 to-indigo-600 hover:from-indigo-500 hover:to-indigo-700 text-white",
    rose: "bg-gradient-to-br from-rose-400 to-rose-600 hover:from-rose-500 hover:to-rose-700 text-white",
    teal: "bg-gradient-to-br from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 text-white",
    sky: "bg-gradient-to-br from-sky-400 to-sky-600 hover:from-sky-500 hover:to-sky-700 text-white",
    lime: "bg-gradient-to-br from-lime-400 to-lime-600 hover:from-lime-500 hover:to-lime-700 text-white",
  };

  return (
    <button
      type={type}
      form={form}
      onClick={onClick}
      disabled={isLoading}
      title={title}
      className={`p-2 sm:p-2.5 rounded-md cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_1px_3px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.25)] ${colors[color]} flex items-center justify-center gap-2`}
    >
      {isLoading ? (
        <>
          <span className="loading loading-spinner loading-xs" />

          {loadingText && (
            <span className="text-xxs sm:text-xs tracking-wide">
              {loadingText}
            </span>
          )}
        </>
      ) : (
        <>
          <Icon className="text-sm sm:text-base" />

          {text && (
            <span className="text-xxs sm:text-xs tracking-wide">{text}</span>
          )}
        </>
      )}
    </button>
  );
};

export default ActionButton;
