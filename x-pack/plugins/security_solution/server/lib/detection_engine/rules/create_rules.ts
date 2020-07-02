/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { transformRuleToAlertAction } from '../../../../common/detection_engine/transform_actions';
import { Alert } from '../../../../../alerts/common';
import { APP_ID, SIGNALS_ID } from '../../../../common/constants';
import { CreateRulesOptions } from './types';
import { addTags } from './add_tags';
import { hasListsFeature } from '../feature_flags';

export const createRules = async ({
  alertsClient,
  anomalyThreshold,
  author,
  buildingBlockType,
  description,
  enabled,
  falsePositives,
  from,
  query,
  language,
  license,
  savedId,
  timelineId,
  timelineTitle,
  meta,
  machineLearningJobId,
  filters,
  ruleId,
  immutable,
  index,
  interval,
  maxSignals,
  riskScore,
  riskScoreMapping,
  ruleNameOverride,
  outputIndex,
  name,
  severity,
  severityMapping,
  tags,
  threat,
  timestampOverride,
  to,
  type,
  references,
  note,
  version,
  exceptionsList,
  actions,
}: CreateRulesOptions): Promise<Alert> => {
  // TODO: Remove this and use regular exceptions_list once the feature is stable for a release
  const exceptionsListParam = hasListsFeature() ? { exceptionsList } : {};
  return alertsClient.create({
    data: {
      name,
      tags: addTags(tags, ruleId, immutable),
      alertTypeId: SIGNALS_ID,
      consumer: APP_ID,
      params: {
        anomalyThreshold,
        author,
        buildingBlockType,
        description,
        ruleId,
        index,
        falsePositives,
        from,
        immutable,
        query,
        language,
        license,
        outputIndex,
        savedId,
        timelineId,
        timelineTitle,
        meta,
        machineLearningJobId,
        filters,
        maxSignals,
        riskScore,
        riskScoreMapping,
        ruleNameOverride,
        severity,
        severityMapping,
        threat,
        timestampOverride,
        to,
        type,
        references,
        note,
        version,
        ...exceptionsListParam,
      },
      schedule: { interval },
      enabled,
      actions: actions.map(transformRuleToAlertAction),
      throttle: null,
    },
  });
};
