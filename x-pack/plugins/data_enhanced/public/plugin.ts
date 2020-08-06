/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { CoreSetup, CoreStart, Plugin } from 'src/core/public';
import { DataPublicPluginSetup, DataPublicPluginStart } from '../../../../src/plugins/data/public';
import { setAutocompleteService } from './services';
import { setupKqlQuerySuggestionProvider, KUERY_LANGUAGE_NAME } from './autocomplete';

import { EnhancedSearchInterceptor } from './search/search_interceptor';
import { EnhancedSessionService } from './session';

export interface DataEnhancedSetupDependencies {
  data: DataPublicPluginSetup;
}
export interface DataEnhancedStartDependencies {
  data: DataPublicPluginStart;
}

export type DataEnhancedSetup = ReturnType<DataEnhancedPlugin['setup']>;
export type DataEnhancedStart = ReturnType<DataEnhancedPlugin['start']>;

export class DataEnhancedPlugin
  implements
    Plugin<void, DataEnhancedStart, DataEnhancedSetupDependencies, DataEnhancedStartDependencies> {

  public setup(
    core: CoreSetup<DataEnhancedStartDependencies>,
    { data }: DataEnhancedSetupDependencies
  ) {
    data.autocomplete.addQuerySuggestionProvider(
      KUERY_LANGUAGE_NAME,
      setupKqlQuerySuggestionProvider(core)
    );

    const sessionService = new EnhancedSessionService(core.http);

    const enhancedSearchInterceptor = new EnhancedSearchInterceptor(
      {
        session: sessionService,
        toasts: core.notifications.toasts,
        http: core.http,
        uiSettings: core.uiSettings,
        startServices: core.getStartServices(),
        usageCollector: data.search.usageCollector,
      },
      core.injectedMetadata.getInjectedVar('esRequestTimeout') as number
    );

    data.enhance({
      search: {
        searchInterceptor: enhancedSearchInterceptor,
        sessionService
      },
    });
  }

  public start(core: CoreStart, plugins: DataEnhancedStartDependencies) {
    setAutocompleteService(plugins.data.autocomplete);

    /*
      Clear any open sessions upon navigation to make sure they are not used mistakenly by
      another application.
     */
    core.application.currentAppId$.subscribe(() => {
      plugins.data.search.session.clear();
    });

  }
}
