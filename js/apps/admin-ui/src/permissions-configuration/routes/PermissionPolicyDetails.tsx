import { lazy } from "react";
import { type Path } from "react-router-dom";
import { generateEncodedPath } from "../../utils/generateEncodedPath";
import type { AppRouteObject } from "../../routes";
import { PermissionPolicyBreadcrumb } from "./PermissionPolicyBreadcrumb";

export type PermissionPolicyDetailsParams = {
  realm: string;
  permissionClientId: string;
  policyId: string;
  policyType: string;
};

const PermissionPolicyDetails = lazy(
  () => import("../../clients/authorization/policy/PolicyDetails"),
);

export const PermissionPolicyDetailsRoute: AppRouteObject = {
  path: "/:realm/permissions/:permissionClientId/policy/:policyId/:policyType",
  element: <PermissionPolicyDetails />,
  breadcrumb: (t) => () => (
    <PermissionPolicyBreadcrumb detailLabel={t("createPermissionPolicy")} />
  ),
  handle: {
    access: (accessChecker) =>
      accessChecker.hasAny(
        "manage-clients",
        "view-authorization",
        "manage-authorization",
      ),
  },
};

export const toPermissionPolicyDetails = (
  params: PermissionPolicyDetailsParams,
): Partial<Path> => ({
  pathname: generateEncodedPath(PermissionPolicyDetailsRoute.path, params),
});
