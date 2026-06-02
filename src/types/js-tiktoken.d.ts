declare module 'js-tiktoken' {
  export function get_encoding(encoding: string): {
    encode(text: string): number[];
    decode(tokens: number[]): string;
  };

  export const encoding_for_model: {
    (model: string): ReturnType<typeof get_encoding>;
  };
}
