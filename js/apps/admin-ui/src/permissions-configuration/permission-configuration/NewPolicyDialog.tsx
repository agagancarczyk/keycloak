import ClientPolicyRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientPolicyRepresentation";
import PolicyRepresentation, { DecisionStrategy, Logic } from "@keycloak/keycloak-admin-client/lib/defs/policyRepresentation";
import PolicyProviderRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyProviderRepresentation";
import { useTranslation } from "react-i18next";
import {
  Modal,
  ModalVariant,
  TextContent,
  Text,
  TextVariants,
  ActionGroup,
  Button,
  Form,
  ButtonVariant,
} from "@patternfly/react-core";
import { SelectControl, TextControl, useFetch } from "@keycloak/keycloak-ui-shared";
import { useState } from "react";
import { ResourceTypesRepresentation } from "@keycloak/keycloak-admin-client/lib/defs/resourceServerRepresentation";
import { FormAccess } from "../../components/form/FormAccess";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useAdminClient } from "../../admin-client";
import { useRealm } from "../../context/realm-context/RealmContext";
import { sortBy } from "lodash-es";
import { Client } from "../../clients/authorization/policy/Client";
import { User } from "../../clients/authorization/policy/User";
import { ClientScope } from "../../clients/authorization/policy/ClientScope";
import { Group } from "../../clients/authorization/policy/Group";
import { Regex } from "../../clients/authorization/policy/Regex";
import { Role } from "../../clients/authorization/policy/Role";
import { Time } from "../../clients/authorization/policy/Time";
import { JavaScript } from "../../clients/authorization/policy/JavaScript";
import { LogicSelector } from "../../clients/authorization/policy/LogicSelector";
import { Aggregate } from "./permission-policy/Aggregate";

type ComponentsProps = {
  isPermissionClient?: boolean;
  permissionClientId: string;
};

type FormFields = Partial<PolicyRepresentation>;

const defaultValues: FormFields = {
  name: "",
  description: "",
  type: "Aggregated",
  policies: [],
  decisionStrategy: "UNANIMOUS" as DecisionStrategy,
  logic: "POSITIVE" as Logic,
};

const COMPONENTS: {
  [index: string]: ({isPermissionClient, permissionClientId}: ComponentsProps) => JSX.Element;
} = {
  Aggregated: Aggregate,
  Client: Client,
  User: User,
  "Client Scope": ClientScope,
  Group: Group,
  Regex: Regex,
  Role: Role,
  Time: Time,
  Js: JavaScript,
  default: Aggregate,
} as const;

export const isValidComponentType = (value: string) => value in COMPONENTS;

type NewPermissionConfigurationDialogProps = {
  resourceTypes?: ResourceTypesRepresentation[];
  toggleDialog: () => void;
  onSelect: (resourceType: ResourceTypesRepresentation) => void;
  permissionClientId: string;
  providers: PolicyProviderRepresentation[];
  policies: PolicyRepresentation[];
};

export const NewPolicyDialog = ({
  toggleDialog,
  onSelect,
  permissionClientId,
  providers,
  policies
}: NewPermissionConfigurationDialogProps) => {
  const { adminClient } = useAdminClient();
  const { realmRepresentation } = useRealm();
  const { t } = useTranslation();
  const form = useForm<FormFields>({
    mode: "onChange",
    defaultValues,
  });
  const { handleSubmit } = form;
  const formValues = form.getValues();
  const isPermissionClient = realmRepresentation?.adminPermissionsEnabled;
  
  const policyTypeSelector = useWatch({
    control: form.control,
    name: "type",
  });

  function getComponentType() {
    if (isValidComponentType(policyTypeSelector!)) {
      return COMPONENTS[policyTypeSelector!];
    }
    return COMPONENTS["default"];
  }

  const ComponentType = getComponentType();
  
  const save = async () => {
    console.log("Saving policy for a client");
  };

  return (
    <Modal
      aria-label={t("createAPolicy")}
      variant={ModalVariant.medium}
      header={
        <TextContent>
          <Text component={TextVariants.h1}>{t("createAPolicy")}</Text>
        </TextContent>
      }
      isOpen
      onClose={toggleDialog}
    >
      <Form
        id="createAPolicy-form"
        onSubmit={handleSubmit(save)}
        isHorizontal
      >
        <FormProvider {...form}>
          <TextControl
            name="name"
            label={t("name")}
            rules={{ required: t("required") }}
          />
          <TextControl
            name="description"
            label={t("description")}
          />
          {providers && providers.length > 0 && (
            <SelectControl
              name="type"
              label={t("policyType")}
              labelIcon={t("policyTypeHelpText")}
              options={providers.map((provider) => ({
                key: provider.name!,
                value: provider.name!,
              }))}
              controller={{ defaultValue: "" }}
            />
          )}
          <ComponentType isPermissionClient={isPermissionClient} permissionClientId={permissionClientId} />
          <LogicSelector isDisabled={false} />
        </FormProvider>
        <ActionGroup>
          <div className="pf-v5-u-mt-md">
            <Button
              variant={ButtonVariant.primary}
              className="pf-v5-u-mr-md"
              type="submit"
              data-testid="save"
              isDisabled={policies?.length === 0 && policyTypeSelector === "Aggregated"}
            >
              {t("save")}
            </Button>
            <Button
              variant="link"
              data-testid="cancel"
              onClick={toggleDialog}
            >
              {t("cancel")}
            </Button>
          </div>
        </ActionGroup>
      </Form>
    </Modal>
  );
};
