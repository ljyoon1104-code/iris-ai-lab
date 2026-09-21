// Legacy command retained; run the current assertion-based browser checks.
import { runBrowserRegression } from './browserRegression';

runBrowserRegression([768]).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
