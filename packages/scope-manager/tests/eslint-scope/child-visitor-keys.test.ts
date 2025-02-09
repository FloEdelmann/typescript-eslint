import type { TSESTree } from '@typescript-eslint/types';

import { analyze } from '../../src/analyze';
import { parse } from '../test-utils';

describe('childVisitorKeys option', () => {
  it('should not visit to properties which are not given.', () => {
    const ast = parse(`
      let foo = bar;
    `);

    const decl = ast.body[0] as TSESTree.VariableDeclaration;
    decl.declarations[0].init = {
      argument: decl.declarations[0].init,
      type: 'TestNode',
    } as never;

    const result = analyze(ast, {
      childVisitorKeys: {
        TestNode: [],
      },
    });

    expect(result.scopes).toHaveLength(1);
    const globalScope = result.scopes[0];

    // `bar` in TestNode has not been visited.
    expect(globalScope.through).toHaveLength(0);
  });

  it('should visit to given properties.', () => {
    const ast = parse(`
      let foo = bar;
    `);

    const decl = ast.body[0] as TSESTree.VariableDeclaration;
    decl.declarations[0].init = {
      argument: decl.declarations[0].init,
      type: 'TestNode',
    } as never;

    const result = analyze(ast, {
      childVisitorKeys: {
        TestNode: ['argument'],
      },
    });

    expect(result.scopes).toHaveLength(1);
    const globalScope = result.scopes[0];

    // `bar` in TestNode has been visited.
    expect(globalScope.through).toHaveLength(1);
    expect(globalScope.through[0].identifier.name).toBe('bar');
  });
});
