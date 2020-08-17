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

import { Plugin, CoreSetup, CoreStart, PackageInfo } from 'src/core/public';
import { ISearchSetup, ISearchStart, SearchEnhancements } from './types';

import { createSearchSource, SearchSource, SearchSourceDependencies } from './search_source';
import { getEsClient, LegacyApiCaller } from './legacy';
import { AggsService, AggsSetupDependencies, AggsStartDependencies } from './aggs';
import { IndexPatternsContract } from '../index_patterns/index_patterns';
import { ISearchInterceptor, SearchInterceptor } from './search_interceptor';
import { SessionService, ISessionService } from './session_service';
import { ISearchGeneric } from './types';
import { SearchUsageCollector, createUsageCollector } from './collectors';
import { UsageCollectionSetup } from '../../../usage_collection/public';

/** @internal */
export interface SearchServiceSetupDependencies {
  packageInfo: PackageInfo;
  registerFunction: AggsSetupDependencies['registerFunction'];
  usageCollection?: UsageCollectionSetup;
}

/** @internal */
export interface SearchServiceStartDependencies {
  fieldFormats: AggsStartDependencies['fieldFormats'];
  indexPatterns: IndexPatternsContract;
}

export class SearchService implements Plugin<ISearchSetup, ISearchStart> {
  private esClient?: LegacyApiCaller;
  private readonly aggsService = new AggsService();
  private searchInterceptor!: ISearchInterceptor;
  private usageCollector?: SearchUsageCollector;
  private sessionService!: ISessionService;

  public setup(
    core: CoreSetup,
    { packageInfo, registerFunction, usageCollection }: SearchServiceSetupDependencies
  ): ISearchSetup {
    this.usageCollector = createUsageCollector(core, usageCollection);
    this.esClient = getEsClient(core.injectedMetadata, core.http, packageInfo);
    /**
     * A global object that intercepts all searches and provides convenience methods for cancelling
     * all pending search requests, as well as getting the number of pending search requests.
     * TODO: Make this modular so that apps can opt in/out of search collection, or even provide
     * their own search collector instances
     */
    this.sessionService = new SessionService();

    this.searchInterceptor = new SearchInterceptor(
      {
        session: this.sessionService,
        toasts: core.notifications.toasts,
        http: core.http,
        uiSettings: core.uiSettings,
        startServices: core.getStartServices(),
        usageCollector: this.usageCollector!,
      },
      core.injectedMetadata.getInjectedVar('esRequestTimeout') as number
    );

    return {
      aggs: this.aggsService.setup({
        registerFunction,
        uiSettings: core.uiSettings,
      }),
      usageCollector: this.usageCollector!,
      __enhance: (enhancements: SearchEnhancements) => {
        this.searchInterceptor = enhancements.searchInterceptor;
        this.sessionService = enhancements.sessionService;
      },
    };
  }

  public start(
    { application, http, injectedMetadata, notifications, uiSettings }: CoreStart,
    { fieldFormats, indexPatterns }: SearchServiceStartDependencies
  ): ISearchStart {
    const search: ISearchGeneric = (request, options) => {
      return this.searchInterceptor.search(request, options);
    };

    const legacySearch = {
      esClient: this.esClient!,
    };

    const searchSourceDependencies: SearchSourceDependencies = {
      uiSettings,
      injectedMetadata,
      search,
      legacySearch,
    };

    return {
      aggs: this.aggsService.start({ fieldFormats, uiSettings }),
      search,
      sendToBackground: () => {
        return this.searchInterceptor.sendToBackground();
      },
      session: this.sessionService,
      usageCollector: this.usageCollector!,
      searchSource: {
        create: createSearchSource(indexPatterns, searchSourceDependencies),
        createEmpty: () => {
          return new SearchSource({}, searchSourceDependencies);
        },
      },
      __LEGACY: legacySearch,
    };
  }

  public stop() {
    this.aggsService.stop();
  }
}
