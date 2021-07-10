export interface CycleResultInterface {
  name: string;
  opsInSec: number;
  failRate: number;
  ranSampleCount: number;
  ui: any;
}

export function getCycleResult(event: any): CycleResultInterface {
  return {
    name: event.target.name,
    opsInSec: Math.round(event.target.hz),
    failRate: event.target.stats.rme.toFixed(2),
    ranSampleCount: event.target.stats.sample.length,
    ui: {
      count: event.target.output,
    },
  };
}

export function startBenchmarkLog(testSuiteName: string): void {
  console.log(`{white Starting Benchmark "{magenta.bold ${testSuiteName}}"..}`);
}

export function cycleLog(
  cycleResult: CycleResultInterface,
  ...addition: any[]
): void {
  console.log(
    `{gray ..Proceeded {green.bold ${cycleResult.name}} - {yellow ${cycleResult.opsInSec} ops/sec}}`,
    ...addition
  );
}

export function endBenchmarkLog(
  testSuiteName: string,
  results: CycleResultInterface[],
  fastest: string[]
): void {
  console.log(`{white ..End Benchmark "{magenta.bold ${testSuiteName}}"}\n\n`);

  results.sort((a, b) => {
    if (a.opsInSec < b.opsInSec) return 1;
    return -1;
  });

  let resultString = '';
  for (let i = 0; i < results.length; i++) {
    const cycleResult = results[i];

    // Build Cycle Result Log
    const cycleString = `{bold.bgGreen ${
      i + 1
    }.} {bold.blue ${cycleResult.name
      .padEnd(20, '.')
      .replace(/(\.+)$/, '{red $1}')}}{yellow ${
      cycleResult.opsInSec
    } ops/se} {gray ±${cycleResult.failRate}%} (${
      cycleResult.ranSampleCount
    } runs sampled)`;

    resultString += `${cycleString}${i < results.length - 1 ? '\n' : ''}`;
  }

  // Build Leaderboard Header
  console.log('{bgYellow.white.bold Leaderboard:}\n');

  // Print Leaderboard
  console.log(resultString);

  // Print fastest
  console.log(`\n{bold Fastest is {bold.green ${fastest}}}\n`);
}
