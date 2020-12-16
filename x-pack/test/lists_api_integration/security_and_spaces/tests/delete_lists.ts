/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from '@kbn/expect';

import { FtrProviderContext } from '../../common/ftr_provider_context';
import {
  EXCEPTION_LIST_ITEM_URL,
  EXCEPTION_LIST_URL,
  LIST_ITEM_URL,
  LIST_URL,
} from '../../../../plugins/lists/common/constants';

import {
  getCreateMinimalListSchemaMock,
  getCreateMinimalListSchemaMockWithoutId,
} from '../../../../plugins/lists/common/schemas/request/create_list_schema.mock';
import {
  createListsIndex,
  deleteAllExceptions,
  deleteListsIndex,
  removeListServerGeneratedProperties,
} from '../../utils';
import { getListResponseMockWithoutAutoGeneratedValues } from '../../../../plugins/lists/common/schemas/response/list_schema.mock';
import { getCreateExceptionListMinimalSchemaMock } from '../../../../plugins/lists/common/schemas/request/create_exception_list_schema.mock';
import { getCreateExceptionListItemMinimalSchemaMockWithoutId } from '../../../../plugins/lists/common/schemas/request/create_exception_list_item_schema.mock';
import { DETECTION_TYPE, LIST_ID } from '../../../../plugins/lists/common/constants.mock';

// eslint-disable-next-line import/no-default-export
export default ({ getService }: FtrProviderContext) => {
  const supertest = getService('supertest');
  const es = getService('es');

  describe('delete_lists', () => {
    describe('deleting lists', () => {
      beforeEach(async () => {
        await createListsIndex(supertest);
      });

      afterEach(async () => {
        await deleteListsIndex(supertest);
      });

      it('should delete a single list with a list id', async () => {
        // create a list
        await supertest
          .post(LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateMinimalListSchemaMock())
          .expect(200);

        // delete the list by its list id
        const { body } = await supertest
          .delete(`${LIST_URL}?id=${getCreateMinimalListSchemaMock().id}`)
          .set('kbn-xsrf', 'true')
          .expect(200);

        const bodyToCompare = removeListServerGeneratedProperties(body);
        expect(bodyToCompare).to.eql(getListResponseMockWithoutAutoGeneratedValues());
      });

      it('should delete a single list using an auto generated id', async () => {
        // add a list
        const { body: bodyWithCreatedList } = await supertest
          .post(LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateMinimalListSchemaMockWithoutId())
          .expect(200);

        // delete that list by its auto-generated id
        const { body } = await supertest
          .delete(`${LIST_URL}?id=${bodyWithCreatedList.id}`)
          .set('kbn-xsrf', 'true')
          .expect(200);

        const bodyToCompare = removeListServerGeneratedProperties(body);
        expect(bodyToCompare).to.eql(getListResponseMockWithoutAutoGeneratedValues());
      });

      it('should return an error if the id does not exist when trying to delete it', async () => {
        const { body } = await supertest
          .delete(`${LIST_URL}?id=c1e1b359-7ac1-4e96-bc81-c683c092436f`)
          .set('kbn-xsrf', 'true')
          .expect(404);

        expect(body).to.eql({
          message: 'list id: "c1e1b359-7ac1-4e96-bc81-c683c092436f" was not found',
          status_code: 404,
        });
      });

      describe('deleting lists referenced in exceptions', () => {
        afterEach(async () => {
          await deleteAllExceptions(es);
        });

        it('should return an error when deleting a list referenced within an exception list item', async () => {
          // create a list
          const { body: valueListBody } = await supertest
            .post(LIST_URL)
            .set('kbn-xsrf', 'true')
            .send(getCreateMinimalListSchemaMock())
            .expect(200);

          // create an exception list
          const { body: exceptionListBody } = await supertest
            .post(EXCEPTION_LIST_URL)
            .set('kbn-xsrf', 'true')
            .send({ ...getCreateExceptionListMinimalSchemaMock(), type: DETECTION_TYPE })
            .expect(200);

          // create an exception list item referencing value list
          await supertest
            .post(EXCEPTION_LIST_ITEM_URL)
            .set('kbn-xsrf', 'true')
            .send({
              ...getCreateExceptionListItemMinimalSchemaMockWithoutId(),
              list_id: exceptionListBody.list_id,
              entries: [
                {
                  field: 'some.not.nested.field',
                  operator: 'included',
                  type: 'list',
                  list: { id: valueListBody.id, type: 'keyword' },
                },
              ],
            })
            .expect(200);

          // try to delete that list by its auto-generated id
          await supertest
            .delete(`${LIST_URL}?id=${valueListBody.id}`)
            .set('kbn-xsrf', 'true')
            .expect(409);

          // really delete that list by its auto-generated id
          await supertest
            .delete(`${LIST_URL}?id=${valueListBody.id}&ignoreReferences=true`)
            .set('kbn-xsrf', 'true')
            .expect(200);
        });

        // Tests in development
        it.skip('should delete a single list referenced within an exception list item if ignoreReferences=true', async () => {
          // create a list
          const { body: valueListBody } = await supertest
            .post(LIST_URL)
            .set('kbn-xsrf', 'true')
            .send(getCreateMinimalListSchemaMock())
            .expect(200);

          // create an exception list
          const { body: exceptionListBody } = await supertest
            .post(EXCEPTION_LIST_URL)
            .set('kbn-xsrf', 'true')
            .send({ ...getCreateExceptionListMinimalSchemaMock(), type: DETECTION_TYPE })
            .expect(200);

          // create an exception list item referencing value list
          await supertest
            .post(EXCEPTION_LIST_ITEM_URL)
            .set('kbn-xsrf', 'true')
            .send({
              ...getCreateExceptionListItemMinimalSchemaMockWithoutId(),
              list_id: exceptionListBody.list_id,
              entries: [
                {
                  field: 'some.not.nested.field',
                  operator: 'included',
                  type: 'list',
                  list: { id: valueListBody.id, type: 'keyword' },
                },
              ],
            })
            .expect(200);

          // delete that list by its auto-generated id and ignoreReferences
          supertest
            .delete(`${LIST_URL}?id=${valueListBody.id}&ignoreReferences=true`)
            .set('kbn-xsrf', 'true')
            .expect(409);
        });

        // Tests in development
        it.skip('should delete a single list referenced within an exception list item and referenced exception list items if deleteReferences=true', async () => {
          // create a list
          const { body: valueListBody } = await supertest
            .post(LIST_URL)
            .set('kbn-xsrf', 'true')
            .send(getCreateMinimalListSchemaMock())
            .expect(200);

          // create an exception list
          const { body: exceptionListBody } = await supertest
            .post(EXCEPTION_LIST_URL)
            .set('kbn-xsrf', 'true')
            .send({ ...getCreateExceptionListMinimalSchemaMock(), type: DETECTION_TYPE })
            .expect(200);

          // create an exception list item referencing value list
          await supertest
            .post(EXCEPTION_LIST_ITEM_URL)
            .set('kbn-xsrf', 'true')
            .send({
              ...getCreateExceptionListItemMinimalSchemaMockWithoutId(),
              list_id: exceptionListBody.list_id,
              entries: [
                {
                  field: 'some.not.nested.field',
                  operator: 'included',
                  type: 'list',
                  list: { id: valueListBody.id, type: 'keyword' },
                },
              ],
            })
            .expect(200);

          // delete that list by its auto-generated id and delete referenced list items
          const deleteListBody = await supertest
            .delete(`${LIST_URL}?id=${valueListBody.id}&ignoreReferences=true`)
            .set('kbn-xsrf', 'true');

          const bodyToCompare = removeListServerGeneratedProperties(deleteListBody.body);
          expect(bodyToCompare).to.eql(getListResponseMockWithoutAutoGeneratedValues());

          await supertest
            .get(`${LIST_ITEM_URL}/_find?list_id=${LIST_ID}`)
            .set('kbn-xsrf', 'true')
            .send()
            .expect(200);
        });
      });
    });
  });
};
