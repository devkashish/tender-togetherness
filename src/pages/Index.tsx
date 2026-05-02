import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const renderPage = () => {
    if (location.pathname.startsWith("/projects/") && location.pathname.split("/").length > 2) {
      return <ProjectDetail />;
    }
    if (location.pathname === "/projects") {
      return <Projects />;
    }
    return <Dashboard />;
  };

  return <AppLayout>{renderPage()}</AppLayout>;
};

export default Index;
