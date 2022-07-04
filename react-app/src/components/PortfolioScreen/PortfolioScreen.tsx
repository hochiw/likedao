import React, { useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import cn from "classnames";
import { useNavigate, useParams } from "react-router-dom";
import { useEffectOnce } from "../../hooks/useEffectOnce";
import {
  isRequestStateError,
  isRequestStateLoaded,
} from "../../models/RequestState";
import LoadingSpinner from "../common/LoadingSpinner/LoadingSpinner";
import { useLocale } from "../../providers/AppLocaleProvider";
import { ConnectionStatus, useWallet } from "../../providers/WalletProvider";
import AppRoutes from "../../navigation/AppRoutes";
import { usePortfolioQuery } from "./PortfolioScreenAPI";
import PortfolioPanel from "./PortfolioPanel";
import StakesPanel from "./StakesPanel";

const PortfolioScreen: React.FC = () => {
  const { address } = useParams();
  const navigate = useNavigate();

  const { requestState, fetch, stakesOrder, setStakesOrder } =
    usePortfolioQuery();

  const { translate } = useLocale();
  const wallet = useWallet();

  const isYourPortfolio = useMemo(() => !address, [address]);

  useEffectOnce(
    () => {
      if (wallet.status === ConnectionStatus.Idle && !address) {
        wallet.openConnectWalletModal();
      } else if (isRequestStateError(requestState)) {
        if (requestState.error.message === "Invalid address") {
          navigate(AppRoutes.ErrorInvalidAddress);
        } else {
          toast.error(translate("PortfolioScreen.requestState.error"));
        }
      }
    },
    () =>
      isRequestStateError(requestState) || isRequestStateLoaded(requestState)
  );

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    fetch(address);
  }, [address, fetch]);

  if (!isRequestStateLoaded(requestState)) {
    return (
      <div className={cn("flex", "justify-center", "items-center", "h-full")}>
        <LoadingSpinner />
      </div>
    );
  }

  const { portfolio, stakes } = requestState.data;

  return (
    <div className={cn("flex", "flex-col")}>
      <PortfolioPanel portfolio={portfolio} isYourPortfolio={isYourPortfolio} />
      <StakesPanel
        stakes={stakes}
        isYourPortfolio={isYourPortfolio}
        order={stakesOrder}
        setOrder={setStakesOrder}
      />
    </div>
  );
};

export default PortfolioScreen;
