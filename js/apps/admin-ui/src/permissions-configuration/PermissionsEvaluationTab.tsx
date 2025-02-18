import type ClientRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientRepresentation";
import type EvaluationResultRepresentation from "@keycloak/keycloak-admin-client/lib/defs/evaluationResultRepresentation";
import type ResourceEvaluation from "@keycloak/keycloak-admin-client/lib/defs/resourceEvaluation";
import type ResourceRepresentation from "@keycloak/keycloak-admin-client/lib/defs/resourceRepresentation";
import {
  ListEmptyState,
  SelectControl,
  useFetch,
} from "@keycloak/keycloak-ui-shared";
import {
  ActionGroup,
  Alert,
  AlertActionCloseButton,
  Button,
  PageSection,
  Panel,
  PanelHeader,
  PanelMainBody,
  Split,
  SplitItem,
  Title,
} from "@patternfly/react-core";
import { useMemo, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useAdminClient } from "../admin-client";
import { UserSelect } from "../components/users/UserSelect";
import { FormAccess } from "../components/form/FormAccess";
import { KeyValueType } from "../components/key-value-form/key-value-convert";
import { useAccess } from "../context/access/Access";
import { ForbiddenSection } from "../ForbiddenSection";
import { FormFields } from "../clients/ClientDetails";
import { BellIcon } from "@patternfly/react-icons";
import { sortBy } from "lodash-es";

interface EvaluateFormInputs
  extends Omit<ResourceEvaluation, "context" | "resources"> {
  alias: string;
  authScopes: string[];
  context: {
    attributes: Record<string, string>[];
  };
  resources?: Record<string, string>[];
  client: FormFields;
  user: string[];
  resourceType?: string;
}

export type AttributeType = {
  key: string;
  name: string;
  custom?: boolean;
  values?: {
    [key: string]: string;
  }[];
};

type ClientSettingsProps = {
  client: ClientRepresentation;
  save: () => void;
};

export type AttributeForm = Omit<
  EvaluateFormInputs,
  "context" | "resources"
> & {
  context: {
    attributes?: KeyValueType[];
  };
  resources?: KeyValueType[];
};

type Props = ClientSettingsProps & EvaluationResultRepresentation;

export const PermissionsEvaluationTab = (props: Props) => {
  const { hasAccess } = useAccess();

  if (!hasAccess("view-users")) {
    return <ForbiddenSection permissionNeeded="view-users" />;
  }

  return <AuthorizationEvaluateContent {...props} />;
};

const AuthorizationEvaluateContent = ({ client }: Props) => {
  const { adminClient } = useAdminClient();

  const form = useForm<EvaluateFormInputs>({ mode: "onChange" });
  const {
    reset,
    formState: { isValid },
  } = form;
  const { t } = useTranslation();
  const [resources, setResources] = useState<ResourceRepresentation[]>([]);
  const [isAlertClosed, setIsAlertClosed] = useState(true);

  const selectedResourceType = useWatch({
    control: form.control,
    name: "resourceType",
  });

  useFetch(
    () =>
      Promise.all([
        adminClient.clients.listResources({
          id: client.id!,
        }),
      ]),
    ([resources]) => {
      setResources(resources);
    },
    [],
  );

  const authScopes = useMemo(() => {
    const resource = resources.find((r) => r.name === selectedResourceType);
    return sortBy(resource?.scopes?.map((scope) => scope.name!) || []);
  }, [selectedResourceType, resources]);

  return (
    <PageSection>
      <Split hasGutter>
        <SplitItem>
          <FormProvider {...form}>
            <Panel>
              <PanelMainBody>
                <FormAccess isHorizontal role="view-clients">
                  {isAlertClosed && (
                    <Alert
                      variant="info"
                      isInline
                      title={t("permissionsEvaluationInstructions")}
                      component="p"
                      actionClose={
                        <AlertActionCloseButton
                          onClose={() => setIsAlertClosed(false)}
                        />
                      }
                    />
                  )}
                  <UserSelect
                    name="user"
                    label={t("user")}
                    helpText={t("selectUser")}
                    defaultValue={[]}
                    variant="typeahead"
                    isRequired
                  />
                  <SelectControl
                    name="resourceType"
                    label={t("resourceType")}
                    labelIcon={t("resourceTypeSelectHelp")}
                    variant="single"
                    controller={{
                      defaultValue: "",
                      rules: {
                        required: true,
                      },
                    }}
                    options={resources.map((resource) => resource.name!)}
                  />
                  <SelectControl
                    name="authScope"
                    label={t("authScope")}
                    labelIcon={t("authScopeSelectHelp")}
                    controller={{
                      defaultValue: [],
                    }}
                    variant="single"
                    options={authScopes}
                  />
                </FormAccess>
              </PanelMainBody>
            </Panel>
            <ActionGroup>
              <Button
                data-testid="authorization-eval"
                id="authorization-eval"
                className="pf-v5-u-mr-md"
                isDisabled={!isValid}
              >
                {t("evaluate")}
              </Button>
              <Button
                data-testid="authorization-revert"
                id="authorization-revert"
                className="pf-v5-u-mr-md"
                variant="link"
                onClick={() => reset()}
              >
                {t("revert")}
              </Button>
            </ActionGroup>
          </FormProvider>
        </SplitItem>
        <SplitItem>
          <Panel>
            <PanelHeader>
              <Title headingLevel="h1" size="md">
                {t("permissionEvaluationPreview")}
              </Title>
            </PanelHeader>
            <PanelMainBody>
              <ListEmptyState
                icon={BellIcon}
                message={t("noPermissionsEvaluationResults")}
                instructions={t("noPermissionsEvaluationResultsInstructions")}
              />
            </PanelMainBody>
          </Panel>
        </SplitItem>
      </Split>
    </PageSection>
  );
};
