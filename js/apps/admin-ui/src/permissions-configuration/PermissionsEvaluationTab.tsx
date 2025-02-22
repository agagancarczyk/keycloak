import type ClientRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientRepresentation";
import type EvaluationResultRepresentation from "@keycloak/keycloak-admin-client/lib/defs/evaluationResultRepresentation";
import type ResourceEvaluation from "@keycloak/keycloak-admin-client/lib/defs/resourceEvaluation";
import type ResourceRepresentation from "@keycloak/keycloak-admin-client/lib/defs/resourceRepresentation";
import PolicyEvaluationResponse from "@keycloak/keycloak-admin-client/lib/defs/policyEvaluationResponse";
import {
  ListEmptyState,
  SelectControl,
  useAlerts,
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
import { useAccess } from "../context/access/Access";
import { ForbiddenSection } from "../ForbiddenSection";
import { BellIcon } from "@patternfly/react-icons";
import { sortBy } from "lodash-es";
import { ClientSelect } from "../components/client/ClientSelect";
import { useRealm } from "../context/realm-context/RealmContext";

interface EvaluateFormInputs
  extends Omit<ResourceEvaluation, "context" | "resources"> {
  alias: string;
  authScopes: string[];
  context: {
    attributes: Record<string, string>[];
  };
  resources?: Record<string, string>[];
  client: Record<string, unknown>;
  user: string[];
  resourceType?: string;
  authScope: string[];
}

type Props = {
  client: ClientRepresentation;
  save: () => void;
} & EvaluationResultRepresentation;

const COMPONENTS: Record<string, React.ElementType> = {
  users: UserSelect,
  clients: ClientSelect,
};

export const PermissionsEvaluationTab = (props: Props) => {
  const { hasAccess } = useAccess();

  if (!hasAccess("view-users")) {
    return <ForbiddenSection permissionNeeded="view-users" />;
  }

  return <AuthorizationEvaluateContent {...props} />;
};

const AuthorizationEvaluateContent = ({ client }: Props) => {
  const { t } = useTranslation();
  const { adminClient } = useAdminClient();
  const realm = useRealm();
  const { addError } = useAlerts();
  const form = useForm<EvaluateFormInputs>({
    mode: "onChange",
    defaultValues: {
      user: [],
      resourceType: "",
      authScope: [],
    },
  });
  const { control, getValues, reset, trigger } = form;
  const [resources, setResources] = useState<ResourceRepresentation[]>([]);
  const [evaluateResult, setEvaluateResult] =
    useState<PolicyEvaluationResponse>();
  const [isAlertClosed, setIsAlertClosed] = useState(true);

  const selectedResourceType = useWatch({
    control: control,
    name: "resourceType",
    defaultValue: "",
  });

  useFetch(
    () =>
      adminClient.clients.listResources({
        id: client.id!,
      }),
    (resources) => setResources(resources),
    [],
  );

  const authScopes = useMemo(() => {
    const resource = resources.find((r) => r.name === selectedResourceType);
    return sortBy(resource?.scopes?.map((scope) => scope.name!) || []);
  }, [selectedResourceType, resources]);

  const ResourceTypeComponent =
    COMPONENTS[selectedResourceType?.toLowerCase() || ""];

  const evaluate = async () => {
    if (!(await trigger())) {
      return;
    }
    const formValues = getValues();
    const resEval: ResourceEvaluation = {
      clientId: "",
      userId: "",
      entitlements: false,
      context: {
        attributes: {},
      },
    };
    try {
      const evaluation = await adminClient.clients.evaluateResource(
        { id: client.id!, realm: realm.realm },
        resEval,
      );

      setEvaluateResult(evaluation);
    } catch (error) {
      addError("evaluateError", error);
    }
  };

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
                      defaultValue: resources.length ? resources[0]?.name : "",
                      rules: { required: true },
                    }}
                    options={resources.map((resource) => resource.name!)}
                  />
                  {ResourceTypeComponent && (
                    <ResourceTypeComponent
                      name={selectedResourceType?.toLowerCase()}
                      label={t(`${selectedResourceType}Select`)}
                      helpText={t(`select${selectedResourceType}`)}
                      defaultValue={[]}
                      variant="typeahead"
                      isRequired
                    />
                  )}
                  <SelectControl
                    name="authScope"
                    label={t("authScope")}
                    labelIcon={t("authScopeSelectHelp")}
                    controller={{ defaultValue: [] }}
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
                isDisabled={!form.formState.isValid}
                onClick={() => evaluate()}
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
