import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";
import { auth, db } from "../firebase";

export default function Register() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async () => {
    setError("");

    if (!email || !password) {
      setError("Enter email and password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      // نحاول نحفظ في Firestore بدون ما يكسر التسجيل
      try {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          role: role,
          createdAt: serverTimestamp()
        });
      } catch (dbError) {
        console.log("Firestore error:", dbError);
      }

      setSuccess(true);

      setTimeout(() => {
        if (role === "manager") navigate("/dashboard");
        else if (role === "staff") navigate("/staff");
        else navigate("/home");
      }, 1200);

    } catch (err) {
      console.log("FULL ERROR:", err);

      // 🔥 هنا التعديل المهم
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen text-white overflow-hidden">

      <img
        src="https://images.unsplash.com/photo-1765445774035-9bb028f7b205?q=80&w=1369&auto=format&fit=crop"
        className="absolute w-full h-full object-cover scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/60 to-black/80"></div>

      <div className="relative z-10 flex items-center justify-center min-h-screen px-6">

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-[360px] bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl"
        >

          {success ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <h2 className="text-3xl font-semibold mb-4 text-green-400">
                Account Created
              </h2>
              <p className="text-white/70">Redirecting...</p>
            </motion.div>
          ) : (
            <>
              <h2 className="text-3xl font-semibold mb-6 text-center">
                Create Account
              </h2>

              {error && (
                <p className="text-red-400 text-sm mb-4 text-center">
                  {error}
                </p>
              )}

              <input
                type="email"
                placeholder="Email"
                className="w-full mb-3 p-3 rounded-lg bg-white/20 outline-none focus:ring-2 focus:ring-green-500 placeholder-white/60"
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full mb-4 p-3 rounded-lg bg-white/20 outline-none focus:ring-2 focus:ring-green-500 placeholder-white/60"
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="mb-5">
                <p className="text-sm mb-2 text-white/80">Select Role</p>

                <div className="grid grid-cols-3 gap-2">

                  <button
                    onClick={() => setRole("customer")}
                    className={`py-2 rounded-lg text-sm border ${
                      role === "customer"
                        ? "bg-blue-600 border-blue-500"
                        : "bg-white/10 border-white/20"
                    }`}
                  >
                    Customer
                  </button>

                  <button
                    onClick={() => setRole("staff")}
                    className={`py-2 rounded-lg text-sm border ${
                      role === "staff"
                        ? "bg-blue-600 border-blue-500"
                        : "bg-white/10 border-white/20"
                    }`}
                  >
                    Staff
                  </button>

                  <button
                    onClick={() => setRole("manager")}
                    className={`py-2 rounded-lg text-sm border ${
                      role === "manager"
                        ? "bg-blue-600 border-blue-500"
                        : "bg-white/10 border-white/20"
                    }`}
                  >
                    Manager
                  </button>

                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-medium transition shadow-lg"
              >
                {loading ? "Creating..." : "Register"}
              </motion.button>

              <p className="text-sm mt-6 text-center text-white/70">
                Already have account?
                <span
                  className="ml-2 text-blue-400 cursor-pointer hover:underline"
                  onClick={() => navigate("/login")}
                >
                  Login
                </span>
              </p>
            </>
          )}

        </motion.div>

      </div>
    </div>
  );
}