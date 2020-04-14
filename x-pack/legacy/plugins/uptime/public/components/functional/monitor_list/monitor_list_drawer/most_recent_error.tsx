/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import React from 'react';
import { EuiText, EuiSpacer } from '@elastic/eui';
import moment from 'moment';
import { i18n } from '@kbn/i18n';
import { MonitorPageLink } from '../monitor_page_link';
import { useGetUrlParams } from '../../../../hooks';
import { stringifyUrlParams } from '../../../../lib/helper/stringify_url_params';
import { MonitorError } from '../../../../../common/runtime_types';

interface MostRecentErrorProps {
  /**
   * error returned from API for monitor details
   */
  error: MonitorError | undefined;

  /**
   * monitorId to be used for link to detail page
   */
  monitorId: string;

  /**
   * Timestamp of error for the monitor
   */
  timestamp: string | undefined;
}

export const MostRecentError = ({ error, monitorId, timestamp }: MostRecentErrorProps) => {
  const { absoluteDateRangeStart, absoluteDateRangeEnd, ...params } = useGetUrlParams();
  params.selectedPingStatus = 'down';
  const linkParameters = stringifyUrlParams(params, true);

  const timestampStr = timestamp ? moment(new Date(timestamp).valueOf()).fromNow() : '';

  return (
    <>
      <EuiSpacer />
      <EuiText size="xs">
        <h3>
          {i18n.translate('xpack.uptime.monitorList.mostRecentError.title', {
            defaultMessage: 'Most recent error ({timestamp})',
            values: { timestamp: timestampStr },
            description: 'Most Recent Error title in Monitor List Expanded row',
          })}
        </h3>
      </EuiText>
      <EuiSpacer size="s" />
      <MonitorPageLink monitorId={monitorId} linkParameters={linkParameters}>
        {error?.message}
      </MonitorPageLink>
    </>
  );
};
