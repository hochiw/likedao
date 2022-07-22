import React from "react";
import cn from "classnames";
import { Link } from "react-router-dom";
import Paper from "../common/Paper/Paper";
import { Icon, IconType } from "../common/Icons/Icons";
import LocalizedText from "../common/Localized/LocalizedText";
import {
  convertBigNumberToFixedPointString,
  convertBigNumberToMillifiedIntegerString,
} from "../../utils/number";
import * as Table from "../common/Table";
import LoadingSpinner from "../common/LoadingSpinner/LoadingSpinner";
import AppRoutes from "../../navigation/AppRoutes";
import { Stake } from "./PortfolioScreenModel";

interface StakesPanelProps {
  isLoading: boolean;
  stakes: Stake[] | null;
  isYourPortfolio: boolean;
  order: Table.ColumnOrder;
  setOrder: (order: Table.ColumnOrder) => void;
}

const StakesPanel: React.FC<StakesPanelProps> = ({
  isLoading,
  stakes,
  isYourPortfolio,
  order,
  setOrder,
}) => {
  if (!stakes || isLoading) {
    return (
      <Paper className={cn("flex", "justify-center", "items-center")}>
        <LoadingSpinner />
      </Paper>
    );
  }

  if (stakes.length === 0) {
    return null;
  }

  return (
    <Paper>
      <div className={cn("flex", "mb-9")}>
        <Icon
          className={cn("fill-app-black", "mr-3")}
          icon={isYourPortfolio ? IconType.Safe : IconType.CommentsQA}
          height={20}
          width={20}
        />
        <h2
          className={cn("text-lg", "font-bold", "leading-5", "text-app-black")}
        >
          <LocalizedText
            messageID={
              isYourPortfolio
                ? "StakesPanel.yourStakes"
                : "StakesPanel.delegations"
            }
          />
        </h2>
      </div>

      <Table.Table items={stakes} sortOrder={order} onSort={setOrder}>
        <Table.Column<Stake>
          id="name"
          titleId="StakesPanel.name"
          sortable={true}
        >
          {(item) => (
            <div className={cn("flex", "items-center")}>
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
                    {item.validator.description.moniker}
                  </Link>
                </h3>
                <p
                  className={cn(
                    "text-xs",
                    "font-medium",
                    "leading-[14px]",
                    "text-app-vote-color-yes"
                  )}
                >
                  <LocalizedText messageID="StakesPanel.active" />
                </p>
              </div>
            </div>
          )}
        </Table.Column>
        <Table.Column<Stake>
          id="staked"
          titleId="StakesPanel.staked"
          sortable={true}
        >
          {(item) => (
            <span
              className={cn(
                "text-sm",
                "leading-5",
                "font-normal",
                "text-gray-500"
              )}
            >
              {convertBigNumberToMillifiedIntegerString(item.balance.amount)}
            </span>
          )}
        </Table.Column>
        <Table.Column<Stake>
          id="rewards"
          titleId="StakesPanel.rewards"
          sortable={true}
        >
          {(item) => (
            <span
              className={cn(
                "text-sm",
                "leading-5",
                "font-normal",
                "text-gray-500"
              )}
            >
              {!item.reward.amount.lt(1)
                ? convertBigNumberToMillifiedIntegerString(item.reward.amount)
                : convertBigNumberToFixedPointString(item.reward.amount, 9)}
            </span>
          )}
        </Table.Column>
        <Table.Column<Stake>
          id="expectedReturns"
          titleId="StakesPanel.expectedReturns"
          sortable={true}
        >
          {(item) => (
            <span
              className={cn(
                "text-sm",
                "leading-5",
                "font-normal",
                "text-gray-500"
              )}
            >
              {(item.expectedReturn * 100).toFixed(2)}%
            </span>
          )}
        </Table.Column>
        <Table.Column<Stake>
          id="votingPower"
          titleId="StakesPanel.votingPower"
          sortable={true}
        >
          {(item) => (
            <span
              className={cn(
                "text-sm",
                "leading-5",
                "font-normal",
                "text-gray-500"
              )}
            >
              {(item.validator.votePower * 100).toFixed(2)}%
            </span>
          )}
        </Table.Column>
      </Table.Table>
    </Paper>
  );
};

export default StakesPanel;
