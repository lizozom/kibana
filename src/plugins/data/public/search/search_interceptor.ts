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

import { createHash } from 'crypto';
import { get, trimEnd, debounce } from 'lodash';
import { BehaviorSubject, throwError, timer, defer, from, Observable, NEVER } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { CoreStart, CoreSetup, ToastsSetup } from 'kibana/public';
import {
  getCombinedSignal,
  AbortError,
  IEsSearchRequest,
  IEsSearchResponse,
  ISearchOptions,
  ES_SEARCH_STRATEGY,
} from '../../common';
import { SearchUsageCollector } from './collectors';
import { SearchTimeoutError, PainlessError, isPainlessError, TimeoutErrorMode } from './errors';
import { toMountPoint } from '../../../kibana_react/public';

export interface SearchInterceptorDeps {
  http: CoreSetup['http'];
  uiSettings: CoreSetup['uiSettings'];
  startServices: Promise<[CoreStart, any, unknown]>;
  toasts: ToastsSetup;
  usageCollector?: SearchUsageCollector;
}

export enum SearchStatus {
  Running,
  Done,
  Error,
  Timeout,
  Expired,
  Canceled,
}

interface RequestInfo {
  searchId?: string;
  status: SearchStatus;
}

interface SessionInfo {
  requests: Record<string, RequestInfo>;
  abortSignals?: AbortSignal[];
  status: SearchStatus;
}

export class SearchInterceptor {
  private readonly idMapping: Map<string, SessionInfo>;

  /**
   * `abortController` used to signal all searches to abort.
   *  @internal
   */
  protected abortController = new AbortController();

  /**
   * Observable that emits when the number of pending requests changes.
   * @internal
   */
  protected pendingCount$ = new BehaviorSubject(0);

  /**
   * @internal
   */
  protected application!: CoreStart['application'];

  /*
   * @internal
   */
  constructor(protected readonly deps: SearchInterceptorDeps) {
    this.idMapping = new Map();

    this.deps.http.addLoadingCountSource(this.pendingCount$);

    this.deps.startServices.then(([coreStart]) => {
      this.application = coreStart.application;
    });
  }

  private createHash(keys: Record<any, any>) {
    return createHash(`sha256`).update(JSON.stringify(keys)).digest('hex');
  }

  protected onRequestStart(
    request: IEsSearchRequest,
    sessionId: string | undefined,
    timeoutSignal: AbortSignal,
    searchId: string = new Date().getTime().toString()
  ) {
    if (sessionId && searchId && request.params && request.params.body) {
      let sessionInfo = this.idMapping.get(sessionId);

      // Create session info for a new session
      if (!sessionInfo) {
        sessionInfo = {
          abortSignals: [],
          requests: {},
          status: SearchStatus.Running,
        };
        this.idMapping.set(sessionId, sessionInfo);
      }

      // Reopen a complete session, if a new search is run. We know this can happen because of follow up requests.
      if (sessionInfo.status === SearchStatus.Done) {
        sessionInfo.status = SearchStatus.Running;
      }

      // Listen to search timeouts
      timeoutSignal.addEventListener('abort', (e) => {
        if (sessionInfo?.status === SearchStatus.Running) {
          sessionInfo.status = SearchStatus.Timeout;
        }
      });

      // Add request info to the session
      sessionInfo.requests[this.createHash(request.params.body)] = {
        status: SearchStatus.Running,
        searchId,
      };
    }
  }

  protected onRequestComplete(request: IEsSearchRequest, sessionId?: string) {
    if (sessionId && request.params && request.params.body) {
      const sessionInfo = this.idMapping.get(sessionId);
      sessionInfo!.requests[this.createHash(request.params.body)].status = SearchStatus.Done;

      // Mark session as done, if all requests are done
      Object.values(sessionInfo!.requests)
        .map((requestInfo) => requestInfo.status === SearchStatus.Done)
        .every(() => {
          sessionInfo!.status = SearchStatus.Done;
        });
    }
  }

  protected onRequestError(request: IEsSearchRequest, sessionId?: string) {
    if (sessionId && request.params && request.params.body) {
      const sessionInfo = this.idMapping.get(sessionId);

      if (sessionInfo) {
        // Mark request as errored, don't update session status
        sessionInfo.requests[this.createHash(request.params.body)].status = SearchStatus.Error;
      }
    }
  }

  /*
   * @returns `TimeoutErrorMode` indicating what action should be taken in case of a request timeout based on license and permissions.
   * @internal
   */
  protected getTimeoutMode() {
    return TimeoutErrorMode.UPGRADE;
  }

  /*
   * @returns `Error` a search service specific error or the original error, if a specific error can't be recognized.
   * @internal
   */
  protected handleSearchError(
    e: any,
    request: IEsSearchRequest,
    timeoutSignal: AbortSignal,
    appAbortSignal?: AbortSignal
  ): Error {
    if (timeoutSignal.aborted || get(e, 'body.message') === 'Request timed out') {
      // Handle a client or a server side timeout
      const err = new SearchTimeoutError(e, this.getTimeoutMode());

      // Show the timeout error here, so that it's shown regardless of how an application chooses to handle errors.
      this.showTimeoutError(err);
      return err;
    } else if (appAbortSignal?.aborted) {
      // In the case an application initiated abort, throw the existing AbortError.
      return e;
    } else if (isPainlessError(e)) {
      return new PainlessError(e, request);
    } else {
      return e;
    }
  }

  /**
   * @internal
   */
  protected runSearch(
    request: IEsSearchRequest,
    signal: AbortSignal,
    strategy?: string
  ): Observable<IEsSearchResponse> {
    const { id, ...searchRequest } = request;
    const path = trimEnd(`/internal/search/${strategy || ES_SEARCH_STRATEGY}/${id || ''}`, '/');
    const body = JSON.stringify(searchRequest);
    return from(
      this.deps.http.fetch({
        method: 'POST',
        path,
        body,
        signal,
      })
    );
  }

  /**
   * @internal
   */
  protected setupAbortSignal({
    abortSignal,
    timeout,
  }: {
    abortSignal?: AbortSignal;
    timeout?: number;
  }) {
    // Schedule this request to automatically timeout after some interval
    const timeoutController = new AbortController();
    const { signal: timeoutSignal } = timeoutController;
    const timeout$ = timeout ? timer(timeout) : NEVER;
    const subscription = timeout$.subscribe(() => {
      timeoutController.abort();
    });

    // Get a combined `AbortSignal` that will be aborted whenever the first of the following occurs:
    // 1. The user manually aborts (via `cancelPending`)
    // 2. The request times out
    // 3. The passed-in signal aborts (e.g. when re-fetching, or whenever the app determines)
    const signals = [
      this.abortController.signal,
      timeoutSignal,
      ...(abortSignal ? [abortSignal] : []),
    ];

    const combinedSignal = getCombinedSignal(signals);
    const cleanup = () => {
      subscription.unsubscribe();
    };

    combinedSignal.addEventListener('abort', cleanup);

    return {
      timeoutSignal,
      combinedSignal,
      cleanup,
    };
  }

  /**
   * Right now we are throttling but we will hook this up with background sessions to show only one
   * error notification per session.
   * @internal
   */
  private showTimeoutError = debounce(
    (e: SearchTimeoutError) => {
      this.deps.toasts.addDanger({
        title: 'Timed out',
        text: toMountPoint(e.getErrorMessage(this.application)),
      });
    },
    30000,
    { leading: true, trailing: false }
  );

  /**
   * Searches using the given `search` method. Overrides the `AbortSignal` with one that will abort
   * either when `cancelPending` is called, when the request times out, or when the original
   * `AbortSignal` is aborted. Updates `pendingCount$` when the request is started/finalized.
   *
   * @param request
   * @options
   * @returns `Observalbe` emitting the search response or an error.
   */
  public search(
    request: IEsSearchRequest,
    options?: ISearchOptions
  ): Observable<IEsSearchResponse> {
    // Defer the following logic until `subscribe` is actually called
    return defer(() => {
      if (options?.abortSignal?.aborted) {
        return throwError(new AbortError());
      }

      const { timeoutSignal, combinedSignal, cleanup } = this.setupAbortSignal({
        abortSignal: options?.abortSignal,
      });
      this.pendingCount$.next(this.pendingCount$.getValue() + 1);

      this.onRequestStart(request, options?.sessionId, timeoutSignal);
      return this.runSearch(request, combinedSignal, options?.strategy).pipe(
        catchError((e: any) => {
          this.onRequestError(request, options?.sessionId);
          return throwError(
            this.handleSearchError(e, request, timeoutSignal, options?.abortSignal)
          );
        }),
        finalize(() => {
          this.pendingCount$.next(this.pendingCount$.getValue() - 1);
          cleanup();
        })
      );
    });
  }

  /*
   *
   */
  public showError(e: Error) {
    if (e instanceof AbortError) return;

    if (e instanceof SearchTimeoutError) {
      // The SearchTimeoutError is shown by the interceptor in getSearchError (regardless of how the app chooses to handle errors)
      return;
    }

    if (e instanceof PainlessError) {
      this.deps.toasts.addDanger({
        title: 'Search Error',
        text: toMountPoint(e.getErrorMessage(this.application)),
      });
      return;
    }

    this.deps.toasts.addError(e, {
      title: 'Search Error',
    });
  }
}

export type ISearchInterceptor = PublicMethodsOf<SearchInterceptor>;
