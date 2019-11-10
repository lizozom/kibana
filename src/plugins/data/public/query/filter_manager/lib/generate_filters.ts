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

import _ from 'lodash';
import { FilterManager, esFilters, Field } from '../../..';

function getExistingFilter(
  appFilters: esFilters.Filter[],
  fieldName: string,
  value: any
): esFilters.Filter | undefined {
  // TODO: On array fields, negating does not negate the combination, rather all terms
  return _.find(appFilters, function(filter) {
    if (!filter) return;

    if (fieldName === '_exists_' && esFilters.isExistsFilter(filter)) {
      return filter.exists!.field === value;
    }

    if (esFilters.isPhraseFilter(filter)) {
      return (
        esFilters.getPhraseFilterField(filter) === fieldName &&
        esFilters.getPhraseFilterValue(filter) === value
      );
    }

    if (esFilters.isScriptedPhraseFilter(filter)) {
      return filter.meta.field === fieldName && filter.meta.script!.script.params.value === value;
    }
  });
}

function updateExistingFilter(existingFilter: esFilters.Filter, negate: boolean) {
  existingFilter.meta.disabled = false;
  if (existingFilter.meta.negate !== negate) {
    existingFilter.meta.negate = !existingFilter.meta.negate;
  }
}

export function generateFilters(
  filterManager: FilterManager,
  field: Field,
  values: any,
  operation: string,
  index: string
): esFilters.Filter[] {
  values = Array.isArray(values) ? values : [values];
  const fieldName = _.isObject(field) ? field.name : field;
  const newFilters: esFilters.Filter[] = [];
  const appFilters = filterManager.getAppFilters();

  const negate = operation === '-';
  let filter;

  _.each(values, function(value) {
    const existing = getExistingFilter(appFilters, fieldName, value);

    if (existing) {
      updateExistingFilter(existing, negate);
      filter = existing;
    } else {
      const tmpIndexPattern = { id: index };
      switch (fieldName) {
        case '_exists_':
          filter = esFilters.buildExistsFilter(
            {
              name: value,
            },
            tmpIndexPattern
          );
          break;
        default:
          filter = esFilters.buildPhraseFilter(field, value, tmpIndexPattern);
          break;
      }

      filter.meta.negate = negate;
    }

    newFilters.push(filter);
  });

  return newFilters;
}
