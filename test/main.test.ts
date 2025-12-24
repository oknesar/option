import { describe, expect, it } from "vitest";
import O, { None, type Option, Some } from "../src";

describe("Factory Functions", () => {
	describe("empty", () => {
		it("should return None instance", () => {
			const result = O.empty<string>();
			expect(result).toBe(O.none);
			expect(result.isNone()).toBe(true);
		});
	});

	describe("from", () => {
		it("should create Some with value", () => {
			const result = O.from(42);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(42);
		});

		it("should handle different value types", () => {
			expect(O.from("test").unwrap()).toBe("test");
			expect(O.from(true).unwrap()).toBe(true);
			expect(O.from({ id: 1 }).unwrap()).toEqual({ id: 1 });
			expect(O.from([1, 2, 3]).unwrap()).toEqual([1, 2, 3]);
		});
	});

	describe("fromNullable", () => {
		it("should return None for null", () => {
			const result = O.fromNullable<string>(null);
			expect(result).toBe(O.none);
			expect(result.isNone()).toBe(true);
		});

		it("should return None for undefined", () => {
			const result = O.fromNullable<string>(undefined);
			expect(result).toBe(O.none);
			expect(result.isNone()).toBe(true);
		});

		it("should return Some for non-null value", () => {
			const result = O.fromNullable("test");
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe("test");
		});

		it("should return Some for zero", () => {
			const result = O.fromNullable(0);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(0);
		});

		it("should return Some for empty string", () => {
			const result = O.fromNullable("");
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe("");
		});

		it("should return Some for false", () => {
			const result = O.fromNullable(false);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(false);
		});
	});

	describe("some", () => {
		it("should create Some instance", () => {
			const result = O.some(42);
			expect(result).toBeInstanceOf(O.Some);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(42);
		});
	});

	describe("none", () => {
		it("should be singleton None instance", () => {
			expect(O.none).toBe(O.none);
			expect(O.none.isNone()).toBe(true);
		});
	});
});

describe("Type Checking Methods", () => {
	describe("isSome", () => {
		it("should return true for Some", () => {
			const opt = O.from(42);
			expect(opt.isSome()).toBe(true);
		});

		it("should return false for None", () => {
			const opt = O.empty<number>();
			expect(opt.isSome()).toBe(false);
		});
	});

	describe("isSomeAnd", () => {
		it("should return true when Some and predicate matches", () => {
			const opt = O.from(42);
			expect(opt.isSomeAnd((x) => x > 0)).toBe(true);
		});

		it("should return false when Some and predicate does not match", () => {
			const opt = O.from(42);
			expect(opt.isSomeAnd((x) => x < 0)).toBe(false);
		});

		it("should return false when None", () => {
			const opt = O.empty<number>();
			expect(opt.isSomeAnd((x) => x > 0)).toBe(false);
		});

		it("should work with type guard predicate", () => {
			const opt = O.from<string | number>(42);
			const result = opt.isSomeAnd((x): x is number => typeof x === "number");
			expect(result).toBe(true);
			if (result) {
				// Type narrowing should work
				expect(typeof opt.unwrap()).toBe("number");
			}
		});

		it("should return false with type guard when predicate fails", () => {
			const opt = O.from<string | number>("test");
			const result = opt.isSomeAnd((x): x is number => typeof x === "number");
			expect(result).toBe(false);
		});
	});

	describe("isNone", () => {
		it("should return true for None", () => {
			const opt = O.empty<number>();
			expect(opt.isNone()).toBe(true);
		});

		it("should return false for Some", () => {
			const opt = O.from(42);
			expect(opt.isNone()).toBe(false);
		});
	});

	describe("isNoneOr", () => {
		it("should return true when None", () => {
			const opt = O.empty<number>();
			expect(opt.isNoneOr((x) => x > 0)).toBe(true);
		});

		it("should return true when Some and predicate matches", () => {
			const opt = O.from(42);
			expect(opt.isNoneOr((x) => x > 0)).toBe(true);
		});

		it("should return false when Some and predicate does not match", () => {
			const opt = O.from(42);
			expect(opt.isNoneOr((x) => x < 0)).toBe(false);
		});

		it("should work with type guard predicate", () => {
			const opt = O.from<string | number>(42);
			const result = opt.isNoneOr((x): x is number => typeof x === "number");
			expect(result).toBe(true);
		});

		it("should return false with type guard when predicate fails", () => {
			const opt = O.from<string | number>("test");
			const result = opt.isNoneOr((x): x is number => typeof x === "number");
			expect(result).toBe(false);
		});

		describe("contains", () => {
			it("should return true when Some contains the value", () => {
				const opt = O.from(42);
				expect(opt.contains(42)).toBe(true);
			});

			it("should return false when Some does not contain the value", () => {
				const opt = O.from(42);
				expect(opt.contains(10)).toBe(false);
			});

			it("should return false when None", () => {
				const opt = O.empty<number>();
				expect(opt.contains(42)).toBe(false);
			});

			it("should work with type narrowing", () => {
				const opt: Option<number | string> = O.from(42);
				if (opt.contains(42)) {
					expect(opt.unwrap()).toBe(42); // Type should be narrowed to 42
				}
				const opt2: Option<number | string> = O.from("hello");
				if (opt2.contains("hello")) {
					expect(opt2.unwrap()).toBe("hello"); // Type should be narrowed to "hello"
				}
			});

			it("should return false for different types that are not assignable", () => {
				const opt = O.from<number>(42);
				// @ts-expect-error - Type 'string' is not assignable to type 'number'.
				expect(opt.contains("42")).toBe(false);
			});
		});
	});
});

describe("Unwrapping Methods", () => {
	describe("unwrap", () => {
		it("should return value for Some", () => {
			const opt = O.from(42);
			expect(opt.unwrap()).toBe(42);
		});

		it("should throw for None", () => {
			const opt = O.empty<number>();
			expect(() => opt.unwrap()).toThrow("Cannot unwrap None");
		});
	});

	describe("unwrapOr", () => {
		it("should return value for Some", () => {
			const opt = O.from(42);
			expect(opt.unwrapOr(0)).toBe(42);
		});

		it("should return default for None", () => {
			const opt = O.empty<number>();
			expect(opt.unwrapOr(0)).toBe(0);
		});

		it("should handle different default types", () => {
			const opt = O.empty<number>();
			expect(opt.unwrapOr("default")).toBe("default");
		});
	});

	describe("unwrapOrUndefined", () => {
		it("should return value for Some", () => {
			const opt = O.from(42);
			expect(opt.unwrapOrUndefined()).toBe(42);
		});

		it("should return undefined for None", () => {
			const opt = O.empty<number>();
			expect(opt.unwrapOrUndefined()).toBeUndefined();
		});
	});

	describe("unwrapOrElse", () => {
		it("should return value for Some", () => {
			const opt = O.from(42);
			expect(opt.unwrapOrElse(() => 0)).toBe(42);
		});

		it("should call function for None", () => {
			const opt = O.empty<number>();
			const fn = () => 100;
			expect(opt.unwrapOrElse(fn)).toBe(100);
		});

		it("should not call function for Some", () => {
			const opt = O.from(42);
			let called = false;
			opt.unwrapOrElse(() => {
				called = true;
				return 0;
			});
			expect(called).toBe(false);
		});
	});

	describe("expect", () => {
		it("should return value for Some", () => {
			const opt = O.from(42);
			expect(opt.expect("should not fail")).toBe(42);
		});

		it("should throw with message for None", () => {
			const opt = O.empty<number>();
			expect(() => opt.expect("custom error")).toThrow("custom error");
		});
	});
});

describe("Transformation Methods", () => {
	describe("map", () => {
		it("should apply function to Some", () => {
			const opt = O.from(42);
			const result = opt.map((x) => x * 2);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(84);
		});

		it("should return None for None", () => {
			const opt = O.empty<number>();
			const result = opt.map((x) => x * 2);
			expect(result.isNone()).toBe(true);
		});

		it("should handle different transformation types", () => {
			const opt = O.from(42);
			expect(opt.map((x) => String(x)).unwrap()).toBe("42");
			expect(opt.map((x) => x > 0).unwrap()).toBe(true);
		});
	});

	describe("mapAsync", () => {
		it("should apply async function to Some", async () => {
			const opt = O.from(42);
			const result = await opt.mapAsync(async (x) => x * 2);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(84);
		});

		it("should return None for None", async () => {
			const opt = O.empty<number>();
			const result = await opt.mapAsync(async (x) => x * 2);
			expect(result.isNone()).toBe(true);
		});

		it("should handle async errors", async () => {
			const opt = O.from(42);
			expect(
				opt.mapAsync(async () => {
					throw new Error("async error");
				}),
			).rejects.toThrow("async error");
		});
	});

	describe("mapNullable", () => {
		it("should map and filter null", () => {
			const opt = O.from(42);
			const result = opt.mapNullable(() => null);
			expect(result.isNone()).toBe(true);
		});

		it("should map and filter undefined", () => {
			const opt = O.from(42);
			const result = opt.mapNullable(() => undefined);
			expect(result.isNone()).toBe(true);
		});

		it("should map and keep non-null value", () => {
			const opt = O.from(42);
			const result = opt.mapNullable((x) => x * 2);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(84);
		});

		it("should return None for None", () => {
			const opt = O.empty<number>();
			const result = opt.mapNullable((x) => x * 2);
			expect(result.isNone()).toBe(true);
		});
	});

	describe("mapNullableAsync", () => {
		it("should map and filter null async", async () => {
			const opt = O.from(42);
			const result = await opt.mapNullableAsync(async () => null);
			expect(result.isNone()).toBe(true);
		});

		it("should map and filter undefined async", async () => {
			const opt = O.from(42);
			const result = await opt.mapNullableAsync(async () => undefined);
			expect(result.isNone()).toBe(true);
		});

		it("should map and keep non-null value async", async () => {
			const opt = O.from(42);
			const result = await opt.mapNullableAsync(async (x) => x * 2);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(84);
		});

		it("should return None for None", async () => {
			const opt = O.empty<number>();
			const result = await opt.mapNullableAsync(async (x) => x * 2);
			expect(result.isNone()).toBe(true);
		});
	});

	describe("mapUnwrapOr", () => {
		it("should map and return value for Some", () => {
			const opt = O.from(42);
			const result = opt.mapOr(0, (x) => x * 2);
			expect(result).toBe(84);
		});

		it("should return default for None", () => {
			const opt = O.empty<number>();
			const result = opt.mapOr(0, (x) => x * 2);
			expect(result).toBe(0);
		});
	});

	describe("mapUnwrapOrUndefined", () => {
		it("should map and return value for Some", () => {
			const opt = O.from(42);
			const result = opt.mapOrUndefined((x) => x * 2);
			expect(result).toBe(84);
		});

		it("should return undefined for None", () => {
			const opt = O.empty<number>();
			const result = opt.mapOrUndefined((x) => x * 2);
			expect(result).toBeUndefined();
		});
	});

	describe("mapUnwrapOrElse", () => {
		it("should map and return value for Some", () => {
			const opt = O.from(42);
			const result = opt.mapOrElse(
				() => 0,
				(x) => x * 2,
			);
			expect(result).toBe(84);
		});

		it("should call default function for None", () => {
			const opt = O.empty<number>();
			const result = opt.mapOrElse(
				() => 100,
				(x) => x * 2,
			);
			expect(result).toBe(100);
		});
	});
});

describe("Promise Methods", () => {
	describe("transposePromise", () => {
		it("should transpose Some<Promise<T>> to Promise<Some<T>>", async () => {
			const opt = O.from(Promise.resolve(42));
			const result = await opt.transposePromise();
			expect(result.isSome()).toBe(true);
			expect(await result.unwrap()).toBe(42);
		});

		it("should transpose None to Promise<None>", async () => {
			const opt = O.empty<Promise<number>>();
			const result = await opt.transposePromise();
			expect(result.isNone()).toBe(true);
		});

		it("should handle rejected promises", async () => {
			const opt = O.from(Promise.reject(new Error("rejected")));
			expect(opt.transposePromise()).rejects.toThrow("rejected");
		});
	});
});

describe("Side Effects", () => {
	describe("inspect", () => {
		it("should call function with value for Some", () => {
			const opt = O.from(42);
			let captured: number | undefined;
			const result = opt.inspect((x) => {
				captured = x;
			});
			expect(captured).toBe(42);
			expect(result).toBe(opt);
		});

		it("should not call function for None", () => {
			const opt = O.empty<number>();
			let called = false;
			const result = opt.inspect(() => {
				called = true;
			});
			expect(called).toBe(false);
			expect(result).toBe(opt);
		});

		it("should return original Option", () => {
			const opt = O.from(42);
			const result = opt.inspect(() => {});
			expect(result).toBe(opt);
		});
	});
});

describe("Combinator Methods", () => {
	describe("flatten", () => {
		it("should flatten Some<Some<T>> to Some<T>", () => {
			const opt = O.from(O.from(42));
			const result = opt.flatten();
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(42);
		});

		it("should flatten Some<None> to None", () => {
			const opt = O.from(O.empty<number>());
			const result = opt.flatten();
			expect(result.isNone()).toBe(true);
		});

		it("should flatten None to None", () => {
			const opt = O.empty<Option<number>>();
			const result = opt.flatten();
			expect(result.isNone()).toBe(true);
		});
	});

	describe("and", () => {
		it("should return other for Some", () => {
			const opt1 = O.from(42);
			const opt2 = O.from("test");
			const result = opt1.and(opt2);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe("test");
		});

		it("should return None for None", () => {
			const opt1 = O.empty<number>();
			const opt2 = O.from("test");
			const result = opt1.and(opt2);
			expect(result.isNone()).toBe(true);
		});
	});

	describe("andThen", () => {
		it("should chain Option-returning function for Some", () => {
			const opt = O.from(42);
			const result = opt.andThen((x) => O.from(x * 2));
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(84);
		});

		it("should return None when function returns None", () => {
			const opt = O.from(42);
			const result = opt.andThen(() => O.empty<number>());
			expect(result.isNone()).toBe(true);
		});

		it("should return None for None", () => {
			const opt = O.empty<number>();
			const result = opt.andThen((x) => O.from(x * 2));
			expect(result.isNone()).toBe(true);
		});
	});

	describe("andThenAsync", () => {
		it("should chain async Option-returning function for Some", async () => {
			const opt = O.from(42);
			const result = await opt.andThenAsync(async (x) => O.from(x * 2));
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(84);
		});

		it("should return None when function returns None", async () => {
			const opt = O.from(42);
			const result = await opt.andThenAsync(async () => O.empty<number>());
			expect(result.isNone()).toBe(true);
		});

		it("should return None for None", async () => {
			const opt = O.empty<number>();
			const result = await opt.andThenAsync(async (x) => O.from(x * 2));
			expect(result.isNone()).toBe(true);
		});
	});

	describe("filter", () => {
		it("should return Some when predicate matches", () => {
			const opt = O.from(42);
			const result = opt.filter((x) => x > 0);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(42);
		});

		it("should return None when predicate does not match", () => {
			const opt = O.from(42);
			const result = opt.filter((x) => x < 0);
			expect(result.isNone()).toBe(true);
		});

		it("should return None for None", () => {
			const opt = O.empty<number>();
			const result = opt.filter((x) => x > 0);
			expect(result.isNone()).toBe(true);
		});

		it("should work with type guard predicate", () => {
			const opt = O.from<string | number>(42);
			const result = opt.filter((x): x is number => typeof x === "number");
			expect(result.isSome()).toBe(true);
			if (result.isSome()) {
				expect(typeof result.unwrap()).toBe("number");
			}
		});

		it("should return None when type guard fails", () => {
			const opt = O.from<string | number>("test");
			const result = opt.filter((x): x is number => typeof x === "number");
			expect(result.isNone()).toBe(true);
		});
	});

	describe("or", () => {
		it("should return self for Some", () => {
			const opt1 = O.from(42);
			const opt2 = O.from(100);
			const result = opt1.or(opt2);
			expect(result).toBe(opt1);
			expect(result.unwrap()).toBe(42);
		});

		it("should return other for None", () => {
			const opt1 = O.empty<number>();
			const opt2 = O.from(100);
			const result = opt1.or(opt2);
			expect(result).toBe(opt2);
			expect(result.unwrap()).toBe(100);
		});
	});

	describe("orElse", () => {
		it("should return self for Some", () => {
			const opt = O.from(42);
			const result = opt.orElse(() => O.from(100));
			expect(result).toBe(opt);
			expect(result.unwrap()).toBe(42);
		});

		it("should call function for None", () => {
			const opt = O.empty<number>();
			const result = opt.orElse(() => O.from(100));
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(100);
		});

		it("should not call function for Some", () => {
			const opt = O.from(42);
			let called = false;
			opt.orElse(() => {
				called = true;
				return O.from(100);
			});
			expect(called).toBe(false);
		});
	});

	describe("xor", () => {
		it("should return Some when exactly one is Some", () => {
			const opt1 = O.from(42);
			const opt2 = O.empty<number>();
			const result = opt1.xor(opt2);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(42);
		});

		it("should return Some when other is Some and self is None", () => {
			const opt1 = O.empty<number>();
			const opt2 = O.from(100);
			const result = opt1.xor(opt2);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(100);
		});

		it("should return None when both are Some", () => {
			const opt1 = O.from(42);
			const opt2 = O.from(100);
			const result = opt1.xor(opt2);
			expect(result.isNone()).toBe(true);
		});

		it("should return None when both are None", () => {
			const opt1 = O.empty<number>();
			const opt2 = O.empty<number>();
			const result = opt1.xor(opt2);
			expect(result.isNone()).toBe(true);
		});
	});
});

describe("Zipping Methods", () => {
	describe("zip", () => {
		it("should zip two Some values", () => {
			const opt1 = O.from(42);
			const opt2 = O.from("test");
			const result = opt1.zip(opt2);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toEqual([42, "test"]);
		});

		it("should return None when first is None", () => {
			const opt1 = O.empty<number>();
			const opt2 = O.from("test");
			const result = opt1.zip(opt2);
			expect(result.isNone()).toBe(true);
		});

		it("should return None when second is None", () => {
			const opt1 = O.from(42);
			const opt2 = O.empty<string>();
			const result = opt1.zip(opt2);
			expect(result.isNone()).toBe(true);
		});

		it("should return None when both are None", () => {
			const opt1 = O.empty<number>();
			const opt2 = O.empty<string>();
			const result = opt1.zip(opt2);
			expect(result.isNone()).toBe(true);
		});
	});

	describe("zipWith", () => {
		it("should zip with reducer function", () => {
			const opt1 = O.from(42);
			const opt2 = O.from(10);
			const result = opt1.zipWith(opt2, (a, b) => a + b);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(52);
		});

		it("should return None when first is None", () => {
			const opt1 = O.empty<number>();
			const opt2 = O.from(10);
			const result = opt1.zipWith(opt2, (a, b) => a + b);
			expect(result.isNone()).toBe(true);
		});

		it("should return None when second is None", () => {
			const opt1 = O.from(42);
			const opt2 = O.empty<number>();
			const result = opt1.zipWith(opt2, (a, b) => a + b);
			expect(result.isNone()).toBe(true);
		});

		it("should handle different types", () => {
			const opt1 = O.from(42);
			const opt2 = O.from("test");
			const result = opt1.zipWith(opt2, (a, b) => `${a}-${b}`);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe("42-test");
		});

		it("should zip with reducer function when both are Some", () => {
			const opt1 = O.from(10);
			const opt2 = O.from(20);
			const result = opt1.zipWith(opt2, (a, b) => a + b);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe(30);
		});

		it("should return None when the first Option is None", () => {
			const opt1 = O.empty<number>();
			const opt2 = O.from(20);
			const result = opt1.zipWith(opt2, (a, b) => a + b);
			expect(result.isNone()).toBe(true);
		});

		it("should return None when the second Option is None", () => {
			const opt1 = O.from(10);
			const opt2 = O.empty<number>();
			const result = opt1.zipWith(opt2, (a, b) => a + b);
			expect(result.isNone()).toBe(true);
		});

		it("should return None when both Options are None", () => {
			const opt1 = O.empty<number>();
			const opt2 = O.empty<number>();
			const result = opt1.zipWith(opt2, (a, b) => a + b);
			expect(result.isNone()).toBe(true);
		});

		it("should handle reducer function with different types", () => {
			const opt1 = O.from("hello");
			const opt2 = O.from(123);
			const result = opt1.zipWith(opt2, (s, n) => `${s}-${n}`);
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toBe("hello-123");
		});

		it("should handle complex reducer logic", () => {
			const userOpt = O.from({ id: 1, name: "Alice" });
			const emailOpt = O.from("alice@example.com");
			const result = userOpt.zipWith(emailOpt, (user, email) => ({
				...user,
				email,
			}));
			expect(result.isSome()).toBe(true);
			expect(result.unwrap()).toEqual({
				id: 1,
				name: "Alice",
				email: "alice@example.com",
			});
		});
	});

	describe("unzip", () => {
		it("should unzip Some<[A, B]> to [Some<A>, Some<B>]", () => {
			const opt = O.from([42, "test"] as [number, string]);
			const [opt1, opt2] = opt.unzip();
			expect(opt1.isSome()).toBe(true);
			expect(opt2.isSome()).toBe(true);
			expect(opt1.unwrap()).toBe(42);
			expect(opt2.unwrap()).toBe("test");
		});

		it("should unzip None to [None, None]", () => {
			const opt = O.empty<[number, string]>();
			const [opt1, opt2] = opt.unzip();
			expect(opt1.isNone()).toBe(true);
			expect(opt2.isNone()).toBe(true);
		});
	});
});

describe("Pattern Matching", () => {
	describe("match", () => {
		it("should call Some handler for Some", () => {
			const opt = O.from(42);
			const result = opt.match({
				Some: (x) => x * 2,
				None: () => 0,
			});
			expect(result).toBe(84);
		});

		it("should call None handler for None", () => {
			const opt = O.empty<number>();
			const result = opt.match({
				Some: (x) => x * 2,
				None: () => 0,
			});
			expect(result).toBe(0);
		});

		it("should handle different return types", () => {
			const opt1 = O.from(42);
			const result1 = opt1.match({
				Some: (x) => String(x),
				None: () => "none",
			});
			expect(result1).toBe("42");

			const opt2 = O.empty<number>();
			const result2 = opt2.match({
				Some: (x) => String(x),
				None: () => "none",
			});
			expect(result2).toBe("none");
		});
	});
});

describe("Utility Methods", () => {
	describe("asArray", () => {
		it("should return array with value for Some", () => {
			const opt = O.from(42);
			const result = opt.asArray();
			expect(result).toEqual([42]);
		});

		it("should return empty array for None", () => {
			const opt = O.empty<number>();
			const result = opt.asArray();
			expect(result).toEqual([]);
		});
	});

	describe("toString", () => {
		it("should return string representation for Some", () => {
			const opt = O.from(42);
			expect(opt.toString()).toBe("42");
		});

		it("should return empty string for None", () => {
			const opt = O.empty<number>();
			expect(opt.toString()).toBe("");
		});

		it("should handle different value types", () => {
			expect(O.from("test").toString()).toBe("test");
			expect(O.from(true).toString()).toBe("true");
			expect(O.from({ id: 1 }).toString()).toBe("[object Object]");
		});
	});
});

describe("Some Class Specific", () => {
	describe("constructor", () => {
		it("should create instance with value", () => {
			const some = O.some(42);
			expect(some).toBeInstanceOf(Some);
			expect(some.isSome()).toBe(true);
			expect(some.unwrap()).toBe(42);
		});
	});

	describe("methods return correct values", () => {
		it("should return correct value for all unwrapping methods", () => {
			const some = O.some(42);
			expect(some.unwrap()).toBe(42);
			expect(some.unwrapOr()).toBe(42);
			expect(some.unwrapOrUndefined()).toBe(42);
			expect(some.unwrapOrElse()).toBe(42);
			expect(some.expect()).toBe(42);
		});

		it("should return correct value for map", () => {
			const some = O.some(42);
			const result = some.map((x) => x * 2);
			expect(result.unwrap()).toBe(84);
		});

		it("should return correct value for filter", () => {
			const some = O.some(42);
			expect(some.filter((x) => x > 0).unwrap()).toBe(42);
			expect(some.filter((x) => x < 0).isNone()).toBe(true);
		});

		it("should return self for or", () => {
			const some = O.some(42);
			expect(some.or()).toBe(some);
		});

		it("should return self for orElse", () => {
			const some = O.some(42);
			expect(some.orElse()).toBe(some);
		});
	});

	describe("type narrowing", () => {
		it("should narrow type with isSome", () => {
			const opt: Option<number> = O.from(42);
			if (opt.isSome()) {
				expect(opt.unwrap()).toBe(42);
			}
		});

		it("should narrow type with isSomeAnd type guard", () => {
			const opt: Option<string | number> = O.from(42);
			if (opt.isSomeAnd((x): x is number => typeof x === "number")) {
				expect(typeof opt.unwrap()).toBe("number");
			}
		});
	});
});

describe("None Class Specific", () => {
	describe("singleton pattern", () => {
		it("should be singleton instance", () => {
			const none1 = O.none;
			const none2 = O.empty();
			expect(none1).toBe(none2);
			expect(none1).toBe(O.none);
		});

		it("should throw when trying to create new instance", () => {
			// @ts-expect-error - private constructor
			expect(() => new None()).toThrow("None instance already exists.");
		});
	});

	describe("methods return correct values", () => {
		it("should return correct values for unwrapping methods", () => {
			const none = O.none;
			expect(() => none.unwrap()).toThrow();
			expect(none.unwrapOr(0)).toBe(0);
			expect(none.unwrapOrUndefined()).toBeUndefined();
			expect(none.unwrapOrElse(() => 100)).toBe(100);
			expect(() => none.expect("error")).toThrow("error");
		});

		it("should return None for map", () => {
			const none = O.none;
			const result = none.map();
			expect(result).toBe(O.none);
		});

		it("should return None for filter", () => {
			const none = O.none;
			const result = none.filter();
			expect(result).toBe(O.none);
		});

		it("should return other for or", () => {
			const none = O.none;
			const other = O.some(100);
			expect(none.or(other)).toBe(other);
		});

		it("should call function for orElse", () => {
			const none = O.none;
			const result = none.orElse(() => O.some(100));
			expect(result.unwrap()).toBe(100);
		});

		it("should return other for xor when other is Some", () => {
			const none = O.none;
			const other = O.some(100);
			const result = none.xor(other);
			expect(result.unwrap()).toBe(100);
		});

		it("should return None for xor when other is None", () => {
			const none = O.none;
			const other = O.none;
			const result = none.xor(other);
			expect(result.isNone()).toBe(true);
		});
	});

	describe("error throwing behavior", () => {
		it("should throw on unwrap", () => {
			const none = O.none;
			expect(() => none.unwrap()).toThrow("Cannot unwrap None");
		});

		it("should throw on expect with custom message", () => {
			const none = O.none;
			expect(() => none.expect("custom")).toThrow("custom");
		});
	});
});

describe("JavaScript Integration", () => {
	describe("toString() with string operations", () => {
		it("should work with string concatenation", () => {
			const opt = O.from(42);
			const message = `Value: ${opt}`;
			expect(message).toBe("Value: 42");

			const empty = O.empty<number>();
			const emptyMessage = `Value: ${empty.toString()}`;
			expect(emptyMessage).toBe("Value: ");
		});

		it("should work with template literals", () => {
			const opt = O.from(42);
			const message = `Result: ${opt}`;
			expect(message).toBe("Result: 42");

			const empty = O.empty<string>();
			const emptyMessage = `Result: ${empty}`;
			expect(emptyMessage).toBe("Result: ");
		});

		it("should work with string interpolation in complex expressions", () => {
			const name = O.from("John");
			const age = O.from(30);
			const message = `${name} is ${age} years old`;
			expect(message).toBe("John is 30 years old");
		});

		it("should work in logging contexts", () => {
			const opt = O.from({ id: 1, name: "test" });
			const logMessage = `User: ${opt}`;
			expect(logMessage).toBe("User: [object Object]");

			const stringOpt = O.from("value");
			expect(String(stringOpt)).toBe("value");
		});
	});
});

describe("Edge Cases & Error Scenarios", () => {
	describe("null/undefined handling", () => {
		it("should handle null in fromNullable", () => {
			expect(O.fromNullable(null).isNone()).toBe(true);
		});

		it("should handle undefined in fromNullable", () => {
			expect(O.fromNullable(undefined).isNone()).toBe(true);
		});

		it("should handle falsy but non-null values", () => {
			expect(O.fromNullable(0).isSome()).toBe(true);
			expect(O.fromNullable("").isSome()).toBe(true);
			expect(O.fromNullable(false).isSome()).toBe(true);
		});
	});

	describe("empty values", () => {
		it("should handle empty string", () => {
			const opt = O.from("");
			expect(opt.isSome()).toBe(true);
			expect(opt.unwrap()).toBe("");
		});

		it("should handle empty array", () => {
			const opt = O.from([]);
			expect(opt.isSome()).toBe(true);
			expect(opt.unwrap()).toEqual([]);
		});

		it("should handle zero", () => {
			const opt = O.from(0);
			expect(opt.isSome()).toBe(true);
			expect(opt.unwrap()).toBe(0);
		});
	});

	describe("complex nested Options", () => {
		it("should handle Option<Option<T>>", () => {
			const opt = O.from(O.from(42));
			const flattened = opt.flatten();
			expect(flattened.unwrap()).toBe(42);
		});

		it("should handle deeply nested Options", () => {
			const opt = O.from(O.from(O.from(42)));
			const flattened1 = opt.flatten();
			const flattened2 = flattened1.flatten();
			expect(flattened2.unwrap()).toBe(42);
		});

		it("should handle Option<Option<None>>", () => {
			const opt = O.from(O.empty<number>());
			const flattened = opt.flatten();
			expect(flattened.isNone()).toBe(true);
		});
	});

	describe("async operations with errors", () => {
		it("should handle rejected promises in transposePromise", async () => {
			const opt = O.from(Promise.reject(new Error("test error")));
			expect(opt.transposePromise()).rejects.toThrow("test error");
		});

		it("should handle errors in mapAsync", async () => {
			const opt = O.from(42);
			expect(
				opt.mapAsync(async () => {
					throw new Error("map error");
				}),
			).rejects.toThrow("map error");
		});

		it("should handle errors in andThenAsync", async () => {
			const opt = O.from(42);
			expect(
				opt.andThenAsync(async () => {
					throw new Error("andThen error");
				}),
			).rejects.toThrow("andThen error");
		});
	});

	describe("type guard predicates", () => {
		it("should narrow types correctly with isSomeAnd", () => {
			const opt: Option<string | number> = O.from(42);
			if (opt.isSomeAnd((x): x is number => typeof x === "number")) {
				expect(typeof opt.unwrap()).toBe("number");
			}
		});

		it("should narrow types correctly with filter", () => {
			const opt: Option<string | number> = O.from(42);
			const filtered = opt.filter((x): x is number => typeof x === "number");
			if (filtered.isSome()) {
				expect(typeof filtered.unwrap()).toBe("number");
			}
		});
	});

	describe("chaining operations", () => {
		it("should chain multiple map operations", () => {
			const result = O.from(42)
				.map((x) => x * 2)
				.map((x) => String(x))
				.map((x) => x.length);
			expect(result.unwrap()).toBe(2);
		});

		it("should chain andThen operations", () => {
			const result = O.from(42)
				.andThen((x) => O.from(x * 2))
				.andThen((x) => O.from(x + 10));
			expect(result.unwrap()).toBe(94);
		});

		it("should chain filter operations", () => {
			const result = O.from(42)
				.filter((x) => x > 0)
				.filter((x) => x < 100)
				.filter((x) => x % 2 === 0);
			expect(result.unwrap()).toBe(42);
		});

		it("should handle chain with None in middle", () => {
			const result = O.from(42)
				.andThen((x) => O.from(x * 2))
				.andThen(() => O.empty<number>())
				.andThen((x) => O.from(x + 10));
			expect(result.isNone()).toBe(true);
		});
	});

	describe("complex scenarios", () => {
		it("should handle zip with unzip", () => {
			const opt1 = O.from(42);
			const opt2 = O.from("test");
			const zipped = opt1.zip(opt2);
			const [unzipped1, unzipped2] = zipped.unzip();
			expect(unzipped1.unwrap()).toBe(42);
			expect(unzipped2.unwrap()).toBe("test");
		});

		it("should handle match with complex logic", () => {
			const opt = O.from(42);
			const result = opt.match({
				Some: (x) => {
					if (x > 0) {
						return `positive: ${x}`;
					}
					return `non-positive: ${x}`;
				},
				None: () => "none",
			});
			expect(result).toBe("positive: 42");
		});

		it("should handle mapNullable with complex types", () => {
			interface User {
				id: number;
				name: string;
			}
			const opt = O.from<User | null>(null);
			const result = opt.mapNullable((user) => user?.name);
			expect(result.isNone()).toBe(true);
		});
	});
});
