// Legacy command retained; run the current assertion-based browser checks.
import { runBrowserRegression } from './browserRegression';

runBrowserRegression([320,375,390,430,768,1024,1280,{width:844,height:390}]).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
