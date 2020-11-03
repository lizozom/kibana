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

import { Observable } from 'rxjs';

export interface ISessionService {
  /**
   * Returns the active session ID
   * @returns The active session ID
   */
  getSessionId: () => string | undefined;
  /**
   * Returns the observable that emits an update every time the session ID changes
   * @returns `Observable`
   */
  getSession$: () => Observable<string | undefined>;
  /**
   * Starts a new session
   */
  start: () => string;

  /**
   * Restores existing session
   */
  restore: (sessionId: string) => void;

  /**
   * Clears the active session.
   */
  clear: () => void;
}
