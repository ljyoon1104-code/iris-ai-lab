// Legacy command retained; run the current assertion-based browser checks.
import { runBrowserRegression } from './browserRegression';

runBrowserRegression([320,390,768,1280]).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
