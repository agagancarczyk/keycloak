import type ClientScopeRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientScopeRepresentation";
import type { UserProfileConfig } from "@keycloak/keycloak-admin-client/lib/defs/userProfileMetadata";
import type RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import {
  Button,
  Divider,
  FormGroup,
  Grid,
  GridItem,
  Radio,
  Select,
  SelectOption,
  SelectVariant,
  Switch,
  Tooltip,
} from "@patternfly/react-core";
import { isEqual } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { HelpItem } from "ui-shared";

import { adminClient } from "../../../admin-client";
import { FormAccess } from "../../../components/form/FormAccess";
import { KeycloakSpinner } from "../../../components/keycloak-spinner/KeycloakSpinner";
import { KeycloakTextInput } from "../../../components/keycloak-text-input/KeycloakTextInput";
import { useFetch } from "../../../utils/useFetch";
import { useParams } from "../../../utils/useParams";
import { USERNAME_EMAIL } from "../../NewAttributeSettings";
import "../../realm-settings-section.css";
import { GlobeRouteIcon } from "@patternfly/react-icons";
import { AddTranslationsDialog } from "./AddTranslationsDialog";
import useToggle from "../../../utils/useToggle";
import { AttributeParams } from "../../routes/Attribute";
import { useRealm } from "../../../context/realm-context/RealmContext";

const REQUIRED_FOR = [
  { label: "requiredForLabel.both", value: ["admin", "user"] },
  { label: "requiredForLabel.users", value: ["user"] },
  { label: "requiredForLabel.admins", value: ["admin"] },
] as const;

type TranslationForm = {
  locale: string;
  value: string;
};

type Translations = {
  key: string;
  translations: TranslationForm[];
};

export type AttributeGeneralSettingsProps = {
  onHandlingTranslationData: (data: Translations) => void;
  onHandlingGeneratedDisplayName: (displayName: string) => void;
};

export const AttributeGeneralSettings = ({
  onHandlingTranslationData,
  onHandlingGeneratedDisplayName,
}: AttributeGeneralSettingsProps) => {
  const { t } = useTranslation();
  const { realm: realmName } = useRealm();
  const form = useFormContext();
  const tooltipRef = useRef();
  const [clientScopes, setClientScopes] =
    useState<ClientScopeRepresentation[]>();
  const [config, setConfig] = useState<UserProfileConfig>();
  const [selectEnabledWhenOpen, setSelectEnabledWhenOpen] = useState(false);
  const [selectRequiredForOpen, setSelectRequiredForOpen] = useState(false);
  const [isAttributeGroupDropdownOpen, setIsAttributeGroupDropdownOpen] =
    useState(false);
  const [addTranslationsModalOpen, toggleModal] = useToggle();
  const { attributeName } = useParams<AttributeParams>();
  const editMode = attributeName ? true : false;
  const [realm, setRealm] = useState<RealmRepresentation>();
  const [newAttributeName, setNewAttributeName] = useState("");
  const [generatedDisplayName, setGeneratedDisplayName] = useState("");
  const [translationsData, setTranslationsData] = useState<Translations>({
    key: "",
    translations: [],
  });
  const displayNameRegex = /\$\{([^}]+)\}/;

  const handleAttributeNameChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newAttributeName = event.target.value;
    setNewAttributeName(newAttributeName);

    const newDisplayName =
      newAttributeName !== "" && realm?.internationalizationEnabled
        ? "${profile.attributes." + `${newAttributeName}}`
        : "";

    setGeneratedDisplayName(newDisplayName);
  };

  const hasSelector = useWatch({
    control: form.control,
    name: "hasSelector",
  });

  const hasRequiredScopes = useWatch({
    control: form.control,
    name: "hasRequiredScopes",
  });

  const required = useWatch({
    control: form.control,
    name: "isRequired",
    defaultValue: false,
  });

  const attributeDisplayName = useWatch({
    control: form.control,
    name: "displayName",
  });

  const displayNamePatternMatch = displayNameRegex.test(attributeDisplayName);

  useFetch(
    () => adminClient.realms.findOne({ realm: realmName }),
    (realm) => {
      if (!realm) {
        throw new Error(t("notFound"));
      }
      setRealm(realm);
    },
    [],
  );

  useFetch(() => adminClient.clientScopes.find(), setClientScopes, []);
  useFetch(() => adminClient.users.getProfile(), setConfig, []);

  const handleTranslationsData = (translationsData: Translations) => {
    onHandlingTranslationData(translationsData);
  };

  const handleGeneratedDisplayName = (displayName: string) => {
    onHandlingGeneratedDisplayName(displayName);
  };

  useEffect(() => {
    handleTranslationsData(translationsData);
    handleGeneratedDisplayName(generatedDisplayName);
  }, [translationsData, generatedDisplayName]);

  if (!clientScopes) {
    return <KeycloakSpinner />;
  }

  function setHasSelector(hasSelector: boolean) {
    form.setValue("hasSelector", hasSelector);
  }

  function setHasRequiredScopes(hasRequiredScopes: boolean) {
    form.setValue("hasRequiredScopes", hasRequiredScopes);
  }

  const handleTranslationsAdded = (translationsData: Translations) => {
    setTranslationsData(translationsData);
  };

  const handleToggleDialog = () => {
    toggleModal();
    handleTranslationsData(translationsData);
    handleGeneratedDisplayName(generatedDisplayName);
  };

  return (
    <>
      {addTranslationsModalOpen && (
        <AddTranslationsDialog
          translationKey={
            editMode
              ? attributeDisplayName
              : "${profile.attributes." + `${newAttributeName}}`
          }
          onTranslationsAdded={handleTranslationsAdded}
          toggleDialog={handleToggleDialog}
          onCancel={() => {
            toggleModal();
          }}
        />
      )}
      <FormAccess role="manage-realm" isHorizontal>
        <FormGroup
          label={t("attributeName")}
          labelIcon={
            <HelpItem
              helpText={t("upAttributeNameHelp")}
              fieldLabelId="attributeName"
            />
          }
          fieldId="kc-attribute-name"
          isRequired
          validated={form.formState.errors.name ? "error" : "default"}
          helperTextInvalid={t("validateAttributeName")}
        >
          <KeycloakTextInput
            isRequired
            id="kc-attribute-name"
            defaultValue=""
            data-testid="attribute-name"
            isDisabled={editMode}
            validated={form.formState.errors.name ? "error" : "default"}
            {...form.register("name", { required: true })}
            onChange={handleAttributeNameChange}
          />
        </FormGroup>
        <FormGroup
          label={t("attributeDisplayName")}
          labelIcon={
            <HelpItem
              helpText={t("attributeDisplayNameHelp")}
              fieldLabelId="attributeDisplayName"
            />
          }
          fieldId="kc-attribute-display-name"
        >
          <Grid hasGutter>
            <GridItem span={realm?.internationalizationEnabled ? 11 : 12}>
              <KeycloakTextInput
                id="kc-attribute-display-name"
                data-testid="attribute-display-name"
                isDisabled={
                  (realm?.internationalizationEnabled &&
                    newAttributeName !== "") ||
                  (editMode && displayNamePatternMatch)
                }
                value={
                  editMode
                    ? attributeDisplayName
                    : realm?.internationalizationEnabled
                      ? generatedDisplayName
                      : undefined
                }
                {...form.register("displayName")}
              />
            </GridItem>
            {realm?.internationalizationEnabled && (
              <GridItem span={1}>
                <Button
                  ref={tooltipRef}
                  variant="link"
                  className="pf-m-plain kc-attribute-display-name-iconBtn"
                  data-testid="addAttributeTranslationBtn"
                  aria-label={t("addAttributeTranslationBtn")}
                  isDisabled={!newAttributeName && !editMode}
                  onClick={() => {
                    toggleModal();
                  }}
                  icon={<GlobeRouteIcon />}
                />
                <Tooltip
                  content={t("addAttributeTranslationTooltip")}
                  reference={tooltipRef}
                />
              </GridItem>
            )}
          </Grid>
        </FormGroup>
        <FormGroup
          label={t("attributeGroup")}
          labelIcon={
            <HelpItem
              helpText={t("attributeGroupHelp")}
              fieldLabelId="realm-setting:attributeGroup"
            />
          }
          fieldId="kc-attributeGroup"
        >
          <Controller
            name="group"
            defaultValue=""
            control={form.control}
            render={({ field }) => (
              <Select
                toggleId="kc-attributeGroup"
                aria-label={t("attributeGroup")}
                onToggle={() =>
                  setIsAttributeGroupDropdownOpen(!isAttributeGroupDropdownOpen)
                }
                isOpen={isAttributeGroupDropdownOpen}
                onSelect={(_, value) => {
                  field.onChange(value.toString());
                  setIsAttributeGroupDropdownOpen(false);
                }}
                selections={[field.value || t("none")]}
                variant={SelectVariant.single}
              >
                {[
                  <SelectOption key="empty" value="">
                    {t("none")}
                  </SelectOption>,
                  ...(config?.groups?.map((group) => (
                    <SelectOption key={group.name} value={group.name}>
                      {group.name}
                    </SelectOption>
                  )) || []),
                ]}
              </Select>
            )}
          ></Controller>
        </FormGroup>
        {!USERNAME_EMAIL.includes(attributeName) && (
          <>
            <Divider />
            <FormGroup
              label={t("enabledWhen")}
              labelIcon={
                <HelpItem
                  helpText={t("enabledWhenTooltip")}
                  fieldLabelId="enabled-when"
                />
              }
              fieldId="enabledWhen"
              hasNoPaddingTop
            >
              <Radio
                id="always"
                data-testid="always"
                isChecked={!hasSelector}
                name="enabledWhen"
                label={t("always")}
                onChange={() => setHasSelector(false)}
                className="pf-u-mb-md"
              />
              <Radio
                id="scopesAsRequested"
                data-testid="scopesAsRequested"
                isChecked={hasSelector}
                name="enabledWhen"
                label={t("scopesAsRequested")}
                onChange={() => setHasSelector(true)}
                className="pf-u-mb-md"
              />
            </FormGroup>
            {hasSelector && (
              <FormGroup fieldId="kc-scope-enabled-when">
                <Controller
                  name="selector.scopes"
                  control={form.control}
                  defaultValue={[]}
                  render={({ field }) => (
                    <Select
                      name="scopes"
                      data-testid="enabled-when-scope-field"
                      variant={SelectVariant.typeaheadMulti}
                      typeAheadAriaLabel="Select"
                      chipGroupProps={{
                        numChips: 3,
                        expandedText: t("hide"),
                        collapsedText: t("showRemaining"),
                      }}
                      onToggle={(isOpen) => setSelectEnabledWhenOpen(isOpen)}
                      selections={field.value}
                      onSelect={(_, selectedValue) => {
                        const option = selectedValue.toString();
                        let changedValue = [""];
                        if (field.value) {
                          changedValue = field.value.includes(option)
                            ? field.value.filter(
                                (item: string) => item !== option,
                              )
                            : [...field.value, option];
                        } else {
                          changedValue = [option];
                        }

                        field.onChange(changedValue);
                      }}
                      onClear={(selectedValues) => {
                        selectedValues.stopPropagation();
                        field.onChange([]);
                      }}
                      isOpen={selectEnabledWhenOpen}
                      aria-labelledby={"scope"}
                    >
                      {clientScopes.map((option) => (
                        <SelectOption key={option.name} value={option.name} />
                      ))}
                    </Select>
                  )}
                />
              </FormGroup>
            )}
          </>
        )}
        {attributeName !== "username" && (
          <>
            <Divider />
            <FormGroup
              label={t("required")}
              labelIcon={
                <HelpItem
                  helpText={t("requiredHelp")}
                  fieldLabelId="required"
                />
              }
              fieldId="kc-required"
              hasNoPaddingTop
            >
              <Controller
                name="isRequired"
                data-testid="required"
                defaultValue={false}
                control={form.control}
                render={({ field }) => (
                  <Switch
                    id={"kc-required"}
                    onChange={field.onChange}
                    isChecked={field.value}
                    label={t("on")}
                    labelOff={t("off")}
                    aria-label={t("required")}
                  />
                )}
              />
            </FormGroup>
            {required && (
              <>
                <FormGroup
                  label={t("requiredFor")}
                  fieldId="requiredFor"
                  hasNoPaddingTop
                >
                  <Controller
                    name="required.roles"
                    data-testid="requiredFor"
                    defaultValue={REQUIRED_FOR[0].value}
                    control={form.control}
                    render={({ field }) => (
                      <div className="kc-requiredFor">
                        {REQUIRED_FOR.map((option) => (
                          <Radio
                            id={option.label}
                            key={option.label}
                            data-testid={option.label}
                            isChecked={isEqual(field.value, option.value)}
                            name="roles"
                            onChange={() => {
                              field.onChange(option.value);
                            }}
                            label={t(option.label)}
                            className="kc-requiredFor-option"
                          />
                        ))}
                      </div>
                    )}
                  />
                </FormGroup>
                <FormGroup
                  label={t("requiredWhen")}
                  labelIcon={
                    <HelpItem
                      helpText={t("requiredWhenTooltip")}
                      fieldLabelId="required-when"
                    />
                  }
                  fieldId="requiredWhen"
                  hasNoPaddingTop
                >
                  <Radio
                    id="requiredAlways"
                    data-testid="requiredAlways"
                    isChecked={!hasRequiredScopes}
                    name="requiredWhen"
                    label={t("always")}
                    onChange={() => setHasRequiredScopes(false)}
                    className="pf-u-mb-md"
                  />
                  <Radio
                    id="requiredScopesAsRequested"
                    data-testid="requiredScopesAsRequested"
                    isChecked={hasRequiredScopes}
                    name="requiredWhen"
                    label={t("scopesAsRequested")}
                    onChange={() => setHasRequiredScopes(true)}
                    className="pf-u-mb-md"
                  />
                </FormGroup>
                {hasRequiredScopes && (
                  <FormGroup fieldId="kc-scope-required-when">
                    <Controller
                      name="required.scopes"
                      control={form.control}
                      defaultValue={[]}
                      render={({ field }) => (
                        <Select
                          name="scopeRequired"
                          data-testid="required-when-scope-field"
                          variant={SelectVariant.typeaheadMulti}
                          typeAheadAriaLabel="Select"
                          chipGroupProps={{
                            numChips: 3,
                            expandedText: t("hide"),
                            collapsedText: t("showRemaining"),
                          }}
                          onToggle={(isOpen) =>
                            setSelectRequiredForOpen(isOpen)
                          }
                          selections={field.value}
                          onSelect={(_, selectedValue) => {
                            const option = selectedValue.toString();
                            let changedValue = [""];
                            if (field.value) {
                              changedValue = field.value.includes(option)
                                ? field.value.filter(
                                    (item: string) => item !== option,
                                  )
                                : [...field.value, option];
                            } else {
                              changedValue = [option];
                            }
                            field.onChange(changedValue);
                          }}
                          onClear={(selectedValues) => {
                            selectedValues.stopPropagation();
                            field.onChange([]);
                          }}
                          isOpen={selectRequiredForOpen}
                          aria-labelledby={"scope"}
                        >
                          {clientScopes.map((option) => (
                            <SelectOption
                              key={option.name}
                              value={option.name}
                            />
                          ))}
                        </Select>
                      )}
                    />
                  </FormGroup>
                )}
              </>
            )}
          </>
        )}
      </FormAccess>
    </>
  );
};
