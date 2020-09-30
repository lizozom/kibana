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

import { IKibanaSearchRequest } from '..';

export enum SessionStatus {
  New,
  Running,
  Completed,
  Timeout,
}

export enum SearchStatus {
  Running,
  Done,
  Error,
}

export interface ISessionService {
  getSessionId: () => string | undefined;
  getSessionTimeoutNotified: () => boolean;
  setSessionTimeoutNotified: () => void;
  start: () => void;
  clear: () => void;
  trackSearch: (request: IKibanaSearchRequest, sessionId: string | undefined) => void;
  trackSearchId: (
    request: IKibanaSearchRequest,
    sessionId: string | undefined,
    searchId: string
  ) => void;
  trackSearchComplete: (request: IKibanaSearchRequest, sessionId?: string) => void;
  trackSearchError: (request: IKibanaSearchRequest, sessionId?: string, e?: Error) => void;
}
