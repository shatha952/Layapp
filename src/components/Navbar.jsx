import { useNavigate } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { useEffect, useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);

  if (!user) return null;

  return (
    <div className="fixed top-0 w-full flex justify-end gap-6 px-8 py-4 z-50 text-white bg-black/50 backdrop-blur">
      <button onClick={() => navigate("/home")}>Home</button>
      <button onClick={() => navigate("/my-plans")}>My Plans</button>
      <button onClick={() => navigate("/my-bookings")}>My Bookings</button>
      <button
        onClick={() => {
          signOut(auth);
          navigate("/");
        }}
        className="bg-white/20 px-4 py-2 rounded-lg"
      >
        Logout
      </button>
    </div>
  );
}