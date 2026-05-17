declare module "sentiment" {
  export default class Sentiment {
    analyze(phrase: string): { score: number; comparative: number };
  }
}
