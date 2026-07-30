import { Navigate, Route, Routes } from "react-router-dom";
import { EstimatorPage } from "@/components/EstimatorPage";
import { LandingPage } from "@/components/LandingPage";
import { PreviewPage } from "@/components/PreviewPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/estimate" element={<EstimatorPage />} />
      <Route path="/p/:token" element={<PreviewPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
