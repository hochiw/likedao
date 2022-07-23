import {
  BondStatus,
  Description,
} from "cosmjs-types/cosmos/staking/v1beta1/staking";
import { YourStake } from "../../models/validator";

export interface Validator {
  operatorAddress: string;
  jailed: boolean;
  status: BondStatus;
  description: Description;
  votingPower: number;
  uptime: number;
  expectedReturn: number;
  participatedProposalCount: number;
  relativeTotalProposalCount: number;
}

export interface AggregatedValidator {
  validator: Validator;
  stake: YourStake | null;
}

export interface ValidatorScreenModel {
  aggregatedValidators: AggregatedValidator[];
}
