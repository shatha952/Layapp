import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { db, auth } from "../firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  query,
  orderBy,
  limit
} from "firebase/firestore";

import { signOut } from "firebase/auth";

export default function Staff() {
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [logs, setLogs] = useState([]);
  const [lastChanged, setLastChanged] = useState(null);
  const [reasons, setReasons] = useState({});

  const quickReasons = [
    "High traffic",
    "Discount campaign",
    "Queue at checkout",
    "Staff shortage",
    "Normal flow"
  ];

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "store", "zones"), (snap) => {
      if (snap.exists()) {
        setZones(snap.data().zones || []);
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "logs"),
      orderBy("createdAt", "desc"),
      limit(6)
    );

    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => d.data()));
    });

    return () => unsub();
  }, []);

  const updateZone = async (index, state) => {
    const updated = [...zones];
    updated[index].state = state;

    setLastChanged(updated[index].name);

    await updateDoc(doc(db, "store", "zones"), {
      zones: updated
    });

    await addDoc(collection(db, "logs"), {
      zone: updated[index].name,
      state,
      reason: updated[index].reason || "",
      user: auth.currentUser?.email,
      createdAt: serverTimestamp()
    });

    setTimeout(() => setLastChanged(null), 2000);
  };

  const saveReason = async (index) => {
    const updated = [...zones];
    updated[index].reason = reasons[index] ?? updated[index].reason ?? "";

    await updateDoc(doc(db, "store", "zones"), {
      zones: updated
    });

    await addDoc(collection(db, "logs"), {
      zone: updated[index].name,
      state: updated[index].state,
      reason: updated[index].reason,
      user: auth.currentUser?.email,
      createdAt: serverTimestamp()
    });
  };

  const clearReason = async (index) => {
    const updated = [...zones];
    updated[index].reason = "";

    setReasons({ ...reasons, [index]: "" });

    await updateDoc(doc(db, "store", "zones"), {
      zones: updated
    });

    await addDoc(collection(db, "logs"), {
      zone: updated[index].name,
      state: updated[index].state,
      reason: "",
      user: auth.currentUser?.email,
      createdAt: serverTimestamp()
    });
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const getZoneIndex = (zoneName) => {
    return zones.findIndex((z) => z.name === zoneName);
  };

  const getZoneByPosition = (position) => {
    return zones.find((z) => z.layoutPosition === position);
  };

  const getCardStyle = (zone) => {
    if (zone.state === "low") {
      return "border-green-400/40 bg-green-500/15";
    }

    if (zone.state === "medium") {
      return "border-yellow-400/40 bg-yellow-400/15";
    }

    if (zone.state === "high") {
      return "border-red-400/50 bg-red-500/15";
    }

    return "border-white/10 bg-white/10";
  };

  const getStatusBadge = (zone) => {
    if (zone.state === "low") {
      return "bg-green-500/20 text-green-300 border-green-400/30";
    }

    if (zone.state === "medium") {
      return "bg-yellow-400/20 text-yellow-200 border-yellow-400/30";
    }

    if (zone.state === "high") {
      return "bg-red-500/20 text-red-300 border-red-400/30";
    }

    return "bg-white/10 text-white/70 border-white/10";
  };

  const ZoneControl = ({ zoneName, position, wide = false }) => {
    const zone = position
      ? getZoneByPosition(position)
      : zones.find((z) => z.name === zoneName);

    if (!zone) return null;

    const index = getZoneIndex(zone.name);

    return (
      <motion.div
        whileHover={{ y: -4 }}
        className={`rounded-2xl border backdrop-blur-xl shadow-lg p-4 transition-all duration-300 ${
          getCardStyle(zone)
        } ${
          lastChanged === zone.name ? "ring-2 ring-blue-500" : ""
        } ${wide ? "md:col-span-2" : ""}`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-base">{zone.name}</h3>
            <p className="text-xs text-white/50">Zone control panel</p>
          </div>

          <span
            className={`text-xs px-3 py-1 rounded-full border ${getStatusBadge(
              zone
            )}`}
          >
            {zone.state}
          </span>
        </div>

        <textarea
          placeholder="Reason..."
          value={reasons[index] ?? zone.reason ?? ""}
          onChange={(e) =>
            setReasons({ ...reasons, [index]: e.target.value })
          }
          className="w-full h-[70px] p-3 rounded-xl bg-white/10 border border-white/15 text-sm resize-none outline-none focus:border-blue-400/60"
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
          {quickReasons.map((reason) => (
            <button
              key={reason}
              onClick={() => setReasons({ ...reasons, [index]: reason })}
              className="text-xs px-2 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
            >
              {reason}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => saveReason(index)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
          >
            Save
          </button>

          <button
            onClick={() => clearReason(index)}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-lg text-sm"
          >
            Clear
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4">
          <button
            onClick={() => updateZone(index, "low")}
            className="py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-200 text-sm"
          >
            Low
          </button>

          <button
            onClick={() => updateZone(index, "medium")}
            className="py-2 rounded-lg bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-100 text-sm"
          >
            Medium
          </button>

          <button
            onClick={() => updateZone(index, "high")}
            className="py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-sm"
          >
            High
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Staff Dashboard</h1>
          <p className="text-sm text-white/50 mt-1">
            Manage store traffic status and reasons
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
        >
          Logout
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg text-white/80">Store Layout Control</h2>
          <span className="text-sm text-green-400">Live system active</span>
        </div>

        <div className="relative w-full max-w-6xl mx-auto min-h-[760px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 shadow-inner overflow-hidden p-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-600 px-8 py-2 rounded-b-xl text-sm">
            Entrance
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            <ZoneControl position="top-left" />
            <ZoneControl position="top-center" />
            <ZoneControl position="top-right" />
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ZoneControl position="middle" wide />
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <ZoneControl position="bottom-left" />

            <div className="rounded-2xl border border-white/10 bg-slate-700/60 shadow-lg p-6 flex flex-col items-center justify-center min-h-[260px]">
              <p className="text-xl font-semibold">Cashier</p>
              <p className="text-sm text-white/50 mt-2">Checkout area</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg mb-4 text-white/80">Recent Updates</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {logs.map((log, index) => (
            <div
              key={index}
              className="bg-white/5 border border-white/10 rounded-xl p-4"
            >
              <p className="text-sm font-semibold">{log.zone}</p>
              <p className="text-xs text-white/70 mt-1">
                Status: {log.state}
              </p>
              <p className="text-xs text-white/70 mt-1">
                Reason: {log.reason || "No reason"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}