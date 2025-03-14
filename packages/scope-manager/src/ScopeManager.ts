import type { SourceType, TSESTree } from '@typescript-eslint/types';

import type { Scope } from './scope';
import type { Variable } from './variable';

import { assert } from './assert';
import {
  BlockScope,
  CatchScope,
  ClassScope,
  ConditionalTypeScope,
  ForScope,
  FunctionExpressionNameScope,
  FunctionScope,
  FunctionTypeScope,
  GlobalScope,
  MappedTypeScope,
  ModuleScope,
  ScopeType,
  SwitchScope,
  TSEnumScope,
  TSModuleScope,
  TypeScope,
  WithScope,
} from './scope';
import { ClassFieldInitializerScope } from './scope/ClassFieldInitializerScope';
import { ClassStaticBlockScope } from './scope/ClassStaticBlockScope';

interface ScopeManagerOptions {
  globalReturn?: boolean;
  impliedStrict?: boolean;
  sourceType?: SourceType;
}

/**
 * @see https://eslint.org/docs/latest/developer-guide/scope-manager-interface#scopemanager-interface
 */
export class ScopeManager {
  readonly #options: ScopeManagerOptions;

  public currentScope: Scope | null;

  public readonly declaredVariables: WeakMap<TSESTree.Node, Variable[]>;

  /**
   * The root scope
   */
  public globalScope: GlobalScope | null;

  public readonly nodeToScope: WeakMap<TSESTree.Node, Scope[]>;

  /**
   * All scopes
   * @public
   */
  public readonly scopes: Scope[];

  constructor(options: ScopeManagerOptions) {
    this.scopes = [];
    this.globalScope = null;
    this.nodeToScope = new WeakMap();
    this.currentScope = null;
    this.#options = options;
    this.declaredVariables = new WeakMap();
  }

  public isES6(): boolean {
    return true;
  }

  public isGlobalReturn(): boolean {
    return this.#options.globalReturn === true;
  }

  public isImpliedStrict(): boolean {
    return this.#options.impliedStrict === true;
  }

  public isModule(): boolean {
    return this.#options.sourceType === 'module';
  }

  public isStrictModeSupported(): boolean {
    return true;
  }

  public get variables(): Variable[] {
    const variables = new Set<Variable>();
    function recurse(scope: Scope): void {
      scope.variables.forEach(v => variables.add(v));
      scope.childScopes.forEach(recurse);
    }
    this.scopes.forEach(recurse);
    return [...variables].sort((a, b) => a.$id - b.$id);
  }

  /**
   * Get the variables that a given AST node defines. The gotten variables' `def[].node`/`def[].parent` property is the node.
   * If the node does not define any variable, this returns an empty array.
   * @param node An AST node to get their variables.
   */
  public getDeclaredVariables(node: TSESTree.Node): Variable[] {
    return this.declaredVariables.get(node) ?? [];
  }

  /**
   * Get the scope of a given AST node. The gotten scope's `block` property is the node.
   * This method never returns `function-expression-name` scope. If the node does not have their scope, this returns `null`.
   *
   * @param node An AST node to get their scope.
   * @param inner If the node has multiple scopes, this returns the outermost scope normally.
   *                If `inner` is `true` then this returns the innermost scope.
   */
  public acquire(node: TSESTree.Node, inner = false): Scope | null {
    function predicate(testScope: Scope): boolean {
      if (
        testScope.type === ScopeType.function &&
        testScope.functionExpressionScope
      ) {
        return false;
      }
      return true;
    }

    const scopes = this.nodeToScope.get(node);

    if (!scopes || scopes.length === 0) {
      return null;
    }

    // Heuristic selection from all scopes.
    // If you would like to get all scopes, please use ScopeManager#acquireAll.
    if (scopes.length === 1) {
      return scopes[0];
    }

    if (inner) {
      for (let i = scopes.length - 1; i >= 0; --i) {
        const scope = scopes[i];

        if (predicate(scope)) {
          return scope;
        }
      }
      return null;
    }
    return scopes.find(predicate) ?? null;
  }

  public nestBlockScope(node: BlockScope['block']): BlockScope {
    assert(this.currentScope);
    return this.nestScope(new BlockScope(this, this.currentScope, node));
  }

  public nestCatchScope(node: CatchScope['block']): CatchScope {
    assert(this.currentScope);
    return this.nestScope(new CatchScope(this, this.currentScope, node));
  }

  public nestClassFieldInitializerScope(
    node: ClassFieldInitializerScope['block'],
  ): ClassFieldInitializerScope {
    assert(this.currentScope);
    return this.nestScope(
      new ClassFieldInitializerScope(this, this.currentScope, node),
    );
  }

  public nestClassScope(node: ClassScope['block']): ClassScope {
    assert(this.currentScope);
    return this.nestScope(new ClassScope(this, this.currentScope, node));
  }

  public nestClassStaticBlockScope(
    node: ClassStaticBlockScope['block'],
  ): ClassStaticBlockScope {
    assert(this.currentScope);
    return this.nestScope(
      new ClassStaticBlockScope(this, this.currentScope, node),
    );
  }

  public nestConditionalTypeScope(
    node: ConditionalTypeScope['block'],
  ): ConditionalTypeScope {
    assert(this.currentScope);
    return this.nestScope(
      new ConditionalTypeScope(this, this.currentScope, node),
    );
  }

  public nestForScope(node: ForScope['block']): ForScope {
    assert(this.currentScope);
    return this.nestScope(new ForScope(this, this.currentScope, node));
  }

  public nestFunctionExpressionNameScope(
    node: FunctionExpressionNameScope['block'],
  ): FunctionExpressionNameScope {
    assert(this.currentScope);
    return this.nestScope(
      new FunctionExpressionNameScope(this, this.currentScope, node),
    );
  }

  public nestFunctionScope(
    node: FunctionScope['block'],
    isMethodDefinition: boolean,
  ): FunctionScope {
    assert(this.currentScope);
    return this.nestScope(
      new FunctionScope(this, this.currentScope, node, isMethodDefinition),
    );
  }

  public nestFunctionTypeScope(
    node: FunctionTypeScope['block'],
  ): FunctionTypeScope {
    assert(this.currentScope);
    return this.nestScope(new FunctionTypeScope(this, this.currentScope, node));
  }

  public nestGlobalScope(node: GlobalScope['block']): GlobalScope {
    return this.nestScope(new GlobalScope(this, node));
  }

  public nestMappedTypeScope(node: MappedTypeScope['block']): MappedTypeScope {
    assert(this.currentScope);
    return this.nestScope(new MappedTypeScope(this, this.currentScope, node));
  }

  public nestModuleScope(node: ModuleScope['block']): ModuleScope {
    assert(this.currentScope);
    return this.nestScope(new ModuleScope(this, this.currentScope, node));
  }

  public nestSwitchScope(node: SwitchScope['block']): SwitchScope {
    assert(this.currentScope);
    return this.nestScope(new SwitchScope(this, this.currentScope, node));
  }

  public nestTSEnumScope(node: TSEnumScope['block']): TSEnumScope {
    assert(this.currentScope);
    return this.nestScope(new TSEnumScope(this, this.currentScope, node));
  }

  public nestTSModuleScope(node: TSModuleScope['block']): TSModuleScope {
    assert(this.currentScope);
    return this.nestScope(new TSModuleScope(this, this.currentScope, node));
  }

  public nestTypeScope(node: TypeScope['block']): TypeScope {
    assert(this.currentScope);
    return this.nestScope(new TypeScope(this, this.currentScope, node));
  }

  public nestWithScope(node: WithScope['block']): WithScope {
    assert(this.currentScope);
    return this.nestScope(new WithScope(this, this.currentScope, node));
  }

  // Scope helpers

  protected nestScope<T extends Scope>(scope: T): T;
  protected nestScope(scope: Scope): Scope {
    if (scope instanceof GlobalScope) {
      assert(this.currentScope == null);
      this.globalScope = scope;
    }
    this.currentScope = scope;
    return scope;
  }
}
