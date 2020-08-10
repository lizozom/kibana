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

import { BehaviorSubject, throwError, timer, Subscription, defer, from, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CoreStart, ToastsSetup, CoreSetup } from 'kibana/public';
import { getCombinedSignal, AbortError } from '../../common/utils';
import { IEsSearchRequest, IEsSearchResponse } from '../../common/search';
import { ISearchOptions } from './types';
import { SearchUsageCollector } from './collectors';
import { ISessionService } from './session_service';

export interface SearchInterceptorDeps {
  session: ISessionService;
  toasts: ToastsSetup;
  http: CoreSetup['http'];
  uiSettings: CoreSetup['uiSettings'];
  startServices: Promise<[CoreStart, any, unknown]>;
  usageCollector?: SearchUsageCollector;
}

export class SearchInterceptor {
  /**
   * `abortController` used to signal all searches to abort.
   */
  protected abortController = new AbortController();

  /**
   * Observable that emits when the number of pending requests changes.
   */
  protected pendingCount$ = new BehaviorSubject<number>(0);

  /**
   * The subscriptions from scheduling the automatic timeout for each request.
   */
  protected timeoutSubscriptions: Subscription = new Subscription();

  protected application!: CoreStart['application'];

  /**
   * This class should be instantiated with a `requestTimeout` corresponding with how many ms after
   * requests are initiated that they should automatically cancel.
   * @param toasts The `core.notifications.toasts` service
   * @param application  The `core.application` service
   * @param requestTimeout Usually config value `elasticsearch.requestTimeout`
   */
  constructor(
    protected readonly deps: SearchInterceptorDeps,
    protected readonly requestTimeout?: number
  ) {
    this.deps.http.addLoadingCountSource(this.pendingCount$);

    this.deps.startServices.then(([coreStart]) => {
      this.application = coreStart.application;
    });
  }

  public async sendToBackground() {
    return false;
  }

  protected runSearch(
    request: IEsSearchRequest,
    signal: AbortSignal
  ): Observable<IEsSearchResponse> {
    const { id, ...searchRequest } = request;
    const path = id != null ? `/internal/search/es/${id}` : '/internal/search/es';
    const method = 'POST';
    const body = JSON.stringify(id != null ? { stored: request.stored } : searchRequest);
    const response = this.deps.http.fetch({ path, method, body, signal });
    return from(response);
  }

  /**
   * Searches using the given `search` method. Overrides the `AbortSignal` with one that will abort
   * either when `cancelPending` is called, when the request times out, or when the original
   * `AbortSignal` is aborted. Updates `pendingCount$` when the request is started/finalized.
   */
  public search(
    request: IEsSearchRequest,
    options?: ISearchOptions
  ): Observable<IEsSearchResponse> {
    // Defer the following logic until `subscribe` is actually called
    return defer(() => {
      if (options?.signal?.aborted) {
        return throwError(new AbortError());
      }

      const { combinedSignal, cleanup } = this.setupTimers(options);
      this.pendingCount$.next(this.pendingCount$.getValue() + 1);

      return this.runSearch(request, combinedSignal).pipe(
        finalize(() => {
          this.pendingCount$.next(this.pendingCount$.getValue() - 1);
          cleanup();
        })
      );
    });
  }

  protected setupTimers(options?: ISearchOptions) {
    // Schedule this request to automatically timeout after some interval
    const timeoutController = new AbortController();
    const { signal: timeoutSignal } = timeoutController;
    const timeout$ = timer(this.requestTimeout);
    const subscription = timeout$.subscribe(() => {
      timeoutController.abort();
    });
    this.timeoutSubscriptions.add(subscription);

    // Get a combined `AbortSignal` that will be aborted whenever the first of the following occurs:
    // 1. The user manually aborts (via `cancelPending`)
    // 2. The request times out
    // 3. The passed-in signal aborts (e.g. when re-fetching, or whenever the app determines)
    const signals = [
      this.abortController.signal,
      timeoutSignal,
      ...(options?.signal ? [options.signal] : []),
    ];

    const combinedSignal = getCombinedSignal(signals);
    const cleanup = () => {
      this.timeoutSubscriptions.remove(subscription);
      // notificationSubscription.unsubscribe();
    };

    combinedSignal.addEventListener('abort', cleanup);

    return {
      combinedSignal,
      cleanup,
    };
  }
}
