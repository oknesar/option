# Option

[![NPM Version](https://img.shields.io/npm/v/@rsnk/option)](https://www.npmjs.com/package/@rsnk/option)
[![NPM License](https://img.shields.io/npm/l/@rsnk/option)](https://www.npmjs.com/package/@rsnk/option)
[![NPM Downloads](https://img.shields.io/npm/dy/@rsnk/option)](https://www.npmjs.com/package/@rsnk/option)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@rsnk/option)](https://bundlephobia.com/result?p=@rsnk/option)

A TypeScript port of Rust's `Option<T>` type, providing a type-safe way to handle nullable values and avoid null pointer exceptions.

## Table of Contents
- [Installation](#installation)
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Common Patterns](#common-patterns)
- [TypeScript Type Narrowing](#typescript-type-narrowing)
- [Comparison with Other Approaches](#comparison-with-other-approaches)
- [Common Pitfalls](#common-pitfalls)
- [Design Philosophy](#design-philosophy)
- [Contributing](#contributing)
- [License](#license)
- [API Reference](#api-reference)

## Installation

Install the package using your favorite package manager:

```bash
npm install @rsnk/option
```

or

```bash
yarn add @rsnk/option
```

## Overview

The `Option` type represents an optional value: every `Option` is either `Some` and contains a value, or `None`, and does not. This pattern eliminates entire classes of bugs related to null and undefined handling.

```typescript
// Instead of this:
const user = getUser(); // User | undefined
if (user) {
  console.log(user.name);
}

// Write this:
const user = O.fromNullable(getUser()); // Option<User>
user.map(u => console.log(u.name));
```

## Quick Start
```bash
npm install @rsnk/option
```

```typescript
import O from "@rsnk/option";
```
### Creating Options

```typescript
// Create an Option with a value
const num = O.from(42);              // Option<number>
const str = O.from("hello");         // Option<string>

// Create an empty Option of given type
const empty = O.empty<string>();     // Option<string>

// From nullable values
const maybeUser = O.fromNullable(user);  // Option<User>

// For narrowed types (when you need Some or None specifically)
const some = O.some(42);             // Some<number>
const none = O.none;                 // None
```

### Basic Operations

```typescript
// Check if value exists
if (option.isSome()) {
  console.log(option.unwrap());
}

// Transform values
option
  .map(x => x * 2)
  .filter(x => x > 10)
  .unwrapOr(0);

// Pattern matching
option.match({
  Some: value => console.log(value),
  None: () => console.log("No value")
});
```

## Common Patterns

### When to Use Option

**Use Option when:**
- Dealing with values that may be absent
- You want type-safe null handling
- Building composable transformations

**Don't use Option when:**
- Simple optional chaining is sufficient
- Performance is absolutely critical
- The added abstraction isn't worth the complexity

**Important:** Options are objects and always truthy. Never rely on implicit boolean coercion.  
❌ Don't use `if (option)` or `option && value`

### Chaining Operations

```typescript
O.fromNullable(user)
  .map(u => u.profile)
  .mapNullable(p => p.email)
  .filter(email => email.includes('@'))
  .map(email => email.toLowerCase())
  .unwrapOr('no-email@example.com');
```

### Working with Nullable APIs

```typescript
// Before
function getUserEmail(userId: string): string | null {
  const user = findUser(userId);
  if (!user) return null;
  if (!user.profile) return null;
  return user.profile.email || null;
}

// After
function getUserEmail(userId: string): Option<string> {
  return O.fromNullable(findUser(userId))
    .mapNullable(user => user.profile)
    .mapNullable(profile => profile.email);
}
```

### Conditional Logic

```typescript
const discount = O.fromNullable(user)
  .filter(user => user.isPremium)
  .map(() => 0.20)
  .unwrapOr(0);
```

### Parsing and Validating User Input

This pattern shows how to compose several operations to safely parse and validate raw input.

```typescript
type User = {
  id: number;
  name: string;
};

function findUser(id: string): Option<User> {
  return O.from(id)
    .map(s => parseInt(s, 10)) // Attempt to parse the string to an integer
    .filter(n => !isNaN(n) && n > 0) // Validate that it's a positive number
    .mapNullable(id => {
      // In a real app, you might fetch this from a database
      const db: Record<number, User> = {
        1: { id: 1, name: "Alice" },
        2: { id: 2, name: "Bob" },
      };
      return db[id];
    });
}

const user1 = findUser("1"); // Some({ id: 1, name: "Alice" })
const user2 = findUser("foo"); // None
const user3 = findUser("-1"); // None
const user4 = findUser("3"); // None
```

### JavaScript Integration

Implementing `toString()` provides **better debugging and logging experience**.

**Benefits:**

- **Easy logging**: Can log options directly in console and debug tools
- **String operations**: Template literals and concatenation work naturally
- **No implicit coercion**: Explicit method calls prevent unexpected behaviors

```typescript
console.log(option);                           // no implicit toString()
console.log("Result:" + option);               // implicit toString()
console.log("Result:" + option.toString());    // implicit toString()
console.log("Result:" + String(option));       // implicit toString()
console.log(`Result: ${option}`);              // implicit toString()
console.log(`Result: ${option.toString()}`);   // implicit toString()
console.log(`Result: ${String(option)}`);      // implicit toString()
```

**Note:** This implementation intentionally **does not implement `valueOf()`** to avoid unpredictable implicit coercion behaviors. Always use explicit methods like `isSome()`, `unwrapOr()`, etc. for conditional logic.

## TypeScript Type Narrowing

The Option type integrates seamlessly with TypeScript's type system:

```typescript
// Type guards work automatically
const opt: Option<number> = getSomeOption();
if (opt.isSome()) {
  const value: number = opt.unwrap();  // Type-safe!
}

// Type predicates
const mixed: Option<string | number> = O.from(42);
if (mixed.isSomeAnd((x): x is number => typeof x === "number")) {
  const num: number = mixed.unwrap();  // TypeScript knows it's a number
}

// Filter with type guards
const filtered: Option<number> = mixed.filter(
  (x): x is number => typeof x === "number"
);
```

## Comparison with Other Approaches

### vs Null/Undefined Checks

```typescript
// Traditional
let email: string | undefined;
if (user && user.profile && user.profile.email) {
  email = user.profile.email.toLowerCase();
}

// With Option
const email = O.fromNullable(user)
  .mapNullable(u => u.profile)
  .mapNullable(p => p.email)
  .map(e => e.toLowerCase());
```

### vs Optional Chaining

```typescript
// Optional chaining
const email = user?.profile?.email?.toLowerCase();  // string | undefined

// With Option
const email = O.fromNullable(user)
  .mapNullable(u => u.profile)
  .mapNullable(p => p.email)
  .map(e => e.toLowerCase());  // Option<string>
```

Option provides more explicit error handling and better composability, while optional chaining is more concise for simple access patterns.

## Common Pitfalls

### Coercing `Option` to a Boolean

A common mistake is to check for the presence of a value by treating the `Option` as a boolean. `Option` is an object, so it will always be "truthy" in JavaScript, even when it's a `None`.

```typescript
const opt = O.empty<string>();

// ❌ Incorrect: This block will always execute
if (opt) {
  console.log("This will always be logged!");
}

// ✅ Correct: Use `isSome()` or `isNone()`
if (opt.isSome()) {
  // This block will not execute
  console.log("Value is present:", opt.unwrap());
}
```

## Design Philosophy

This implementation prioritizes **developer experience and productivity**. Key design decisions:

### Class-Based Architecture

Uses class instances instead of utility functions for better IDE autocomplete, method chaining, and type inference. No need to update import any time you need a new operation.

```typescript
// Class-based (this implementation)
O.some(42)
  .map(x => x * 2)
  .filter(x => x > 50)
  .unwrapOr(0);

// vs utility-based alternative
pipe(
  some(42),
  map(x => x * 2),
  filter(x => x > 50),
  unwrapOr(0)
);
```

### Separated Some and None

`Some` and `None` are implemented as separate classes that extend a common `Option` abstract class. This design has several tradeoffs compared to the more common discriminated union pattern.

**Pros of Separate Classes (This Implementation):**

-   **Performance**: Each class has its own method implementations, avoiding `if (isSome(option))` checks within each method. This results in more direct and slightly faster execution.
-   **Cleaner Implementation**: Method logic is cleaner as it doesn't require branching. For example, `map` on `None` always returns `None` without executing the mapping function.
-   **Singleton `None`**: `None` is an immutable singleton, which reduces memory allocations for empty options.

**Cons of Separate Classes:**

-   **Serialization**: Class instances are not easily serializable.
-   **Less Common Pattern**: Most developers familiar with functional TypeScript might expect a discriminated union.

### vs. Discriminated Unions

A discriminated union is an alternative way to define `Option`, typically using a `_tag` property to distinguish between variants.

```typescript
type Option<T> =
  | { readonly _tag: 'Some'; readonly value: T }
  | { readonly _tag: 'None' };
```

**Pros of Discriminated Unions:**

-   **Idiomatic & Predictable**: This is a standard pattern in the functional TypeScript ecosystem, making it familiar to many developers.
-   **Easy Serialization**: As plain objects, they can be losslessly serialized with `JSON.stringify` and deserialized with `JSON.parse`.

**Cons of Discriminated Unions:**

-   **No Method Chaining**: Operations must be performed with standalone utility functions, which can be less ergonomic than method chaining (e.g., `pipe(option, map(fn))` vs. `option.map(fn)`).
-   **Runtime Checks**: Every operation needs to perform a runtime check on the `_tag` property, which can be slightly less performant than the class-based virtual dispatch.

### Type-Safe Unwrapping

By design, calling `unwrap()` on `Option<T>` returns `unknown`, **forcing you to do type narrowing first**. This prevents unsafe unwrapping and entire classes of runtime errors.

```typescript
const option: Option<number> = O.from(42);

// ❌ This won't compile - unwrap() returns unknown on Option<T>
const value: number = option.unwrap();

// ✅ Correct: Check first, then unwrap returns T
if (option.isSome()) {
  // After type narrowing, option is Some<number>
  const value: number = option.unwrap(); // Returns number, not unknown!
}

// ✅ Alternative: Use safe unwrapping methods
const value = option.unwrapOr(0);         // Always safe
const value = option.unwrapOrUndefined(); // Always safe
```

This design ensures you always handle the empty case explicitly, making your code more robust and preventing the "Cannot unwrap None" error at runtime.

**Why this matters:**

```typescript
// Without type narrowing enforcement, this could crash:
function dangerousCode(opt: Option<User>): string {
  const user = opt.unwrap(); // Would crash if None!
  return user.name;
}

// With type narrowing enforcement, you must handle both cases:
function safeCode(opt: Option<User>): string {
  if (opt.isSome()) {
    const user = opt.unwrap(); // Safe - TypeScript knows it's Some
    return user.name;
  }
  return "Unknown";
}

// Or use safe alternatives:
function safeCode2(opt: Option<User>): string {
  return opt.mapOr("Unknown", user => user.name);
}
```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

### Development

To get started with development:

1.  Clone the repository:
    ```bash
    git clone https://github.com/oknesar/option.git
    cd option
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the tests:
    ```bash
    npm run test
    ```

4.  Run the build:
    ```bash
    npm run build
    ```

## License

This project is licensed under the MIT License.

## API Reference

### Factory Functions

#### `O.from<T>(value: T): Option<T>`

Creates an `Option` containing the given value. This is the recommended factory function for general use.

```typescript
O.from(42);              // Option<number>
O.from("hello");         // Option<string>
O.from({ id: 1 });       // Option<{id: number}>
```

#### `O.empty<T>(): Option<T>`

Returns an empty `Option` with a specific type annotation. This is the recommended way to create an empty Option.

```typescript
const noString = O.empty<string>();  // Option<string>
noString.isNone();                   // true
```

#### `O.some<T>(value: T): Some<T>`

Creates a `Some` option containing the given value. Returns the narrowed `Some<T>` type. Use this when you need the specific `Some` type rather than the general `Option` type.

```typescript
const num = O.some(42);  // Some<number> (not Option<number>)
num.unwrap();            // 42
```

#### `O.none: None`

A singleton `None` instance representing no value. Returns the narrowed `None` type. Use this when you need the specific `None` type rather than `O.empty()`.

```typescript
const empty = O.none;  // None (not Option<never>)
empty.isNone();        // true
```

#### `O.fromNullable<T>(value: T | null | undefined): Option<T>`

Creates an `Option` from a nullable value. Returns `None` if the value is `null` or `undefined`, `Some` otherwise.

```typescript
O.fromNullable(null);      // None
O.fromNullable(undefined); // None
O.fromNullable(42);        // Some<number>
O.fromNullable(0);         // Some<number> (0 is not null!)
O.fromNullable("");        // Some<string> (empty string is valid!)
```

### Type Checking

#### `isSome(): this is Some<T>`

Returns `true` if the option contains a value, enabling TypeScript type narrowing.

```typescript
const opt = O.fromNullable(value);
if (opt.isSome()) {
  // TypeScript knows opt contains a value here
  const val = opt.unwrap(); // Safe!
}
```

#### `isNone(): this is None`

Returns `true` if the option is `None`.

```typescript
if (opt.isNone()) {
  console.log("No value present");
}
```

#### `isSomeAnd(predicate: (value: T) => boolean): boolean`

Returns `true` if the option contains a value and the predicate returns `true`.

```typescript
const opt = O.from(42);
opt.isSomeAnd(x => x > 0);  // true
opt.isSomeAnd(x => x < 0);  // false

// Works with type guards
const mixed: Option<string | number> = O.from(42);
if (mixed.isSomeAnd((x): x is number => typeof x === "number")) {
  // TypeScript knows the value is a number here
}
```

#### `isNoneOr(predicate: (value: T) => boolean): boolean`

Returns `true` if the option is empty or the predicate returns `true`.

```typescript
O.from(42).isNoneOr(x => x > 0);  // true
O.from(42).isNoneOr(x => x < 0);  // false
O.empty().isNoneOr(() => false);  // true
```

#### `contains(value: U): boolean`

Returns `true` if the option contains the given value.

```typescript
O.from(42).contains(42);   // true
O.from(42).contains(10);   // false
O.empty().contains(42);    // false
```

### Unwrapping Values

#### `unwrap(): T`

Returns the contained value.

**⚠️ Throws an error if the option is empty.**

**⚠️ Returns `unknown` on `Option<T>` - requires type narrowing first!** After calling `isSome()`, TypeScript narrows the type to `Some<T>` and `unwrap()` returns `T`.

```typescript
const opt = O.from(42);

// Type narrowing required
if (opt.isSome()) {
  const value: number = opt.unwrap();  // Returns number
}

// Alternative: use safe methods
const value = opt.unwrapOr(0);        // Always returns number
```

#### `expect(msg: string): T`

Returns the contained value. Unlike `unwrap()`, this always returns `T` (not `unknown`) but will throw with a custom error message if empty.

**⚠️ Throws an error with the provided message if the option is empty.**

```typescript
const opt = O.from(42);
const value: number = opt.expect("should have value");  // 42 - no narrowing needed!

O.empty().expect("missing value");  // Throws: "missing value"
```

#### `unwrapOr<U>(defaultValue: U): T | U`

Returns the contained value or a provided default.

```typescript
O.from(42).unwrapOr(0);  // 42
O.empty().unwrapOr(0);   // 0
```

#### `unwrapOrElse<U>(fn: () => U): T | U`

Returns the contained value or computes it from a callback.

```typescript
O.from(42).unwrapOrElse(() => 0);        // 42
O.empty().unwrapOrElse(() => expensive());  // Result of expensive()
```

#### `unwrapOrUndefined(): T | undefined`

Returns the contained value or `undefined`.

```typescript
O.from(42).unwrapOrUndefined();  // 42
O.empty().unwrapOrUndefined();   // undefined
```

### Transformations

#### `map<U>(fn: (value: T) => U): Option<U>`

Transforms the contained value by applying a function. Returns an empty Option if the original is empty.

```typescript
O.from(42)
  .map(x => x * 2)       // Option<number> with 84
  .map(x => String(x));  // Option<string> with "84"

O.empty().map(x => x * 2);  // Option<never> (empty)
```

#### `mapOr<U>(defaultValue: U, fn: (value: T) => U): U`

Applies a function to the contained value and unwraps, or returns a default.

```typescript
O.from(42).mapOr(0, x => x * 2);  // 84
O.empty().mapOr(0, x => x * 2);   // 0
```

#### `mapOrElse<U>(defaultFn: () => U, fn: (value: T) => U): U`

Applies a function to the contained value and unwraps, or computes a default.

```typescript
O.from(42).mapOrElse(() => 0, x => x * 2);  // 84
O.empty().mapOrElse(() => 0, x => x * 2);   // 0
```

#### `mapOrUndefined<U>(fn: (value: T) => U): U | undefined`

Applies a function and returns the result or `undefined`.

```typescript
O.from(42).mapOrUndefined(x => x * 2);  // 84
O.empty().mapOrUndefined(x => x * 2);   // undefined
```

#### `mapNullable<U>(fn: (value: T) => U | null | undefined): Option<U>`

Maps with a function that may return `null` or `undefined`, automatically wrapping the result.

```typescript
O.from({ name: "John" })
  .mapNullable(user => user.email);  // Empty if email is null/undefined

O.from("42")
  .mapNullable(s => {
    const n = parseInt(s);
    return isNaN(n) ? null : n;
  });
```

#### `filter(predicate: (value: T) => boolean): Option<T>`

Returns the Option if the predicate returns `true`, otherwise returns None.

```typescript
O.from(42)
  .filter(x => x > 0);   // Option with 42

O.from(42)
  .filter(x => x < 0);   // None

// With type guards
const mixed: Option<string | number> = O.from(42);
const onlyNumbers = mixed.filter((x): x is number => typeof x === "number");
```

#### `andThen<U>(fn: (value: T) => Option<U>): Option<U>`

Chains option-returning functions (also known as `flatMap`).

```typescript
const getUser = (id: number) => O.fromNullable(findUser(id));
const getEmail = (user: User) => O.fromNullable(user.email);

O.from(123)
  .andThen(getUser)
  .andThen(getEmail);  // Option<string>
```

#### `flatten<U>(this: Option<Option<U>>): Option<U>`

Flattens a nested `Option`.

```typescript
O.from(O.from(42)).flatten();  // Option with 42
O.from(O.none).flatten();   // None
O.none.flatten();           // None
```

### Async Operations

It's important to note that `Option` itself is synchronous and does not provide asynchronous chaining mechanisms like `Promise.then()`. Instead, it offers helpers for unwrapping `Option<Promise<T>>` into `Promise<Option<T>>`, allowing developers to `await` the `Promise` independently.

#### `mapAsync<U>(fn: (value: T) => Promise<U>): Promise<Option<U>>`

Maps with an async function.

```typescript
await O.from(42)
  .mapAsync(async x => {
    const result = await fetchData(x);
    return result;
  });
```

#### `mapNullableAsync<U>(fn: (value: T) => Promise<U | null | undefined>): Promise<Option<U>>`

Maps with an async function that may return `null` or `undefined`.

```typescript
await O.from(userId)
  .mapNullableAsync(async id => await fetchUser(id));
```

#### `andThenAsync<U>(fn: (value: T) => Promise<Option<U>>): Promise<Option<U>>`

```typescript
await O.from(userId)
  .andThenAsync(async id => {
    const user = await fetchUser(id);
    return O.fromNullable(user);
  });
```

#### `transposePromise<U>(this: Option<Promise<U>>): Promise<Option<U>>`

Converts `Option<Promise<T>>` into `Promise<Option<T>>`.

```typescript
const opt: Option<Promise<number>> = O.from(Promise.resolve(42));
const result: Promise<Option<number>> = opt.transposePromise();
await result;  // Option with 42
```

### Combinators

#### `and<U>(other: Option<U>): Option<U>`

Returns None if this is empty, otherwise returns `other`.

```typescript
O.from(42).and(O.from("hello"));  // Option with "hello"
O.empty().and(O.from("hello"));   // None
```

#### `or(other: Option<T>): Option<T>`

Returns this option if it contains a value, otherwise returns `other`.

```typescript
O.from(42).or(O.from(100));  // Option with 42
O.empty().or(O.from(100));   // Option with 100
```

#### `orElse(fn: () => Option<T>): Option<T>`

Returns this option if it contains a value, otherwise calls `fn`.

```typescript
O.from(42).orElse(() => O.from(100));  // Option with 42
O.empty().orElse(() => O.from(100));   // Option with 100
```

#### `xor(other: Option<T>): Option<T>`

Returns an Option if exactly one of the options contains a value, otherwise returns empty.

```typescript
O.from(42).xor(O.none);     // Option with 42
O.empty().xor(O.from(42));     // Option with 42
O.from(42).xor(O.from(100));   // None (both have values)
O.empty().xor(O.none);      // None (both are empty)
```

#### `zip<U>(other: Option<U>): Option<[T, U]>`

Combines two options into an option of a tuple.

```typescript
O.from(42).zip(O.from("hello"));  // Option with [42, "hello"]
O.from(42).zip(O.none);        // None
```

#### `zipWith<U, R>(other: Option<U>, fn: (a: T, b: U) => R): Option<R>`

Combines two options using a reducer function.

```typescript
O.from(42).zipWith(
  O.from(10),
  (a, b) => a + b
);  // Option with 52
```

#### `unzip<A, B>(this: Option<[A, B]>): [Option<A>, Option<B>]`

Splits an option of a tuple into a tuple of options.

```typescript
const zipped = O.from([42, "hello"] as [number, string]);
const [num, str] = zipped.unzip();  // [Option with 42, Option with "hello"]

const empty = O.empty<[number, string]>();
const [a, b] = empty.unzip();  // [None, None]
```

### Pattern Matching

#### `match<U>(handlers: { Some: (value: T) => U; None: () => U }): U`

Pattern matches on the option, calling the appropriate handler.

```typescript
const result = O.from(42).match({
  Some: value => `Got: ${value}`,
  None: () => "No value"
});  // "Got: 42"

const result2 = O.empty().match({
  Some: value => `Got: ${value}`,
  None: () => "No value"
});  // "No value"
```

### Utility Methods

#### `asArray(): T[]`

Converts the option to an array with 0 or 1 elements.

```typescript
O.from(42).asArray();  // [42]
O.empty().asArray();   // []

// Useful for spreading into arrays
const values = [...O.from(1).asArray(), 2, 3];  // [1, 2, 3]
```

#### `inspect(fn: (value: T) => unknown): Option<T>`

Calls a function with the contained value for side effects, returns the original option.

```typescript
O.from(42)
  .inspect(x => console.log(`Value is: ${x}`))
  .map(x => x * 2);
```

#### `toString(): string`

Returns a string representation of the option for debugging and logging. Returns the stringified value if present, empty string if not.

**Why this is useful:**

- **Debugging**: Easy to log Options without explicit unwrapping
- **Template literals**: Natural string interpolation
- **UI display**: Safe rendering without null checks
- **No coercion issues**: Only affects string contexts

```tsx
O.from(42).toString();     // "42"
O.from("hi").toString();   // "hi"
O.empty().toString();      // ""

// Logging and debugging
console.log(`Debug: ${idOption}`);             // Works in templates
logger.info({user: userOpt.toString()});       // Explicit call

// String operations
const message = "Value: " + option.toString();  // Explicit
const message = "Value: " + option;             // Implicit
const message = `Value: ${option}`;             // Implicit
```

**Note:** This implementation intentionally does **not** implement `valueOf()` to prevent unpredictable implicit type coercion. Always use explicit methods (`isSome()`, `unwrapOr()`, etc.) for conditional logic and value extraction.

