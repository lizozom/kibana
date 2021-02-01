/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { SearchSessionSavedObjectAttributes, SearchSessionStatus } from '../../../common';
import { ACTION } from './components/actions';

export const DATE_STRING_FORMAT = 'D MMM, YYYY, HH:mm:ss';

/**
 * Some properties are optional for a non-persisted Search Session.
 * This interface makes them mandatory, because management only shows persisted search sessions.
 */
export type PersistedSearchSessionSavedObjectAttributes = SearchSessionSavedObjectAttributes &
  Required<
    Pick<
      SearchSessionSavedObjectAttributes,
      'name' | 'appId' | 'urlGeneratorId' | 'initialState' | 'restoreState'
    >
  >;

export interface UISession {
  id: string;
  name: string;
  appId: string;
  created: string;
  expires: string | null;
  status: SearchSessionStatus;
  actions?: ACTION[];
  reloadUrl: string;
  restoreUrl: string;
}
