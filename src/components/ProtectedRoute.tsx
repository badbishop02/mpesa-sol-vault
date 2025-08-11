import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthenticated(!!session);
      setChecking(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthenticated(!!session);
      setChecking(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (checking) return null;
  if (!authenticated) return <Navigate to="/auth" replace />;
  return children;
};
