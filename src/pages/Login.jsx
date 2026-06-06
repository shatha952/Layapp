import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { auth, db } from "../firebase";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Enter email and password");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const role = docSnap.data().role;

        if (role === "manager") {
          navigate("/dashboard");
        } else if (role === "staff") {
          navigate("/staff");
        } else {
          navigate("/home");
        }
      } else {
        navigate("/home");
      }

    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden">

      <img
        src="https://images.unsplash.com/photo-1765410848575-063a741bfcab?q=80&w=1369&auto=format&fit=crop"
        className="absolute w-full h-full object-cover scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-[360px] bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl"
        >

          <h2 className="text-3xl font-semibold mb-6 text-center">
            Welcome Back
          </h2>

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">
              {error}
            </p>
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full mb-3 p-3 rounded-lg bg-white/20 outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/60"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full mb-5 p-3 rounded-lg bg-white/20 outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/60"
            onChange={(e) => setPassword(e.target.value)}
          />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-lg font-medium transition shadow-lg"
          >
            {loading ? "Loading..." : "Login"}
          </motion.button>

          <p className="text-sm mt-6 text-center text-white/70">
            No account?
            <span
              className="ml-2 text-blue-400 cursor-pointer hover:underline"
              onClick={() => navigate("/register")}
            >
              Register
            </span>
          </p>

        </motion.div>

      </div>
    </div>
  );
}