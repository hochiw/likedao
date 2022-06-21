package resolvers

// This file will be automatically regenerated based on the schema, any resolver implementations
// will be copied through when generating and any unknown code will be moved to the end.

import (
	"context"
	"fmt"
	"strconv"

	pkgContext "github.com/oursky/likedao/pkg/context"
	servererrors "github.com/oursky/likedao/pkg/errors"
	graphql1 "github.com/oursky/likedao/pkg/generated/graphql"
	"github.com/oursky/likedao/pkg/models"
	gql_bigint "github.com/xplorfin/gql-bigint"
)

func (r *proposalResolver) ProposalID(ctx context.Context, obj *models.Proposal) (int, error) {
	return obj.ID, nil
}

func (r *proposalResolver) Type(ctx context.Context, obj *models.Proposal) (models.ProposalType, error) {
	proposalType := new(models.ProposalType)
	err := proposalType.UnmarshalGQL(obj.ProposalType)
	if err != nil {
		return "", nil
	}

	return *proposalType, nil
}

func (r *proposalResolver) DepositTotal(ctx context.Context, obj *models.Proposal) (gql_bigint.BigInt, error) {
	config := pkgContext.GetConfigFromCtx(ctx)
	res, err := pkgContext.GetQueriesFromCtx(ctx).Proposal.QueryProposalDepositTotal(obj.ID, config.Chain.CoinDenom)
	if err != nil {
		return 0, err
	}
	return gql_bigint.BigInt(res.ToInt64()), nil
}

func (r *proposalResolver) TallyResult(ctx context.Context, obj *models.Proposal) (*models.ProposalTallyResult, error) {
	if obj.Status == models.ProposalStatusFailed || obj.Status == models.ProposalStatusInvalid || obj.Status == models.ProposalStatusDepositPeriod {
		return nil, nil
	}

	tally, err := pkgContext.GetDataLoadersFromCtx(ctx).Proposal.LoadProposalTallyResult(obj.ID)
	if err != nil {
		return nil, servererrors.QueryError.NewError(ctx, fmt.Sprintf("failed to load proposal tally result: %v", err))
	}
	return tally, nil
}

func (r *proposalTallyResultResolver) Yes(ctx context.Context, obj *models.ProposalTallyResult) (gql_bigint.BigInt, error) {
	if obj.Yes == nil {
		return 0, nil
	}
	return gql_bigint.BigInt(obj.Yes.ToInt64()), nil
}

func (r *proposalTallyResultResolver) No(ctx context.Context, obj *models.ProposalTallyResult) (gql_bigint.BigInt, error) {
	if obj.No == nil {
		return 0, nil
	}
	return gql_bigint.BigInt(obj.No.ToInt64()), nil
}

func (r *proposalTallyResultResolver) NoWithVeto(ctx context.Context, obj *models.ProposalTallyResult) (gql_bigint.BigInt, error) {
	if obj.NoWithVeto == nil {
		return 0, nil
	}
	return gql_bigint.BigInt(obj.NoWithVeto.ToInt64()), nil
}

func (r *proposalTallyResultResolver) Abstain(ctx context.Context, obj *models.ProposalTallyResult) (gql_bigint.BigInt, error) {
	if obj.Abstain == nil {
		return 0, nil
	}
	return gql_bigint.BigInt(obj.Abstain.ToInt64()), nil
}

func (r *proposalTallyResultResolver) OutstandingOption(ctx context.Context, obj *models.ProposalTallyResult) (*models.ProposalVoteOption, error) {
	option := new(models.ProposalVoteOption)
	var votes = int64(0)

	// FIXME: Improve this handling
	if obj.Yes != nil && obj.Yes.ToInt64() > votes {
		*option = models.ProposalVoteOptionYes
		votes = obj.Yes.ToInt64()
	}

	if obj.No != nil && obj.No.ToInt64() > votes {
		*option = models.ProposalVoteOptionNo
		votes = obj.No.ToInt64()
	}

	if obj.NoWithVeto != nil && obj.NoWithVeto.ToInt64() > votes {
		*option = models.ProposalVoteOptionNoWithVeto
		votes = obj.NoWithVeto.ToInt64()
	}

	if obj.Abstain != nil && obj.Abstain.ToInt64() > votes {
		*option = models.ProposalVoteOptionAbstain
	}

	// All the votes are the same, no outstanding option
	if *option == "" {
		return nil, nil
	}

	return option, nil
}

func (r *queryResolver) Proposals(ctx context.Context, input models.QueryProposalsInput) (*models.Connection[models.Proposal], error) {
	proposalQuery := pkgContext.GetQueriesFromCtx(ctx).Proposal
	if input.FollowingAddress != nil && *input.FollowingAddress != "" {
		proposalQuery = proposalQuery.ScopeRelatedAddress(*input.FollowingAddress)
	} else if input.Filter != nil {
		proposalQuery = proposalQuery.ScopeProposalStatus((*input.Filter).ToProposalStatus())
	}

	res, err := proposalQuery.QueryPaginatedProposals(input.First, input.After)
	if err != nil {
		return nil, servererrors.QueryError.NewError(ctx, fmt.Sprintf("failed to load proposals: %v", err))
	}
	proposalCursorMap := make(map[int]string)
	for index, proposal := range res.Items {
		cursorString := strconv.Itoa(input.After + index + 1)
		proposalCursorMap[proposal.ID] = cursorString
	}

	conn := models.NewConnection(res.Items, func(model models.Proposal) string {
		return proposalCursorMap[model.ID]
	})
	conn.TotalCount = res.PaginationInfo.TotalCount
	conn.PageInfo.HasNextPage = res.PaginationInfo.HasNext
	conn.PageInfo.HasPreviousPage = res.PaginationInfo.HasPrevious

	return &conn, nil
}

func (r *queryResolver) ProposalByID(ctx context.Context, id models.NodeID) (*models.Proposal, error) {
	res, err := pkgContext.GetDataLoadersFromCtx(ctx).Proposal.Load(id.ID)
	if err != nil {
		return nil, err
	}
	return res, nil
}

// Proposal returns graphql1.ProposalResolver implementation.
func (r *Resolver) Proposal() graphql1.ProposalResolver { return &proposalResolver{r} }

// ProposalTallyResult returns graphql1.ProposalTallyResultResolver implementation.
func (r *Resolver) ProposalTallyResult() graphql1.ProposalTallyResultResolver {
	return &proposalTallyResultResolver{r}
}

type proposalResolver struct{ *Resolver }
type proposalTallyResultResolver struct{ *Resolver }