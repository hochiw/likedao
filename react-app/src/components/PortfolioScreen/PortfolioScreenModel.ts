import {
  Delegation,
  Validator as RPCValidator,
} from "cosmjs-types/cosmos/staking/v1beta1/staking";
import { BigNumberCoin } from "../../models/coin";
import { ProposalHistory } from "../ProposalHistory/ProposalHistoryModel";

export interface StakedValidatorInfo {
  reward: BigNumberCoin;
  delegation: Delegation;
  balance: BigNumberCoin;
  validator: RPCValidator;
  expectedReturn: number;
  votingPower: number;
}

export interface Portfolio {
  balance: BigNumberCoin;
  stakedBalance: BigNumberCoin;
  unstakingBalance: BigNumberCoin;
  availableBalance: BigNumberCoin;
  commission: BigNumberCoin;
  reward: BigNumberCoin;
  address: string;
}

export interface PortfolioScreenGraphql extends ProposalHistory {}

export default interface PortfolioScreenModel {
  portfolio: Portfolio;
  stakedValidatorInfo: StakedValidatorInfo[];
}
