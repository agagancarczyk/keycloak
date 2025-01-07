import PolicyRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyRepresentation";
import { ResourceTypesRepresentation } from "@keycloak/keycloak-admin-client/lib/defs/resourceServerRepresentation";
import {
  FormErrorText,
  HelpItem,
  useFetch,
} from "@keycloak/keycloak-ui-shared";
import { Button, FormGroup } from "@patternfly/react-core";
import { Table, Tbody, Td, Th, Thead, Tr } from "@patternfly/react-table";
import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAdminClient } from "../../admin-client";
import { NewPolicyDialog } from "./NewPolicyDialog";
import PolicyProviderRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyProviderRepresentation";
import { ExistingPoliciesDialog } from "./ExistingPoliciesDialog";
import ClientScopeRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientScopeRepresentation";
import { ClientScopeType } from "../../components/client-scope/ClientScopeTypes";

type AssignedPoliciesProps = {
  permissionClientId: string;
  providers: PolicyProviderRepresentation[];
  policies: PolicyRepresentation[] | undefined;
};

type AssignedPolicyForm = {
  assignedPolicies?: AssignedPolicyValue[];
};

export type AssignedPolicyValue = {
  id: string;
  name: string;
  type: string;
  description: string;
};

export const AssignedPolicies = ({
  permissionClientId,
  providers,
  policies,
}: AssignedPoliciesProps) => {
  const { adminClient } = useAdminClient();
  const { t } = useTranslation();
  const {
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useFormContext<AssignedPolicyForm>();
  const values = getValues("assignedPolicies");
  const [existingPoliciesOpen, setExistingPoliciesOpen] = useState(false);
  const [newPolicyOpen, setNewPolicyOpen] = useState(false);
  const [selectedPolicies, setSelectedPolicies] = useState<PolicyRepresentation[]>(
    [],
  );

  useFetch(
    () => {
      if (values && values.length > 0)
        return Promise.all(
          values.map((p) => adminClient.clients.findOnePolicy({ id: permissionClientId, type: p.type, policyId: p.id })),
        );
      return Promise.resolve([]);
    },
    (policies) => {
      const filteredPolicy = policies.filter((p) => p) as [];
      setSelectedPolicies(filteredPolicy);
    },
    [],
  );

  return (
      <FormGroup
        label={t("assignedPolicies")}
        labelIcon={
          <HelpItem helpText={t("permissionPoliciesHelp")} fieldLabelId="assignedPolicies" />
        }
        fieldId="assignedPolicies"
        isRequired
      >
        <Controller
          name="assignedPolicies"
          control={control}
          defaultValue={[]}
          rules={{
            validate: (value?: AssignedPolicyValue[]) =>
              value && value.filter(({ id }) => id).length > 0,
          }}
          render={({ field }) => (
            <>
              {existingPoliciesOpen && (
                <ExistingPoliciesDialog
                  policies={policies!}
                  open={existingPoliciesOpen}
                  toggleDialog={() => setExistingPoliciesOpen(!existingPoliciesOpen)}
                  onAssign={() => {}}
                />
              )}
              {newPolicyOpen && (
                <NewPolicyDialog 
                  toggleDialog={()=> setNewPolicyOpen(!newPolicyOpen)} 
                  permissionClientId={permissionClientId}
                  providers={providers!}
                  policies={policies!}
                  onSelect={()=> console.log("onSelect")} 
                />
              )}
              <Button
                data-testid="select-assignedPolicy-button"
                variant="secondary"
                onClick={() => {
                  setExistingPoliciesOpen(true);
                }}
              >
                {t("assignExistingPolicies")}
              </Button>
              <Button
                data-testid="select-createNewPolicy-button"
                className="pf-v5-u-ml-md"
                variant="secondary"
                onClick={() => {
                  setNewPolicyOpen(true);
                }}
              >
                {t("createNewPolicy")}
              </Button>
            </>
          )}
        />
        {selectedPolicies.length > 0 && (
          <Table variant="compact">
            <Thead>
              <Tr>
                <Th>{t("name")}</Th>
                <Th>{t("type")}</Th>
                <Th>{t("description")}</Th>
                <Th aria-hidden="true" />
              </Tr>
            </Thead>
            <Tbody>
              {selectedPolicies.map((policy, index) => (
                <Tr key={policy.id}>
                  <Td>{policy.name}</Td>
                  <Td>{policy.type}</Td>
                  <Td>{policy.description}</Td>
                  <Td>
                    <Button
                      variant="link"
                      onClick={() => {
                        setValue("assignedPolicies", [
                          ...(values || []).filter(({ id }) => id !== policy.id),
                        ]);
                        setSelectedPolicies([
                          ...selectedPolicies.filter(({ id }) => id !== policy.id),
                        ]);
                      }}
                    />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
        {errors.assignedPolicies && <FormErrorText message={t("requiredAssignedPolicies")} />}
      </FormGroup>
  );
};
