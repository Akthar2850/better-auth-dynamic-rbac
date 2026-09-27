export type ColumnDef = {
  key: string;
  label: string;
};

export type ResourceConfig = {
  slug: string;
  permissionKey: string;
  displayName: string;
  description: string;
  columns: ColumnDef[];
  data: Record<string, string | number>[];
};

// All sample data is fictional. Companies are well-known placeholder names,
// people use example.com, and numbers are made up.
export const resources: Record<string, ResourceConfig> = {
  user: {
    slug: "user",
    permissionKey: "user",
    displayName: "Users",
    description: "System user accounts",
    columns: [
      { key: "id", label: "User ID" },
      { key: "name", label: "Full Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "status", label: "Status" },
    ],
    data: [
      { id: "U-001", name: "Alice", email: "alice@example.com", role: "admin", status: "Active" },
      { id: "U-002", name: "Bob", email: "bob@example.com", role: "agent", status: "Active" },
      { id: "U-003", name: "Carol", email: "carol@example.com", role: "endUser", status: "Active" },
      { id: "U-004", name: "Dave", email: "dave@example.com", role: "endUser", status: "Active" },
      { id: "U-005", name: "Erin", email: "erin@example.com", role: "endUser", status: "Inactive" },
    ],
  },
  customer: {
    slug: "customer",
    permissionKey: "customer",
    displayName: "Customers",
    description: "Companies using the platform",
    columns: [
      { key: "id", label: "Customer ID" },
      { key: "name", label: "Company" },
      { key: "accountNo", label: "Account No" },
      { key: "city", label: "City" },
      { key: "plan", label: "Plan" },
      { key: "status", label: "Status" },
    ],
    data: [
      { id: "C-001", name: "Acme Corp", accountNo: "ACC-0001", city: "Springfield", plan: "Business", status: "Active" },
      { id: "C-002", name: "Globex Ltd", accountNo: "ACC-0002", city: "Shelbyville", plan: "Starter", status: "Active" },
      { id: "C-003", name: "Initech", accountNo: "ACC-0003", city: "Riverside", plan: "Enterprise", status: "Active" },
      { id: "C-004", name: "Umbrella Co", accountNo: "ACC-0004", city: "Lakeview", plan: "Starter", status: "Inactive" },
    ],
  },
  subscription: {
    slug: "subscription",
    permissionKey: "subscription",
    displayName: "Subscriptions",
    description: "Plans each customer is subscribed to",
    columns: [
      { key: "id", label: "Subscription ID" },
      { key: "customer", label: "Customer" },
      { key: "plan", label: "Plan" },
      { key: "seats", label: "Seats" },
      { key: "renews", label: "Renews" },
      { key: "status", label: "Status" },
    ],
    data: [
      { id: "SUB-001", customer: "Acme Corp", plan: "Business", seats: 25, renews: "01/15/2027", status: "Active" },
      { id: "SUB-002", customer: "Acme Corp", plan: "Add-on: Storage", seats: 25, renews: "01/15/2027", status: "Active" },
      { id: "SUB-003", customer: "Initech", plan: "Enterprise", seats: 120, renews: "06/01/2027", status: "Active" },
      { id: "SUB-004", customer: "Umbrella Co", plan: "Starter", seats: 3, renews: "-", status: "Cancelled" },
    ],
  },
  invoice: {
    slug: "invoice",
    permissionKey: "invoice",
    displayName: "Invoices",
    description: "Billing invoices for customers",
    columns: [
      { key: "id", label: "Invoice #" },
      { key: "customer", label: "Customer" },
      { key: "ownerId", label: "Owner" },
      { key: "date", label: "Date" },
      { key: "amount", label: "Amount" },
      { key: "dueDate", label: "Due Date" },
      { key: "status", label: "Status" },
    ],
    data: [
      { id: "INV-1001", customer: "Acme Corp", ownerId: "carol@example.com", date: "09/03/2025", amount: "$120.00", dueDate: "10/03/2025", status: "Paid" },
      { id: "INV-1002", customer: "Acme Corp", ownerId: "carol@example.com", date: "06/03/2025", amount: "$480.00", dueDate: "07/03/2025", status: "Paid" },
      { id: "INV-1003", customer: "Globex Ltd", ownerId: "dave@example.com", date: "12/10/2025", amount: "$95.00", dueDate: "01/09/2026", status: "Pending" },
      { id: "INV-1004", customer: "Initech", ownerId: "dave@example.com", date: "09/06/2024", amount: "$150.00", dueDate: "10/07/2024", status: "Overdue" },
      { id: "INV-1005", customer: "Umbrella Co", ownerId: "erin@example.com", date: "06/07/2024", amount: "$60.00", dueDate: "07/08/2024", status: "Paid" },
    ],
  },
  payment: {
    slug: "payment",
    permissionKey: "payment",
    displayName: "Payments",
    description: "Payments received from customers",
    columns: [
      { key: "id", label: "Payment ID" },
      { key: "customer", label: "Customer" },
      { key: "date", label: "Date" },
      { key: "amount", label: "Amount" },
      { key: "method", label: "Method" },
      { key: "status", label: "Status" },
    ],
    data: [
      { id: "PAY-301", customer: "Acme Corp", date: "05/08/2026", amount: "$120.00", method: "Card", status: "Completed" },
      { id: "PAY-302", customer: "Globex Ltd", date: "04/29/2026", amount: "$95.00", method: "Bank Transfer", status: "Completed" },
      { id: "PAY-303", customer: "Acme Corp", date: "04/29/2026", amount: "$480.00", method: "Card", status: "Completed" },
      { id: "PAY-304", customer: "Initech", date: "01/01/2026", amount: "$150.00", method: "Cheque", status: "Completed" },
      { id: "PAY-305", customer: "Umbrella Co", date: "09/30/2024", amount: "$60.00", method: "Bank Transfer", status: "Processing" },
    ],
  },
  paymentMethod: {
    slug: "paymentMethod",
    permissionKey: "paymentMethod",
    displayName: "Payment Methods",
    description: "Saved payment methods for customers",
    columns: [
      { key: "id", label: "Method ID" },
      { key: "customer", label: "Customer" },
      { key: "type", label: "Type" },
      { key: "last4", label: "Last 4" },
      { key: "expiry", label: "Expiry" },
      { key: "isDefault", label: "Default" },
    ],
    data: [
      { id: "PM-101", customer: "Acme Corp", type: "Visa", last4: "4242", expiry: "12/2030", isDefault: "Yes" },
      { id: "PM-102", customer: "Acme Corp", type: "Bank Account", last4: "0000", expiry: "-", isDefault: "No" },
      { id: "PM-103", customer: "Globex Ltd", type: "Mastercard", last4: "4444", expiry: "06/2030", isDefault: "Yes" },
      { id: "PM-104", customer: "Initech", type: "Visa", last4: "1111", expiry: "03/2030", isDefault: "Yes" },
    ],
  },
  product: {
    slug: "product",
    permissionKey: "product",
    displayName: "Products",
    description: "Items available to order",
    columns: [
      { key: "id", label: "Product ID" },
      { key: "sku", label: "SKU" },
      { key: "name", label: "Name" },
      { key: "category", label: "Category" },
      { key: "price", label: "Price" },
      { key: "status", label: "Status" },
    ],
    data: [
      { id: "P-001", sku: "SKU-1001", name: "Widget", category: "Hardware", price: "$10.00", status: "Active" },
      { id: "P-002", sku: "SKU-1002", name: "Gadget", category: "Hardware", price: "$25.00", status: "Active" },
      { id: "P-003", sku: "SKU-2001", name: "Support Plan", category: "Service", price: "$99.00", status: "Active" },
      { id: "P-004", sku: "SKU-3001", name: "Legacy Widget", category: "Hardware", price: "$8.00", status: "Discontinued" },
    ],
  },
  order: {
    slug: "order",
    permissionKey: "order",
    displayName: "Orders",
    description: "Orders placed by customers",
    columns: [
      { key: "id", label: "Order ID" },
      { key: "customer", label: "Customer" },
      { key: "sku", label: "Product" },
      { key: "date", label: "Date" },
      { key: "quantity", label: "Quantity" },
      { key: "total", label: "Total" },
    ],
    data: [
      { id: "ORD-001", customer: "Acme Corp", sku: "SKU-1001", date: "03/02/2026", quantity: 10, total: "$100.00" },
      { id: "ORD-002", customer: "Acme Corp", sku: "SKU-2001", date: "12/01/2025", quantity: 1, total: "$99.00" },
      { id: "ORD-003", customer: "Globex Ltd", sku: "SKU-1002", date: "03/02/2026", quantity: 4, total: "$100.00" },
      { id: "ORD-004", customer: "Initech", sku: "SKU-1001", date: "02/15/2026", quantity: 50, total: "$500.00" },
      { id: "ORD-005", customer: "Acme Corp", sku: "SKU-1002", date: "09/01/2025", quantity: 2, total: "$50.00" },
    ],
  },
  report: {
    slug: "report",
    permissionKey: "report",
    displayName: "Reports",
    description: "Monthly financial reports",
    columns: [
      { key: "id", label: "Report #" },
      { key: "period", label: "Period" },
      { key: "totalAmount", label: "Total Amount" },
      { key: "entries", label: "Entries" },
      { key: "publishedDate", label: "Published" },
      { key: "status", label: "Status" },
    ],
    data: [
      { id: "REP-501", period: "Jan 2026", totalAmount: "$12,000.00", entries: 12, publishedDate: "02/05/2026", status: "Published" },
      { id: "REP-502", period: "Feb 2026", totalAmount: "$13,500.00", entries: 14, publishedDate: "03/05/2026", status: "In Review" },
      { id: "REP-503", period: "Mar 2026", totalAmount: "$11,800.00", entries: 11, publishedDate: "-", status: "Pending" },
      { id: "REP-504", period: "Apr 2026", totalAmount: "$14,200.00", entries: 16, publishedDate: "-", status: "Draft" },
    ],
  },
  project: {
    slug: "project",
    permissionKey: "project",
    displayName: "Projects",
    description: "Internal projects and initiatives",
    columns: [
      { key: "id", label: "Project ID" },
      { key: "name", label: "Project Name" },
      { key: "type", label: "Type" },
      { key: "team", label: "Team" },
      { key: "members", label: "Members" },
      { key: "status", label: "Status" },
    ],
    data: [
      { id: "PRJ-001", name: "Website Redesign", type: "Design", team: "Marketing", members: 6, status: "Active" },
      { id: "PRJ-002", name: "Mobile App", type: "Engineering", team: "Product", members: 9, status: "Active" },
      { id: "PRJ-003", name: "Billing Migration", type: "Engineering", team: "Finance", members: 4, status: "Active" },
      { id: "PRJ-004", name: "Customer Survey", type: "Research", team: "Support", members: 3, status: "Paused" },
    ],
  },
};

export const allResourceSlugs = Object.keys(resources);
