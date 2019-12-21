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

// /// Define plugin function
import { DataPlugin as Plugin, DataSetup, DataStart } from './plugin';

export function plugin() {
  return new Plugin();
}

// /// Export types & static code

/** @public types */
export { DataSetup, DataStart };

export { Field, FieldType, IFieldList, IndexPattern } from './index_patterns';
export { EsQuerySortValue, FetchOptions, ISearchSource, SortDirection } from './search/types';
export { SearchSourceFields } from './search/types';
export {
  SavedQueryAttributes,
  SavedQuery,
  SavedQueryTimeFilter,
} from '../../../../plugins/data/public';

/** @public static code */
export * from '../common';
export { FilterStateManager } from './filter/filter_manager';
export { getFromSavedObject, getRoutes, flattenHitWrapper } from './index_patterns';
export {
  defaultSearchStrategy,
  getRequestInspectorStats,
  getResponseInspectorStats,
} from './search';
