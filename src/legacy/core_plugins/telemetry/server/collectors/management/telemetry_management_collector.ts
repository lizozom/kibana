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

import { Server } from 'hapi';
import { size } from 'lodash';
import { KIBANA_MANAGEMENT_STATS_TYPE } from '../../../common/constants';
import { UsageCollectionSetup } from '../../../../../../plugins/usage_collection/server';
import { SavedObjectsClient } from '../../../../../../core/server';

export type UsageStats = Record<string, any>;

export async function getTranslationCount(loader: any, locale: string): Promise<number> {
  const translations = await loader.getTranslationsByLocale(locale);
  return size(translations.messages);
}

export function createCollectorFetch(server: Server) {
  return async function fetchUsageStats(): Promise<UsageStats> {
    const internalRepo = server.newPlatform.setup.core.savedObjects.createInternalRepository();
    const uiSettings = server.newPlatform.start.core.uiSettings.asScopedToClient(
      new SavedObjectsClient(internalRepo)
    );

    const all = await uiSettings.getAll();
    console.log(
      await uiSettings.get('visualize:enableLabs'),
      uiSettings.isOverridden('visualize:enableLabs')
    );
    const modifiedEntries = Object.keys(all)
      .filter((setting: any) => uiSettings.isOverridden(setting[0]))
      .reduce((obj: any, key: string) => {
        obj[key] = all[key];
        return obj;
      }, {});
    modifiedEntries.test = 'aaa';
    console.log(modifiedEntries);

    return modifiedEntries;
  };
}

export function registerManagementUsageCollector(
  usageCollection: UsageCollectionSetup,
  server: any
) {
  const collector = usageCollection.makeUsageCollector({
    type: KIBANA_MANAGEMENT_STATS_TYPE,
    isReady: () => true,
    fetch: createCollectorFetch(server),
  });

  usageCollection.registerCollector(collector);
}
