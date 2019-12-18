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

import { TSearchStrategyProvider } from '../../../src/plugins/data/server';
import { DEMO_SEARCH_STRATEGY } from '../common';

const responseMap = new Map<string, any>();
const getId = (() => {
  let id = 0;
  return () => `${id++}`;
})();

export const demoSearchStrategyProvider: TSearchStrategyProvider<typeof DEMO_SEARCH_STRATEGY> = () => {
  return {
    search: request => {
      const { id = getId() } = request;
      const response = responseMap.get(id) ?? {};
      const nextResponse = {
        id,
        loaded: (response.loaded ?? 0) + 1,
        total: response.total ?? 10,
        greeting:
          response.greeting ?? request.mood === 'happy'
            ? `Lovely to meet you, ${request.name}`
            : `Hope you feel better, ${request.name}`,
      };
      responseMap.set(id, nextResponse);
      return Promise.resolve(nextResponse);
    },
  };
};
