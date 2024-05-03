import type RealmRepresentation from "@keycloak/keycloak-admin-client/lib/defs/realmRepresentation";
import type { UserProfileGroup } from "@keycloak/keycloak-admin-client/lib/defs/userProfileMetadata";
import {
  Button,
  ButtonVariant,
  PageSection,
  ToolbarItem,
} from "@patternfly/react-core";
import { useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useConfirmDialog } from "../../components/confirm-dialog/ConfirmDialog";
import { ListEmptyState } from "../../components/list-empty-state/ListEmptyState";
import {
  Action,
  KeycloakDataTable,
} from "../../components/table-toolbar/KeycloakDataTable";
import { useRealm } from "../../context/realm-context/RealmContext";
import { toEditAttributesGroup } from "../routes/EditAttributesGroup";
import { toNewAttributesGroup } from "../routes/NewAttributesGroup";
import { useUserProfile } from "./UserProfileContext";
import { useFetch } from "../../utils/useFetch";
import { adminClient } from "../../admin-client";
import { DEFAULT_LOCALE } from "../../i18n/i18n";

type AttributesGroupTabProps = {
  setTableData: React.Dispatch<
    React.SetStateAction<Record<string, string>[] | undefined>
  >;
};

export const AttributesGroupTab = ({
  setTableData,
}: AttributesGroupTabProps) => {
  const { config, save } = useUserProfile();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { realm: realmName } = useRealm();
  const [key, setKey] = useState(0);
  const [realm, setRealm] = useState<RealmRepresentation>();
  const [groupToDelete, setGroupToDelete] = useState<UserProfileGroup>();

  // Refresh data in table when config changes.
  useEffect(() => setKey((value) => value + 1), [config]);

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

  const defaultSupportedLocales = useMemo(() => {
    return realm?.supportedLocales?.length
      ? realm.supportedLocales
      : [DEFAULT_LOCALE];
  }, [realm]);

  const defaultLocales = useMemo(() => {
    return realm?.defaultLocale?.length ? [realm.defaultLocale] : [];
  }, [realm]);

  const combinedLocales = useMemo(() => {
    return Array.from(new Set([...defaultLocales, ...defaultSupportedLocales]));
  }, [defaultLocales, defaultSupportedLocales]);

  async function loader() {
    return config?.groups ?? [];
  }

  const [toggleDeleteDialog, DeleteConfirm] = useConfirmDialog({
    titleKey: "deleteDialogTitle",
    children: (
      <Trans i18nKey="deleteDialogDescription">
        {" "}
        <strong>{{ group: groupToDelete?.name }}</strong>.
      </Trans>
    ),
    continueButtonLabel: "delete",
    continueButtonVariant: ButtonVariant.danger,
    onConfirm: async () => {
      const groups = (config?.groups ?? []).filter(
        (group) => group !== groupToDelete,
      );

      // Remove the the `${}` from translationsForDisplayHeaderToDelete and translationsForDisplayDescriptionToDelete strings
      const translationsForDisplayHeaderToDelete =
        groupToDelete?.displayHeader?.substring(
          2,
          groupToDelete?.displayHeader.length - 1,
        );
      const translationsForDisplayDescriptionToDelete =
        groupToDelete?.displayDescription?.substring(
          2,
          groupToDelete?.displayDescription.length - 1,
        );

      try {
        await Promise.all(
          combinedLocales.map(async (locale) => {
            try {
              const response =
                await adminClient.realms.getRealmLocalizationTexts({
                  realm: realmName,
                  selectedLocale: locale,
                });

              if (response) {
                await adminClient.realms.deleteRealmLocalizationTexts({
                  realm: realmName,
                  selectedLocale: locale,
                  key: translationsForDisplayHeaderToDelete,
                });

                await adminClient.realms.deleteRealmLocalizationTexts({
                  realm: realmName,
                  selectedLocale: locale,
                  key: translationsForDisplayDescriptionToDelete,
                });

                const updatedData =
                  await adminClient.realms.getRealmLocalizationTexts({
                    realm: realmName,
                    selectedLocale: locale,
                  });
                setTableData([updatedData]);
              }
            } catch (error) {
              console.error(`Error removing translations for ${locale}`);
            }
          }),
        );

        save(
          { ...config, groups },
          {
            successMessageKey: "deleteSuccess",
            errorMessageKey: "deleteAttributeGroupError",
          },
        );
      } catch (error) {
        console.error(
          `Error removing translations or updating attributes group: ${error}`,
        );
      }
    },
  });

  function deleteAttributeGroup(group: UserProfileGroup) {
    setGroupToDelete(group);
    toggleDeleteDialog();
  }

  return (
    <PageSection variant="light" className="pf-v5-u-p-0">
      <DeleteConfirm />
      <KeycloakDataTable
        key={key}
        loader={loader}
        ariaLabelKey="tableTitle"
        toolbarItem={
          <ToolbarItem>
            <Button
              component={(props) => (
                <Link
                  data-testid="create-attributes-groups-action"
                  {...props}
                  to={toNewAttributesGroup({ realm: realmName })}
                />
              )}
            >
              {t("createGroupText")}
            </Button>
          </ToolbarItem>
        }
        columns={[
          {
            name: "name",
            displayKey: "columnName",
            cellRenderer: (group) => (
              <Link
                to={toEditAttributesGroup({
                  realm: realmName,
                  name: group.name!,
                })}
              >
                {group.name}
              </Link>
            ),
          },
          {
            name: "displayHeader",
            displayKey: "columnDisplayName",
          },
          {
            name: "displayDescription",
            displayKey: "columnDisplayDescription",
          },
        ]}
        actions={[
          {
            title: t("delete"),
            onRowClick: deleteAttributeGroup,
          } as Action<UserProfileGroup>,
        ]}
        emptyState={
          <ListEmptyState
            message={t("emptyStateMessage")}
            instructions={t("emptyStateInstructions")}
            primaryActionText={t("createGroupText")}
            onPrimaryAction={() =>
              navigate(toNewAttributesGroup({ realm: realmName }))
            }
          />
        }
      />
    </PageSection>
  );
};
