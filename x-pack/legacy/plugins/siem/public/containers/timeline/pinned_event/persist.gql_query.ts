/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { gql } from '@apollo/client';

export const persistTimelinePinnedEventMutation = gql`
  mutation PersistTimelinePinnedEventMutation($pinnedEventId: ID, $eventId: ID!, $timelineId: ID) {
    persistPinnedEventOnTimeline(
      pinnedEventId: $pinnedEventId
      eventId: $eventId
      timelineId: $timelineId
    ) {
      pinnedEventId
      eventId
      timelineId
      timelineVersion
      created
      createdBy
      updated
      updatedBy
      version
    }
  }
`;
