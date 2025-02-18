import { NavLink as RouterLink, NavLinkProps as RouterLinkProps } from "react-router";
import { NavLinkProps as ThemeUILinkProps, NavLink as ThemeUINavLink } from "theme-ui";

type CombinedProps = ThemeUILinkProps & RouterLinkProps;

const ExactLink: React.FC<CombinedProps> = props => {
  return <RouterLink {...props} />;
};

export const Link: React.FC<CombinedProps> = props => {
  return <ThemeUINavLink {...props} as={ExactLink} />;
};
