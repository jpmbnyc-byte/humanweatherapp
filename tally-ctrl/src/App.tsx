import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { EstimatorPage } from "@/components/EstimatorPage";
import { LandingPage } from "@/components/LandingPage";
import { MintPage } from "@/components/MintPage";
import { PreviewPage } from "@/components/PreviewPage";
import { parseHostSlug } from "@/data/preview-access";

/** On vanity hosts like faulkner.preview.tallyctrl.com, / → /p/faulkner */
function SubdomainHomeRedirect() {
  const location = useLocation();
  const slug =
    typeof window !== "undefined"
      ? parseHostSlug(window.location.hostname)
      : null;
  if (slug && (location.pathname === "/" || location.pathname === "")) {
    return (
      <Navigate to={`/p/${slug}${location.search}${location.hash}`} replace />
    );
  }
  return <LandingPage />;
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<SubdomainHomeRedirect />} />
      <Route path="/estimate" element={<EstimatorPage />} />
      <Route path="/mint" element={<MintPage />} />
      <Route path="/p/:token" element={<PreviewPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
