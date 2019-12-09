/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiFlexGroup, EuiFlexItem, EuiToolTip } from '@elastic/eui';
import { isNumber, isString } from 'lodash/fp';
import * as React from 'react';

import { Bytes, BYTES_FORMAT } from '../../../bytes';
import { Duration, EVENT_DURATION_FIELD_NAME } from '../../../duration';
import { getOrEmptyTagFromValue, getEmptyTagValue } from '../../../empty_value';
import { FormattedDate } from '../../../formatted_date';
import { FormattedIp } from '../../../formatted_ip';
import { HostDetailsLink } from '../../../links';
import { Port, PORT_NAMES } from '../../../port';
import { TruncatableText } from '../../../truncatable_text';
import {
  DATE_FIELD_TYPE,
  HOST_NAME_FIELD_NAME,
  IP_FIELD_TYPE,
  MESSAGE_FIELD_NAME,
} from './constants';

export const FormattedFieldValue = React.memo<{
  contextId: string;
  eventId: string;
  fieldFormat?: string;
  fieldName: string;
  fieldType: string;
  truncate?: boolean;
  value: string | number | undefined | null;
}>(({ contextId, eventId, fieldFormat, fieldName, fieldType, truncate, value }) => {
  if (fieldType === IP_FIELD_TYPE) {
    return (
      <FormattedIp
        eventId={eventId}
        contextId={contextId}
        fieldName={fieldName}
        value={!isNumber(value) ? value : String(value)}
      />
    );
  } else if (fieldType === DATE_FIELD_TYPE) {
    return <FormattedDate fieldName={fieldName} value={value} />;
  } else if (PORT_NAMES.some(portName => fieldName === portName)) {
    return (
      <Port contextId={contextId} eventId={eventId} fieldName={fieldName} value={`${value}`} />
    );
  } else if (fieldName === EVENT_DURATION_FIELD_NAME) {
    return (
      <Duration contextId={contextId} eventId={eventId} fieldName={fieldName} value={`${value}`} />
    );
  } else if (fieldName === HOST_NAME_FIELD_NAME) {
    const hostname = `${value}`;

    return isString(value) && hostname.length > 0 ? (
      <EuiToolTip content={value}>
        <HostDetailsLink data-test-subj="host-details-link" hostName={hostname}>
          {value}
        </HostDetailsLink>
      </EuiToolTip>
    ) : (
      getEmptyTagValue()
    );
  } else if (fieldFormat === BYTES_FORMAT) {
    return (
      <Bytes contextId={contextId} eventId={eventId} fieldName={fieldName} value={`${value}`} />
    );
  } else if (fieldName === MESSAGE_FIELD_NAME && value != null && value !== '') {
    return (
      <>
        {truncate ? (
          <TruncatableText data-test-subj="truncatable-message">
            <EuiToolTip
              data-test-subj="message-tool-tip"
              content={
                <EuiFlexGroup direction="column" gutterSize="none">
                  <EuiFlexItem grow={false}>
                    <span>{fieldName}</span>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <span>{value}</span>
                  </EuiFlexItem>
                </EuiFlexGroup>
              }
            >
              <>{value}</>
            </EuiToolTip>
          </TruncatableText>
        ) : (
          <>{value}</>
        )}
      </>
    );
  } else {
    return getOrEmptyTagFromValue(value);
  }
});

FormattedFieldValue.displayName = 'FormattedFieldValue';
