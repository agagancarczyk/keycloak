import { AngleRightIcon } from "@patternfly/react-icons";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

type PermissionPolicyBreadcrumbProps = {
  detailLabel: string;
};

export const PermissionPolicyBreadcrumb = ({
  detailLabel,
}: PermissionPolicyBreadcrumbProps) => {
  const { t } = useTranslation();
  const { realm } = useParams();

  return (
    <>
      <Link to={`/${realm}/permissions/policies`}>{t("policies")}</Link>{" "}
      <AngleRightIcon
        className="pf-v5-u-ml-sm pf-v5-u-mr-xs"
        style={{ position: "relative", top: "0.125rem" }}
      />
      {t(detailLabel)}
    </>
  );
};
