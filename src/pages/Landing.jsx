import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default function Landing() {
  const navigate = useNavigate();
  const [checkingUser, setCheckingUser] = useState(true);
  const [text, setText] = useState("");

  const fullText = "Smart Store Layout Optimization";

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(auth, () => {
      setCheckingUser(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) clearInterval(interval);
    }, 40);

    return () => clearInterval(interval);
  }, []);

  if (checkingUser) return null;

  return (
    <div className="relative min-h-screen text-white overflow-hidden">

      <img
        src="https://plus.unsplash.com/premium_photo-1728176933711-08dda16dd80a?q=80&w=1170&auto=format&fit=crop"
        className="absolute w-full h-full object-cover"
      />

      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-screen px-6">

        <motion.h1
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-6xl font-extrabold mb-4 tracking-tight"
        >
          LayApp
        </motion.h1>

        <h2 className="text-xl text-blue-300 mb-6">
          {text}
          <span className="animate-pulse">|</span>
        </h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-xl text-white/80 mb-8"
        >
          Analyze customer flow, detect congestion, and improve store performance using intelligent insights.
        </motion.p>

        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/login")}
            className="px-7 py-3 bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition"
          >
            Login
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/register")}
            className="px-7 py-3 border border-white/40 rounded-xl hover:bg-white/10 transition"
          >
            Register
          </motion.button>
        </div>

      </div>
    </div>
  );
}