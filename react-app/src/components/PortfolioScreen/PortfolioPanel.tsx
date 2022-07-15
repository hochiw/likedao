import React, { useCallback } from "react";
import cn from "classnames";
import { toast } from "react-toastify";
import { BigNumber } from "bignumber.js";
import Paper from "../common/Paper/Paper";
import LocalizedText from "../common/Localized/LocalizedText";
import { Icon, IconType } from "../common/Icons/Icons";
import CopyableText from "../common/CopyableText/CopyableText";
import { useLocale } from "../../providers/AppLocaleProvider";
import { truncateAddress } from "../../utils/address";
import CoinBalanceCard from "../common/CoinBalanceCard/CoinBalanceCard";
import { convertBigNumberToMillifiedIntegerString } from "../../utils/number";
import Config from "../../config/Config";
import { MessageID } from "../../i18n/LocaleModel";
import { Portfolio } from "./PortfolioScreenModel";

interface PortfolioPanelProps {
  portfolio: Portfolio;
  isYourPortfolio: boolean;
}

const ProfilePicture: React.FC<{
  profile: Portfolio["profile"];
  className?: string;
}> = ({ profile, className }) => {
  const profilePicture = profile?.pictures?.profile;

  return (
    <div className={cn("flex", "justify-center", className)}>
      {profilePicture ? (
        <img
          className={cn(
            "rounded-full",
            "w-[120px]",
            "h-[120px]",
            "sm:w-[180px]",
            "sm:h-[180px]",
            "object-cover"
          )}
          src={profilePicture}
          alt="profile picture"
        />
      ) : (
        <div
          className={cn(
            "flex",
            "justify-center",
            "items-center",
            "bg-likecoin-secondarygreen",
            "rounded-full",
            "w-[120px]",
            "h-[120px]",
            "sm:w-[180px]",
            "sm:h-[180px]"
          )}
        >
          <Icon
            icon={IconType.Account}
            className={cn("w-11", "h-11", "sm:w-16", "sm:h-16")}
          />
        </div>
      )}
    </div>
  );
};

const CoinsAmountField: React.FC<{
  messageID: MessageID;
  amount: BigNumber;
}> = ({ messageID, amount }) => {
  return (
    <div>
      <p
        className={cn(
          "text-likecoin-lightgreen",
          "text-sm",
          "leading-5",
          "font-medium"
        )}
      >
        <LocalizedText messageID={messageID} />
      </p>
      <p className={cn("text-base", "leading-5", "font-medium")}>
        {convertBigNumberToMillifiedIntegerString(amount)}{" "}
        {Config.chainInfo.currency.coinDenom}
      </p>
    </div>
  );
};

const PortfolioPanel: React.FC<PortfolioPanelProps> = ({
  portfolio,
  isYourPortfolio,
}) => {
  const { translate } = useLocale();

  const onAddressCopied = useCallback(() => {
    toast.success(translate("UserInfoPanel.addressCopied"));
  }, [translate]);

  return (
    <Paper className={cn("py-6", "px-5")}>
      <div className={cn("flex")}>
        <Icon
          className={cn("fill-likecoin-black", "mr-3")}
          icon={isYourPortfolio ? IconType.PieChart : IconType.Account}
          height={20}
          width={20}
        />
        <h2
          className={cn(
            "text-lg",
            "font-bold",
            "leading-5",
            "text-likecoin-black"
          )}
        >
          <LocalizedText
            messageID={
              isYourPortfolio
                ? "PortfolioScreen.yourPortfolio"
                : "PortfolioScreen.account"
            }
          />
        </h2>
      </div>
      <div
        className={cn(
          "mt-11",
          "mb-6",
          "sm:flex",
          "sm:min-w-0",
          "overflow-x-auto"
        )}
      >
        <ProfilePicture
          profile={portfolio.profile}
          className={cn("mb-9", "sm:mb-0", "sm:mr-9")}
        />

        <div className={cn("flex", "flex-col", "items-start", "w-full")}>
          <p className={cn("text-xl", "leading-6", "font-medium", "mb-3")}>
            {portfolio.profile?.dtag ?? truncateAddress(portfolio.address)}
          </p>

          <CopyableText
            className={cn(
              "text-2xs",
              "leading-6",
              "font-medium",
              "text-likecoin-green"
            )}
            containerClassName={cn("shadow-sm", "mb-6")}
            text={portfolio.address}
            onCopied={onAddressCopied}
          />

          <CoinBalanceCard
            balance={portfolio.balance.amount}
            denom={Config.chainInfo.currency.coinDenom}
          />

          <div
            className={cn(
              "mt-3",
              "w-full",
              "grid",
              "grid-cols-[repeat(auto-fill,minmax(100px,1fr))]",
              "gap-y-3"
            )}
          >
            <CoinsAmountField
              messageID="PortfolioScreen.yourPortfolio.stake"
              amount={portfolio.stakedBalance.amount}
            />
            <CoinsAmountField
              messageID="PortfolioScreen.yourPortfolio.unstaking"
              amount={portfolio.unstakingBalance.amount}
            />
            <CoinsAmountField
              messageID="PortfolioScreen.yourPortfolio.commission"
              amount={portfolio.commission.amount}
            />
            <CoinsAmountField
              messageID="PortfolioScreen.yourPortfolio.reward"
              amount={portfolio.reward.amount}
            />
            <CoinsAmountField
              messageID="PortfolioScreen.yourPortfolio.available"
              amount={portfolio.availableBalance.amount}
            />
          </div>
        </div>
      </div>
    </Paper>
  );
};

export default PortfolioPanel;
