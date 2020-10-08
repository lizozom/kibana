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
import expect from '@kbn/expect';
import { PluginFunctionalProviderContext } from '../../services';

export default function ({ getService, getPageObjects }: PluginFunctionalProviderContext) {
  const PageObjects = getPageObjects(['common', 'dashboard', 'discover', 'timePicker']);
  const filterBar = getService('filterBar');
  const testSubjects = getService('testSubjects');
  const toasts = getService('toasts');

  const getSessionIds = async () => {
    const sessionsBtn = await testSubjects.find('showSessionsButton');
    await sessionsBtn.click();
    const toast = await toasts.getToastElement(1);
    const sessionIds = await toast.getVisibleText();
    return sessionIds.split(',');
  };

  describe('Session management', function describeIndexTests() {
    describe('Discover', () => {
      before(async () => {
        await PageObjects.common.navigateToApp('discover');
      });

      afterEach(async () => {
        await testSubjects.click('clearSessionsButton');
        await toasts.dismissAllToasts();
      });

      it('Starts a new session', async () => {
        const sessionIds = await getSessionIds();
        expect(sessionIds.length).to.be(1);
      });

      it('Starts on a refresh', async () => {
        await testSubjects.click('querySubmitButton');
        const sessionIds = await getSessionIds();
        expect(sessionIds.length).to.be(1);
      });

      it('Starts a new session on sort', async () => {
        await PageObjects.discover.clickFieldListItemAdd('speaker');
        await PageObjects.discover.clickFieldSort('speaker');
        const sessionIds = await getSessionIds();
        expect(sessionIds.length).to.be(1);
      });

      it('Starts a new session on filter change', async () => {
        await filterBar.addFilter('line_number', 'exists');
        const sessionIds = await getSessionIds();
        expect(sessionIds.length).to.be(1);
      });
    });
  });
}
