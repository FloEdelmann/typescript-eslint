// THIS CODE WAS AUTOMATICALLY GENERATED
// DO NOT EDIT THIS CODE BY HAND
// RUN THE FOLLOWING COMMAND FROM THE WORKSPACE ROOT TO REGENERATE:
// npx nx generate-lib repo

import type { ImplicitLibVariableOptions } from '../variable';

import { TYPE, TYPE_VALUE } from './base-config';
import { es2015_symbol } from './es2015.symbol';
import { es2015_symbol_wellknown } from './es2015.symbol.wellknown';

export const es2017_sharedmemory = {
  ...es2015_symbol,
  ...es2015_symbol_wellknown,
  ArrayBufferTypes: TYPE,
  Atomics: TYPE_VALUE,
  SharedArrayBuffer: TYPE_VALUE,
  SharedArrayBufferConstructor: TYPE,
} as Record<string, ImplicitLibVariableOptions>;
