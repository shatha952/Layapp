import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { db, auth } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  limit,
  updateDoc
} from "firebase/firestore";

import { signOut } from "firebase/auth";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ManagerDashboard() {
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [logs, setLogs] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [tab, setTab] = useState("dashboard");

  const defaultLayout = {
    "Women's Wear": "top-left",
    "Men's Wear": "top-center",
    Shoes: "top-right",
    Accessories: "middle",
    Kids: "bottom-left",
    Checkout: "bottom-right",
    Entrance: "bottom-right"
  };

  const layoutSlots = [
    { id: "top-left", label: "Top Left" },
    { id: "top-center", label: "Top Center" },
    { id: "top-right", label: "Top Right" },
    { id: "middle", label: "Middle" },
    { id: "bottom-left", label: "Bottom Left" },
    { id: "bottom-right", label: "Bottom Right" }
  ];

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "store", "zones"), (snap) => {
      if (snap.exists()) setZones(snap.data().zones || []);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "logs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map((d) => d.data()));
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
      setRecentLogs(snap.docs.map((d) => d.data()));
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setFeedbacks(snap.docs.map((d) => d.data()));
    });

    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  const getZonePosition = (zone) => {
    return zone.layoutPosition || defaultLayout[zone.name] || "bottom-right";
  };

  const changeZonePosition = async (zoneIndex, newPosition) => {
    const updated = [...zones];
    const selectedZone = updated[zoneIndex];
    const oldPosition = getZonePosition(selectedZone);

    const existingIndex = updated.findIndex((zone, index) => {
      return index !== zoneIndex && getZonePosition(zone) === newPosition;
    });

    updated[zoneIndex] = {
      ...selectedZone,
      layoutPosition: newPosition,
      x: 0,
      y: 0
    };

    if (existingIndex !== -1) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        layoutPosition: oldPosition,
        x: 0,
        y: 0
      };
    }

    await updateDoc(doc(db, "store", "zones"), {
      zones: updated
    });
  };

  const stats = useMemo(() => {
    let low = 0;
    let medium = 0;
    let high = 0;

    zones.forEach((z) => {
      if (z.state === "low") low++;
      if (z.state === "medium") medium++;
      if (z.state === "high") high++;
    });

    return { low, medium, high };
  }, [zones]);

  const systemStatus =
    stats.high > 2 ? "BUSY" : stats.high > 0 ? "MODERATE" : "CALM";

  const trendData = logs
    .slice(0, 10)
    .reverse()
    .map((log, i) => ({
      time: i + 1,
      value:
        log.state === "low"
          ? 1
          : log.state === "medium"
          ? 2
          : 3
    }));

  const averageRating =
    feedbacks.length > 0
      ? (
          feedbacks.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
          feedbacks.length
        ).toFixed(1)
      : "0.0";

  const exportPDF = () => {
    const pdf = new jsPDF();
    const now = new Date();

    pdf.text("Manager Report", 14, 15);
    pdf.text(`Date: ${now.toLocaleDateString()}`, 14, 25);
    pdf.text(`Time: ${now.toLocaleTimeString()}`, 14, 32);

    autoTable(pdf, {
      startY: 40,
      head: [["Zone", "State", "Reason"]],
      body: zones.map((z) => [z.name, z.state, z.reason || "No reason"])
    });

    autoTable(pdf, {
      startY: pdf.lastAutoTable.finalY + 10,
      head: [["Rating", "Good", "Improve", "User"]],
      body: feedbacks.map((f) => [
        f.rating || "",
        f.good || "",
        f.improve || "",
        f.user || ""
      ])
    });

    pdf.save("manager-report.pdf");
  };

  const getColor = (state) => {
    if (state === "low") return "bg-green-500/20 border-green-400/30";
    if (state === "medium") return "bg-yellow-400/20 border-yellow-400/30";
    return "bg-red-500/20 border-red-400/30";
  };

  const formatDate = (value) => {
    if (!value) return "No time";
    if (value.toDate) return value.toDate().toLocaleString();
    return "No time";
  };

  const ZoneLayoutCard = ({ zone, index }) => {
    return (
      <motion.div
        whileHover={{ scale: 1.03 }}
        className={`p-4 rounded-xl border ${getColor(zone.state)}`}
      >
        <div className="flex justify-between gap-3">
          <div>
            <p className="font-semibold">{zone.name}</p>
            <p className="text-sm text-white/70 mt-1">Status: {zone.state}</p>
            <p className="text-sm text-white/70 mt-1">
              Reason: {zone.reason || "No reason"}
            </p>
          </div>
        </div>

        <select
          value={getZonePosition(zone)}
          onChange={(e) => changeZonePosition(index, e.target.value)}
          className="w-full mt-4 bg-slate-900 border border-white/10 rounded-lg p-2 text-sm outline-none"
        >
          {layoutSlots.map((slot) => (
            <option key={slot.id} value={slot.id}>
              {slot.label}
            </option>
          ))}
        </select>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 pb-24">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-sm text-white/50 mt-1">
            Monitor traffic, staff updates, and customer feedback
          </p>
        </div>

        <div className="text-green-400 text-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          Live
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        {["dashboard", "activity", "feedback"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg capitalize ${
              tab === t ? "bg-blue-600" : "bg-white/10 hover:bg-white/20"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <motion.div
        key={tab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {tab === "dashboard" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <p className="text-sm text-white/50">Status</p>
                <div className="text-xl mt-1">{systemStatus}</div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <p className="text-sm text-white/50">High</p>
                <div className="text-red-400 text-xl mt-1">{stats.high}</div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <p className="text-sm text-white/50">Medium</p>
                <div className="text-yellow-400 text-xl mt-1">
                  {stats.medium}
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <p className="text-sm text-white/50">Low</p>
                <div className="text-green-400 text-xl mt-1">{stats.low}</div>
              </div>

              <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                <p className="text-sm text-white/50">Avg Rating</p>
                <div className="text-blue-400 text-xl mt-1">
                  {averageRating}
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-xl mb-6">
              <h2 className="text-lg text-white/80 mb-4">Traffic Trend</h2>

              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="value" stroke="#22c55e" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
              <h2 className="text-lg mb-4 text-white/80">Recent Updates</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentLogs.length === 0 && (
                  <p className="text-sm text-white/50">No updates yet</p>
                )}

                {recentLogs.map((log, index) => (
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
                    <p className="text-xs text-white/40 mt-2">
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg mb-4 text-white/80">Store Layout Control</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {layoutSlots.map((slot) => {
                  const zoneIndex = zones.findIndex(
                    (zone) => getZonePosition(zone) === slot.id
                  );

                  const zone = zoneIndex !== -1 ? zones[zoneIndex] : null;

                  return (
                    <div
                      key={slot.id}
                      className="min-h-[190px] rounded-2xl border border-white/10 bg-slate-900/60 p-4"
                    >
                      <p className="text-xs text-white/40 mb-3">{slot.label}</p>

                      {zone ? (
                        <ZoneLayoutCard zone={zone} index={zoneIndex} />
                      ) : (
                        <div className="h-full flex items-center justify-center text-sm text-white/40">
                          Empty
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {tab === "activity" && (
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <h2 className="text-lg mb-4 text-white/80">Recent Updates</h2>

            {logs.length === 0 && (
              <p className="text-sm text-white/50">No activity yet</p>
            )}

            <div className="space-y-3">
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
                  <p className="text-xs text-white/40 mt-2">
                    {formatDate(log.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "feedback" && (
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <h2 className="text-lg mb-4 text-white/80">Customer Feedback</h2>

            {feedbacks.length === 0 && (
              <p className="text-sm text-white/50">No feedback yet</p>
            )}

            <div className="space-y-3">
              {feedbacks.map((feedback, index) => (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-xl p-4"
                >
                  <p className="text-sm font-semibold">
                    Rating: {feedback.rating || 0}/5
                  </p>

                  <p className="text-xs text-white/70 mt-2">
                    Good: {feedback.good || "No answer"}
                  </p>

                  <p className="text-xs text-white/70 mt-1">
                    Improve: {feedback.improve || "No answer"}
                  </p>

                  <p className="text-xs text-white/40 mt-2">
                    User: {feedback.user || "Unknown"}
                  </p>

                  <p className="text-xs text-white/40 mt-1">
                    {formatDate(feedback.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <div className="fixed bottom-4 left-0 w-full flex justify-center gap-4">
        <button
          onClick={exportPDF}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg"
        >
          Export PDF
        </button>

        <button
          onClick={handleLogout}
          className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-xl shadow-lg"
        >
          Logout
        </button>
      </div>
    </div>
  );
}