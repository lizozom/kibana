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

import React from 'react';
import { i18n } from '@kbn/i18n';
import { EuiButton, EuiSpacer } from '@elastic/eui';
import { ApplicationStart } from 'kibana/public';
import { HttpFetchError } from 'kibana/public';
import { KbnError } from '../../../../kibana_utils/common';

export enum TimeoutErrorMode {
  UPGRADE,
  CONTACT,
  CHANGE,
}

/**
 * Request Failure - When an entire multi request fails
 * @param {Error} err - the Error that came back
 */
export class SearchTimeoutError extends KbnError {
  public mode: TimeoutErrorMode;
  constructor(err: HttpFetchError | null = null, mode: TimeoutErrorMode) {
    super(`Request timeout: ${JSON.stringify(err?.message)}`);
    this.mode = mode;
  }

  private getMessage() {
    switch (this.mode) {
      case TimeoutErrorMode.UPGRADE:
        return i18n.translate('data.search.upgradeLicense', {
          defaultMessage:
            'One or more queries timed out. With our free Basic tier, your queries never time out.',
        });
      case TimeoutErrorMode.CONTACT:
        return i18n.translate('data.search.timeoutContactAdmin', {
          defaultMessage:
            'One or more queries timed out. Contact your system administrator to increase the run time.',
        });
      case TimeoutErrorMode.CHANGE:
        return i18n.translate('data.search.timeoutIncreaseSetting', {
          defaultMessage:
            'One or more queries timed out. Increase run time with the search timeout advanced setting.',
        });
    }
  }

  private getActionText() {
    switch (this.mode) {
      case TimeoutErrorMode.UPGRADE:
        return i18n.translate('data.search.upgradeLicenseActionText', {
          defaultMessage: 'Upgrade',
        });
        break;
      case TimeoutErrorMode.CHANGE:
        return i18n.translate('data.search.timeoutIncreaseSettingActionText', {
          defaultMessage: 'Go to Advanced Settings',
        });
        break;
    }
  }

  private onClick(application: ApplicationStart) {
    switch (this.mode) {
      case TimeoutErrorMode.UPGRADE:
        application.navigateToApp('management', {
          path: `/kibana/indexPatterns`,
        });
        break;
      case TimeoutErrorMode.CHANGE:
        application.navigateToApp('management', {
          path: `/kibana/settings`,
        });
        break;
    }
  }

  public getErrorMessage(application: ApplicationStart) {
    const actionText = this.getActionText();
    return (
      <>
        {this.getMessage()}
        {actionText && (
          <>
            <EuiSpacer size="s" />
            <div className="eui-textRight">
              <EuiButton color="danger" onClick={() => this.onClick(application)} size="s">
                {actionText}
              </EuiButton>
            </div>
          </>
        )}
      </>
    );
  }
}
