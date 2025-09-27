import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Map,
    FileText,
    CheckSquare,
    AlertTriangle,
    BarChart3,
    Calendar,
    Users,
    Settings,
    HelpCircle,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/authStore";
import { useAppStore } from "@/store/appStore";

const navigationItems = [
    {
        name: "nav.dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: [
            "mota_admin",
            "district_officer",
            "forest_revenue_officer",
            "pda_planner",
            "ngo_user",
            "citizen_user",
        ],
    },
    {
        name: "nav.atlas",
        href: "/atlas",
        icon: Map,
        roles: [
            "mota_admin",
            "district_officer",
            "forest_revenue_officer",
            "pda_planner",
            "ngo_user",
            "citizen_user",
        ],
    },
    {
        name: "nav.claims",
        href: "/claims",
        icon: FileText,
        roles: [
            "mota_admin",
            "district_officer",
            "forest_revenue_officer",
            "pda_planner",
            "ngo_user",
            "citizen_user",
        ],
    },
    {
        name: "nav.tasks",
        href: "/tasks",
        icon: CheckSquare,
        roles: ["district_officer", "forest_revenue_officer"],
    },
    {
        name: "nav.alerts",
        href: "/alerts",
        icon: AlertTriangle,
        roles: ["mota_admin", "district_officer"],
    },
    {
        name: "nav.reports",
        href: "/reports",
        icon: BarChart3,
        roles: ["mota_admin", "district_officer", "pda_planner"],
    },
    {
        name: "nav.planning",
        href: "/planning",
        icon: Calendar,
        roles: ["pda_planner"],
    },
    {
        name: "Community Reports",
        href: "/community/reports",
        icon: Users,
        roles: ["mota_admin", "district_officer", "ngo_user"],
    },
    {
        name: "nav.admin",
        href: "/admin",
        icon: Settings,
        roles: ["mota_admin"],
    },
    {
        name: "nav.help",
        href: "/help",
        icon: HelpCircle,
        roles: [
            "mota_admin",
            "district_officer",
            "forest_revenue_officer",
            "pda_planner",
            "ngo_user",
            "citizen_user",
        ],
    },
];

export const Sidebar = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { user } = useAuthStore();
    const { sidebarOpen, setSidebarOpen } = useAppStore();

    if (!user) return null;

    const filteredNavigation = navigationItems.filter((item) =>
        item.roles.includes(user.role)
    );

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-card border-r z-50 transform transition-transform duration-200 ease-in-out",
                    "md:translate-x-0 md:static md:h-auto",
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {/* Mobile header */}
                <div className="flex items-center justify-between p-4 md:hidden">
                    <h2 className="text-lg font-semibold">Navigation</h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation links */}
                <nav className="p-4 space-y-2">
                    {filteredNavigation.map((item) => {
                        const isActive =
                            location.pathname === item.href ||
                            (item.href !== "/dashboard" &&
                                location.pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                to={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={cn(
                                    "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                <span>
                                    {item.name.startsWith("nav.") ? t(item.name) : item.name}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Role indicator */}
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="bg-muted/50 rounded-lg p-3 text-sm">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-muted-foreground capitalize">
                            {user.role?.replace("_", " ")}
                        </div>
                        {user.district && (
                            <div className="text-xs text-muted-foreground mt-1">
                                {user.district}
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};
