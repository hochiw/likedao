import { useCallback, useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { useQueryClient } from "../../providers/QueryClientProvider";
import { ConnectionStatus, useWallet } from "../../providers/WalletProvider";
import { useStakingAPI } from "../../api/stakingAPI";
import {
  isRequestStateLoaded,
  RequestState,
  RequestStateError,
  RequestStateInitial,
  RequestStateLoaded,
  RequestStateLoading,
} from "../../models/RequestState";
import { useDistributionAPI } from "../../api/distributionAPI";
import * as Table from "../common/Table";
import { useBankAPI } from "../../api/bankAPI";
import {
  calculateValidatorExpectedReturn,
  calculateValidatorVotingPower,
} from "../../models/validator";
import PortfolioScreenModel, {
  Portfolio,
  StakedValidatorInfo,
} from "./PortfolioScreenModel";

type PortfolioScreenRequestState = RequestState<PortfolioScreenModel>;

export const usePortfolioQuery = (): {
  requestState: PortfolioScreenRequestState;
  fetch: (address?: string) => Promise<void>;
  stakesOrder: Table.ColumnOrder;
  setStakesOrder: (order: Table.ColumnOrder) => void;
} => {
  const [requestState, setRequestState] =
    useState<PortfolioScreenRequestState>(RequestStateInitial);

  const wallet = useWallet();
  const bankAPI = useBankAPI();
  const stakingAPI = useStakingAPI();
  const distribution = useDistributionAPI();
  const { query } = useQueryClient();

  const [stakesOrder, setStakesOrder] = useState({
    id: "name",
    direction: "asc" as Table.ColumnOrder["direction"],
  });

  const isValidAddress = useCallback(
    async (address: string) => {
      try {
        const account = await query.auth.account(address);
        return account != null;
      } catch {
        return false;
      }
    },
    [query]
  );

  const fetchAddressPortfolio = useCallback<
    (address: string) => Promise<Portfolio>
  >(
    async (address) => {
      const [
        availableBalance,
        stakedBalance,
        unstakingBalance,
        commission,
        reward,
      ] = await Promise.all([
        bankAPI.getAddressBalance(address),
        stakingAPI.getAddressStakedBalance(address),
        stakingAPI.getUnstakingAmount(address),
        distribution.getAddressTotalCommission(address),
        distribution.getAddressTotalDelegationRewards(address),
      ]);

      const balance = {
        amount: BigNumber.sum(
          availableBalance.amount,
          stakedBalance.amount,
          unstakingBalance.amount
        ),
        denom: availableBalance.denom,
      };

      return {
        balance,
        stakedBalance,
        unstakingBalance,
        availableBalance,
        commission,
        reward,
        address,
      };
    },
    [bankAPI, stakingAPI, distribution]
  );

  const fetchStakes = useCallback(
    async (address: string) => {
      // get stakes amount and validator address of each delegation
      const delegations = await stakingAPI.getDelegatorStakes(address);

      // get rewards of each delegations
      const validatorAddresses = delegations.map(
        (delegation) => delegation.delegation.validatorAddress
      );

      const [annualProvisions, stakingPool, rewards, validators] =
        await Promise.all([
          query.mint.annualProvisions(),
          stakingAPI.getPool(),
          distribution.getDelegationRewardsByValidators(
            address,
            validatorAddresses
          ),
          stakingAPI.getValidators(validatorAddresses),
        ]);

      const calculatedValidatorInfo = validators.map((validator) => {
        return {
          expectedReturn: calculateValidatorExpectedReturn(
            annualProvisions,
            stakingPool,
            validator
          ),
          votingPower: calculateValidatorVotingPower(
            stakingPool,
            new BigNumber(validator.tokens)
          ),
        };
      });

      // merge stakes and delegation rewards into stake entries
      const stakeEntries: StakedValidatorInfo[] = delegations.map(
        (delegation, i) => ({
          ...delegation,
          reward: rewards[i],
          validator: validators[i],
          expectedReturn: calculatedValidatorInfo[i].expectedReturn,
          votingPower: calculatedValidatorInfo[i].votingPower,
        })
      );

      return stakeEntries;
    },
    [distribution, query.mint, stakingAPI]
  );

  const fetch = useCallback(
    async (address?: string) => {
      setRequestState(RequestStateLoading);

      try {
        if (address) {
          if (!(await isValidAddress(address))) {
            throw new Error("Invalid address");
          }
          const portfolio = await fetchAddressPortfolio(address);
          const stakes = await fetchStakes(address);
          setRequestState(
            RequestStateLoaded({ portfolio, stakedValidatorInfo: stakes })
          );
        } else {
          if (wallet.status !== ConnectionStatus.Connected) {
            throw new Error("Wallet not connected.");
          }
          const portfolio = await fetchAddressPortfolio(wallet.account.address);
          const stakes = await fetchStakes(wallet.account.address);
          setRequestState(
            RequestStateLoaded({ portfolio, stakedValidatorInfo: stakes })
          );
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setRequestState(RequestStateError(err));
        }
        console.error("Failed to handle fetch portfolio error =", err);
      }
    },
    [fetchAddressPortfolio, fetchStakes, isValidAddress, wallet]
  );

  const requestStateSorted = useMemo(() => {
    if (!isRequestStateLoaded(requestState)) {
      return requestState;
    }
    return RequestStateLoaded({
      ...requestState.data,
      // eslint-disable-next-line complexity
      stakes: requestState.data.stakedValidatorInfo.sort((a, b) => {
        const direction = stakesOrder.direction === "asc" ? 1 : -1;
        switch (stakesOrder.id) {
          case "name":
            return (
              a.validator.description!.moniker.localeCompare(
                b.validator.description!.moniker
              ) * direction
            );
          case "staked":
            return (
              a.balance.amount.minus(b.balance.amount).toNumber() * direction
            );
          case "rewards":
            return (
              a.reward.amount.minus(b.reward.amount).toNumber() * direction
            );
          case "expectedReturns":
            return (a.expectedReturn - b.expectedReturn) * direction;
          case "votingPower":
            return (a.votingPower - b.votingPower) * direction;
          default:
            return 1;
        }
      }),
    });
  }, [stakesOrder.direction, stakesOrder.id, requestState]);

  return {
    requestState: requestStateSorted,
    fetch,
    stakesOrder,
    setStakesOrder,
  };
};
