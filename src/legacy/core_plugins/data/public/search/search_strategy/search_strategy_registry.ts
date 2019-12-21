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

import { IndexPattern } from '../../../../../../plugins/data/public';
import { SearchStrategyProvider } from './types';
import { noOpSearchStrategy } from './no_op_search_strategy';
import { SearchResponse } from '../types';

export class SearchStrategyRegistry {
  private readonly searchStrategies: SearchStrategyProvider[] = [];

  getAll = (): SearchStrategyProvider[] => {
    return this.searchStrategies.map(strategy => Object.freeze(strategy));
  };

  addSearchStrategy = (searchStrategy: SearchStrategyProvider) => {
    if (this.searchStrategies.includes(searchStrategy)) {
      return;
    }

    this.searchStrategies.push(searchStrategy);
  };

  getSearchStrategyByViability = (indexPattern: IndexPattern) => {
    return this.searchStrategies.find(searchStrategy => {
      return searchStrategy.isViable(indexPattern);
    });
  };

  getSearchStrategyById = (searchStrategyId: string) => {
    return [...this.searchStrategies, noOpSearchStrategy].find(searchStrategy => {
      return searchStrategy.id === searchStrategyId;
    });
  };

  getSearchStrategyForSearchRequest = (
    searchRequest: SearchResponse,
    { searchStrategyId }: { searchStrategyId?: string } = {}
  ) => {
    // Allow the searchSource to declare the correct strategy with which to execute its searches.
    if (searchStrategyId != null) {
      const strategy = this.getSearchStrategyById(searchStrategyId);
      if (!strategy) throw Error(`No strategy with ID ${searchStrategyId}`);
      return strategy;
    }

    // Otherwise try to match it to a strategy.
    const viableSearchStrategy = this.getSearchStrategyByViability(searchRequest.index);

    if (viableSearchStrategy) {
      return viableSearchStrategy;
    }

    // This search strategy automatically rejects with an error.
    return noOpSearchStrategy;
  };

  hasSearchStrategyForIndexPattern = (indexPattern: IndexPattern) => {
    return Boolean(this.getSearchStrategyByViability(indexPattern));
  };

  /**
   * Here for BWC only; deprecated due to typo in the method name.
   *
   * @deprecated
   */
  hasSearchStategyForIndexPattern = this.hasSearchStrategyForIndexPattern;
}
