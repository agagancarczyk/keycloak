import { useTranslation } from "react-i18next";
import { UserSelect } from "../../../components/users/UserSelect";

export const Users = () => {
  const { t } = useTranslation();
  return (
    <UserSelect
      name="users"
      label="users"
      helpText={t("permissionUsersHelpText")}
      defaultValue={[]}
      variant="typeaheadMulti"
      isRequired
    />
  );
};
