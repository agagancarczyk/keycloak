import ResourceServerRepresentation from "@keycloak/keycloak-admin-client/lib/defs/resourceServerRepresentation";
import PolicyProviderRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyProviderRepresentation";
import { useAlerts, useFetch } from "@keycloak/keycloak-ui-shared";
import {
  ActionGroup,
  AlertVariant,
  Button,
  ButtonVariant,
  DropdownItem,
  PageSection,
} from "@patternfly/react-core";
import { useState, type JSX } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAdminClient } from "../../admin-client";
import { useConfirmDialog } from "../../components/confirm-dialog/ConfirmDialog";
import { FormAccess } from "../../components/form/FormAccess";
import { KeycloakSpinner } from "@keycloak/keycloak-ui-shared";
import { ViewHeader } from "../../components/view-header/ViewHeader";
import { useParams } from "../../utils/useParams";
import {
  PermissionConfigurationDetailsParams,
  toPermissionConfigurationDetails,
} from "../routes/PermissionConfigurationDetails";
import { Users } from "./permission-type/Users";
import { toPermissionsConfigurationTabs } from "../routes/PermissionsConfigurationTabs";
import PolicyRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyRepresentation";
import { useRealm } from "../../context/realm-context/RealmContext";
import { NameDescription } from "./NameDescription";
import { ResourceScope } from "./ResourceScope";
import { AssignedPolicies } from "./AssignedPolicies";
import { ScopePicker } from "../../clients/authorization/ScopePicker";
import { sortBy } from "lodash-es";

type Permission = {};

const COMPONENTS: {
  [index: string]: () => JSX.Element;
} = {
  Users: Users,
} as const;

export const isValidComponentType = (value: string) => value in COMPONENTS;

export default function PermissionConfigurationDetails() {
  const { adminClient } = useAdminClient();
  const { realmRepresentation } = useRealm();
  const { t } = useTranslation();
  const { realm, permissionId, resourceType } = useParams<PermissionConfigurationDetailsParams>();
  const navigate = useNavigate();
  const form = useForm();
  const { reset, handleSubmit } = form;
  const { addAlert, addError } = useAlerts();
  const [permission, setPermission] = useState<PolicyRepresentation>();
  const [providers, setProviders] = useState<PolicyProviderRepresentation[]>();
  const [policies, setPolicies] = useState<PolicyRepresentation[]>();
  const clientId = realmRepresentation?.adminPermissionsClient?.id!;

  useFetch(
    () =>
      Promise.all([
        adminClient.clients.listPolicyProviders({
          id: clientId!,
        }),
        adminClient.clients.listPolicies({
          id: clientId!,
          permission: "false",
        }),
      ]),
    ([providers, policies]) => {
      const filteredProviders = providers.filter(
        (p) => p.type !== "resource" && p.type !== "scope"
      );
      setProviders(sortBy(filteredProviders, (provider: PolicyProviderRepresentation) => provider.name));
      setPolicies(policies || []);
    },
    [clientId]
  );

  // useFetch(
  //   async () => {
  //     if (!permissionId) {
  //       return {};
  //     }
  //     const [permission, resources, policies, scopes] = await Promise.all([
  //       adminClient.clients.findOnePermission({
  //         id,
  //         type: resourceType,
  //         permissionId,
  //       }),
  //       adminClient.clients.getAssociatedResources({
  //         id,
  //         permissionId,
  //       }),
  //       adminClient.clients.getAssociatedPolicies({
  //         id,
  //         permissionId,
  //       }),
  //       adminClient.clients.getAssociatedScopes({
  //         id,
  //         permissionId,
  //       }),
  //     ]);

  //     if (!permission) {
  //       throw new Error(t("notFound"));
  //     }

  //     return {
  //       permission,
  //       resources: resources.map((r) => r._id),
  //       policies: policies.map((p) => p.id!),
  //       scopes: scopes.map((s) => s.id!),
  //     };
  //   },
  //   ({ permission, resources, policies, scopes }) => {
  //     reset({ ...permission, resources, policies, scopes });
  //     // if (permission && "resourceType" in permission) {
  //     //   setApplyToResourceTypeFlag(
  //     //     !!(permission as { resourceType: string }).resourceType,
  //     //   );
  //     // }
  //     setPermission({ ...permission, resources, policies });
  //   },
  //   [],
  // );

  const onSubmit = async (permission: Permission) => {
    //TODO creating a source-based permission
  };

  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: "deletePermission",
    messageKey: t("deletePermissionConfirm", {
      permission: permission?.name,
    }),
    continueButtonVariant: ButtonVariant.danger,
    continueButtonLabel: "confirm",
    onConfirm: async () => {
      try {
        await adminClient.clients.delPermission({
          id: clientId!,
          type: "scope",
          permissionId: permissionId,
        });
        addAlert(t("permissionDeletedSuccess"), AlertVariant.success);
        navigate(
          toPermissionsConfigurationTabs({ realm, tab: "permissions" }),
        );
      } catch (error) {
        addError("permissionDeletedError", error);
      }
    },
  });

  if (permissionId && !permission) {
    return <KeycloakSpinner />;
  }

  function getComponentType() {
    return isValidComponentType(resourceType)
      ? COMPONENTS[resourceType]
      : COMPONENTS["js"];
  }
  
  const ComponentType = getComponentType();

  return (
    <>
      <DeleteConfirm />
      <ViewHeader
        titleKey={
          permissionId ? permission?.name! : t("createPermissionOfType", { resourceType })
        }
        subKey={permissionId ? permission?.description : t(`resourceType.${resourceType}`)}
        dropdownItems={
          permissionId
            ? [
                <DropdownItem
                  key="delete"
                  data-testid="delete-permission"
                  onClick={() => toggleDeleteDialog()}
                >
                  {t("delete")}
                </DropdownItem>,
              ]
            : undefined
        }
      />
      <PageSection variant="light">
        <FormAccess
          isHorizontal
          onSubmit={handleSubmit(onSubmit)}
          role="anyone"
        >
          <FormProvider {...form}>
            <NameDescription />
            <ResourceScope />
            <ScopePicker clientId={clientId} />
            <AssignedPolicies permissionClientId={clientId} providers={providers!} policies={policies!}/>
            <ComponentType />
          </FormProvider>
          <ActionGroup>
            <div className="pf-v5-u-mt-md">
              <Button
                variant={ButtonVariant.primary}
                className="pf-v5-u-mr-md"
                type="submit"
                data-testid="save"
              >
                {t("save")}
              </Button>
              <Button
                variant="link"
                data-testid="cancel"
                component={(props) => (
                  <Link
                    {...props}
                    to={toPermissionsConfigurationTabs({
                      realm,
                      tab: "permissions",
                    })}
                  />
                )}
              >
                {t("cancel")}
              </Button>
            </div>
          </ActionGroup>
        </FormAccess>
      </PageSection>
    </>
  );
}
