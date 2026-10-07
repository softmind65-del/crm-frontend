import React from "react";
import { NavItem } from "@/types/navigation";

export function DashboardIcon({
  className = "w-5 h-5",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return React.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      ...props,
    },
    React.createElement("rect", { x: 3, y: 3, width: 7, height: 7, rx: 1.5 }),
    React.createElement("rect", { x: 14, y: 3, width: 7, height: 7, rx: 1.5 }),
    React.createElement("rect", { x: 3, y: 14, width: 7, height: 7, rx: 1.5 }),
    React.createElement("rect", { x: 14, y: 14, width: 7, height: 7, rx: 1.5 })
  );
}

export function CustomersIcon({
  className = "w-5 h-5",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return React.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      ...props,
    },
    React.createElement("path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
    React.createElement("circle", { cx: 9, cy: 7, r: 4 }),
    React.createElement("path", { d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
    React.createElement("path", { d: "M16 3.13a4 4 0 0 1 0 7.75" })
  );
}

export function ContactsIcon({
  className = "w-5 h-5",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return React.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      ...props,
    },
    React.createElement("path", { d: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" }),
    React.createElement("circle", { cx: 12, cy: 7, r: 4 })
  );
}

export function LeadsIcon({
  className = "w-5 h-5",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return React.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      ...props,
    },
    React.createElement("circle", { cx: 12, cy: 12, r: 10 }),
    React.createElement("polygon", {
      points: "16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76",
    })
  );
}

export function DealsIcon({
  className = "w-5 h-5",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return React.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      ...props,
    },
    React.createElement("rect", { x: 2, y: 7, width: 20, height: 14, rx: 2, ry: 2 }),
    React.createElement("path", { d: "M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" })
  );
}

export function ComponentsIcon({
  className = "w-5 h-5",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return React.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      ...props,
    },
    React.createElement("polygon", { points: "12 2 2 7 12 12 22 7 12 2" }),
    React.createElement("polyline", { points: "2 17 12 22 22 17" }),
    React.createElement("polyline", { points: "2 12 12 17 22 12" })
  );
}

export function SettingsIcon({
  className = "w-5 h-5",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return React.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      ...props,
    },
    React.createElement("path", {
      d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",
    }),
    React.createElement("circle", { cx: 12, cy: 12, r: 3 })
  );
}

export function ChevronRightIcon({
  className = "w-4 h-4",
  ...props
}: React.SVGProps<SVGSVGElement>) {
  return React.createElement(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.75",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      className,
      "aria-hidden": "true",
      ...props,
    },
    React.createElement("polyline", { points: "9 18 15 12 9 6" })
  );
}

export const CRM_NAVIGATION_ITEMS: readonly NavItem[] = [
  {
    label: "Dashboard",
    href: "/",
    icon: DashboardIcon,
    exact: true,
  },
  {
    label: "Customers",
    href: "/customers",
    icon: CustomersIcon,
    children: [
      {
        label: "View Customers",
        href: "/customers",
      },
      {
        label: "Add Customer",
        href: "/customers/new",
      },
    ],
  },
  {
    label: "Contacts",
    href: "/contacts",
    icon: ContactsIcon,
    children: [
      {
        label: "View Contacts",
        href: "/contacts",
      },
      {
        label: "Add Contact",
        href: "/contacts/new",
      },
    ],
  },
  {
    label: "Leads",
    href: "/leads",
    icon: LeadsIcon,
    children: [
      {
        label: "View Leads",
        href: "/leads",
      },
      {
        label: "Add Lead",
        href: "/leads/new",
      },
      {
        label: "Leads Pipeline",
        href: "/leads/pipeline",
      },
    ],
  },
  {
    label: "Deals",
    href: "/deals",
    icon: DealsIcon,
    children: [
      {
        label: "View Deals",
        href: "/deals",
      },
      {
        label: "Add Deal",
        href: "/deals/new",
      },
      {
        label: "Deals Pipeline",
        href: "/deals/pipeline",
      },
    ],
  },
  {
    label: "Settings",
    href: "/settings",
    icon: SettingsIcon,
    children: [
      {
        label: "Lead Pipeline",
        href: "/settings/lead-pipeline",
      },
      {
        label: "Deal Pipeline",
        href: "/settings/deal-pipeline",
      },
    ],
  },
  {
    label: "Components",
    href: "/components",
    icon: ComponentsIcon,
  },
] as const;
