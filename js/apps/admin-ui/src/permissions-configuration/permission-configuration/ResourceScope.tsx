import { useTranslation } from "react-i18next";
import { FormGroup, Radio, SelectOption } from "@patternfly/react-core";
import { HelpItem, KeycloakSelect, SelectVariant } from "@keycloak/keycloak-ui-shared";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useState } from "react";

type ResourceScopeProps = {
  isDisabled?: boolean;
};

export const ResourceScope = ({ isDisabled }: ResourceScopeProps) => {
  const { t } = useTranslation();
  const form = useFormContext();
  const [selectResourceScopeSwitch, setSelectResourceScopeSwitch] = useState(false);

  const hasSelector = useWatch({
    control: form.control,
    name: "hasSelector",
  });

  function setHasSelector(hasSelector: boolean) {
    form.setValue("hasSelector", hasSelector);
  };

  return (
    <>
      <FormGroup
        label={t("resourceScope")}
        labelIcon={
          <HelpItem
            helpText={t("resourceScopeHelpText")}
            fieldLabelId="resource-scope"
          />
        }
        fieldId="resourceScope"
        hasNoPaddingTop
      >
        <Radio
          id="allClients"
          data-testid="allClients"
          isChecked={!hasSelector}
          name="resourceScope"
          label={t("allClients")}
          onChange={() => setHasSelector(false)}
          className="pf-v5-u-mb-md"
        />
        <Radio
          id="specificClients"
          data-testid="specificClients"
          isChecked={hasSelector}
          name="resourceScope"
          label={t("specificClients")}
          onChange={() => setHasSelector(true)}
          className="pf-v5-u-mb-md"
        />
      </FormGroup>
      {hasSelector && (
        <FormGroup fieldId="kc-resource-scope">
          <Controller
            name="selector.scopes"
            control={form.control}
            defaultValue={[]}
            render={({ field }) => (
              <KeycloakSelect
                data-testid="resource-scope-field"
                variant={SelectVariant.typeaheadMulti}
                typeAheadAriaLabel="Select"
                chipGroupProps={{
                  numChips: 3,
                  expandedText: t("hide"),
                  collapsedText: t("showRemaining"),
                }}
                onToggle={(isOpen) => setSelectResourceScopeSwitch(isOpen)}
                selections={field.value}
                onSelect={(selectedValue) => {
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
                onClear={() => {
                  field.onChange([]);
                }}
                isOpen={selectResourceScopeSwitch}
                aria-labelledby={"scope"}
              >
              {/* {clientScopes.map((option) => (
                <SelectOption key={option.name} value={option.name}>
                  {option.name}
                </SelectOption>
              ))} */}
            </KeycloakSelect>
          )}
        />
      </FormGroup>
    )}
  </>
  );
};
