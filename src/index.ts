namespace Option {
	const notNullable = <T>(value: T | null | undefined): value is T =>
		value != null;
	const tuple = <A, B>(value: A, otherValue: B): [A, B] => [value, otherValue];

	/**
	 * Type Option represents an optional value: every Option is either Some and contains a value, or None, and does not.
	 * This provides a type-safe way to handle nullable values and avoid null pointer exceptions.
	 */
	export abstract class Option<T> {
		/**
		 * Returns true if the option is a Some value.
		 * @returns True if Some, false if None.
		 */
		abstract isSome(): this is Some<T>;

		/**
		 * Returns true if the option is a Some and the value inside of it matches a type predicate.
		 * @returns True if Some and predicate returns true, false otherwise.
		 */
		abstract isSomeAnd<U extends T>(
			predicate: (value: T) => value is U,
		): this is Some<U>;

		/**
		 * Returns true if the option is a Some and the value inside of it matches a predicate.
		 * @returns True if Some and predicate returns true, false otherwise.
		 */
		abstract isSomeAnd(predicate: (value: T) => unknown): this is Some<T>;

		/**
		 * Returns true if the option is a Some and the value inside of it equals a predicate.
		 * @returns True if Some and value equals a predicate, false otherwise.
		 */
		contains<const U extends T>(value: U): this is Some<U> {
			return this.isSomeAnd((optValue) => optValue === value);
		}

		/**
		 * Returns true if the option is a None value.
		 * @returns True if None, false if Some.
		 */
		abstract isNone(): this is None;

		/**
		 * Returns true if the option is a None or the value inside of it matches a type predicate.
		 * @returns True if None or predicate returns true, false otherwise.
		 */
		abstract isNoneOr<U extends T>(
			predicate: (value: T) => value is U,
		): this is Option<U>;

		/**
		 * Returns true if the option is a None or the value inside of it matches a predicate.
		 * @returns True if None or predicate returns true, false otherwise.
		 */
		abstract isNoneOr(predicate: (value: T) => unknown): boolean;

		/**
		 * Returns an array containing the value if Some, or an empty array if None.
		 * @returns An array with the contained value if Some, empty array if None.
		 */
		abstract asArray(): T[];

		/**
		 * Returns the contained Some value.
		 * @returns The contained value.
		 * @throws {Error} Throws an error with the provided message if the value is None.
		 */
		abstract expect(msg: string): T;

		/**
		 * Returns the contained Some value.
		 *
		 * @returns The contained value.
		 * @throws {Error} Throws an error if the value is None.
		 */
		abstract unwrap(): unknown;

		/**
		 * Returns the contained Some value or a provided default.
		 * @returns The contained value if Some, or the default value if None.
		 */
		abstract unwrapOr<U>(defaultValue: U): T | U;

		/**
		 * Returns the contained Some value, or undefined if None.
		 * @returns The contained value if Some, or undefined if None.
		 */
		abstract unwrapOrUndefined(): T | undefined;

		/**
		 * Returns the contained Some value or computes it from a callback.
		 * @returns The contained value if Some, or the result of fn if None.
		 */
		abstract unwrapOrElse<U>(fn: () => U): T | U;

		/**
		 * Maps an Option<T> to Option<U> by applying a function to the contained value.
		 * @returns Some with the mapped value if Some, None if None.
		 */
		abstract map<U>(fn: (value: T) => U): Option<U>;

		/**
		 * Transposes an Option of a Promise into a Promise of an Option.
		 * @returns A Promise that resolves to Some if Some, or None if None.
		 */
		abstract transposePromise<U>(this: Option<Promise<U>>): Promise<Option<U>>;

		/**
		 * Maps an Option<T> to Option<U> by applying an async function to the contained value.
		 * @returns A Promise that resolves to Some with the mapped value if Some, or None if None.
		 */
		mapAsync<U>(fn: (value: T) => Promise<U>): Promise<Option<U>> {
			return this.map(fn).transposePromise();
		}

		/**
		 * Maps an Option<T> to Option<U> by applying a function that may return null or undefined.
		 * @returns Some with the mapped value if Some and fn returns non-null, None otherwise.
		 */
		mapNullable<U>(fn: (value: T) => U | null | undefined): Option<U> {
			return this.map(fn).filter(notNullable);
		}

		/**
		 * Maps an Option<T> to Option<U> by applying an async function that may return null or undefined.
		 * @returns A Promise that resolves to Some with the mapped value if Some and fn returns non-null, None otherwise.
		 */
		mapNullableAsync<U>(
			fn: (value: T) => Promise<U | null | undefined>,
		): Promise<Option<U>> {
			return this.mapNullable(fn)
				.transposePromise()
				.then((opt) => opt.filter(notNullable));
		}

		/**
		 * Applies a function to the contained value if Some, or returns a default value if None.
		 * @returns The result of applying fn if Some, or defaultValue if None.
		 */
		mapOr<U>(defaultValue: U, fn: (value: T) => U): U {
			return this.map(fn).unwrapOr(defaultValue);
		}

		/**
		 * Maps and unwraps an Option<T> to U by applying a function to the contained value.
		 * @returns The mapped value if Some, undefined if None.
		 */
		mapOrUndefined<U>(fn: (value: T) => U): U | undefined {
			return this.map(fn).unwrapOrUndefined();
		}

		/**
		 * Applies a function to the contained value if Some, or computes a default value if None.
		 * @returns The result of applying fn if Some, or the result of defaultFn if None.
		 */
		mapOrElse<U>(defaultFn: () => U, fn: (value: T) => U): U {
			return this.map(fn).unwrapOrElse(defaultFn);
		}

		/**
		 * Calls a function with the contained value if Some for side effects.
		 * @returns The original option unchanged.
		 */
		abstract inspect(fn: (value: T) => unknown): Option<T>;

		/**
		 * Flattens an Option<Option<T>> to Option<T>.
		 * @returns The inner Option if Some, or None if None.
		 */
		flatten<U>(this: Option<Option<U>>): Option<U> {
			return this.unwrapOr(None.Instance);
		}

		/**
		 * Returns None if this option is None, otherwise returns the other option.
		 * @returns The other option if this is Some, None if this is None.
		 */
		abstract and<U>(other: Option<U>): Option<U>;

		/**
		 * Returns None if this option is None, otherwise calls fn with the wrapped value and returns the result.
		 * @returns The result of fn if Some, None if None.
		 */
		andThen<U>(fn: (value: T) => Option<U>): Option<U> {
			return this.map(fn).flatten();
		}

		/**
		 * Returns None if this option is None, otherwise calls fn with the wrapped value and returns the result.
		 * @returns A Promise that resolves to the result of fn if Some, or None if None.
		 */
		andThenAsync<U>(fn: (value: T) => Promise<Option<U>>): Promise<Option<U>> {
			return this.mapAsync(fn).then((opt) => opt.flatten());
		}

		/**
		 * Returns None if this option is None, otherwise calls predicate with the wrapped value.
		 * Returns Some(t) if predicate returns true (where t is the wrapped value), or None if predicate returns false.
		 * @returns Some with the value if Some and predicate returns true, None otherwise.
		 */
		abstract filter<U extends T>(
			predicate: (value: T) => value is U,
		): Option<U>;

		/**
		 * Returns None if this option is None, otherwise calls predicate with the wrapped value.
		 * Returns Some(t) if predicate returns true (where t is the wrapped value), or None if predicate returns false.
		 * @returns Some with the value if Some and predicate returns true, None otherwise.
		 */
		abstract filter(predicate: (value: T) => unknown): Option<T>;

		/**
		 * Returns this option if it contains a value, otherwise returns the other option.
		 * @returns This option if Some, or other if None.
		 */
		abstract or(other: Option<T>): Option<T>;

		/**
		 * Returns this option if it contains a value, otherwise calls fn and returns the result.
		 * @returns This option if Some, or the result of fn if None.
		 */
		abstract orElse(fn: () => Option<T>): Option<T>;

		/**
		 * Returns Some if exactly one of this option and other is Some, otherwise returns None.
		 * @returns Some if exactly one is Some, None if both are Some or both are None.
		 */
		abstract xor(other: Option<T>): Option<T>;

		/**
		 * Zips this option with another Option into a tuple.
		 * Returns Some containing a tuple if both are Some, otherwise returns None.
		 * @returns Some with a tuple of both values if both are Some, None otherwise.
		 */
		zip<U>(other: Option<U>): Option<[T, U]> {
			return this.zipWith(other, tuple);
		}

		/**
		 * Zips this option and another Option using a reducer function.
		 * Returns Some with the reduced value if both are Some, otherwise returns None.
		 * @returns Some with the reduced value if both are Some, None otherwise.
		 */
		abstract zipWith<U, R>(
			other: Option<U>,
			reduce: (value: T, otherValue: U) => R,
		): Option<R>;

		/**
		 * Unzips an option containing a tuple into a tuple of options.
		 * Returns a tuple of Some values if this is Some, otherwise returns a tuple of None values.
		 * @returns A tuple of (Some(a), Some(b)) if Some, or (None, None) if None.
		 */
		abstract unzip<A, B>(this: Option<[A, B]>): [Option<A>, Option<B>];

		/**
		 * Pattern matches on the option, calling the appropriate handler based on whether it is Some or None.
		 * @returns The result of calling the appropriate handler.
		 */
		abstract match<U>(condition: { Some: (value: T) => U; None: () => U }): U;

		/**
		 * Returns a string representation of the option.
		 *
		 * @returns empty string if None, or a string representation of the value if Some.
		 */
		toString(): string {
			return String(this.unwrapOr(""));
		}
	}

	export class None extends Option<never> {
		static readonly Instance = Object.freeze(new None());

		private constructor() {
			if (None.Instance) {
				throw new Error("None instance already exists.");
			}
			super();
		}

		isSome(): this is never {
			return false;
		}

		isSomeAnd(): this is never {
			return false;
		}

		isNone(): this is None {
			return true;
		}

		isNoneOr(): this is None {
			return true;
		}

		asArray<T>(): T[] {
			return [];
		}

		expect(msg: string): never {
			throw new Error(msg);
		}

		unwrap(): never {
			throw new Error("Cannot unwrap None");
		}

		unwrapOr<U>(defaultValue: U): U {
			return defaultValue;
		}

		unwrapOrUndefined(): undefined {
			return undefined;
		}

		unwrapOrElse<U>(fn: () => U): U {
			return fn();
		}

		map(): None {
			return None.Instance;
		}

		transposePromise<U>(this: Option<Promise<U>>): Promise<Option<U>> {
			return Promise.resolve(None.Instance);
		}

		inspect(): None {
			return None.Instance;
		}

		and(): None {
			return None.Instance;
		}

		filter(): None {
			return None.Instance;
		}

		or<U>(other: Option<U>): Option<U> {
			return other;
		}

		orElse<U>(fn: () => Option<U>): Option<U> {
			return fn();
		}

		xor<U>(other: Option<U>): Option<U> {
			return other;
		}

		zipWith(): None {
			return None.Instance;
		}

		unzip(this: None): [None, None] {
			return [None.Instance, None.Instance];
		}

		match<U>(condition: { None: () => U }): U {
			return condition.None();
		}
	}

	export class Some<T> extends Option<T> {
		constructor(private _value: T) {
			super();
		}

		isSome(): this is Some<T> {
			return true;
		}

		isSomeAnd<U extends T>(
			predicate: (value: T) => value is U,
		): this is Some<U>;
		isSomeAnd(predicate: (value: T) => unknown): this is Some<T>;
		isSomeAnd(predicate: (value: T) => unknown): boolean {
			return Boolean(predicate(this._value));
		}

		isNone(): this is never {
			return false;
		}

		isNoneOr<U extends T>(predicate: (value: T) => value is U): this is Some<U>;
		isNoneOr(predicate: (value: T) => unknown): this is Some<T>;
		isNoneOr(predicate: (value: T) => unknown): boolean {
			return Boolean(predicate(this._value));
		}

		asArray(): [T] {
			return [this._value];
		}

		expect(): T {
			return this._value;
		}

		unwrap(): T {
			return this._value;
		}

		unwrapOr(): T {
			return this._value;
		}

		unwrapOrUndefined(): T {
			return this._value;
		}

		unwrapOrElse() {
			return this._value;
		}

		map<U>(fn: (value: T) => U): Option<U> {
			return new Some(fn(this._value));
		}

		transposePromise<U>(this: Some<Promise<U>>): Promise<Option<U>> {
			return this._value.then((value) => new Some(value));
		}

		inspect(fn: (value: T) => unknown): Option<T> {
			fn(this._value);
			return this;
		}

		and<U>(other: Option<U>): Option<U> {
			return other;
		}

		filter<U extends T>(predicate: (value: T) => value is U): Option<U>;
		filter(predicate: (value: T) => unknown): Option<T>;
		filter(predicate: (value: T) => unknown): Option<T> {
			return predicate(this._value) ? this : None.Instance;
		}

		or(): Option<T> {
			return this;
		}

		orElse(): Option<T> {
			return this;
		}

		xor(other: Option<T>): Option<T> {
			return other.isNone() ? this : None.Instance;
		}

		zipWith<U, R>(
			other: Option<U>,
			reduce: (value: T, otherValue: U) => R,
		): Option<R> {
			return other.map((otherValue) => reduce(this._value, otherValue));
		}

		unzip<A, B>(this: Some<[A, B]>): [Some<A>, Some<B>] {
			return [new Some(this._value[0]), new Some(this._value[1])];
		}

		match<U>(condition: { Some: (value: T) => U }): U {
			return condition.Some(this._value);
		}
	}

	export const none = None.Instance;

	/**
	 * @returns A Some option containing the given value.
	 */
	export function some<T>(value: T): Some<T> {
		return new Some<T>(value);
	}

	/**
	 * @returns An empty Option (None) the given type.
	 */
	export function empty<T>(): Option<T> {
		return None.Instance;
	}

	/**
	 * @returns An Option from a value.
	 */
	export function from<T>(value: T): Option<T> {
		return new Some<T>(value);
	}

	/**
	 * Creates an Option from a nullable value.
	 * @returns Some if the value is not null or undefined, None otherwise.
	 */
	export function fromNullable<T>(value: T | null | undefined): Option<T> {
		if (value == null) {
			return None.Instance;
		}
		return new Some<T>(value);
	}
}

export default Option;

// Aliases
import OptionClass = Option.Option;
export { OptionClass as Option };
export const { Some, None, some, none, empty, from, fromNullable } = Option;
