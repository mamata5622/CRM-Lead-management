import { useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router";
import AllRoutes from "./routes/AllRoutes";

function TokenExpiryHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        const { status, data } = error.response || {};

        const isAuthPage = ["/login", "/register"].includes(
          window.location.pathname,
        );

        if (
          status === 401 &&
          data?.code === "TOKEN_EXPIRED" &&
          !isAuthPage &&
          !window.__tokenExpiryRedirecting
        ) {
          window.__tokenExpiryRedirecting = true;

          toast.error(
            "Your session has expired. Redirecting to login in 5 seconds.",
            {
              toastId: "token-expired",
              autoClose: 5000,
              closeOnClick: false,
              draggable: false,
            },
          );

          setTimeout(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            window.__tokenExpiryRedirecting = false;
            navigate("/login", { replace: true });
          }, 5000);
        }

        return Promise.reject(error);
      },
    );

    return () => {
      axios.interceptors.response.eject(interceptorId);
    };
  }, [navigate]);

  return null;
}

function App() {
  return (
    <>
      <TokenExpiryHandler />
      <AllRoutes />
    </>
  );
}

export default App;
