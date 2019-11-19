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

import { IFieldType, IIndexPattern, esFilters } from '../..';
import { Operator } from './filter_operators';

export function buildFilter(
  indexPattern: IIndexPattern,
  field: IFieldType,
  operator: Operator,
  disabled: boolean,
  params: any,
  alias: string | null,
  store: esFilters.FilterStateStore
): esFilters.Filter {
  const filter = buildBaseFilter(indexPattern, field, operator, params);
  filter.meta.alias = alias;
  filter.meta.negate = operator.negate;
  filter.meta.disabled = disabled;
  filter.$state = { store };
  return filter;
}

function buildBaseFilter(
  indexPattern: IIndexPattern,
  field: IFieldType,
  operator: Operator,
  params: any
): esFilters.Filter {
  switch (operator.type) {
    case 'phrase':
      return esFilters.buildPhraseFilter(field, params, indexPattern);
    case 'phrases':
      return esFilters.buildPhrasesFilter(field, params, indexPattern);
    case 'range':
      const newParams = { gte: params.from, lt: params.to };
      return esFilters.buildRangeFilter(field, newParams, indexPattern);
    case 'exists':
      return esFilters.buildExistsFilter(field, indexPattern);
    default:
      throw new Error(`Unknown operator type: ${operator.type}`);
  }
}

export function buildCustomFilter(
  index: string,
  queryDsl: any,
  disabled: boolean,
  negate: boolean,
  alias: string | null,
  store: esFilters.FilterStateStore
): esFilters.Filter {
  const meta: esFilters.FilterMeta = { index, type: 'custom', disabled, negate, alias };
  const filter: esFilters.Filter = { ...queryDsl, meta };
  filter.$state = { store };
  return filter;
}
