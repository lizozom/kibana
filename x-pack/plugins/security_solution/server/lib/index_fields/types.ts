/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { IFieldSubType } from '@kbn/es-query';
import { FrameworkRequest } from '../framework';

export interface FieldsAdapter {
  getIndexFields(req: FrameworkRequest, indices: string[]): Promise<string[]>;
}

export interface IndexFieldDescriptor {
  name: string;
  type: string;
  searchable: boolean;
  aggregatable: boolean;
  esTypes?: string[];
  subType?: IFieldSubType;
}
