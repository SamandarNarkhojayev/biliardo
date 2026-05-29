
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model ActivityLog
 * Аудит: одна запись на проксированный через gateway запрос.
 */
export type ActivityLog = $Result.DefaultSelection<Prisma.$ActivityLogPayload>
/**
 * Model ServiceHealthSample
 * Сэмплы пинга сервисов — для графиков латентности/аптайма.
 */
export type ServiceHealthSample = $Result.DefaultSelection<Prisma.$ServiceHealthSamplePayload>
/**
 * Model AlertLog
 * Журнал алертов (ошибки/аномалии/падения). notified=true когда отправлен в Telegram.
 */
export type AlertLog = $Result.DefaultSelection<Prisma.$AlertLogPayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more ActivityLogs
 * const activityLogs = await prisma.activityLog.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more ActivityLogs
   * const activityLogs = await prisma.activityLog.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.activityLog`: Exposes CRUD operations for the **ActivityLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ActivityLogs
    * const activityLogs = await prisma.activityLog.findMany()
    * ```
    */
  get activityLog(): Prisma.ActivityLogDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.serviceHealthSample`: Exposes CRUD operations for the **ServiceHealthSample** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ServiceHealthSamples
    * const serviceHealthSamples = await prisma.serviceHealthSample.findMany()
    * ```
    */
  get serviceHealthSample(): Prisma.ServiceHealthSampleDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.alertLog`: Exposes CRUD operations for the **AlertLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AlertLogs
    * const alertLogs = await prisma.alertLog.findMany()
    * ```
    */
  get alertLog(): Prisma.AlertLogDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    ActivityLog: 'ActivityLog',
    ServiceHealthSample: 'ServiceHealthSample',
    AlertLog: 'AlertLog'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "activityLog" | "serviceHealthSample" | "alertLog"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      ActivityLog: {
        payload: Prisma.$ActivityLogPayload<ExtArgs>
        fields: Prisma.ActivityLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ActivityLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ActivityLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogPayload>
          }
          findFirst: {
            args: Prisma.ActivityLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ActivityLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogPayload>
          }
          findMany: {
            args: Prisma.ActivityLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogPayload>[]
          }
          create: {
            args: Prisma.ActivityLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogPayload>
          }
          createMany: {
            args: Prisma.ActivityLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ActivityLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogPayload>[]
          }
          delete: {
            args: Prisma.ActivityLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogPayload>
          }
          update: {
            args: Prisma.ActivityLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogPayload>
          }
          deleteMany: {
            args: Prisma.ActivityLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ActivityLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ActivityLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogPayload>[]
          }
          upsert: {
            args: Prisma.ActivityLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ActivityLogPayload>
          }
          aggregate: {
            args: Prisma.ActivityLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateActivityLog>
          }
          groupBy: {
            args: Prisma.ActivityLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<ActivityLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.ActivityLogCountArgs<ExtArgs>
            result: $Utils.Optional<ActivityLogCountAggregateOutputType> | number
          }
        }
      }
      ServiceHealthSample: {
        payload: Prisma.$ServiceHealthSamplePayload<ExtArgs>
        fields: Prisma.ServiceHealthSampleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ServiceHealthSampleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceHealthSamplePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ServiceHealthSampleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceHealthSamplePayload>
          }
          findFirst: {
            args: Prisma.ServiceHealthSampleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceHealthSamplePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ServiceHealthSampleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceHealthSamplePayload>
          }
          findMany: {
            args: Prisma.ServiceHealthSampleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceHealthSamplePayload>[]
          }
          create: {
            args: Prisma.ServiceHealthSampleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceHealthSamplePayload>
          }
          createMany: {
            args: Prisma.ServiceHealthSampleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ServiceHealthSampleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceHealthSamplePayload>[]
          }
          delete: {
            args: Prisma.ServiceHealthSampleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceHealthSamplePayload>
          }
          update: {
            args: Prisma.ServiceHealthSampleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceHealthSamplePayload>
          }
          deleteMany: {
            args: Prisma.ServiceHealthSampleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ServiceHealthSampleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ServiceHealthSampleUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceHealthSamplePayload>[]
          }
          upsert: {
            args: Prisma.ServiceHealthSampleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ServiceHealthSamplePayload>
          }
          aggregate: {
            args: Prisma.ServiceHealthSampleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateServiceHealthSample>
          }
          groupBy: {
            args: Prisma.ServiceHealthSampleGroupByArgs<ExtArgs>
            result: $Utils.Optional<ServiceHealthSampleGroupByOutputType>[]
          }
          count: {
            args: Prisma.ServiceHealthSampleCountArgs<ExtArgs>
            result: $Utils.Optional<ServiceHealthSampleCountAggregateOutputType> | number
          }
        }
      }
      AlertLog: {
        payload: Prisma.$AlertLogPayload<ExtArgs>
        fields: Prisma.AlertLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AlertLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AlertLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertLogPayload>
          }
          findFirst: {
            args: Prisma.AlertLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AlertLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertLogPayload>
          }
          findMany: {
            args: Prisma.AlertLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertLogPayload>[]
          }
          create: {
            args: Prisma.AlertLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertLogPayload>
          }
          createMany: {
            args: Prisma.AlertLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AlertLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertLogPayload>[]
          }
          delete: {
            args: Prisma.AlertLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertLogPayload>
          }
          update: {
            args: Prisma.AlertLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertLogPayload>
          }
          deleteMany: {
            args: Prisma.AlertLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AlertLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AlertLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertLogPayload>[]
          }
          upsert: {
            args: Prisma.AlertLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AlertLogPayload>
          }
          aggregate: {
            args: Prisma.AlertLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAlertLog>
          }
          groupBy: {
            args: Prisma.AlertLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<AlertLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.AlertLogCountArgs<ExtArgs>
            result: $Utils.Optional<AlertLogCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    activityLog?: ActivityLogOmit
    serviceHealthSample?: ServiceHealthSampleOmit
    alertLog?: AlertLogOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model ActivityLog
   */

  export type AggregateActivityLog = {
    _count: ActivityLogCountAggregateOutputType | null
    _avg: ActivityLogAvgAggregateOutputType | null
    _sum: ActivityLogSumAggregateOutputType | null
    _min: ActivityLogMinAggregateOutputType | null
    _max: ActivityLogMaxAggregateOutputType | null
  }

  export type ActivityLogAvgAggregateOutputType = {
    statusCode: number | null
    durationMs: number | null
  }

  export type ActivityLogSumAggregateOutputType = {
    statusCode: number | null
    durationMs: number | null
  }

  export type ActivityLogMinAggregateOutputType = {
    id: string | null
    userId: string | null
    userName: string | null
    role: string | null
    method: string | null
    path: string | null
    statusCode: number | null
    ip: string | null
    userAgent: string | null
    durationMs: number | null
    createdAt: Date | null
  }

  export type ActivityLogMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    userName: string | null
    role: string | null
    method: string | null
    path: string | null
    statusCode: number | null
    ip: string | null
    userAgent: string | null
    durationMs: number | null
    createdAt: Date | null
  }

  export type ActivityLogCountAggregateOutputType = {
    id: number
    userId: number
    userName: number
    role: number
    method: number
    path: number
    statusCode: number
    ip: number
    userAgent: number
    durationMs: number
    createdAt: number
    _all: number
  }


  export type ActivityLogAvgAggregateInputType = {
    statusCode?: true
    durationMs?: true
  }

  export type ActivityLogSumAggregateInputType = {
    statusCode?: true
    durationMs?: true
  }

  export type ActivityLogMinAggregateInputType = {
    id?: true
    userId?: true
    userName?: true
    role?: true
    method?: true
    path?: true
    statusCode?: true
    ip?: true
    userAgent?: true
    durationMs?: true
    createdAt?: true
  }

  export type ActivityLogMaxAggregateInputType = {
    id?: true
    userId?: true
    userName?: true
    role?: true
    method?: true
    path?: true
    statusCode?: true
    ip?: true
    userAgent?: true
    durationMs?: true
    createdAt?: true
  }

  export type ActivityLogCountAggregateInputType = {
    id?: true
    userId?: true
    userName?: true
    role?: true
    method?: true
    path?: true
    statusCode?: true
    ip?: true
    userAgent?: true
    durationMs?: true
    createdAt?: true
    _all?: true
  }

  export type ActivityLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ActivityLog to aggregate.
     */
    where?: ActivityLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ActivityLogs to fetch.
     */
    orderBy?: ActivityLogOrderByWithRelationInput | ActivityLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ActivityLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ActivityLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ActivityLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ActivityLogs
    **/
    _count?: true | ActivityLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ActivityLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ActivityLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ActivityLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ActivityLogMaxAggregateInputType
  }

  export type GetActivityLogAggregateType<T extends ActivityLogAggregateArgs> = {
        [P in keyof T & keyof AggregateActivityLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateActivityLog[P]>
      : GetScalarType<T[P], AggregateActivityLog[P]>
  }




  export type ActivityLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ActivityLogWhereInput
    orderBy?: ActivityLogOrderByWithAggregationInput | ActivityLogOrderByWithAggregationInput[]
    by: ActivityLogScalarFieldEnum[] | ActivityLogScalarFieldEnum
    having?: ActivityLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ActivityLogCountAggregateInputType | true
    _avg?: ActivityLogAvgAggregateInputType
    _sum?: ActivityLogSumAggregateInputType
    _min?: ActivityLogMinAggregateInputType
    _max?: ActivityLogMaxAggregateInputType
  }

  export type ActivityLogGroupByOutputType = {
    id: string
    userId: string | null
    userName: string | null
    role: string | null
    method: string
    path: string
    statusCode: number | null
    ip: string | null
    userAgent: string | null
    durationMs: number | null
    createdAt: Date
    _count: ActivityLogCountAggregateOutputType | null
    _avg: ActivityLogAvgAggregateOutputType | null
    _sum: ActivityLogSumAggregateOutputType | null
    _min: ActivityLogMinAggregateOutputType | null
    _max: ActivityLogMaxAggregateOutputType | null
  }

  type GetActivityLogGroupByPayload<T extends ActivityLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ActivityLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ActivityLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ActivityLogGroupByOutputType[P]>
            : GetScalarType<T[P], ActivityLogGroupByOutputType[P]>
        }
      >
    >


  export type ActivityLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    userName?: boolean
    role?: boolean
    method?: boolean
    path?: boolean
    statusCode?: boolean
    ip?: boolean
    userAgent?: boolean
    durationMs?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["activityLog"]>

  export type ActivityLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    userName?: boolean
    role?: boolean
    method?: boolean
    path?: boolean
    statusCode?: boolean
    ip?: boolean
    userAgent?: boolean
    durationMs?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["activityLog"]>

  export type ActivityLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    userName?: boolean
    role?: boolean
    method?: boolean
    path?: boolean
    statusCode?: boolean
    ip?: boolean
    userAgent?: boolean
    durationMs?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["activityLog"]>

  export type ActivityLogSelectScalar = {
    id?: boolean
    userId?: boolean
    userName?: boolean
    role?: boolean
    method?: boolean
    path?: boolean
    statusCode?: boolean
    ip?: boolean
    userAgent?: boolean
    durationMs?: boolean
    createdAt?: boolean
  }

  export type ActivityLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "userId" | "userName" | "role" | "method" | "path" | "statusCode" | "ip" | "userAgent" | "durationMs" | "createdAt", ExtArgs["result"]["activityLog"]>

  export type $ActivityLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ActivityLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string | null
      userName: string | null
      role: string | null
      method: string
      path: string
      statusCode: number | null
      ip: string | null
      userAgent: string | null
      durationMs: number | null
      createdAt: Date
    }, ExtArgs["result"]["activityLog"]>
    composites: {}
  }

  type ActivityLogGetPayload<S extends boolean | null | undefined | ActivityLogDefaultArgs> = $Result.GetResult<Prisma.$ActivityLogPayload, S>

  type ActivityLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ActivityLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ActivityLogCountAggregateInputType | true
    }

  export interface ActivityLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ActivityLog'], meta: { name: 'ActivityLog' } }
    /**
     * Find zero or one ActivityLog that matches the filter.
     * @param {ActivityLogFindUniqueArgs} args - Arguments to find a ActivityLog
     * @example
     * // Get one ActivityLog
     * const activityLog = await prisma.activityLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ActivityLogFindUniqueArgs>(args: SelectSubset<T, ActivityLogFindUniqueArgs<ExtArgs>>): Prisma__ActivityLogClient<$Result.GetResult<Prisma.$ActivityLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ActivityLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ActivityLogFindUniqueOrThrowArgs} args - Arguments to find a ActivityLog
     * @example
     * // Get one ActivityLog
     * const activityLog = await prisma.activityLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ActivityLogFindUniqueOrThrowArgs>(args: SelectSubset<T, ActivityLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ActivityLogClient<$Result.GetResult<Prisma.$ActivityLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ActivityLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityLogFindFirstArgs} args - Arguments to find a ActivityLog
     * @example
     * // Get one ActivityLog
     * const activityLog = await prisma.activityLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ActivityLogFindFirstArgs>(args?: SelectSubset<T, ActivityLogFindFirstArgs<ExtArgs>>): Prisma__ActivityLogClient<$Result.GetResult<Prisma.$ActivityLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ActivityLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityLogFindFirstOrThrowArgs} args - Arguments to find a ActivityLog
     * @example
     * // Get one ActivityLog
     * const activityLog = await prisma.activityLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ActivityLogFindFirstOrThrowArgs>(args?: SelectSubset<T, ActivityLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__ActivityLogClient<$Result.GetResult<Prisma.$ActivityLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ActivityLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ActivityLogs
     * const activityLogs = await prisma.activityLog.findMany()
     * 
     * // Get first 10 ActivityLogs
     * const activityLogs = await prisma.activityLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const activityLogWithIdOnly = await prisma.activityLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ActivityLogFindManyArgs>(args?: SelectSubset<T, ActivityLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ActivityLog.
     * @param {ActivityLogCreateArgs} args - Arguments to create a ActivityLog.
     * @example
     * // Create one ActivityLog
     * const ActivityLog = await prisma.activityLog.create({
     *   data: {
     *     // ... data to create a ActivityLog
     *   }
     * })
     * 
     */
    create<T extends ActivityLogCreateArgs>(args: SelectSubset<T, ActivityLogCreateArgs<ExtArgs>>): Prisma__ActivityLogClient<$Result.GetResult<Prisma.$ActivityLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ActivityLogs.
     * @param {ActivityLogCreateManyArgs} args - Arguments to create many ActivityLogs.
     * @example
     * // Create many ActivityLogs
     * const activityLog = await prisma.activityLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ActivityLogCreateManyArgs>(args?: SelectSubset<T, ActivityLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ActivityLogs and returns the data saved in the database.
     * @param {ActivityLogCreateManyAndReturnArgs} args - Arguments to create many ActivityLogs.
     * @example
     * // Create many ActivityLogs
     * const activityLog = await prisma.activityLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ActivityLogs and only return the `id`
     * const activityLogWithIdOnly = await prisma.activityLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ActivityLogCreateManyAndReturnArgs>(args?: SelectSubset<T, ActivityLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ActivityLog.
     * @param {ActivityLogDeleteArgs} args - Arguments to delete one ActivityLog.
     * @example
     * // Delete one ActivityLog
     * const ActivityLog = await prisma.activityLog.delete({
     *   where: {
     *     // ... filter to delete one ActivityLog
     *   }
     * })
     * 
     */
    delete<T extends ActivityLogDeleteArgs>(args: SelectSubset<T, ActivityLogDeleteArgs<ExtArgs>>): Prisma__ActivityLogClient<$Result.GetResult<Prisma.$ActivityLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ActivityLog.
     * @param {ActivityLogUpdateArgs} args - Arguments to update one ActivityLog.
     * @example
     * // Update one ActivityLog
     * const activityLog = await prisma.activityLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ActivityLogUpdateArgs>(args: SelectSubset<T, ActivityLogUpdateArgs<ExtArgs>>): Prisma__ActivityLogClient<$Result.GetResult<Prisma.$ActivityLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ActivityLogs.
     * @param {ActivityLogDeleteManyArgs} args - Arguments to filter ActivityLogs to delete.
     * @example
     * // Delete a few ActivityLogs
     * const { count } = await prisma.activityLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ActivityLogDeleteManyArgs>(args?: SelectSubset<T, ActivityLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ActivityLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ActivityLogs
     * const activityLog = await prisma.activityLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ActivityLogUpdateManyArgs>(args: SelectSubset<T, ActivityLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ActivityLogs and returns the data updated in the database.
     * @param {ActivityLogUpdateManyAndReturnArgs} args - Arguments to update many ActivityLogs.
     * @example
     * // Update many ActivityLogs
     * const activityLog = await prisma.activityLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ActivityLogs and only return the `id`
     * const activityLogWithIdOnly = await prisma.activityLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ActivityLogUpdateManyAndReturnArgs>(args: SelectSubset<T, ActivityLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ActivityLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ActivityLog.
     * @param {ActivityLogUpsertArgs} args - Arguments to update or create a ActivityLog.
     * @example
     * // Update or create a ActivityLog
     * const activityLog = await prisma.activityLog.upsert({
     *   create: {
     *     // ... data to create a ActivityLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ActivityLog we want to update
     *   }
     * })
     */
    upsert<T extends ActivityLogUpsertArgs>(args: SelectSubset<T, ActivityLogUpsertArgs<ExtArgs>>): Prisma__ActivityLogClient<$Result.GetResult<Prisma.$ActivityLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ActivityLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityLogCountArgs} args - Arguments to filter ActivityLogs to count.
     * @example
     * // Count the number of ActivityLogs
     * const count = await prisma.activityLog.count({
     *   where: {
     *     // ... the filter for the ActivityLogs we want to count
     *   }
     * })
    **/
    count<T extends ActivityLogCountArgs>(
      args?: Subset<T, ActivityLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ActivityLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ActivityLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ActivityLogAggregateArgs>(args: Subset<T, ActivityLogAggregateArgs>): Prisma.PrismaPromise<GetActivityLogAggregateType<T>>

    /**
     * Group by ActivityLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ActivityLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ActivityLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ActivityLogGroupByArgs['orderBy'] }
        : { orderBy?: ActivityLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ActivityLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetActivityLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ActivityLog model
   */
  readonly fields: ActivityLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ActivityLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ActivityLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ActivityLog model
   */
  interface ActivityLogFieldRefs {
    readonly id: FieldRef<"ActivityLog", 'String'>
    readonly userId: FieldRef<"ActivityLog", 'String'>
    readonly userName: FieldRef<"ActivityLog", 'String'>
    readonly role: FieldRef<"ActivityLog", 'String'>
    readonly method: FieldRef<"ActivityLog", 'String'>
    readonly path: FieldRef<"ActivityLog", 'String'>
    readonly statusCode: FieldRef<"ActivityLog", 'Int'>
    readonly ip: FieldRef<"ActivityLog", 'String'>
    readonly userAgent: FieldRef<"ActivityLog", 'String'>
    readonly durationMs: FieldRef<"ActivityLog", 'Int'>
    readonly createdAt: FieldRef<"ActivityLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ActivityLog findUnique
   */
  export type ActivityLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLog
     */
    select?: ActivityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLog
     */
    omit?: ActivityLogOmit<ExtArgs> | null
    /**
     * Filter, which ActivityLog to fetch.
     */
    where: ActivityLogWhereUniqueInput
  }

  /**
   * ActivityLog findUniqueOrThrow
   */
  export type ActivityLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLog
     */
    select?: ActivityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLog
     */
    omit?: ActivityLogOmit<ExtArgs> | null
    /**
     * Filter, which ActivityLog to fetch.
     */
    where: ActivityLogWhereUniqueInput
  }

  /**
   * ActivityLog findFirst
   */
  export type ActivityLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLog
     */
    select?: ActivityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLog
     */
    omit?: ActivityLogOmit<ExtArgs> | null
    /**
     * Filter, which ActivityLog to fetch.
     */
    where?: ActivityLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ActivityLogs to fetch.
     */
    orderBy?: ActivityLogOrderByWithRelationInput | ActivityLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ActivityLogs.
     */
    cursor?: ActivityLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ActivityLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ActivityLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ActivityLogs.
     */
    distinct?: ActivityLogScalarFieldEnum | ActivityLogScalarFieldEnum[]
  }

  /**
   * ActivityLog findFirstOrThrow
   */
  export type ActivityLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLog
     */
    select?: ActivityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLog
     */
    omit?: ActivityLogOmit<ExtArgs> | null
    /**
     * Filter, which ActivityLog to fetch.
     */
    where?: ActivityLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ActivityLogs to fetch.
     */
    orderBy?: ActivityLogOrderByWithRelationInput | ActivityLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ActivityLogs.
     */
    cursor?: ActivityLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ActivityLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ActivityLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ActivityLogs.
     */
    distinct?: ActivityLogScalarFieldEnum | ActivityLogScalarFieldEnum[]
  }

  /**
   * ActivityLog findMany
   */
  export type ActivityLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLog
     */
    select?: ActivityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLog
     */
    omit?: ActivityLogOmit<ExtArgs> | null
    /**
     * Filter, which ActivityLogs to fetch.
     */
    where?: ActivityLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ActivityLogs to fetch.
     */
    orderBy?: ActivityLogOrderByWithRelationInput | ActivityLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ActivityLogs.
     */
    cursor?: ActivityLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ActivityLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ActivityLogs.
     */
    skip?: number
    distinct?: ActivityLogScalarFieldEnum | ActivityLogScalarFieldEnum[]
  }

  /**
   * ActivityLog create
   */
  export type ActivityLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLog
     */
    select?: ActivityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLog
     */
    omit?: ActivityLogOmit<ExtArgs> | null
    /**
     * The data needed to create a ActivityLog.
     */
    data: XOR<ActivityLogCreateInput, ActivityLogUncheckedCreateInput>
  }

  /**
   * ActivityLog createMany
   */
  export type ActivityLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ActivityLogs.
     */
    data: ActivityLogCreateManyInput | ActivityLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ActivityLog createManyAndReturn
   */
  export type ActivityLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLog
     */
    select?: ActivityLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLog
     */
    omit?: ActivityLogOmit<ExtArgs> | null
    /**
     * The data used to create many ActivityLogs.
     */
    data: ActivityLogCreateManyInput | ActivityLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ActivityLog update
   */
  export type ActivityLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLog
     */
    select?: ActivityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLog
     */
    omit?: ActivityLogOmit<ExtArgs> | null
    /**
     * The data needed to update a ActivityLog.
     */
    data: XOR<ActivityLogUpdateInput, ActivityLogUncheckedUpdateInput>
    /**
     * Choose, which ActivityLog to update.
     */
    where: ActivityLogWhereUniqueInput
  }

  /**
   * ActivityLog updateMany
   */
  export type ActivityLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ActivityLogs.
     */
    data: XOR<ActivityLogUpdateManyMutationInput, ActivityLogUncheckedUpdateManyInput>
    /**
     * Filter which ActivityLogs to update
     */
    where?: ActivityLogWhereInput
    /**
     * Limit how many ActivityLogs to update.
     */
    limit?: number
  }

  /**
   * ActivityLog updateManyAndReturn
   */
  export type ActivityLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLog
     */
    select?: ActivityLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLog
     */
    omit?: ActivityLogOmit<ExtArgs> | null
    /**
     * The data used to update ActivityLogs.
     */
    data: XOR<ActivityLogUpdateManyMutationInput, ActivityLogUncheckedUpdateManyInput>
    /**
     * Filter which ActivityLogs to update
     */
    where?: ActivityLogWhereInput
    /**
     * Limit how many ActivityLogs to update.
     */
    limit?: number
  }

  /**
   * ActivityLog upsert
   */
  export type ActivityLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLog
     */
    select?: ActivityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLog
     */
    omit?: ActivityLogOmit<ExtArgs> | null
    /**
     * The filter to search for the ActivityLog to update in case it exists.
     */
    where: ActivityLogWhereUniqueInput
    /**
     * In case the ActivityLog found by the `where` argument doesn't exist, create a new ActivityLog with this data.
     */
    create: XOR<ActivityLogCreateInput, ActivityLogUncheckedCreateInput>
    /**
     * In case the ActivityLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ActivityLogUpdateInput, ActivityLogUncheckedUpdateInput>
  }

  /**
   * ActivityLog delete
   */
  export type ActivityLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLog
     */
    select?: ActivityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLog
     */
    omit?: ActivityLogOmit<ExtArgs> | null
    /**
     * Filter which ActivityLog to delete.
     */
    where: ActivityLogWhereUniqueInput
  }

  /**
   * ActivityLog deleteMany
   */
  export type ActivityLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ActivityLogs to delete
     */
    where?: ActivityLogWhereInput
    /**
     * Limit how many ActivityLogs to delete.
     */
    limit?: number
  }

  /**
   * ActivityLog without action
   */
  export type ActivityLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ActivityLog
     */
    select?: ActivityLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ActivityLog
     */
    omit?: ActivityLogOmit<ExtArgs> | null
  }


  /**
   * Model ServiceHealthSample
   */

  export type AggregateServiceHealthSample = {
    _count: ServiceHealthSampleCountAggregateOutputType | null
    _avg: ServiceHealthSampleAvgAggregateOutputType | null
    _sum: ServiceHealthSampleSumAggregateOutputType | null
    _min: ServiceHealthSampleMinAggregateOutputType | null
    _max: ServiceHealthSampleMaxAggregateOutputType | null
  }

  export type ServiceHealthSampleAvgAggregateOutputType = {
    status: number | null
    latencyMs: number | null
  }

  export type ServiceHealthSampleSumAggregateOutputType = {
    status: number | null
    latencyMs: number | null
  }

  export type ServiceHealthSampleMinAggregateOutputType = {
    id: string | null
    service: string | null
    ok: boolean | null
    status: number | null
    latencyMs: number | null
    createdAt: Date | null
  }

  export type ServiceHealthSampleMaxAggregateOutputType = {
    id: string | null
    service: string | null
    ok: boolean | null
    status: number | null
    latencyMs: number | null
    createdAt: Date | null
  }

  export type ServiceHealthSampleCountAggregateOutputType = {
    id: number
    service: number
    ok: number
    status: number
    latencyMs: number
    createdAt: number
    _all: number
  }


  export type ServiceHealthSampleAvgAggregateInputType = {
    status?: true
    latencyMs?: true
  }

  export type ServiceHealthSampleSumAggregateInputType = {
    status?: true
    latencyMs?: true
  }

  export type ServiceHealthSampleMinAggregateInputType = {
    id?: true
    service?: true
    ok?: true
    status?: true
    latencyMs?: true
    createdAt?: true
  }

  export type ServiceHealthSampleMaxAggregateInputType = {
    id?: true
    service?: true
    ok?: true
    status?: true
    latencyMs?: true
    createdAt?: true
  }

  export type ServiceHealthSampleCountAggregateInputType = {
    id?: true
    service?: true
    ok?: true
    status?: true
    latencyMs?: true
    createdAt?: true
    _all?: true
  }

  export type ServiceHealthSampleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ServiceHealthSample to aggregate.
     */
    where?: ServiceHealthSampleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ServiceHealthSamples to fetch.
     */
    orderBy?: ServiceHealthSampleOrderByWithRelationInput | ServiceHealthSampleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ServiceHealthSampleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ServiceHealthSamples from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ServiceHealthSamples.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ServiceHealthSamples
    **/
    _count?: true | ServiceHealthSampleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ServiceHealthSampleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ServiceHealthSampleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ServiceHealthSampleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ServiceHealthSampleMaxAggregateInputType
  }

  export type GetServiceHealthSampleAggregateType<T extends ServiceHealthSampleAggregateArgs> = {
        [P in keyof T & keyof AggregateServiceHealthSample]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateServiceHealthSample[P]>
      : GetScalarType<T[P], AggregateServiceHealthSample[P]>
  }




  export type ServiceHealthSampleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ServiceHealthSampleWhereInput
    orderBy?: ServiceHealthSampleOrderByWithAggregationInput | ServiceHealthSampleOrderByWithAggregationInput[]
    by: ServiceHealthSampleScalarFieldEnum[] | ServiceHealthSampleScalarFieldEnum
    having?: ServiceHealthSampleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ServiceHealthSampleCountAggregateInputType | true
    _avg?: ServiceHealthSampleAvgAggregateInputType
    _sum?: ServiceHealthSampleSumAggregateInputType
    _min?: ServiceHealthSampleMinAggregateInputType
    _max?: ServiceHealthSampleMaxAggregateInputType
  }

  export type ServiceHealthSampleGroupByOutputType = {
    id: string
    service: string
    ok: boolean
    status: number | null
    latencyMs: number | null
    createdAt: Date
    _count: ServiceHealthSampleCountAggregateOutputType | null
    _avg: ServiceHealthSampleAvgAggregateOutputType | null
    _sum: ServiceHealthSampleSumAggregateOutputType | null
    _min: ServiceHealthSampleMinAggregateOutputType | null
    _max: ServiceHealthSampleMaxAggregateOutputType | null
  }

  type GetServiceHealthSampleGroupByPayload<T extends ServiceHealthSampleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ServiceHealthSampleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ServiceHealthSampleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ServiceHealthSampleGroupByOutputType[P]>
            : GetScalarType<T[P], ServiceHealthSampleGroupByOutputType[P]>
        }
      >
    >


  export type ServiceHealthSampleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    service?: boolean
    ok?: boolean
    status?: boolean
    latencyMs?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["serviceHealthSample"]>

  export type ServiceHealthSampleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    service?: boolean
    ok?: boolean
    status?: boolean
    latencyMs?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["serviceHealthSample"]>

  export type ServiceHealthSampleSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    service?: boolean
    ok?: boolean
    status?: boolean
    latencyMs?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["serviceHealthSample"]>

  export type ServiceHealthSampleSelectScalar = {
    id?: boolean
    service?: boolean
    ok?: boolean
    status?: boolean
    latencyMs?: boolean
    createdAt?: boolean
  }

  export type ServiceHealthSampleOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "service" | "ok" | "status" | "latencyMs" | "createdAt", ExtArgs["result"]["serviceHealthSample"]>

  export type $ServiceHealthSamplePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ServiceHealthSample"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      service: string
      ok: boolean
      status: number | null
      latencyMs: number | null
      createdAt: Date
    }, ExtArgs["result"]["serviceHealthSample"]>
    composites: {}
  }

  type ServiceHealthSampleGetPayload<S extends boolean | null | undefined | ServiceHealthSampleDefaultArgs> = $Result.GetResult<Prisma.$ServiceHealthSamplePayload, S>

  type ServiceHealthSampleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ServiceHealthSampleFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ServiceHealthSampleCountAggregateInputType | true
    }

  export interface ServiceHealthSampleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ServiceHealthSample'], meta: { name: 'ServiceHealthSample' } }
    /**
     * Find zero or one ServiceHealthSample that matches the filter.
     * @param {ServiceHealthSampleFindUniqueArgs} args - Arguments to find a ServiceHealthSample
     * @example
     * // Get one ServiceHealthSample
     * const serviceHealthSample = await prisma.serviceHealthSample.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ServiceHealthSampleFindUniqueArgs>(args: SelectSubset<T, ServiceHealthSampleFindUniqueArgs<ExtArgs>>): Prisma__ServiceHealthSampleClient<$Result.GetResult<Prisma.$ServiceHealthSamplePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ServiceHealthSample that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ServiceHealthSampleFindUniqueOrThrowArgs} args - Arguments to find a ServiceHealthSample
     * @example
     * // Get one ServiceHealthSample
     * const serviceHealthSample = await prisma.serviceHealthSample.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ServiceHealthSampleFindUniqueOrThrowArgs>(args: SelectSubset<T, ServiceHealthSampleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ServiceHealthSampleClient<$Result.GetResult<Prisma.$ServiceHealthSamplePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ServiceHealthSample that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServiceHealthSampleFindFirstArgs} args - Arguments to find a ServiceHealthSample
     * @example
     * // Get one ServiceHealthSample
     * const serviceHealthSample = await prisma.serviceHealthSample.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ServiceHealthSampleFindFirstArgs>(args?: SelectSubset<T, ServiceHealthSampleFindFirstArgs<ExtArgs>>): Prisma__ServiceHealthSampleClient<$Result.GetResult<Prisma.$ServiceHealthSamplePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ServiceHealthSample that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServiceHealthSampleFindFirstOrThrowArgs} args - Arguments to find a ServiceHealthSample
     * @example
     * // Get one ServiceHealthSample
     * const serviceHealthSample = await prisma.serviceHealthSample.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ServiceHealthSampleFindFirstOrThrowArgs>(args?: SelectSubset<T, ServiceHealthSampleFindFirstOrThrowArgs<ExtArgs>>): Prisma__ServiceHealthSampleClient<$Result.GetResult<Prisma.$ServiceHealthSamplePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ServiceHealthSamples that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServiceHealthSampleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ServiceHealthSamples
     * const serviceHealthSamples = await prisma.serviceHealthSample.findMany()
     * 
     * // Get first 10 ServiceHealthSamples
     * const serviceHealthSamples = await prisma.serviceHealthSample.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const serviceHealthSampleWithIdOnly = await prisma.serviceHealthSample.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ServiceHealthSampleFindManyArgs>(args?: SelectSubset<T, ServiceHealthSampleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ServiceHealthSamplePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ServiceHealthSample.
     * @param {ServiceHealthSampleCreateArgs} args - Arguments to create a ServiceHealthSample.
     * @example
     * // Create one ServiceHealthSample
     * const ServiceHealthSample = await prisma.serviceHealthSample.create({
     *   data: {
     *     // ... data to create a ServiceHealthSample
     *   }
     * })
     * 
     */
    create<T extends ServiceHealthSampleCreateArgs>(args: SelectSubset<T, ServiceHealthSampleCreateArgs<ExtArgs>>): Prisma__ServiceHealthSampleClient<$Result.GetResult<Prisma.$ServiceHealthSamplePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ServiceHealthSamples.
     * @param {ServiceHealthSampleCreateManyArgs} args - Arguments to create many ServiceHealthSamples.
     * @example
     * // Create many ServiceHealthSamples
     * const serviceHealthSample = await prisma.serviceHealthSample.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ServiceHealthSampleCreateManyArgs>(args?: SelectSubset<T, ServiceHealthSampleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ServiceHealthSamples and returns the data saved in the database.
     * @param {ServiceHealthSampleCreateManyAndReturnArgs} args - Arguments to create many ServiceHealthSamples.
     * @example
     * // Create many ServiceHealthSamples
     * const serviceHealthSample = await prisma.serviceHealthSample.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ServiceHealthSamples and only return the `id`
     * const serviceHealthSampleWithIdOnly = await prisma.serviceHealthSample.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ServiceHealthSampleCreateManyAndReturnArgs>(args?: SelectSubset<T, ServiceHealthSampleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ServiceHealthSamplePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ServiceHealthSample.
     * @param {ServiceHealthSampleDeleteArgs} args - Arguments to delete one ServiceHealthSample.
     * @example
     * // Delete one ServiceHealthSample
     * const ServiceHealthSample = await prisma.serviceHealthSample.delete({
     *   where: {
     *     // ... filter to delete one ServiceHealthSample
     *   }
     * })
     * 
     */
    delete<T extends ServiceHealthSampleDeleteArgs>(args: SelectSubset<T, ServiceHealthSampleDeleteArgs<ExtArgs>>): Prisma__ServiceHealthSampleClient<$Result.GetResult<Prisma.$ServiceHealthSamplePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ServiceHealthSample.
     * @param {ServiceHealthSampleUpdateArgs} args - Arguments to update one ServiceHealthSample.
     * @example
     * // Update one ServiceHealthSample
     * const serviceHealthSample = await prisma.serviceHealthSample.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ServiceHealthSampleUpdateArgs>(args: SelectSubset<T, ServiceHealthSampleUpdateArgs<ExtArgs>>): Prisma__ServiceHealthSampleClient<$Result.GetResult<Prisma.$ServiceHealthSamplePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ServiceHealthSamples.
     * @param {ServiceHealthSampleDeleteManyArgs} args - Arguments to filter ServiceHealthSamples to delete.
     * @example
     * // Delete a few ServiceHealthSamples
     * const { count } = await prisma.serviceHealthSample.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ServiceHealthSampleDeleteManyArgs>(args?: SelectSubset<T, ServiceHealthSampleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ServiceHealthSamples.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServiceHealthSampleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ServiceHealthSamples
     * const serviceHealthSample = await prisma.serviceHealthSample.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ServiceHealthSampleUpdateManyArgs>(args: SelectSubset<T, ServiceHealthSampleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ServiceHealthSamples and returns the data updated in the database.
     * @param {ServiceHealthSampleUpdateManyAndReturnArgs} args - Arguments to update many ServiceHealthSamples.
     * @example
     * // Update many ServiceHealthSamples
     * const serviceHealthSample = await prisma.serviceHealthSample.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ServiceHealthSamples and only return the `id`
     * const serviceHealthSampleWithIdOnly = await prisma.serviceHealthSample.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ServiceHealthSampleUpdateManyAndReturnArgs>(args: SelectSubset<T, ServiceHealthSampleUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ServiceHealthSamplePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ServiceHealthSample.
     * @param {ServiceHealthSampleUpsertArgs} args - Arguments to update or create a ServiceHealthSample.
     * @example
     * // Update or create a ServiceHealthSample
     * const serviceHealthSample = await prisma.serviceHealthSample.upsert({
     *   create: {
     *     // ... data to create a ServiceHealthSample
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ServiceHealthSample we want to update
     *   }
     * })
     */
    upsert<T extends ServiceHealthSampleUpsertArgs>(args: SelectSubset<T, ServiceHealthSampleUpsertArgs<ExtArgs>>): Prisma__ServiceHealthSampleClient<$Result.GetResult<Prisma.$ServiceHealthSamplePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ServiceHealthSamples.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServiceHealthSampleCountArgs} args - Arguments to filter ServiceHealthSamples to count.
     * @example
     * // Count the number of ServiceHealthSamples
     * const count = await prisma.serviceHealthSample.count({
     *   where: {
     *     // ... the filter for the ServiceHealthSamples we want to count
     *   }
     * })
    **/
    count<T extends ServiceHealthSampleCountArgs>(
      args?: Subset<T, ServiceHealthSampleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ServiceHealthSampleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ServiceHealthSample.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServiceHealthSampleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ServiceHealthSampleAggregateArgs>(args: Subset<T, ServiceHealthSampleAggregateArgs>): Prisma.PrismaPromise<GetServiceHealthSampleAggregateType<T>>

    /**
     * Group by ServiceHealthSample.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ServiceHealthSampleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ServiceHealthSampleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ServiceHealthSampleGroupByArgs['orderBy'] }
        : { orderBy?: ServiceHealthSampleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ServiceHealthSampleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetServiceHealthSampleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ServiceHealthSample model
   */
  readonly fields: ServiceHealthSampleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ServiceHealthSample.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ServiceHealthSampleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ServiceHealthSample model
   */
  interface ServiceHealthSampleFieldRefs {
    readonly id: FieldRef<"ServiceHealthSample", 'String'>
    readonly service: FieldRef<"ServiceHealthSample", 'String'>
    readonly ok: FieldRef<"ServiceHealthSample", 'Boolean'>
    readonly status: FieldRef<"ServiceHealthSample", 'Int'>
    readonly latencyMs: FieldRef<"ServiceHealthSample", 'Int'>
    readonly createdAt: FieldRef<"ServiceHealthSample", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ServiceHealthSample findUnique
   */
  export type ServiceHealthSampleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceHealthSample
     */
    select?: ServiceHealthSampleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceHealthSample
     */
    omit?: ServiceHealthSampleOmit<ExtArgs> | null
    /**
     * Filter, which ServiceHealthSample to fetch.
     */
    where: ServiceHealthSampleWhereUniqueInput
  }

  /**
   * ServiceHealthSample findUniqueOrThrow
   */
  export type ServiceHealthSampleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceHealthSample
     */
    select?: ServiceHealthSampleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceHealthSample
     */
    omit?: ServiceHealthSampleOmit<ExtArgs> | null
    /**
     * Filter, which ServiceHealthSample to fetch.
     */
    where: ServiceHealthSampleWhereUniqueInput
  }

  /**
   * ServiceHealthSample findFirst
   */
  export type ServiceHealthSampleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceHealthSample
     */
    select?: ServiceHealthSampleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceHealthSample
     */
    omit?: ServiceHealthSampleOmit<ExtArgs> | null
    /**
     * Filter, which ServiceHealthSample to fetch.
     */
    where?: ServiceHealthSampleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ServiceHealthSamples to fetch.
     */
    orderBy?: ServiceHealthSampleOrderByWithRelationInput | ServiceHealthSampleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ServiceHealthSamples.
     */
    cursor?: ServiceHealthSampleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ServiceHealthSamples from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ServiceHealthSamples.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ServiceHealthSamples.
     */
    distinct?: ServiceHealthSampleScalarFieldEnum | ServiceHealthSampleScalarFieldEnum[]
  }

  /**
   * ServiceHealthSample findFirstOrThrow
   */
  export type ServiceHealthSampleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceHealthSample
     */
    select?: ServiceHealthSampleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceHealthSample
     */
    omit?: ServiceHealthSampleOmit<ExtArgs> | null
    /**
     * Filter, which ServiceHealthSample to fetch.
     */
    where?: ServiceHealthSampleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ServiceHealthSamples to fetch.
     */
    orderBy?: ServiceHealthSampleOrderByWithRelationInput | ServiceHealthSampleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ServiceHealthSamples.
     */
    cursor?: ServiceHealthSampleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ServiceHealthSamples from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ServiceHealthSamples.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ServiceHealthSamples.
     */
    distinct?: ServiceHealthSampleScalarFieldEnum | ServiceHealthSampleScalarFieldEnum[]
  }

  /**
   * ServiceHealthSample findMany
   */
  export type ServiceHealthSampleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceHealthSample
     */
    select?: ServiceHealthSampleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceHealthSample
     */
    omit?: ServiceHealthSampleOmit<ExtArgs> | null
    /**
     * Filter, which ServiceHealthSamples to fetch.
     */
    where?: ServiceHealthSampleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ServiceHealthSamples to fetch.
     */
    orderBy?: ServiceHealthSampleOrderByWithRelationInput | ServiceHealthSampleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ServiceHealthSamples.
     */
    cursor?: ServiceHealthSampleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ServiceHealthSamples from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ServiceHealthSamples.
     */
    skip?: number
    distinct?: ServiceHealthSampleScalarFieldEnum | ServiceHealthSampleScalarFieldEnum[]
  }

  /**
   * ServiceHealthSample create
   */
  export type ServiceHealthSampleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceHealthSample
     */
    select?: ServiceHealthSampleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceHealthSample
     */
    omit?: ServiceHealthSampleOmit<ExtArgs> | null
    /**
     * The data needed to create a ServiceHealthSample.
     */
    data: XOR<ServiceHealthSampleCreateInput, ServiceHealthSampleUncheckedCreateInput>
  }

  /**
   * ServiceHealthSample createMany
   */
  export type ServiceHealthSampleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ServiceHealthSamples.
     */
    data: ServiceHealthSampleCreateManyInput | ServiceHealthSampleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ServiceHealthSample createManyAndReturn
   */
  export type ServiceHealthSampleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceHealthSample
     */
    select?: ServiceHealthSampleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceHealthSample
     */
    omit?: ServiceHealthSampleOmit<ExtArgs> | null
    /**
     * The data used to create many ServiceHealthSamples.
     */
    data: ServiceHealthSampleCreateManyInput | ServiceHealthSampleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ServiceHealthSample update
   */
  export type ServiceHealthSampleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceHealthSample
     */
    select?: ServiceHealthSampleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceHealthSample
     */
    omit?: ServiceHealthSampleOmit<ExtArgs> | null
    /**
     * The data needed to update a ServiceHealthSample.
     */
    data: XOR<ServiceHealthSampleUpdateInput, ServiceHealthSampleUncheckedUpdateInput>
    /**
     * Choose, which ServiceHealthSample to update.
     */
    where: ServiceHealthSampleWhereUniqueInput
  }

  /**
   * ServiceHealthSample updateMany
   */
  export type ServiceHealthSampleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ServiceHealthSamples.
     */
    data: XOR<ServiceHealthSampleUpdateManyMutationInput, ServiceHealthSampleUncheckedUpdateManyInput>
    /**
     * Filter which ServiceHealthSamples to update
     */
    where?: ServiceHealthSampleWhereInput
    /**
     * Limit how many ServiceHealthSamples to update.
     */
    limit?: number
  }

  /**
   * ServiceHealthSample updateManyAndReturn
   */
  export type ServiceHealthSampleUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceHealthSample
     */
    select?: ServiceHealthSampleSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceHealthSample
     */
    omit?: ServiceHealthSampleOmit<ExtArgs> | null
    /**
     * The data used to update ServiceHealthSamples.
     */
    data: XOR<ServiceHealthSampleUpdateManyMutationInput, ServiceHealthSampleUncheckedUpdateManyInput>
    /**
     * Filter which ServiceHealthSamples to update
     */
    where?: ServiceHealthSampleWhereInput
    /**
     * Limit how many ServiceHealthSamples to update.
     */
    limit?: number
  }

  /**
   * ServiceHealthSample upsert
   */
  export type ServiceHealthSampleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceHealthSample
     */
    select?: ServiceHealthSampleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceHealthSample
     */
    omit?: ServiceHealthSampleOmit<ExtArgs> | null
    /**
     * The filter to search for the ServiceHealthSample to update in case it exists.
     */
    where: ServiceHealthSampleWhereUniqueInput
    /**
     * In case the ServiceHealthSample found by the `where` argument doesn't exist, create a new ServiceHealthSample with this data.
     */
    create: XOR<ServiceHealthSampleCreateInput, ServiceHealthSampleUncheckedCreateInput>
    /**
     * In case the ServiceHealthSample was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ServiceHealthSampleUpdateInput, ServiceHealthSampleUncheckedUpdateInput>
  }

  /**
   * ServiceHealthSample delete
   */
  export type ServiceHealthSampleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceHealthSample
     */
    select?: ServiceHealthSampleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceHealthSample
     */
    omit?: ServiceHealthSampleOmit<ExtArgs> | null
    /**
     * Filter which ServiceHealthSample to delete.
     */
    where: ServiceHealthSampleWhereUniqueInput
  }

  /**
   * ServiceHealthSample deleteMany
   */
  export type ServiceHealthSampleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ServiceHealthSamples to delete
     */
    where?: ServiceHealthSampleWhereInput
    /**
     * Limit how many ServiceHealthSamples to delete.
     */
    limit?: number
  }

  /**
   * ServiceHealthSample without action
   */
  export type ServiceHealthSampleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ServiceHealthSample
     */
    select?: ServiceHealthSampleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ServiceHealthSample
     */
    omit?: ServiceHealthSampleOmit<ExtArgs> | null
  }


  /**
   * Model AlertLog
   */

  export type AggregateAlertLog = {
    _count: AlertLogCountAggregateOutputType | null
    _min: AlertLogMinAggregateOutputType | null
    _max: AlertLogMaxAggregateOutputType | null
  }

  export type AlertLogMinAggregateOutputType = {
    id: string | null
    level: string | null
    source: string | null
    title: string | null
    message: string | null
    notified: boolean | null
    createdAt: Date | null
  }

  export type AlertLogMaxAggregateOutputType = {
    id: string | null
    level: string | null
    source: string | null
    title: string | null
    message: string | null
    notified: boolean | null
    createdAt: Date | null
  }

  export type AlertLogCountAggregateOutputType = {
    id: number
    level: number
    source: number
    title: number
    message: number
    context: number
    notified: number
    createdAt: number
    _all: number
  }


  export type AlertLogMinAggregateInputType = {
    id?: true
    level?: true
    source?: true
    title?: true
    message?: true
    notified?: true
    createdAt?: true
  }

  export type AlertLogMaxAggregateInputType = {
    id?: true
    level?: true
    source?: true
    title?: true
    message?: true
    notified?: true
    createdAt?: true
  }

  export type AlertLogCountAggregateInputType = {
    id?: true
    level?: true
    source?: true
    title?: true
    message?: true
    context?: true
    notified?: true
    createdAt?: true
    _all?: true
  }

  export type AlertLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AlertLog to aggregate.
     */
    where?: AlertLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlertLogs to fetch.
     */
    orderBy?: AlertLogOrderByWithRelationInput | AlertLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AlertLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlertLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlertLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AlertLogs
    **/
    _count?: true | AlertLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AlertLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AlertLogMaxAggregateInputType
  }

  export type GetAlertLogAggregateType<T extends AlertLogAggregateArgs> = {
        [P in keyof T & keyof AggregateAlertLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAlertLog[P]>
      : GetScalarType<T[P], AggregateAlertLog[P]>
  }




  export type AlertLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AlertLogWhereInput
    orderBy?: AlertLogOrderByWithAggregationInput | AlertLogOrderByWithAggregationInput[]
    by: AlertLogScalarFieldEnum[] | AlertLogScalarFieldEnum
    having?: AlertLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AlertLogCountAggregateInputType | true
    _min?: AlertLogMinAggregateInputType
    _max?: AlertLogMaxAggregateInputType
  }

  export type AlertLogGroupByOutputType = {
    id: string
    level: string
    source: string
    title: string
    message: string
    context: JsonValue | null
    notified: boolean
    createdAt: Date
    _count: AlertLogCountAggregateOutputType | null
    _min: AlertLogMinAggregateOutputType | null
    _max: AlertLogMaxAggregateOutputType | null
  }

  type GetAlertLogGroupByPayload<T extends AlertLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AlertLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AlertLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AlertLogGroupByOutputType[P]>
            : GetScalarType<T[P], AlertLogGroupByOutputType[P]>
        }
      >
    >


  export type AlertLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    level?: boolean
    source?: boolean
    title?: boolean
    message?: boolean
    context?: boolean
    notified?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["alertLog"]>

  export type AlertLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    level?: boolean
    source?: boolean
    title?: boolean
    message?: boolean
    context?: boolean
    notified?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["alertLog"]>

  export type AlertLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    level?: boolean
    source?: boolean
    title?: boolean
    message?: boolean
    context?: boolean
    notified?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["alertLog"]>

  export type AlertLogSelectScalar = {
    id?: boolean
    level?: boolean
    source?: boolean
    title?: boolean
    message?: boolean
    context?: boolean
    notified?: boolean
    createdAt?: boolean
  }

  export type AlertLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "level" | "source" | "title" | "message" | "context" | "notified" | "createdAt", ExtArgs["result"]["alertLog"]>

  export type $AlertLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AlertLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      level: string
      source: string
      title: string
      message: string
      context: Prisma.JsonValue | null
      notified: boolean
      createdAt: Date
    }, ExtArgs["result"]["alertLog"]>
    composites: {}
  }

  type AlertLogGetPayload<S extends boolean | null | undefined | AlertLogDefaultArgs> = $Result.GetResult<Prisma.$AlertLogPayload, S>

  type AlertLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AlertLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AlertLogCountAggregateInputType | true
    }

  export interface AlertLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AlertLog'], meta: { name: 'AlertLog' } }
    /**
     * Find zero or one AlertLog that matches the filter.
     * @param {AlertLogFindUniqueArgs} args - Arguments to find a AlertLog
     * @example
     * // Get one AlertLog
     * const alertLog = await prisma.alertLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AlertLogFindUniqueArgs>(args: SelectSubset<T, AlertLogFindUniqueArgs<ExtArgs>>): Prisma__AlertLogClient<$Result.GetResult<Prisma.$AlertLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AlertLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AlertLogFindUniqueOrThrowArgs} args - Arguments to find a AlertLog
     * @example
     * // Get one AlertLog
     * const alertLog = await prisma.alertLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AlertLogFindUniqueOrThrowArgs>(args: SelectSubset<T, AlertLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AlertLogClient<$Result.GetResult<Prisma.$AlertLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AlertLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertLogFindFirstArgs} args - Arguments to find a AlertLog
     * @example
     * // Get one AlertLog
     * const alertLog = await prisma.alertLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AlertLogFindFirstArgs>(args?: SelectSubset<T, AlertLogFindFirstArgs<ExtArgs>>): Prisma__AlertLogClient<$Result.GetResult<Prisma.$AlertLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AlertLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertLogFindFirstOrThrowArgs} args - Arguments to find a AlertLog
     * @example
     * // Get one AlertLog
     * const alertLog = await prisma.alertLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AlertLogFindFirstOrThrowArgs>(args?: SelectSubset<T, AlertLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__AlertLogClient<$Result.GetResult<Prisma.$AlertLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AlertLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AlertLogs
     * const alertLogs = await prisma.alertLog.findMany()
     * 
     * // Get first 10 AlertLogs
     * const alertLogs = await prisma.alertLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const alertLogWithIdOnly = await prisma.alertLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AlertLogFindManyArgs>(args?: SelectSubset<T, AlertLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlertLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AlertLog.
     * @param {AlertLogCreateArgs} args - Arguments to create a AlertLog.
     * @example
     * // Create one AlertLog
     * const AlertLog = await prisma.alertLog.create({
     *   data: {
     *     // ... data to create a AlertLog
     *   }
     * })
     * 
     */
    create<T extends AlertLogCreateArgs>(args: SelectSubset<T, AlertLogCreateArgs<ExtArgs>>): Prisma__AlertLogClient<$Result.GetResult<Prisma.$AlertLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AlertLogs.
     * @param {AlertLogCreateManyArgs} args - Arguments to create many AlertLogs.
     * @example
     * // Create many AlertLogs
     * const alertLog = await prisma.alertLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AlertLogCreateManyArgs>(args?: SelectSubset<T, AlertLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AlertLogs and returns the data saved in the database.
     * @param {AlertLogCreateManyAndReturnArgs} args - Arguments to create many AlertLogs.
     * @example
     * // Create many AlertLogs
     * const alertLog = await prisma.alertLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AlertLogs and only return the `id`
     * const alertLogWithIdOnly = await prisma.alertLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AlertLogCreateManyAndReturnArgs>(args?: SelectSubset<T, AlertLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlertLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AlertLog.
     * @param {AlertLogDeleteArgs} args - Arguments to delete one AlertLog.
     * @example
     * // Delete one AlertLog
     * const AlertLog = await prisma.alertLog.delete({
     *   where: {
     *     // ... filter to delete one AlertLog
     *   }
     * })
     * 
     */
    delete<T extends AlertLogDeleteArgs>(args: SelectSubset<T, AlertLogDeleteArgs<ExtArgs>>): Prisma__AlertLogClient<$Result.GetResult<Prisma.$AlertLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AlertLog.
     * @param {AlertLogUpdateArgs} args - Arguments to update one AlertLog.
     * @example
     * // Update one AlertLog
     * const alertLog = await prisma.alertLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AlertLogUpdateArgs>(args: SelectSubset<T, AlertLogUpdateArgs<ExtArgs>>): Prisma__AlertLogClient<$Result.GetResult<Prisma.$AlertLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AlertLogs.
     * @param {AlertLogDeleteManyArgs} args - Arguments to filter AlertLogs to delete.
     * @example
     * // Delete a few AlertLogs
     * const { count } = await prisma.alertLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AlertLogDeleteManyArgs>(args?: SelectSubset<T, AlertLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AlertLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AlertLogs
     * const alertLog = await prisma.alertLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AlertLogUpdateManyArgs>(args: SelectSubset<T, AlertLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AlertLogs and returns the data updated in the database.
     * @param {AlertLogUpdateManyAndReturnArgs} args - Arguments to update many AlertLogs.
     * @example
     * // Update many AlertLogs
     * const alertLog = await prisma.alertLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AlertLogs and only return the `id`
     * const alertLogWithIdOnly = await prisma.alertLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AlertLogUpdateManyAndReturnArgs>(args: SelectSubset<T, AlertLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AlertLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AlertLog.
     * @param {AlertLogUpsertArgs} args - Arguments to update or create a AlertLog.
     * @example
     * // Update or create a AlertLog
     * const alertLog = await prisma.alertLog.upsert({
     *   create: {
     *     // ... data to create a AlertLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AlertLog we want to update
     *   }
     * })
     */
    upsert<T extends AlertLogUpsertArgs>(args: SelectSubset<T, AlertLogUpsertArgs<ExtArgs>>): Prisma__AlertLogClient<$Result.GetResult<Prisma.$AlertLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AlertLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertLogCountArgs} args - Arguments to filter AlertLogs to count.
     * @example
     * // Count the number of AlertLogs
     * const count = await prisma.alertLog.count({
     *   where: {
     *     // ... the filter for the AlertLogs we want to count
     *   }
     * })
    **/
    count<T extends AlertLogCountArgs>(
      args?: Subset<T, AlertLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AlertLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AlertLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AlertLogAggregateArgs>(args: Subset<T, AlertLogAggregateArgs>): Prisma.PrismaPromise<GetAlertLogAggregateType<T>>

    /**
     * Group by AlertLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AlertLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AlertLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AlertLogGroupByArgs['orderBy'] }
        : { orderBy?: AlertLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AlertLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAlertLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AlertLog model
   */
  readonly fields: AlertLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AlertLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AlertLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AlertLog model
   */
  interface AlertLogFieldRefs {
    readonly id: FieldRef<"AlertLog", 'String'>
    readonly level: FieldRef<"AlertLog", 'String'>
    readonly source: FieldRef<"AlertLog", 'String'>
    readonly title: FieldRef<"AlertLog", 'String'>
    readonly message: FieldRef<"AlertLog", 'String'>
    readonly context: FieldRef<"AlertLog", 'Json'>
    readonly notified: FieldRef<"AlertLog", 'Boolean'>
    readonly createdAt: FieldRef<"AlertLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AlertLog findUnique
   */
  export type AlertLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertLog
     */
    select?: AlertLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlertLog
     */
    omit?: AlertLogOmit<ExtArgs> | null
    /**
     * Filter, which AlertLog to fetch.
     */
    where: AlertLogWhereUniqueInput
  }

  /**
   * AlertLog findUniqueOrThrow
   */
  export type AlertLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertLog
     */
    select?: AlertLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlertLog
     */
    omit?: AlertLogOmit<ExtArgs> | null
    /**
     * Filter, which AlertLog to fetch.
     */
    where: AlertLogWhereUniqueInput
  }

  /**
   * AlertLog findFirst
   */
  export type AlertLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertLog
     */
    select?: AlertLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlertLog
     */
    omit?: AlertLogOmit<ExtArgs> | null
    /**
     * Filter, which AlertLog to fetch.
     */
    where?: AlertLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlertLogs to fetch.
     */
    orderBy?: AlertLogOrderByWithRelationInput | AlertLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AlertLogs.
     */
    cursor?: AlertLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlertLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlertLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AlertLogs.
     */
    distinct?: AlertLogScalarFieldEnum | AlertLogScalarFieldEnum[]
  }

  /**
   * AlertLog findFirstOrThrow
   */
  export type AlertLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertLog
     */
    select?: AlertLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlertLog
     */
    omit?: AlertLogOmit<ExtArgs> | null
    /**
     * Filter, which AlertLog to fetch.
     */
    where?: AlertLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlertLogs to fetch.
     */
    orderBy?: AlertLogOrderByWithRelationInput | AlertLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AlertLogs.
     */
    cursor?: AlertLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlertLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlertLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AlertLogs.
     */
    distinct?: AlertLogScalarFieldEnum | AlertLogScalarFieldEnum[]
  }

  /**
   * AlertLog findMany
   */
  export type AlertLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertLog
     */
    select?: AlertLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlertLog
     */
    omit?: AlertLogOmit<ExtArgs> | null
    /**
     * Filter, which AlertLogs to fetch.
     */
    where?: AlertLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AlertLogs to fetch.
     */
    orderBy?: AlertLogOrderByWithRelationInput | AlertLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AlertLogs.
     */
    cursor?: AlertLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AlertLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AlertLogs.
     */
    skip?: number
    distinct?: AlertLogScalarFieldEnum | AlertLogScalarFieldEnum[]
  }

  /**
   * AlertLog create
   */
  export type AlertLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertLog
     */
    select?: AlertLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlertLog
     */
    omit?: AlertLogOmit<ExtArgs> | null
    /**
     * The data needed to create a AlertLog.
     */
    data: XOR<AlertLogCreateInput, AlertLogUncheckedCreateInput>
  }

  /**
   * AlertLog createMany
   */
  export type AlertLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AlertLogs.
     */
    data: AlertLogCreateManyInput | AlertLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AlertLog createManyAndReturn
   */
  export type AlertLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertLog
     */
    select?: AlertLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AlertLog
     */
    omit?: AlertLogOmit<ExtArgs> | null
    /**
     * The data used to create many AlertLogs.
     */
    data: AlertLogCreateManyInput | AlertLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AlertLog update
   */
  export type AlertLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertLog
     */
    select?: AlertLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlertLog
     */
    omit?: AlertLogOmit<ExtArgs> | null
    /**
     * The data needed to update a AlertLog.
     */
    data: XOR<AlertLogUpdateInput, AlertLogUncheckedUpdateInput>
    /**
     * Choose, which AlertLog to update.
     */
    where: AlertLogWhereUniqueInput
  }

  /**
   * AlertLog updateMany
   */
  export type AlertLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AlertLogs.
     */
    data: XOR<AlertLogUpdateManyMutationInput, AlertLogUncheckedUpdateManyInput>
    /**
     * Filter which AlertLogs to update
     */
    where?: AlertLogWhereInput
    /**
     * Limit how many AlertLogs to update.
     */
    limit?: number
  }

  /**
   * AlertLog updateManyAndReturn
   */
  export type AlertLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertLog
     */
    select?: AlertLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AlertLog
     */
    omit?: AlertLogOmit<ExtArgs> | null
    /**
     * The data used to update AlertLogs.
     */
    data: XOR<AlertLogUpdateManyMutationInput, AlertLogUncheckedUpdateManyInput>
    /**
     * Filter which AlertLogs to update
     */
    where?: AlertLogWhereInput
    /**
     * Limit how many AlertLogs to update.
     */
    limit?: number
  }

  /**
   * AlertLog upsert
   */
  export type AlertLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertLog
     */
    select?: AlertLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlertLog
     */
    omit?: AlertLogOmit<ExtArgs> | null
    /**
     * The filter to search for the AlertLog to update in case it exists.
     */
    where: AlertLogWhereUniqueInput
    /**
     * In case the AlertLog found by the `where` argument doesn't exist, create a new AlertLog with this data.
     */
    create: XOR<AlertLogCreateInput, AlertLogUncheckedCreateInput>
    /**
     * In case the AlertLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AlertLogUpdateInput, AlertLogUncheckedUpdateInput>
  }

  /**
   * AlertLog delete
   */
  export type AlertLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertLog
     */
    select?: AlertLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlertLog
     */
    omit?: AlertLogOmit<ExtArgs> | null
    /**
     * Filter which AlertLog to delete.
     */
    where: AlertLogWhereUniqueInput
  }

  /**
   * AlertLog deleteMany
   */
  export type AlertLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AlertLogs to delete
     */
    where?: AlertLogWhereInput
    /**
     * Limit how many AlertLogs to delete.
     */
    limit?: number
  }

  /**
   * AlertLog without action
   */
  export type AlertLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AlertLog
     */
    select?: AlertLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AlertLog
     */
    omit?: AlertLogOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ActivityLogScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    userName: 'userName',
    role: 'role',
    method: 'method',
    path: 'path',
    statusCode: 'statusCode',
    ip: 'ip',
    userAgent: 'userAgent',
    durationMs: 'durationMs',
    createdAt: 'createdAt'
  };

  export type ActivityLogScalarFieldEnum = (typeof ActivityLogScalarFieldEnum)[keyof typeof ActivityLogScalarFieldEnum]


  export const ServiceHealthSampleScalarFieldEnum: {
    id: 'id',
    service: 'service',
    ok: 'ok',
    status: 'status',
    latencyMs: 'latencyMs',
    createdAt: 'createdAt'
  };

  export type ServiceHealthSampleScalarFieldEnum = (typeof ServiceHealthSampleScalarFieldEnum)[keyof typeof ServiceHealthSampleScalarFieldEnum]


  export const AlertLogScalarFieldEnum: {
    id: 'id',
    level: 'level',
    source: 'source',
    title: 'title',
    message: 'message',
    context: 'context',
    notified: 'notified',
    createdAt: 'createdAt'
  };

  export type AlertLogScalarFieldEnum = (typeof AlertLogScalarFieldEnum)[keyof typeof AlertLogScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type ActivityLogWhereInput = {
    AND?: ActivityLogWhereInput | ActivityLogWhereInput[]
    OR?: ActivityLogWhereInput[]
    NOT?: ActivityLogWhereInput | ActivityLogWhereInput[]
    id?: StringFilter<"ActivityLog"> | string
    userId?: StringNullableFilter<"ActivityLog"> | string | null
    userName?: StringNullableFilter<"ActivityLog"> | string | null
    role?: StringNullableFilter<"ActivityLog"> | string | null
    method?: StringFilter<"ActivityLog"> | string
    path?: StringFilter<"ActivityLog"> | string
    statusCode?: IntNullableFilter<"ActivityLog"> | number | null
    ip?: StringNullableFilter<"ActivityLog"> | string | null
    userAgent?: StringNullableFilter<"ActivityLog"> | string | null
    durationMs?: IntNullableFilter<"ActivityLog"> | number | null
    createdAt?: DateTimeFilter<"ActivityLog"> | Date | string
  }

  export type ActivityLogOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrderInput | SortOrder
    userName?: SortOrderInput | SortOrder
    role?: SortOrderInput | SortOrder
    method?: SortOrder
    path?: SortOrder
    statusCode?: SortOrderInput | SortOrder
    ip?: SortOrderInput | SortOrder
    userAgent?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type ActivityLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ActivityLogWhereInput | ActivityLogWhereInput[]
    OR?: ActivityLogWhereInput[]
    NOT?: ActivityLogWhereInput | ActivityLogWhereInput[]
    userId?: StringNullableFilter<"ActivityLog"> | string | null
    userName?: StringNullableFilter<"ActivityLog"> | string | null
    role?: StringNullableFilter<"ActivityLog"> | string | null
    method?: StringFilter<"ActivityLog"> | string
    path?: StringFilter<"ActivityLog"> | string
    statusCode?: IntNullableFilter<"ActivityLog"> | number | null
    ip?: StringNullableFilter<"ActivityLog"> | string | null
    userAgent?: StringNullableFilter<"ActivityLog"> | string | null
    durationMs?: IntNullableFilter<"ActivityLog"> | number | null
    createdAt?: DateTimeFilter<"ActivityLog"> | Date | string
  }, "id">

  export type ActivityLogOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrderInput | SortOrder
    userName?: SortOrderInput | SortOrder
    role?: SortOrderInput | SortOrder
    method?: SortOrder
    path?: SortOrder
    statusCode?: SortOrderInput | SortOrder
    ip?: SortOrderInput | SortOrder
    userAgent?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: ActivityLogCountOrderByAggregateInput
    _avg?: ActivityLogAvgOrderByAggregateInput
    _max?: ActivityLogMaxOrderByAggregateInput
    _min?: ActivityLogMinOrderByAggregateInput
    _sum?: ActivityLogSumOrderByAggregateInput
  }

  export type ActivityLogScalarWhereWithAggregatesInput = {
    AND?: ActivityLogScalarWhereWithAggregatesInput | ActivityLogScalarWhereWithAggregatesInput[]
    OR?: ActivityLogScalarWhereWithAggregatesInput[]
    NOT?: ActivityLogScalarWhereWithAggregatesInput | ActivityLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ActivityLog"> | string
    userId?: StringNullableWithAggregatesFilter<"ActivityLog"> | string | null
    userName?: StringNullableWithAggregatesFilter<"ActivityLog"> | string | null
    role?: StringNullableWithAggregatesFilter<"ActivityLog"> | string | null
    method?: StringWithAggregatesFilter<"ActivityLog"> | string
    path?: StringWithAggregatesFilter<"ActivityLog"> | string
    statusCode?: IntNullableWithAggregatesFilter<"ActivityLog"> | number | null
    ip?: StringNullableWithAggregatesFilter<"ActivityLog"> | string | null
    userAgent?: StringNullableWithAggregatesFilter<"ActivityLog"> | string | null
    durationMs?: IntNullableWithAggregatesFilter<"ActivityLog"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"ActivityLog"> | Date | string
  }

  export type ServiceHealthSampleWhereInput = {
    AND?: ServiceHealthSampleWhereInput | ServiceHealthSampleWhereInput[]
    OR?: ServiceHealthSampleWhereInput[]
    NOT?: ServiceHealthSampleWhereInput | ServiceHealthSampleWhereInput[]
    id?: StringFilter<"ServiceHealthSample"> | string
    service?: StringFilter<"ServiceHealthSample"> | string
    ok?: BoolFilter<"ServiceHealthSample"> | boolean
    status?: IntNullableFilter<"ServiceHealthSample"> | number | null
    latencyMs?: IntNullableFilter<"ServiceHealthSample"> | number | null
    createdAt?: DateTimeFilter<"ServiceHealthSample"> | Date | string
  }

  export type ServiceHealthSampleOrderByWithRelationInput = {
    id?: SortOrder
    service?: SortOrder
    ok?: SortOrder
    status?: SortOrderInput | SortOrder
    latencyMs?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type ServiceHealthSampleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ServiceHealthSampleWhereInput | ServiceHealthSampleWhereInput[]
    OR?: ServiceHealthSampleWhereInput[]
    NOT?: ServiceHealthSampleWhereInput | ServiceHealthSampleWhereInput[]
    service?: StringFilter<"ServiceHealthSample"> | string
    ok?: BoolFilter<"ServiceHealthSample"> | boolean
    status?: IntNullableFilter<"ServiceHealthSample"> | number | null
    latencyMs?: IntNullableFilter<"ServiceHealthSample"> | number | null
    createdAt?: DateTimeFilter<"ServiceHealthSample"> | Date | string
  }, "id">

  export type ServiceHealthSampleOrderByWithAggregationInput = {
    id?: SortOrder
    service?: SortOrder
    ok?: SortOrder
    status?: SortOrderInput | SortOrder
    latencyMs?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: ServiceHealthSampleCountOrderByAggregateInput
    _avg?: ServiceHealthSampleAvgOrderByAggregateInput
    _max?: ServiceHealthSampleMaxOrderByAggregateInput
    _min?: ServiceHealthSampleMinOrderByAggregateInput
    _sum?: ServiceHealthSampleSumOrderByAggregateInput
  }

  export type ServiceHealthSampleScalarWhereWithAggregatesInput = {
    AND?: ServiceHealthSampleScalarWhereWithAggregatesInput | ServiceHealthSampleScalarWhereWithAggregatesInput[]
    OR?: ServiceHealthSampleScalarWhereWithAggregatesInput[]
    NOT?: ServiceHealthSampleScalarWhereWithAggregatesInput | ServiceHealthSampleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ServiceHealthSample"> | string
    service?: StringWithAggregatesFilter<"ServiceHealthSample"> | string
    ok?: BoolWithAggregatesFilter<"ServiceHealthSample"> | boolean
    status?: IntNullableWithAggregatesFilter<"ServiceHealthSample"> | number | null
    latencyMs?: IntNullableWithAggregatesFilter<"ServiceHealthSample"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"ServiceHealthSample"> | Date | string
  }

  export type AlertLogWhereInput = {
    AND?: AlertLogWhereInput | AlertLogWhereInput[]
    OR?: AlertLogWhereInput[]
    NOT?: AlertLogWhereInput | AlertLogWhereInput[]
    id?: StringFilter<"AlertLog"> | string
    level?: StringFilter<"AlertLog"> | string
    source?: StringFilter<"AlertLog"> | string
    title?: StringFilter<"AlertLog"> | string
    message?: StringFilter<"AlertLog"> | string
    context?: JsonNullableFilter<"AlertLog">
    notified?: BoolFilter<"AlertLog"> | boolean
    createdAt?: DateTimeFilter<"AlertLog"> | Date | string
  }

  export type AlertLogOrderByWithRelationInput = {
    id?: SortOrder
    level?: SortOrder
    source?: SortOrder
    title?: SortOrder
    message?: SortOrder
    context?: SortOrderInput | SortOrder
    notified?: SortOrder
    createdAt?: SortOrder
  }

  export type AlertLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AlertLogWhereInput | AlertLogWhereInput[]
    OR?: AlertLogWhereInput[]
    NOT?: AlertLogWhereInput | AlertLogWhereInput[]
    level?: StringFilter<"AlertLog"> | string
    source?: StringFilter<"AlertLog"> | string
    title?: StringFilter<"AlertLog"> | string
    message?: StringFilter<"AlertLog"> | string
    context?: JsonNullableFilter<"AlertLog">
    notified?: BoolFilter<"AlertLog"> | boolean
    createdAt?: DateTimeFilter<"AlertLog"> | Date | string
  }, "id">

  export type AlertLogOrderByWithAggregationInput = {
    id?: SortOrder
    level?: SortOrder
    source?: SortOrder
    title?: SortOrder
    message?: SortOrder
    context?: SortOrderInput | SortOrder
    notified?: SortOrder
    createdAt?: SortOrder
    _count?: AlertLogCountOrderByAggregateInput
    _max?: AlertLogMaxOrderByAggregateInput
    _min?: AlertLogMinOrderByAggregateInput
  }

  export type AlertLogScalarWhereWithAggregatesInput = {
    AND?: AlertLogScalarWhereWithAggregatesInput | AlertLogScalarWhereWithAggregatesInput[]
    OR?: AlertLogScalarWhereWithAggregatesInput[]
    NOT?: AlertLogScalarWhereWithAggregatesInput | AlertLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AlertLog"> | string
    level?: StringWithAggregatesFilter<"AlertLog"> | string
    source?: StringWithAggregatesFilter<"AlertLog"> | string
    title?: StringWithAggregatesFilter<"AlertLog"> | string
    message?: StringWithAggregatesFilter<"AlertLog"> | string
    context?: JsonNullableWithAggregatesFilter<"AlertLog">
    notified?: BoolWithAggregatesFilter<"AlertLog"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"AlertLog"> | Date | string
  }

  export type ActivityLogCreateInput = {
    id?: string
    userId?: string | null
    userName?: string | null
    role?: string | null
    method: string
    path: string
    statusCode?: number | null
    ip?: string | null
    userAgent?: string | null
    durationMs?: number | null
    createdAt?: Date | string
  }

  export type ActivityLogUncheckedCreateInput = {
    id?: string
    userId?: string | null
    userName?: string | null
    role?: string | null
    method: string
    path: string
    statusCode?: number | null
    ip?: string | null
    userAgent?: string | null
    durationMs?: number | null
    createdAt?: Date | string
  }

  export type ActivityLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    method?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ActivityLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    method?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ActivityLogCreateManyInput = {
    id?: string
    userId?: string | null
    userName?: string | null
    role?: string | null
    method: string
    path: string
    statusCode?: number | null
    ip?: string | null
    userAgent?: string | null
    durationMs?: number | null
    createdAt?: Date | string
  }

  export type ActivityLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    method?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ActivityLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: NullableStringFieldUpdateOperationsInput | string | null
    userName?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    method?: StringFieldUpdateOperationsInput | string
    path?: StringFieldUpdateOperationsInput | string
    statusCode?: NullableIntFieldUpdateOperationsInput | number | null
    ip?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ServiceHealthSampleCreateInput = {
    id?: string
    service: string
    ok: boolean
    status?: number | null
    latencyMs?: number | null
    createdAt?: Date | string
  }

  export type ServiceHealthSampleUncheckedCreateInput = {
    id?: string
    service: string
    ok: boolean
    status?: number | null
    latencyMs?: number | null
    createdAt?: Date | string
  }

  export type ServiceHealthSampleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    ok?: BoolFieldUpdateOperationsInput | boolean
    status?: NullableIntFieldUpdateOperationsInput | number | null
    latencyMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ServiceHealthSampleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    ok?: BoolFieldUpdateOperationsInput | boolean
    status?: NullableIntFieldUpdateOperationsInput | number | null
    latencyMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ServiceHealthSampleCreateManyInput = {
    id?: string
    service: string
    ok: boolean
    status?: number | null
    latencyMs?: number | null
    createdAt?: Date | string
  }

  export type ServiceHealthSampleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    ok?: BoolFieldUpdateOperationsInput | boolean
    status?: NullableIntFieldUpdateOperationsInput | number | null
    latencyMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ServiceHealthSampleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    ok?: BoolFieldUpdateOperationsInput | boolean
    status?: NullableIntFieldUpdateOperationsInput | number | null
    latencyMs?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlertLogCreateInput = {
    id?: string
    level?: string
    source: string
    title: string
    message: string
    context?: NullableJsonNullValueInput | InputJsonValue
    notified?: boolean
    createdAt?: Date | string
  }

  export type AlertLogUncheckedCreateInput = {
    id?: string
    level?: string
    source: string
    title: string
    message: string
    context?: NullableJsonNullValueInput | InputJsonValue
    notified?: boolean
    createdAt?: Date | string
  }

  export type AlertLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    context?: NullableJsonNullValueInput | InputJsonValue
    notified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlertLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    context?: NullableJsonNullValueInput | InputJsonValue
    notified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlertLogCreateManyInput = {
    id?: string
    level?: string
    source: string
    title: string
    message: string
    context?: NullableJsonNullValueInput | InputJsonValue
    notified?: boolean
    createdAt?: Date | string
  }

  export type AlertLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    context?: NullableJsonNullValueInput | InputJsonValue
    notified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AlertLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    level?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    message?: StringFieldUpdateOperationsInput | string
    context?: NullableJsonNullValueInput | InputJsonValue
    notified?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ActivityLogCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    userName?: SortOrder
    role?: SortOrder
    method?: SortOrder
    path?: SortOrder
    statusCode?: SortOrder
    ip?: SortOrder
    userAgent?: SortOrder
    durationMs?: SortOrder
    createdAt?: SortOrder
  }

  export type ActivityLogAvgOrderByAggregateInput = {
    statusCode?: SortOrder
    durationMs?: SortOrder
  }

  export type ActivityLogMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    userName?: SortOrder
    role?: SortOrder
    method?: SortOrder
    path?: SortOrder
    statusCode?: SortOrder
    ip?: SortOrder
    userAgent?: SortOrder
    durationMs?: SortOrder
    createdAt?: SortOrder
  }

  export type ActivityLogMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    userName?: SortOrder
    role?: SortOrder
    method?: SortOrder
    path?: SortOrder
    statusCode?: SortOrder
    ip?: SortOrder
    userAgent?: SortOrder
    durationMs?: SortOrder
    createdAt?: SortOrder
  }

  export type ActivityLogSumOrderByAggregateInput = {
    statusCode?: SortOrder
    durationMs?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type ServiceHealthSampleCountOrderByAggregateInput = {
    id?: SortOrder
    service?: SortOrder
    ok?: SortOrder
    status?: SortOrder
    latencyMs?: SortOrder
    createdAt?: SortOrder
  }

  export type ServiceHealthSampleAvgOrderByAggregateInput = {
    status?: SortOrder
    latencyMs?: SortOrder
  }

  export type ServiceHealthSampleMaxOrderByAggregateInput = {
    id?: SortOrder
    service?: SortOrder
    ok?: SortOrder
    status?: SortOrder
    latencyMs?: SortOrder
    createdAt?: SortOrder
  }

  export type ServiceHealthSampleMinOrderByAggregateInput = {
    id?: SortOrder
    service?: SortOrder
    ok?: SortOrder
    status?: SortOrder
    latencyMs?: SortOrder
    createdAt?: SortOrder
  }

  export type ServiceHealthSampleSumOrderByAggregateInput = {
    status?: SortOrder
    latencyMs?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type AlertLogCountOrderByAggregateInput = {
    id?: SortOrder
    level?: SortOrder
    source?: SortOrder
    title?: SortOrder
    message?: SortOrder
    context?: SortOrder
    notified?: SortOrder
    createdAt?: SortOrder
  }

  export type AlertLogMaxOrderByAggregateInput = {
    id?: SortOrder
    level?: SortOrder
    source?: SortOrder
    title?: SortOrder
    message?: SortOrder
    notified?: SortOrder
    createdAt?: SortOrder
  }

  export type AlertLogMinOrderByAggregateInput = {
    id?: SortOrder
    level?: SortOrder
    source?: SortOrder
    title?: SortOrder
    message?: SortOrder
    notified?: SortOrder
    createdAt?: SortOrder
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}