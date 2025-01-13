import { useTranslation } from "react-i18next";
import { FormGroup, Radio, SelectOption } from "@patternfly/react-core";
import { HelpItem, KeycloakSelect, SelectVariant } from "@keycloak/keycloak-ui-shared";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import { useState } from "react";
import { UserSelect } from "../../../components/users/UserSelect";

export const Users = () => {
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
          id="allUsers"
          data-testid="allUsers"
          isChecked={!hasSelector}
          name="resourceScope"
          label={t("allUsers")}
          onChange={() => setHasSelector(false)}
          className="pf-v5-u-mb-md"
        />
        <Radio
          id="specificUsers"
          data-testid="specificUsers"
          isChecked={hasSelector}
          name="resourceScope"
          label={t("specificUsers")}
          onChange={() => setHasSelector(true)}
          className="pf-v5-u-mb-md"
        />
      </FormGroup>
      {hasSelector && (
        <UserSelect
          name="users"
          helpText={t("permissionUsersHelpText")}
          defaultValue={[]}
          variant="typeaheadMulti"
       // isRequired
      />
    )}
  </>
  );
};
