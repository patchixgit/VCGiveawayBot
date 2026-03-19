import crypto from "node:crypto";

export function getRandomNumber(
  min: number,
  max: number,
  passes = 1000,
): number {
  let resultsMap = new Map<number, number>();

  for (let i = 0; i < passes; i++) {
    const randomNum = crypto.randomInt(min, max + 1);

    if (resultsMap.has(randomNum)) {
      resultsMap.set(randomNum, resultsMap.get(randomNum)! + 1);
    } else {
      resultsMap.set(randomNum, 1);
    }
  }


  let mostFrequentNum: number | null = null;
  let highestCount = 0;

  for (const [num, count] of resultsMap.entries()) {
    if (count > highestCount) {
      highestCount = count;
      mostFrequentNum = num;
    }
  }

  return mostFrequentNum!;
}
