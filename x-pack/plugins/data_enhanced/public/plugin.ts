/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { CoreSetup, CoreStart, Plugin } from 'src/core/public';
import {
  DataPublicPluginSetup,
  DataPublicPluginStart,
  ES_SEARCH_STRATEGY,
} from '../../../../src/plugins/data/public';
import { setAutocompleteService } from './services';
import { setupKqlQuerySuggestionProvider, KUERY_LANGUAGE_NAME } from './autocomplete';
import {
  ASYNC_SEARCH_STRATEGY,
  asyncSearchStrategyProvider,
  enhancedEsSearchStrategyProvider,
} from './search';
import { EnhancedSearchInterceptor } from './search/search_interceptor';
import { BackgroundSessionService } from './background_session';

export interface DataEnhancedSetupDependencies {
  data: DataPublicPluginSetup;
}
export interface DataEnhancedStartDependencies {
  data: DataPublicPluginStart;
}

export type DataEnhancedSetup = ReturnType<DataEnhancedPlugin['setup']>;
export type DataEnhancedStart = ReturnType<DataEnhancedPlugin['start']>;

export class DataEnhancedPlugin implements Plugin {
  private backgroundSessionService!: BackgroundSessionService;
  constructor() {}

  public setup(core: CoreSetup, { data }: DataEnhancedSetupDependencies) {
    data.autocomplete.addQuerySuggestionProvider(
      KUERY_LANGUAGE_NAME,
      setupKqlQuerySuggestionProvider(core)
    );
    data.search.registerSearchStrategyProvider(ASYNC_SEARCH_STRATEGY, asyncSearchStrategyProvider);
    data.search.registerSearchStrategyProvider(
      ES_SEARCH_STRATEGY,
      enhancedEsSearchStrategyProvider
    );
  }

  public start(core: CoreStart, plugins: DataEnhancedStartDependencies) {
    setAutocompleteService(plugins.data.autocomplete);
    this.backgroundSessionService = new BackgroundSessionService(core.http, plugins.data.search);

    const enhancedSearchInterceptor = new EnhancedSearchInterceptor(
      this.backgroundSessionService,
      core.notifications.toasts,
      core.application,
      core.injectedMetadata.getInjectedVar('esRequestTimeout') as number
    );
    plugins.data.search.setInterceptor(enhancedSearchInterceptor);

    /*
      Clear any open sessions upon navigation to make sure they are not used mistakenly by
      another application.
     */
    core.application.currentAppId$.subscribe(() => {
      plugins.data.search.clearSession();
    });
  }
}
