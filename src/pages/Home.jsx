import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { signOut } from "firebase/auth";
import {
  doc,
  onSnapshot,
  addDoc,
  collection,
  serverTimestamp
} from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Home() {
  const navigate = useNavigate();

  const [zones, setZones] = useState([]);
  const [sending, setSending] = useState(false);
  const [highlight, setHighlight] = useState(null);

  const [rating, setRating] = useState(0);
  const [good, setGood] = useState("");
  const [improve, setImprove] = useState("");

  const alertSound = useRef(null);

  const movableZoneNames = [
    "Women's Wear",
    "Men's Wear",
    "Accessories",
    "Kids",
    "Checkout",
    "Entrance"
  ];

  const defaultLayout = {
    "Women's Wear": "top-left",
    "Men's Wear": "top-center",
    Accessories: "middle",
    Kids: "top-right",
    Checkout: "bottom-left",
    Entrance: "bottom-right"
  };

  const layoutSlots = [
    { id: "top-left", className: "col-span-1" },
    { id: "top-center", className: "col-span-1" },
    { id: "top-right", className: "col-span-1" },
    { id: "middle", className: "col-span-1" },
    { id: "bottom-left", className: "col-span-1" },
    { id: "bottom-right", className: "col-span-1" }
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "store", "zones"), (snap) => {
      if (snap.exists()) {
        const data = snap.data().zones || [];
        setZones(data);

        const best = data.find(
          (z) => movableZoneNames.includes(z.name) && z.state === "low"
        );

        if (best) setHighlight(best.name);

        const hasHigh = data.some(
          (z) => movableZoneNames.includes(z.name) && z.state === "high"
        );

        if (hasHigh && alertSound.current) {
          alertSound.current.play().catch(() => {});
        }
      }
    });

    return () => unsub();
  }, []);

  const bestZone = zones.find(
    (z) => movableZoneNames.includes(z.name) && z.state === "low"
  );

  const focusBest = () => {
    if (!bestZone) return;
    setHighlight(bestZone.name);
  };

  const getZonePosition = (zone) => {
    return zone.layoutPosition || defaultLayout[zone.name] || "middle";
  };

  const getLayoutZones = () => {
    const result = {};

    zones.forEach((zone) => {
      const position = getZonePosition(zone);
      if (!result[position]) {
        result[position] = zone;
      }
    });

    return result;
  };

  const layoutZones = getLayoutZones();

  const getCardStyle = (zone) => {
    if (zone.state === "low") return "border-green-400/40 bg-green-500/15";
    if (zone.state === "medium") return "border-yellow-400/40 bg-yellow-400/15";
    if (zone.state === "high") return "border-red-400/50 bg-red-500/15";
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

  const ZoneCard = ({ zone }) => {
    if (!zone) return null;

    return (
      <motion.div
        whileHover={{ y: -4 }}
        className={`rounded-2xl border backdrop-blur-xl shadow-lg p-4 transition-all duration-300 min-h-[180px] ${
          getCardStyle(zone)
        } ${highlight === zone.name ? "ring-2 ring-blue-500" : ""}`}
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-base">{zone.name}</h3>
            <p className="text-xs text-white/50">Customer area status</p>
          </div>

          <span
            className={`text-xs px-3 py-1 rounded-full border ${getStatusBadge(
              zone
            )}`}
          >
            {zone.state}
          </span>
        </div>

        <div className="mt-4 bg-white/10 border border-white/10 rounded-xl p-4 min-h-[90px]">
          <p className="text-xs text-white/50 mb-2">Staff reason</p>
          <p className="text-sm text-white/80">
            {zone.reason || "No reason added"}
          </p>
        </div>
      </motion.div>
    );
  };

  const sendFeedback = async () => {
    if (!rating) return;

    setSending(true);

    await addDoc(collection(db, "feedback"), {
      rating,
      good,
      improve,
      user: auth.currentUser?.email,
      createdAt: serverTimestamp()
    });

    setRating(0);
    setGood("");
    setImprove("");
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <audio ref={alertSound} src="/alert.mp3" />

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Store Smart Map</h1>
          <p className="text-sm text-white/50 mt-1">
            View store traffic status and staff updates
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
        >
          Logout
        </button>
      </div>

      <div className="mb-6">
        <button
          onClick={focusBest}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
        >
          Focus Best Area
        </button>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg text-white/80">Store Layout</h2>
          <span className="text-sm text-green-400">Live system active</span>
        </div>

        <div className="relative w-full max-w-6xl mx-auto min-h-[620px] bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-white/10 shadow-inner overflow-hidden p-8">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-blue-600 px-8 py-2 rounded-b-xl text-sm">
            Entrance
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
            {layoutSlots.map((slot) => {
              const zone = layoutZones[slot.id];

              return (
                <div key={slot.id} className={slot.className}>
                  {zone ? (
                    <ZoneCard zone={zone} />
                  ) : (
                    <div className="h-[180px] flex items-center justify-center text-white/30 border border-white/10 rounded-xl">
                      Empty
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
        <h2 className="text-lg mb-4">Feedback</h2>

        <p className="text-sm mb-2">How was your experience?</p>

        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-2xl ${
                star <= rating ? "text-yellow-400" : "text-gray-500"
              }`}
            >
              ★
            </button>
          ))}
        </div>

        <p className="text-sm mb-1">What was good?</p>
        <input
          value={good}
          onChange={(e) => setGood(e.target.value)}
          className="w-full p-2 mb-3 rounded bg-white/10 border border-white/20"
        />

        <p className="text-sm mb-1">What can be improved?</p>
        <input
          value={improve}
          onChange={(e) => setImprove(e.target.value)}
          className="w-full p-2 mb-4 rounded bg-white/10 border border-white/20"
        />

        <button
          onClick={sendFeedback}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg"
        >
          {sending ? "Sending..." : "Submit Feedback"}
        </button>
      </div>
    </div>
  );
}