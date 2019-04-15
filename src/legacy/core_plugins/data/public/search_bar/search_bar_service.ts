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

// @ts-ignore
import { SearchBar, FilterOptions } from './components';

// @ts-ignore
import { setupDirectives } from './directive';

/**
 * Index Patterns Service
 *
 * The `setup` method of this service returns the public contract for
 * index patterns. Right now these APIs are simply imported from `ui/public`
 * and re-exported here. Once the index patterns code actually moves to
 * this plugin, the imports above can simply be updated to point to their
 * corresponding local directory.
 *
 * @internal
 */
export class SearchBarService {
  public setup() {
    setupDirectives();

    return {
      ui: {
        SearchBar,
      },
      filters: {
        FilterOptions,
      },
    };
  }

  public stop() {
    // nothing to do here yet
  }
}

/** @public */
export type SearchBarSetup = ReturnType<SearchBarService['setup']>;
