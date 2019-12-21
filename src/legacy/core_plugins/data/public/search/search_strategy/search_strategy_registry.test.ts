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
import { noOpSearchStrategy } from './no_op_search_strategy';
import { SearchStrategyRegistry } from './search_strategy_registry';
import { SearchStrategyProvider } from './types';

const mockSearchStrategies: SearchStrategyProvider[] = [
  {
    id: '0',
    isViable: (index: IndexPattern) => index.id === '0',
    search: () => ({
      searching: Promise.resolve([]),
      abort: () => void 0,
    }),
  },
  {
    id: '1',
    isViable: (index: IndexPattern) => index.id === '1',
    search: () => ({
      searching: Promise.resolve([]),
      abort: () => void 0,
    }),
  },
];

let strategies: SearchStrategyRegistry;

describe('Search strategy registry', () => {
  beforeEach(() => {
    strategies = new SearchStrategyRegistry();
  });

  describe('addSearchStrategy', () => {
    it('adds a search strategy', () => {
      strategies.addSearchStrategy(mockSearchStrategies[0]);
      expect(strategies.getAll().length).toBe(1);
    });

    it('does not add a search strategy if it is already included', () => {
      strategies.addSearchStrategy(mockSearchStrategies[0]);
      strategies.addSearchStrategy(mockSearchStrategies[0]);
      expect(strategies.getAll().length).toBe(1);
    });
  });

  describe('getSearchStrategyByViability', () => {
    beforeEach(() => {
      mockSearchStrategies.forEach(strategies.addSearchStrategy);
    });

    it('returns the viable strategy', () => {
      expect(strategies.getSearchStrategyByViability({ id: '0' } as IndexPattern)).toBe(
        mockSearchStrategies[0]
      );
      expect(strategies.getSearchStrategyByViability({ id: '1' } as IndexPattern)).toBe(
        mockSearchStrategies[1]
      );
    });

    it('returns undefined if there is no viable strategy', () => {
      expect(strategies.getSearchStrategyByViability({ id: '-1' } as IndexPattern)).toBe(undefined);
    });
  });

  describe('getSearchStrategyById', () => {
    beforeEach(() => {
      mockSearchStrategies.forEach(strategies.addSearchStrategy);
    });

    it('returns the strategy by ID', () => {
      expect(strategies.getSearchStrategyById('0')).toBe(mockSearchStrategies[0]);
      expect(strategies.getSearchStrategyById('1')).toBe(mockSearchStrategies[1]);
    });

    it('returns undefined if there is no strategy with that ID', () => {
      expect(strategies.getSearchStrategyById('-1')).toBe(undefined);
    });

    it('returns the noOp search strategy if passed that ID', () => {
      expect(strategies.getSearchStrategyById('noOp')).toBe(noOpSearchStrategy);
    });
  });

  describe('getSearchStrategyForSearchRequest', () => {
    beforeEach(() => {
      mockSearchStrategies.forEach(strategies.addSearchStrategy);
    });

    it('returns the strategy by ID if provided', () => {
      expect(strategies.getSearchStrategyForSearchRequest({}, { searchStrategyId: '1' })).toBe(
        mockSearchStrategies[1]
      );
    });

    it('throws if there is no strategy by provided ID', () => {
      expect(() =>
        strategies.getSearchStrategyForSearchRequest({}, { searchStrategyId: '-1' })
      ).toThrowErrorMatchingInlineSnapshot(`"No strategy with ID -1"`);
    });

    it('returns the strategy by viability if there is one', () => {
      expect(
        strategies.getSearchStrategyForSearchRequest({
          index: {
            id: '1',
          },
        })
      ).toBe(mockSearchStrategies[1]);
    });

    it('returns the no op strategy if there is no viable strategy', () => {
      expect(strategies.getSearchStrategyForSearchRequest({ index: '3' })).toBe(noOpSearchStrategy);
    });
  });

  describe('hasSearchStrategyForIndexPattern', () => {
    beforeEach(() => {
      mockSearchStrategies.forEach(strategies.addSearchStrategy);
    });

    it('returns whether there is a search strategy for this index pattern', () => {
      expect(strategies.hasSearchStrategyForIndexPattern({ id: '0' } as IndexPattern)).toBe(true);
      expect(strategies.hasSearchStrategyForIndexPattern({ id: '-1' } as IndexPattern)).toBe(false);
      // here to test BWC for method with typo in name
      expect(strategies.hasSearchStategyForIndexPattern({ id: '0' } as IndexPattern)).toBe(true);
      expect(strategies.hasSearchStategyForIndexPattern({ id: '-1' } as IndexPattern)).toBe(false);
    });
  });
});
