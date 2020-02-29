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

import { PluginInitializerContext } from '../../../../../core/server';
import { EsSearchService } from './es_search_service';

export { ES_SEARCH_STRATEGY, IEsSearchRequest, IEsSearchResponse } from '../../../common/search';
export { getDefaultSearchParams } from './get_default_search_params';

export function esSearchService(initializerContext: PluginInitializerContext) {
  return new EsSearchService(initializerContext);
}
