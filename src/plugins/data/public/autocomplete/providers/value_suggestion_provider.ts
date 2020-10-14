/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { CoreSetup } from 'src/core/public';
import { map, catchError, tap, share } from 'rxjs/operators';
import { combineLatest, Observable, of } from 'rxjs';
import { SearchResponse } from 'elasticsearch';
import { flatten } from 'lodash';
import { getQueryService, getSearchService, getUiSettings } from '../../services';
import {
  IIndexPattern,
  IFieldType,
  UI_SETTINGS,
  buildEsQuery,
  getEsQueryConfig,
} from '../../../common';

export type ValueSuggestionsGetFn = (args: ValueSuggestionsGetFnArgs) => Observable<any[]>;

interface ValueSuggestionsGetFnArgs {
  indexPattern: IIndexPattern;
  field: IFieldType;
  query: string;
  boolFilter?: any[];
  signal?: AbortSignal;
}

export const getEmptyValueSuggestions = (() => of([])) as ValueSuggestionsGetFn;

function getTermsAggRequest(
  index: string,
  field: IFieldType,
  query: any,
  timeFieldName: string | undefined
) {
  // Helps ensure that the regex is not evaluated eagerly against the terms dictionary
  const executionHint = 'map';
  // We don't care about the accuracy of the counts, just the content of the terms, so this reduces
  // the amount of information that needs to be transmitted to the coordinating node
  const shardSize = 10;

  return {
    params: {
      index,
      body: {
        size: 0,
        sort: [...(timeFieldName ? [{ [timeFieldName]: { order: 'desc' } }] : [])],
        aggs: {
          suggestions: {
            terms: {
              field: field.name,
              // include: `${query}.*`,
              execution_hint: executionHint,
              shard_size: shardSize,
            },
          },
        },
        query,
      },
    },
  };
}

function getLatestRequest(
  index: string,
  field: IFieldType,
  query: any,
  timeFieldName: string | undefined
) {
  return {
    params: {
      index,
      body: {
        size: 50,
        sort: [...(timeFieldName ? [{ [timeFieldName]: { order: 'desc' } }] : [])],
        docvalue_fields: [field.name],
        _source: false,
        query,
      },
    },
  };
}

const fetchSuggestions = (
  index: string,
  field: IFieldType,
  query: any,
  timeFieldName: string | undefined,
  signal?: AbortSignal
): Observable<any[]> => {
  const termsRequest = getTermsAggRequest(index, field, query, timeFieldName);
  const latestRequest = getLatestRequest(index, field, query, timeFieldName);
  const termsAgg$ = getSearchService()
    .search(termsRequest, { abortSignal: signal })
    .pipe(
      share(),
      tap((r) => {
        console.log('terms', r);
      }),
      map((response) => response.rawResponse?.aggregations?.suggestions?.buckets || []),
      catchError(() => of([])),
      map((suggestionTerms) => suggestionTerms.map((item: any) => item.key))
    );

  const latest$ = getSearchService()
    .search(latestRequest, { abortSignal: signal })
    .pipe(
      share(),
      tap((r) => {
        console.log('latest', r);
      }),
      map((response) => response.rawResponse?.hits?.hits || []),
      catchError(() => of([])),
      map((suggestionTerms: SearchResponse<any>['hits']['hits']) => {
        return flatten(suggestionTerms.map((item: any) => item.fields[field.name]));
      })
    );

  return combineLatest([latest$, termsAgg$]);
};

export const setupValueSuggestionProvider = (core: CoreSetup): ValueSuggestionsGetFn => {
  return ({
    indexPattern,
    field,
    query,
    boolFilter,
    signal,
  }: ValueSuggestionsGetFnArgs): Observable<any[]> => {
    const shouldSuggestValues = core!.uiSettings.get<boolean>(
      UI_SETTINGS.FILTERS_EDITOR_SUGGEST_VALUES
    );
    const { title, timeFieldName } = indexPattern;

    if (field.type === 'boolean') {
      return of([true, false]);
    } else if (!shouldSuggestValues || !field.aggregatable || field.type !== 'string') {
      return of([]);
    }

    const timeFilter = getQueryService().timefilter.timefilter.createFilter(indexPattern);
    const queryState = buildEsQuery(
      indexPattern,
      {
        query,
        language: 'kuery',
      },
      [...(boolFilter ? boolFilter : []), ...(timeFilter ? [timeFilter] : [])],
      getEsQueryConfig(getUiSettings())
    );

    return fetchSuggestions(title, field, queryState, timeFieldName, signal);
  };
};
