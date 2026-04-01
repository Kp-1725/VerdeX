import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import AddProductPage from "./pages/AddProductPage";
import UpdateStatusPage from "./pages/UpdateStatusPage";
import TrackProductPage from "./pages/TrackProductPage";
import PublicProductPage from "./pages/PublicProductPage";
import LandingPage from "./pages/LandingPage";
import FarmerProfilePage from "./pages/FarmerProfilePage";
import DiscoverFarmersPage from "./pages/DiscoverFarmersPage";
import RequestsInboxPage from "./pages/RequestsInboxPage";
import MetricsPage from "./pages/MetricsPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/product/:id" element={<PublicProductPage />} />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/add-product"
        element={
          <RoleRoute allowedRoles={["Farmer"]}>
            <AddProductPage />
          </RoleRoute>
        }
      />

      <Route
        path="/update-status"
        element={
          <ProtectedRoute>
            <UpdateStatusPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/track"
        element={
          <ProtectedRoute>
            <TrackProductPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/farmer-profile"
        element={
          <RoleRoute allowedRoles={["Farmer"]}>
            <FarmerProfilePage />
          </RoleRoute>
        }
      />

      <Route
        path="/discover-farmers"
        element={
          <RoleRoute allowedRoles={["Retailer"]}>
            <DiscoverFarmersPage />
          </RoleRoute>
        }
      />

      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <RequestsInboxPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/metrics"
        element={
          <ProtectedRoute>
            <MetricsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
