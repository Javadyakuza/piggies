export class BigIntMath {
    static min(...args: [bigint, ...bigint[]]): bigint {
        return args.reduce((m, e) => (e < m ? e : m));
    }

    static max(...args: [bigint, ...bigint[]]): bigint {
        return args.reduce((m, e) => (e > m ? e : m));
    }

    static abs(value: bigint) {
        return value < BigInt(0) ? -value : value;
    }

    static round(value: bigint, digits: number | bigint = 6) {
        const scale = BigInt(10) ** BigInt(digits);
        return ((value + scale / BigInt(2)) / scale) * scale;
    }
}
