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

/**
 * Nothing to see here!
 *
 * Courier / SearchSource has moved to the data plugin, and is being
 * re-exported from ui/courier for backwards compatibility.
 */

import { start as dataStart } from '../../../core_plugins/data/public/legacy';

// runtime contracts
export const { defaultSearchStrategy, SearchSource } = dataStart.search;

// types
export {
  ISearchSource,
  EsQuerySortValue, // used externally by Discover
  FetchOptions, // used externally by AggTypes
  SortDirection, // used externally by Discover
} from '../../../core_plugins/data/public';

// static code
export {
  getRequestInspectorStats,
  getResponseInspectorStats,
} from '../../../core_plugins/data/public';
