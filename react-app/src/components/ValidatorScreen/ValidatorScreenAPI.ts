import { useCallback, useState } from "react";
import { isAfter } from "date-fns";
import BigNumber from "bignumber.js";
import { useDistributionAPI } from "../../api/distributionAPI";
import { useGovAPI } from "../../api/govAPI";
import { useSlashingAPI } from "../../api/slashingAPI";
import { useStakingAPI } from "../../api/stakingAPI";
import {
  RequestState,
  RequestStateInitial,
  RequestStateLoaded,
  RequestStateLoading,
  RequestStateError,
} from "../../models/RequestState";
import { useQueryClient } from "../../providers/QueryClientProvider";
import { useWallet, ConnectionStatus } from "../../providers/WalletProvider";
import { convertTimestampToDate } from "../../utils/datetime";
import { pubKeyToBech32, translateAddress } from "../../utils/address";
import Config from "../../config/Config";
import {
  calculateValidatorExpectedReturn,
  calculateValidatorUptime,
  calculateValidatorVotingPower,
} from "../../models/validator";
import {
  AggregatedValidator,
  Validator,
  ValidatorScreenModel,
} from "./ValidatorScreenModel";

export type FilterKey = "all" | "active" | "inactive";

export const useValidatorsQuery = (): {
  fetch: () => Promise<void>;
  requestState: RequestState<ValidatorScreenModel>;
} => {
  const [requestState, setRequestState] =
    useState<RequestState<ValidatorScreenModel>>(RequestStateInitial);
  const wallet = useWallet();
  const stakingAPI = useStakingAPI();
  const slashingAPI = useSlashingAPI();
  const distributionAPI = useDistributionAPI();
  const govAPI = useGovAPI();
  const { query, stargateQuery } = useQueryClient();

  const fetch = useCallback(async () => {
    setRequestState(RequestStateLoading);
    try {
      const walletConnected = wallet.status === ConnectionStatus.Connected;

      const [
        currentBlockHeight,
        validators,
        proposals,
        annualProvisions,
        stakingPool,
      ] = await Promise.all([
        stargateQuery.getHeight(),
        stakingAPI.getAllValidators(),
        govAPI.getAllProposals(),
        query.mint.annualProvisions(),
        stakingAPI.getPool(),
      ]);

      const aggregatedValidatorsPromises = validators
        .filter((validator) => validator.consensusPubkey != null)
        .map<Promise<AggregatedValidator>>(async (validator) => {
          const consensusPubAddr = pubKeyToBech32(
            validator.consensusPubkey!,
            Config.chainInfo.bech32Config.bech32PrefixConsAddr
          );

          const selfDelegationAddress = translateAddress(
            validator.operatorAddress,
            Config.chainInfo.bech32Config.bech32PrefixAccAddr
          );

          const [participatedProposals, stake, reward, signingInfo] =
            await Promise.all([
              govAPI.getParticipatedProposals(selfDelegationAddress),
              walletConnected
                ? stakingAPI.getDelegation(
                    wallet.account.address,
                    validator.operatorAddress
                  )
                : Promise.resolve(null),
              walletConnected
                ? distributionAPI.getDelegationRewardsByValidator(
                    wallet.account.address,
                    validator.operatorAddress
                  )
                : Promise.resolve(null),
              slashingAPI.getSigningInfo(consensusPubAddr),
            ]);

          let relativeProposals = proposals;
          const startHeight = signingInfo.startHeight.toNumber();

          // Adjust the total nunber of proposals based on the starting time of the validator
          if (startHeight !== 0) {
            const startBlock = await stargateQuery.getBlock(startHeight);
            const startTime = new Date(startBlock.header.time);

            relativeProposals = proposals.filter((proposal) => {
              if (!proposal.votingEndTime) {
                return false;
              }
              const votingEndTime = convertTimestampToDate(
                proposal.votingEndTime
              );
              return isAfter(votingEndTime, startTime);
            });
          }

          const votingPower = calculateValidatorVotingPower(
            stakingPool,
            new BigNumber(validator.tokens)
          );

          const uptime = calculateValidatorUptime(
            signingInfo,
            currentBlockHeight
          );

          const expectedReturn = calculateValidatorExpectedReturn(
            annualProvisions,
            stakingPool,
            validator
          );
          const aggregatedValidator: Validator = {
            operatorAddress: validator.operatorAddress,
            jailed: validator.jailed,
            status: validator.status,
            description: validator.description!,
            votingPower,
            uptime,
            expectedReturn,
            participatedProposalCount: participatedProposals.length,
            relativeTotalProposalCount: relativeProposals.length,
          };

          return {
            validator: aggregatedValidator,
            stake:
              stake !== null && reward !== null ? { ...stake, reward } : null,
          };
        });

      const aggregatedValidators = await Promise.all(
        aggregatedValidatorsPromises
      );

      setRequestState(
        RequestStateLoaded({
          aggregatedValidators,
        })
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        setRequestState(RequestStateError(err));
      } else {
        console.error(
          "Unexpected error occurred when fetching validators = ",
          err
        );
        setRequestState(RequestStateError(new Error("Unknown error")));
      }
    }
  }, [
    distributionAPI,
    govAPI,
    query.mint,
    slashingAPI,
    stakingAPI,
    stargateQuery,
    wallet,
  ]);

  return {
    fetch,
    requestState,
  };
};
