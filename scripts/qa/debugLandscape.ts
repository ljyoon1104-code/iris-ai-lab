// Legacy command retained; run the current assertion-based browser checks.
import { runBrowserRegression } from './browserRegression';

runBrowserRegression([{width:844,height:390}]).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
