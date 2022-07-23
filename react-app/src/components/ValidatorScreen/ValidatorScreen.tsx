import React, { useCallback, useEffect, useMemo } from "react";
import cn from "classnames";
import { Link, useSearchParams } from "react-router-dom";
import { BondStatus } from "cosmjs-types/cosmos/staking/v1beta1/staking";
import Paper from "../common/Paper/Paper";
import { Icon, IconType } from "../common/Icons/Icons";
import LocalizedText from "../common/Localized/LocalizedText";
import FilterTabs, { IFilterTabItem } from "../Tabs/FilterTabs";
import * as Table from "../common/Table";
import AppRoutes from "../../navigation/AppRoutes";
import PageContoller from "../common/PageController/PageController";
import { usePagination } from "../../hooks/usePagination";
import {
  isRequestStateLoaded,
  isRequestStateLoading,
} from "../../models/RequestState";
import { useWallet } from "../../providers/WalletProvider";
import { FilterKey, useValidatorsQuery } from "./ValidatorScreenAPI";
import { AggregatedValidator } from "./ValidatorScreenModel";

const VALIDATOR_LIST_PAGE_SIZE = 20;

type ValidatorTabItem = IFilterTabItem<FilterKey>;

const defaultTabItems: ValidatorTabItem[] = [
  {
    label: "ValidatorScreen.filters.all",
    value: "all",
  },
  {
    label: "ValidatorScreen.filters.active",
    value: "active",
  },
  {
    label: "ValidatorScreen.filters.inactive",
    value: "inactive",
  },
];

const defaultTabItem = defaultTabItems[0];

const ValidatorScreen: React.FC = () => {
  const wallet = useWallet();
  const [searchParams, setSearchParams] = useSearchParams({
    tab: defaultTabItem.value,
    page: "1",
  });

  const [after, selectedTab] = useMemo(() => {
    const after =
      (parseInt(searchParams.get("page") ?? "1", 10) - 1) *
      VALIDATOR_LIST_PAGE_SIZE;

    const tab = (
      defaultTabItems.find((i) => i.value === searchParams.get("tab")) ??
      defaultTabItem
    ).value;
    return [after, tab];
  }, [searchParams]);

  const setPage = useCallback(
    (after: number) => {
      setSearchParams({
        tab: selectedTab,
        page: (after / VALIDATOR_LIST_PAGE_SIZE + 1).toString(),
      });
    },
    [selectedTab, setSearchParams]
  );

  const handleSelectTab = useCallback(
    (tab: FilterKey) => {
      setSearchParams({
        tab,
      });
    },
    [setSearchParams]
  );

  const {
    requestState,
    fetch: fetchValidators,
    order,
    setOrder,
  } = useValidatorsQuery();

  const validators = useMemo(() => {
    if (!isRequestStateLoaded(requestState)) return [];
    return requestState.data.aggregatedValidators.filter((v) => {
      switch (selectedTab) {
        case "all":
          return true;
        case "active":
          return (
            !v.validator.jailed &&
            v.validator.status === BondStatus.BOND_STATUS_BONDED
          );
        case "inactive":
          return v.validator.jailed;
        default:
          return false;
      }
    });
  }, [requestState, selectedTab]);

  const paginatedValidators = usePagination(
    validators,
    after,
    VALIDATOR_LIST_PAGE_SIZE
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetchValidators();
  }, [fetchValidators, wallet]);

  return (
    <Paper className={cn("flex", "flex-col")}>
      <div className={cn("flex", "flex-row", "gap-x-2.5", "items-center")}>
        <Icon
          icon={IconType.Validator}
          fill="currentColor"
          height={24}
          width={24}
          className={cn("text-app-black")}
        />
        <h1
          className={cn(
            "text-lg",
            "leading-none",
            "font-bold",
            "text-app-black"
          )}
        >
          <LocalizedText messageID="ValidatorScreen.title" />
        </h1>
      </div>
      <div className={cn("flex", "flex-col", "mt-9", "gap-y-4")}>
        <FilterTabs<FilterKey>
          tabs={defaultTabItems}
          selectedTab={selectedTab}
          onSelectTab={handleSelectTab}
        />

        <Table.Table
          items={paginatedValidators}
          isLoading={isRequestStateLoading(requestState)}
          sortOrder={order}
          onSort={setOrder}
        >
          <Table.Column<AggregatedValidator>
            id="name"
            titleId="ValidatorScreen.validatorList.name"
            sortable={true}
          >
            {(item) => (
              <div className={cn("flex", "flex-row")}>
                <div
                  className={cn(
                    "flex-shrink-0",
                    "w-9",
                    "h-9",
                    "leading-none",
                    "rounded-full",
                    "bg-blue-700"
                  )}
                />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-app-green">
                    <Link
                      to={AppRoutes.ValidatorDetail.replace(
                        ":address",
                        item.validator.operatorAddress
                      )}
                    >
                      {item.validator.description?.moniker}
                    </Link>
                  </h3>
                  <p
                    className={cn(
                      "text-xs",
                      "font-medium",
                      "leading-[14px]",
                      item.validator.jailed
                        ? "text-app-vote-color-no"
                        : "text-app-vote-color-yes"
                    )}
                  >
                    <LocalizedText
                      messageID={
                        item.validator.jailed
                          ? "ValidatorScreen.validatorList.inactive"
                          : "ValidatorScreen.validatorList.active"
                      }
                    />
                  </p>
                </div>
              </div>
            )}
          </Table.Column>
          <Table.Column<AggregatedValidator>
            id="votingPower"
            titleId="ValidatorScreen.validatorList.votingPower"
            sortable={true}
          >
            {(item) => (
              <span
                className={cn(
                  "font-normal",
                  "text-sm",
                  "leading-5",
                  "text-gray-500"
                )}
              >
                {`${(item.validator.votingPower * 100).toFixed(2)}%`}
              </span>
            )}
          </Table.Column>
          <Table.Column<AggregatedValidator>
            id="staked"
            titleId="ValidatorScreen.validatorList.staked"
            sortable={true}
          >
            {(item) => (
              <span
                className={cn(
                  "font-normal",
                  "text-sm",
                  "leading-5",
                  "text-gray-500"
                )}
              >
                {item.stake ? item.stake.balance.amount.toFixed(2) : "-"}
              </span>
            )}
          </Table.Column>
          <Table.Column<AggregatedValidator>
            id="rewards"
            titleId="ValidatorScreen.validatorList.rewards"
            sortable={true}
          >
            {(item) => (
              <span
                className={cn(
                  "font-normal",
                  "text-sm",
                  "leading-5",
                  "text-gray-500"
                )}
              >
                {item.stake ? item.stake.reward.amount.toString() : "-"}
              </span>
            )}
          </Table.Column>
          <Table.Column<AggregatedValidator>
            id="expectedReturns"
            titleId="ValidatorScreen.validatorList.expectedReturns"
            sortable={true}
          >
            {(item) => (
              <span
                className={cn(
                  "font-normal",
                  "text-sm",
                  "leading-5",
                  "text-gray-500"
                )}
              >
                {`${(item.validator.expectedReturn * 100).toFixed(2)}%`}
              </span>
            )}
          </Table.Column>
          <Table.Column<AggregatedValidator>
            id="participations"
            titleId="ValidatorScreen.validatorList.participations"
            sortable={true}
          >
            {(item) => (
              <div className={cn("flex")}>
                <span
                  className={cn(
                    "border",
                    "border-app-vote-color-yes",
                    "text-app-vote-color-yes",
                    "rounded-full",
                    "font-normal",
                    "text-sm",
                    "leading-5",
                    "px-2.5"
                  )}
                >
                  {item.validator.participatedProposalCount}/
                  {item.validator.relativeTotalProposalCount}
                </span>
              </div>
            )}
          </Table.Column>
          <Table.Column<AggregatedValidator>
            id="uptime"
            titleId="ValidatorScreen.validatorList.uptime"
            sortable={true}
          >
            {(item) => (
              <span
                className={cn(
                  "font-normal",
                  "text-sm",
                  "leading-5",
                  "text-gray-500"
                )}
              >
                {`${(item.validator.uptime * 100).toFixed(2)}%`}
              </span>
            )}
          </Table.Column>
        </Table.Table>

        <PageContoller
          offsetBased={true}
          pageSize={VALIDATOR_LIST_PAGE_SIZE}
          totalItems={validators.length}
          currentOffset={after}
          onPageChange={setPage}
        />
      </div>
    </Paper>
  );
};

export default ValidatorScreen;
