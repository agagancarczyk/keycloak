import PolicyRepresentation from "@keycloak/keycloak-admin-client/lib/defs/policyRepresentation";
import {
  Button,
  ButtonVariant,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  Modal,
  ModalVariant,
} from "@patternfly/react-core";
import { CaretDownIcon, FilterIcon } from "@patternfly/react-icons";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ListEmptyState } from "@keycloak/keycloak-ui-shared";
import { KeycloakDataTable } from "@keycloak/keycloak-ui-shared";
import { capitalize } from "lodash-es";
import useToggle from "../../utils/useToggle";

export type ExistingPoliciesDialogProps = {
  policies: PolicyRepresentation[];
  open: boolean;
  toggleDialog: () => void;
  onAssign: (policies: { policy: PolicyRepresentation }[]) => void;
};

export const ExistingPoliciesDialog = ({
  policies,
  open,
  toggleDialog,
  onAssign,
}: ExistingPoliciesDialogProps) => {
  const { t } = useTranslation();
  const [rows, setRows] = useState<PolicyRepresentation[]>([]);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);
  const [isFilterTypeDropdownOpen, toggleIsFilterTypeDropdownOpen] =
    useToggle();

  const policyTypes = useMemo(
    () => Array.from(new Set(policies.map((policy) => policy.type))),
    [policies]
  );

  const filteredPolicies = useMemo(() => {
    if (!filterType) return policies;
    return policies.filter((policy) => policy.type === filterType);
  }, [policies, filterType]);

  return (
    <Modal
      variant={ModalVariant.medium}
      title={t("assignExistingPolicies")}
      isOpen={open}
      onClose={toggleDialog}
      actions={[
        <>
          <Button
            id="modal-assignExistingPolicies"
            data-testid="confirm"
            key="assign"
            variant={ButtonVariant.primary}
            onClick={() => {
              const selectedPolicies = rows.map((policy) => ({ policy }));
              onAssign(selectedPolicies);
              toggleDialog();
            }}
            isDisabled={rows.length === 0}
          >
            {t("assign")}
          </Button>
          <Button
            id="modal-cancelExistingPolicies"
            data-testid="cancel"
            key="cancel"
            variant={ButtonVariant.link}
            onClick={() => {
              setRows([]);
              toggleDialog();
            }}
          >
            {t("cancel")}
          </Button>
        </>
      ]}
    >
      <KeycloakDataTable
        loader={filteredPolicies}
        ariaLabelKey={t("chooseAPolicyType")}
        searchPlaceholderKey={t("searchPolicy")}
        isSearching={true}
        searchTypeComponent={
          <Dropdown
            onSelect={(event, value) => {
              setFilterType(value as string | undefined);
              toggleIsFilterTypeDropdownOpen();
            }}
            onOpenChange={toggleIsFilterTypeDropdownOpen}
            toggle={(ref) => (
              <MenuToggle
                ref={ref}
                data-testid="filter-type-dropdown-existingPolicies"
                id="toggle-id-9"
                onClick={toggleIsFilterTypeDropdownOpen}
                icon={<FilterIcon />}
                statusIcon={<CaretDownIcon />}
              >
                {filterType ? capitalize(filterType) : t("allTypes")}
              </MenuToggle>
            )}
            isOpen={isFilterTypeDropdownOpen}
          >
            <DropdownList>
              <DropdownItem
                data-testid="filter-type-dropdown-existingPolicies-all"
                key="all"
                onClick={() => setFilterType(undefined)}
              >
                {t("allTypes")}
              </DropdownItem>
              {policyTypes.map((type) => (
                <DropdownItem
                  data-testid={`filter-type-dropdown-existingPolicies-${type}`}
                  key={type}
                  onClick={() => setFilterType(type)}
                >
                  {capitalize(type)}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        }
        canSelectAll
        onSelect={(selectedRows) => setRows(selectedRows)}
        columns={[
          { name: "name", displayKey: t("name") },
          {
            name: "type",
            displayKey: t("type"),
            cellFormatters: [
              (value) => capitalize(String(value || "")),
            ],
          },
          { name: "description", displayKey: t("description") },
        ]}
        emptyState={
          <ListEmptyState
            message={t("emptyAssignExistingPolicies")}
            instructions={t("emptyAssignExistingPoliciesInstructions")}
          />
        }
      />
    </Modal>
  );
};
