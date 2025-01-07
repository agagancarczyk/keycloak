import type { AppRouteObject } from "../routes";
import { NewPermissionConfigurationRoute } from "./routes/NewPermissionConfiguration";
import { PermissionConfigurationDetailRoute } from "./routes/PermissionConfigurationDetails";
import { PermissionsConfigurationRoute } from "./routes/PermissionsConfiguration";
import { PermissionsConfigurationTabsRoute } from "./routes/PermissionsConfigurationTabs";

const routes: AppRouteObject[] = [NewPermissionConfigurationRoute, PermissionConfigurationDetailRoute, PermissionsConfigurationRoute, PermissionsConfigurationTabsRoute];

export default routes;
