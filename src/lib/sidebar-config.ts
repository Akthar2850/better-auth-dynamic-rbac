export type NavItem = {
  label: string;
  href: string;
  icon: string;
  resource?: string;
};

const dashboardItem: NavItem = {
  label: "Dashboard",
  href: "/dashboard",
  icon: "dashboard",
};

const resourceItems: NavItem[] = [
  { label: "Customers", href: "/resource/customer", icon: "customer", resource: "customer" },
  { label: "Subscriptions", href: "/resource/subscription", icon: "subscription", resource: "subscription" },
  { label: "Invoices", href: "/resource/invoice", icon: "invoice", resource: "invoice" },
  { label: "Payments", href: "/resource/payment", icon: "payment", resource: "payment" },
  { label: "Payment Methods", href: "/resource/paymentMethod", icon: "paymentMethod", resource: "paymentMethod" },
  { label: "Products", href: "/resource/product", icon: "product", resource: "product" },
  { label: "Orders", href: "/resource/order", icon: "order", resource: "order" },
  { label: "Reports", href: "/resource/report", icon: "report", resource: "report" },
  { label: "Projects", href: "/resource/project", icon: "project", resource: "project" },
];

const adminItem: NavItem = {
  label: "User Management",
  href: "/admin",
  icon: "admin",
};

const profileItem: NavItem = {
  label: "Profile",
  href: "/profile",
  icon: "profile",
};

export function getNavItems(
  visibleResources: string[],
  role: string
): {
  top: NavItem[];
  bottom: NavItem[];
} {
  const visibleSet = new Set(visibleResources);
  const filtered = resourceItems.filter((item) => {
    if (!item.resource) return true;
    return visibleSet.has(item.resource);
  });

  const top: NavItem[] = [dashboardItem, ...filtered];

  if (role === "admin") {
    top.push(adminItem);
  }

  return { top, bottom: [profileItem] };
}
