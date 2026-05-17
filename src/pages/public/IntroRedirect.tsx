import { Navigate } from "react-router-dom";

/** Legacy entry — always lands on home. Splash remains at /splash. */
export function IntroRedirect() {
  return <Navigate to="/" replace />;
}
