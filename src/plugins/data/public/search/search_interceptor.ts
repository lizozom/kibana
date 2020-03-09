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

import { Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { IKibanaSearchRequest } from '../../common/search';
import { ISearchGeneric, ISearchOptions } from './i_search';

export class SearchInterceptor {
  /**
   * `abortController` used to signal all searches to abort.
   */
  private abortController = new AbortController();

  /**
   * Number of in-progress search requests.
   */
  private pendingCount: number = 0;

  /**
   * Observable that emits when the number of pending requests changes.
   */
  private pendingCount$: Subject<number> = new Subject();

  /**
   * Abort our `AbortController`, which in turn aborts any intercepted searches.
   */
  cancelPending = () => {
    this.abortController.abort();
    this.abortController = new AbortController();
  };

  /**
   * Searches using the given `search` method. Overrides the `AbortSignal` with one that will abort
   * either when `cancelPending` is called, or when the original `AbortSignal` is aborted. Updates
   * the `pendingCount` when the request is started/finalized.
   */
  search = (search: ISearchGeneric, request: IKibanaSearchRequest, options: ISearchOptions) => {
    this.pendingCount$.next(++this.pendingCount);

    // Create a new `AbortController` that will abort when our either our private `AbortController`
    // aborts, or the given `AbortSignal` aborts.
    const abortController = new AbortController();
    if (options?.signal) {
      options.signal.addEventListener('abort', () => {
        abortController.abort();
      });
    }
    this.abortController.signal.addEventListener('abort', () => {
      abortController.abort();
    });
    const { signal } = abortController;

    return search(request as any, { ...options, signal }).pipe(
      finalize(() => this.pendingCount$.next(--this.pendingCount))
    );
  };

  /**
   * Returns the current number of pending searches. This could mean either one of the search
   * requests is still in flight, or that it has only received partial responses.
   */
  getPendingCount$ = () => {
    return this.pendingCount$.asObservable();
  };
}
