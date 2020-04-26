/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { SavedObjectsClientContract } from 'src/core/server';
import { AgentSOAttributes } from '../../types';
import { AGENT_SAVED_OBJECT_TYPE } from '../../constants';
import { getAgent } from './crud';
import * as APIKeyService from '../api_keys';

export async function unenrollAgent(soClient: SavedObjectsClientContract, agentId: string) {
  const agent = await getAgent(soClient, agentId);

  await Promise.all([
    agent.access_api_key_id
      ? APIKeyService.invalidateAPIKey(soClient, agent.access_api_key_id)
      : undefined,
    agent.default_api_key_id
      ? APIKeyService.invalidateAPIKey(soClient, agent.default_api_key_id)
      : undefined,
  ]);
  await soClient.update<AgentSOAttributes>(AGENT_SAVED_OBJECT_TYPE, agentId, {
    active: false,
  });
}
