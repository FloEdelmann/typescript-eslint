import type { TSESTree } from '@typescript-eslint/types';

import { AST_NODE_TYPES } from '@typescript-eslint/types';
import { simpleTraverse } from '@typescript-eslint/typescript-estree';

import { parseAndAnalyze } from '../test-utils/index.js';

describe('variable definition', () => {
  it('defines a variable for a type declaration', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      type TypeDecl = string;
    `);

    const nodes: TSESTree.Node[] = [];

    simpleTraverse(
      ast,
      {
        visitors: {
          [AST_NODE_TYPES.TSTypeAliasDeclaration](node) {
            nodes.push(node);
          },
        },
      },
      true,
    );

    const node = nodes[0];

    assert.isNodeOfType(node, AST_NODE_TYPES.TSTypeAliasDeclaration);

    expect(scopeManager.getDeclaredVariables(node)).toMatchInlineSnapshot(`
      [
        Variable$2 {
          defs: [
            TypeDefinition$1 {
              name: Identifier<"TypeDecl">,
              node: TSTypeAliasDeclaration$1,
            },
          ],
          name: "TypeDecl",
          references: [],
          isValueVariable: false,
          isTypeVariable: true,
        },
      ]
    `);
  });

  it('defines a variable for an interface definition', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      interface InterfaceDecl {
        prop: string;
      }
    `);

    const nodes: TSESTree.Node[] = [];

    simpleTraverse(
      ast,
      {
        visitors: {
          [AST_NODE_TYPES.TSInterfaceDeclaration](node) {
            nodes.push(node);
          },
        },
      },
      true,
    );

    const node = nodes[0];

    assert.isNodeOfType(node, AST_NODE_TYPES.TSInterfaceDeclaration);

    expect(scopeManager.getDeclaredVariables(node)).toMatchInlineSnapshot(`
      [
        Variable$2 {
          defs: [
            TypeDefinition$1 {
              name: Identifier<"InterfaceDecl">,
              node: TSInterfaceDeclaration$1,
            },
          ],
          name: "InterfaceDecl",
          references: [],
          isValueVariable: false,
          isTypeVariable: true,
        },
      ]
    `);
  });

  it('defines a variable for a generic type', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      type TypeDecl<TypeParam> = string;
    `);

    const nodes: TSESTree.Node[] = [];

    simpleTraverse(
      ast,
      {
        visitors: {
          [AST_NODE_TYPES.TSTypeParameter](node) {
            nodes.push(node);
          },
        },
      },
      true,
    );

    const node = nodes[0];

    assert.isNodeOfType(node, AST_NODE_TYPES.TSTypeParameter);

    expect(scopeManager.getDeclaredVariables(node)).toMatchInlineSnapshot(`
      [
        Variable$3 {
          defs: [
            TypeDefinition$2 {
              name: Identifier<"TypeParam">,
              node: TSTypeParameter$1,
            },
          ],
          name: "TypeParam",
          references: [],
          isValueVariable: false,
          isTypeVariable: true,
        },
      ]
    `);
  });

  it('defines a variable for an inferred generic type', () => {
    const { ast, scopeManager } = parseAndAnalyze(`
      type TypeDecl<TypeParam> = TypeParam extends Foo<infer Inferred> ? Inferred : never;
    `);

    const nodes: TSESTree.Node[] = [];

    simpleTraverse(
      ast,
      {
        visitors: {
          [AST_NODE_TYPES.TSInferType](node) {
            assert.isNodeOfType(node, AST_NODE_TYPES.TSInferType);

            nodes.push(node.typeParameter);
          },
        },
      },
      true,
    );

    const node = nodes[0];

    assert.isNodeOfType(node, AST_NODE_TYPES.TSTypeParameter);

    expect(scopeManager.getDeclaredVariables(node)).toMatchInlineSnapshot(`
      [
        Variable$4 {
          defs: [
            TypeDefinition$3 {
              name: Identifier<"Inferred">,
              node: TSTypeParameter$1,
            },
          ],
          name: "Inferred",
          references: [
            Reference$3 {
              identifier: Identifier<"Inferred">,
              isRead: true,
              isTypeReference: true,
              isValueReference: false,
              isWrite: false,
              resolved: Variable$4,
            },
          ],
          isValueVariable: false,
          isTypeVariable: true,
        },
      ]
    `);
  });
});
