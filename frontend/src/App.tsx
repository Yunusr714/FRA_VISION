import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { I18nextProvider } from 'react-i18next';
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { ProtectedRoute } from "@/components/ui/protected-route";
import i18n from "@/lib/i18n";

// Pages (same imports as before)

import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Atlas from "./pages/Atlas";
import Claims from "./pages/Claims";
import ClaimDetail from "./pages/ClaimDetail";
import NewClaim from "./pages/NewClaim";
import Tasks from "./pages/Tasks";
import Alerts from "./pages/Alerts";
import Reports from "./pages/Reports";
import Planning from "./pages/Planning";
import Admin from "./pages/Admin";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";
import DigitizeLegacyClaim from "@/pages/Ngo/DigitizeLegacyClaim";

const queryClient = new QueryClient();

const AppLayout = () => (
 <div className="min-h-screen bg-background">
<Header />
<div className="flex">
 <Sidebar />
 <main className="flex-1 md:ml-0">
 <Outlet />
 </main>
 </div>
</div>
);

const App = () => (
<QueryClientProvider client={queryClient}>
<I18nextProvider i18n={i18n}>
 <TooltipProvider>
 <Toaster />
 <Sonner />
 <BrowserRouter>
 <Routes>
  {/* Public Routes */}
  <Route path="/" element={<Index />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
 <Route path="/help" element={<Help />} />

 {/* Protected Layout */}
 <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
 <Route path="/dashboard" element={<Dashboard />} />
 <Route path="/atlas" element={<Atlas />} />
 <Route path="/claims" element={<Claims />} />
 <Route path="/ngo/claims/new" element={<NewClaim />} />
 <Route path="/ngo/digitize" element={<DigitizeLegacyClaim />} />
 <Route path="/claims/:id" element={<ClaimDetail />} />
 <Route path="/tasks" element={<Tasks />} />
 <Route path="/alerts" element={<Alerts />} />
 <Route path="/reports" element={<Reports />} />
 <Route path="/planning" element={<Planning />} />
 <Route path="/admin/*" element={
  <ProtectedRoute requiredPermission="admin:users">
 <Admin />
 </ProtectedRoute>
 } />
 </Route>

 {/* Not found route */}
 <Route path="*" element={<NotFound />} />
 </Routes>
</BrowserRouter>
 </TooltipProvider>
 </I18nextProvider>
</QueryClientProvider>
);

export default App;
