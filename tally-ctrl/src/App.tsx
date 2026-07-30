import { Navigate, Route, Routes } from "react-router-dom";
import { PreviewPage } from "@/components/PreviewPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/p/demo-faulkner" replace />} />
      <Route path="/p/:token" element={<PreviewPage />} />
      <Route path="*" element={<Navigate to="/p/demo-faulkner" replace />} />
    </Routes>
  );
}
