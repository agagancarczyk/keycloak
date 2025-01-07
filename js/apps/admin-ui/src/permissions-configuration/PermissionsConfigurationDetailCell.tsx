import type ResourceServerRepresentation from "@keycloak/keycloak-admin-client/lib/defs/resourceServerRepresentation";
import { useFetch } from "@keycloak/keycloak-ui-shared";
import { DescriptionList } from "@patternfly/react-core";
import { useState } from "react";
import { useAdminClient } from "../admin-client";
import { KeycloakSpinner } from "@keycloak/keycloak-ui-shared";
import { useRealm } from "../context/realm-context/RealmContext";

import "./detail-cell.css";
import PolicyRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyRepresentation";
import { DetailDescriptionLink } from "../clients/authorization/DetailDescription";

type PermissionsConfigurationDetailCellProps = {
  policyId: string;
};

export const DetailCell = ({ policyId }: PermissionsConfigurationDetailCellProps) => {
  const { adminClient } = useAdminClient();
  const { realm } = useRealm();
  const [policies, setPolicies] =
    useState<PolicyRepresentation[]>();

  // useFetch(
  //   () =>
  //       adminClient.clients.getAssociatedPolicies({
  //         id: clientId,
  //         resourceName: id,
  //       }),
  //   ([policies]) => {
  //     setPolicies(policies);
  //   },
  //   [],
  // );

  if (!policies) {
    return <KeycloakSpinner />;
  }

  return (
    <DescriptionList isHorizontal className="keycloak_resource_details">
      <DetailDescriptionLink
        name="assignedPolicies"
        array={policies}
        convert={(p) => p.name!}
      />
    </DescriptionList>
  );
};
