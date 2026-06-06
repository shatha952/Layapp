import { motion } from "framer-motion";

export function StoreLayout({ zones, highlight }) {

  const getStyle = (state, name) => {
    let base =
      "rounded-2xl p-4 text-center text-sm font-medium transition-all duration-300";

    let color =
      state === "low"
        ? "bg-green-500/80"
        : state === "medium"
        ? "bg-yellow-400 text-black"
        : "bg-red-500";

    let pulse =
      state === "high"
        ? "animate-pulse"
        : "";

    let active =
      highlight === name
        ? "ring-4 ring-blue-500 scale-105"
        : "";

    return `${base} ${color} ${pulse} ${active}`;
  };

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">

      <h2 className="text-lg mb-4 text-white/80">
        Store Map
      </h2>

      {/* GRID MAP */}
      <div className="grid grid-cols-3 gap-4">

        {zones.map((zone, index) => (
          <motion.div
            key={index}
            whileHover={{ scale: 1.05 }}
            className={getStyle(zone.state, zone.name)}
          >
            {zone.name}
          </motion.div>
        ))}

      </div>

      {/* LEGEND */}
      <div className="flex gap-6 mt-6 text-sm">

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          Low
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400 rounded"></div>
          Medium
        </div>

        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          High
        </div>

      </div>

    </div>
  );
}