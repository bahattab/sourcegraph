import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { createAggregateError } from '../../../shared/src/errors'
import { gql } from '../../../shared/src/graphql'
import * as GQL from '../../../shared/src/graphqlschema'
import { queryGraphQL } from '../backend/graphql'

/**
 * Fetches symbols.
 */
export function fetchSymbols(
    repo: GQL.ID,
    rev: string,
    args: { first?: number; query?: string }
): Observable<GQL.ISymbolConnection> {
    return queryGraphQL(
        gql`
            query Symbols($repo: ID!, $rev: String!, $first: Int, $query: String) {
                node(id: $repo) {
                    ... on Repository {
                        commit(rev: $rev) {
                            symbols(first: $first, query: $query) {
                                pageInfo {
                                    hasNextPage
                                }
                                nodes {
                                    name
                                    containerName
                                    kind
                                    language
                                    location {
                                        resource {
                                            path
                                        }
                                        range {
                                            start {
                                                line
                                                character
                                            }
                                            end {
                                                line
                                                character
                                            }
                                        }
                                    }
                                    url
                                }
                            }
                        }
                    }
                }
            }
        `,
        { ...args, repo, rev }
    ).pipe(
        map(({ data, errors }) => {
            if (
                !data ||
                !data.node ||
                !(data.node as GQL.IRepository).commit ||
                !(data.node as GQL.IRepository).commit!.symbols ||
                !(data.node as GQL.IRepository).commit!.symbols.nodes
            ) {
                throw createAggregateError(errors)
            }
            return (data.node as GQL.IRepository).commit!.symbols
        })
    )
}
