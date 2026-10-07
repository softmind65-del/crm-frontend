import { ComponentType, SVGProps } from "react";

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon?: IconComponent;
  readonly badge?: string | number;
  readonly children?: readonly NavItem[];
  readonly exact?: boolean;
}
