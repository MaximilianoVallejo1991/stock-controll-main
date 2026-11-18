import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ThemeToggle from "../components/ThemeToggle";
import { useTheme } from "../context/ThemeContext";
import ThemedButton from "../components/ThemedButton";
import ThemedInput from "../components/ThemedInput";
import useUserStore from '../store/userStore';
import useWakeStore from '../store/wakeStore';
import { isAuthenticated } from "../utils/auth";
import { setToken } from "../utils/tokenStorage";
import { withWakeFloor } from "../utils/wakeTracker";



const LoginPage = () => {
  const { theme } = useTheme();

  const setUser = useUserStore((state) => state.setUser);
  const beginWake = useWakeStore((state) => state.beginWake);
  const endWake = useWakeStore((state) => state.endWake);

  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
  });


  useEffect(() => {
    const pendingSetup = sessionStorage.getItem("pending-password-setup");
    if (pendingSetup) {
      navigate("/setup-password", { replace: true });
      return;
    }
    if (isAuthenticated()) {
      navigate("/mainpanel", { replace: true });
    }
  }, [navigate]);


  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({ email: "", password: "" });

    let hasError = false;
    const newErrors = { email: "", password: "" };

    if (!email.trim()) {
      newErrors.email = "El correo es obligatorio";
      hasError = true;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Formato de correo inválido";
      hasError = true;
    }

    if (!password.trim()) {
      newErrors.password = "La contraseña es obligatoria";
      hasError = true;
    }

    if (hasError) {
      setFieldErrors(newErrors);
      return;
    }

    const startedAt = Date.now();
    // Overlay YA, antes de saber rol/tier: cubre la espera real del cold
    // start en vez de dejarla pasar detrás de un "Ingresando..." genérico.
    // SISTEMA puede llegar a verlo brevemente en un login propio lento;
    // se descarta sin piso apenas se confirma el rol, más abajo.
    beginWake(startedAt);
    try {
      const res = await axios.post("/api/auth/login", {
        email,
        password,
      });

      if (res.data.requiresPasswordChange) {
        endWake();
        setToken(res.data.setupToken);
        sessionStorage.setItem("pending-password-setup", JSON.stringify({
          email: res.data.user?.email || email
        }));

        setPassword("");
        navigate("/setup-password", {
          replace: true,
          state: { email: res.data.user?.email || email }
        });
        return;
      }

      setToken(res.data.token);
      setUser(res.data.user);

      const u = res.data.user;
      const exempt = u.role === 'SISTEMA' || u.rbacRole === 'SISTEMA' || !u.isFreeTier;
      if (exempt) {
        endWake();
        navigate("/mainpanel");
        return;
      }

      // Free-tier no-SISTEMA: completa el piso de 30s desde el SUBMIT, no desde la respuesta.
      await withWakeFloor(Promise.resolve(), startedAt);
      endWake();
      navigate("/mainpanel");
    } catch (err) {
      endWake();
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Credenciales incorrectas");
      }
    }
  };



  return (
    <div
      className="min-h-screen flex items-center  justify-center"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      <div
        className="p-6 rounded shadow-md w-full max-w-md"
        style={{ backgroundColor: theme.bg2, color: theme.text }}
      >
        <div className="pb-4 flex flex-row align-super items-center justify-between">
          <h2 className="text-2xl font-bold ">Iniciar Sesión</h2>

          <ThemeToggle />
        </div>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">

          {fieldErrors.email && (
            <p className="text-red-500 text-sm -mt-2">{fieldErrors.email}</p>
          )}
          <ThemedInput
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            name="email"
          />

          {fieldErrors.password && (
            <p className="text-red-500 text-sm -mt-2">{fieldErrors.password}</p>
          )}
          <ThemedInput
            type="password"
            placeholder="Contraseña o PIN temporal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            name="password"
          />

          {error && <p className="text-red-600 text-center mt-2">{error}</p>}
          <ThemedButton type="submit">
            Iniciar sesión
          </ThemedButton>

        </form>
      </div>
    </div>
  );
};

export default LoginPage;
