/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { fromKueryExpression } from './ast';

jest.mock('./grammar');

describe('kql syntax errors', () => {
  it('should throw an error for a field query missing a value', () => {
    expect(() => {
      fromKueryExpression('response:');
    }).toThrow(
      'Expected whitespace, , whitespace, , value, whitespace, , whitespace, , value, whitespace, , whitespace, , value, whitespace, , whitespace, , value but end of input found.\n' +
        'response:\n' +
        '---------^'
    );
  });

  it('should throw an error for an OR query missing a right side sub-query', () => {
    expect(() => {
      fromKueryExpression('response:200 or ');
    }).toThrow(
      'Expected NOT, , field name, field name, field name, value, NOT, , field name, field name, field name, value but end of input found.\n' +
        'response:200 or \n' +
        '----------------^'
    );
  });

  it('should throw an error for an OR list of values missing a right side sub-query', () => {
    expect(() => {
      fromKueryExpression('response:(200 or )');
    }).toThrow(
      'Expected NOT, , value, NOT, , value, NOT, , value, NOT, , value, NOT, , value, NOT, , value, NOT, , value, NOT, , value but ")" found.\n' +
        'response:(200 or )\n' +
        '-----------------^'
    );
  });

  it('should throw an error for a NOT query missing a sub-query', () => {
    expect(() => {
      fromKueryExpression('response:200 and not ');
    }).toThrow(
      'Expected , field name, field name, field name, value, , field name, field name, field name, value but end of input found.\n' +
        'response:200 and not \n' +
        '---------------------^'
    );
  });

  it('should throw an error for a NOT list missing a sub-query', () => {
    expect(() => {
      fromKueryExpression('response:(200 and not )');
    }).toThrow(
      'Expected , value, , value, , value, , value, , value, , value, , value, , value but ")" found.\n' +
        'response:(200 and not )\n' +
        '----------------------^'
    );
  });

  it('should throw an error for unbalanced quotes', () => {
    expect(() => {
      fromKueryExpression('foo:"ba ');
    }).toThrow(
      'Expected whitespace, , whitespace, , value, whitespace, , whitespace, , value, whitespace, , whitespace, , value, whitespace, , whitespace, , value but """ found.\n' +
        'foo:"ba \n' +
        '----^'
    );
  });

  it('should throw an error for unescaped quotes in a quoted string', () => {
    expect(() => {
      fromKueryExpression('foo:"ba "r"');
    }).toThrow(
      'Expected AND, OR, AND, whitespace,  but "r" found.\n' + 'foo:"ba "r"\n' + '---------^'
    );
  });

  it('should throw an error for unescaped special characters in literals', () => {
    expect(() => {
      fromKueryExpression('foo:ba:r');
    }).toThrow('Expected AND, OR, AND, whitespace,  but ":" found.\n' + 'foo:ba:r\n' + '------^');
  });

  it('should throw an error for range queries missing a value', () => {
    expect(() => {
      fromKueryExpression('foo > ');
    }).toThrow(
      'Expected whitespace, literal, whitespace, literal, whitespace, literal, whitespace, literal but end of input found.\n' +
        'foo > \n' +
        '------^'
    );
  });

  it('should throw an error for range queries missing a field', () => {
    expect(() => {
      fromKueryExpression('< 1000');
    }).toThrow(
      'Expected whitespace, NOT, , field name, field name, field name, value, NOT, , field name, field name, field name, value, NOT, , field name, field name, field name, value, NOT, , field name, field name, field name, value, whitespace,  but "<" found.\n' +
        '< 1000\n' +
        '^'
    );
  });
});
