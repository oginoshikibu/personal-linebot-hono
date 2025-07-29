export class Result<T> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: string,
  ) {}

  static success<T>(value?: T): Result<T> {
    return new Result(true, value);
  }

  static failure<T>(error: string): Result<T> {
    return new Result<T>(false, undefined, error);
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }

  get isFailure(): boolean {
    return !this._isSuccess;
  }

  get value(): T {
    if (!this._isSuccess) {
      throw new Error(
        "Attempted to retrieve the success value from a failed result.",
      );
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return this._value as T;
  }

  get error(): string {
    if (this._isSuccess) {
      throw new Error(
        "Attempted to retrieve the error from a successful result.",
      );
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return this._error as string;
  }
}
