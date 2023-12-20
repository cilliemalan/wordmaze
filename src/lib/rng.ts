import forge from 'node-forge'

export interface RNG {
    get: (bits?: number) => number;
}

class ForgeRNG implements RNG {

    #counter: forge.util.ByteStringBuffer;
    #cipher: forge.cipher.BlockCipher;

    constructor(key: string | forge.util.ByteStringBuffer) {
        this.#counter = forge.util.createBuffer(new Uint8Array(16));
        this.#cipher = forge.cipher.createCipher("AES-ECB", key);

        this.#fill();
    }

    #fill() {
        for (let i = 0; i < this.#counter.length(); i++) {
            const c = this.#counter.at(i);
            if (c < 255) {
                this.#counter.setAt(i, c + 1);
                this.#cipher.update(this.#counter);
                break;
            } else {
                this.#counter.setAt(i, 0);
            }
        }
    }

    get(bits: number = 8) {
        let number = 0;
        while (bits > 0) {

            if (this.#cipher.output.length() == 0) {
                this.#fill();
            }
            const v = this.#cipher.output.getByte();

            number <<= Math.min(8, bits);
            if (bits < 8) {
                number |= ((1 << bits) - 1) & v;
            } else {
                number |= v;
            }

            bits -= 8;
        }

        return number;
    }
}

export function createrng(key: string): RNG {
    key = forge.pkcs5.pbkdf2(key, 'saltsaltsaltsalt', 10, 16);
    return new ForgeRNG(key);
}
