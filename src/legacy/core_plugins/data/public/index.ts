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

import { IndexPatternsService } from './index_patterns';

import { SearchBarService } from './search_bar';

import { FilterManagerProviderService } from './filter_manager';

class DataService {
  private readonly indexPatterns: IndexPatternsService;
  private readonly searchBar: SearchBarService;
  private readonly filterManagerProvider: FilterManagerProviderService;

  constructor() {
    this.indexPatterns = new IndexPatternsService();
    this.searchBar = new SearchBarService();
    this.filterManagerProvider = new FilterManagerProviderService();
  }

  public setup() {
    return {
      indexPatterns: this.indexPatterns.setup(),
      searchBar: this.searchBar.setup(),
      filterManager: this.filterManagerProvider.setup(),
    };
  }

  public stop() {
    this.indexPatterns.stop();
    this.searchBar.stop();
    this.filterManagerProvider.stop();
  }
}

/**
 * We temporarily export default here so that users importing from 'plugins/data'
 * will automatically receive the response value of the `setup` contract, mimicking
 * the data that will eventually be injected by the new platform.
 */
// eslint-disable-next-line import/no-default-export
const data = new DataService().setup();
export { data };

/** @public */
export type DataSetup = ReturnType<DataService['setup']>;
