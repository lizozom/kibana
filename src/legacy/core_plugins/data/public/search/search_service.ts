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

import { Plugin, CoreSetup, CoreStart } from '../../../../../core/public';
import { SearchSource } from './search_source';
import { defaultSearchStrategy, SearchStrategyRegistry } from './search_strategy';

export interface SearchSetup {
  strategies: SearchStrategyRegistry;
}

export interface SearchStart {
  SearchSource: typeof SearchSource;
  strategies: SearchStrategyRegistry;
}

/**
 * The contract provided here is a new platform shim for ui/courier.
 *
 * Once it has been refactored to work with new platform services,
 * it will move into the existing search service in src/plugins/data/public/search
 */
export class SearchService implements Plugin<SearchSetup, SearchStart> {
  private readonly searchStrategyRegistry = new SearchStrategyRegistry();

  public setup(core: CoreSetup): SearchSetup {
    this.searchStrategyRegistry.addSearchStrategy(defaultSearchStrategy);

    return {
      strategies: this.searchStrategyRegistry,
    };
  }

  public start(core: CoreStart): SearchStart {
    return {
      SearchSource,
      strategies: this.searchStrategyRegistry,
    };
  }

  public stop() {}
}
