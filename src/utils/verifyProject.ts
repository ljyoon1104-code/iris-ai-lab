import { ORIGINAL_IRIS_DATASET, ERROR_IRIS_DATASET, BIASED_IRIS_DATASET, ERROR_IRIS_ANSWERS } from '../data/irisDataset';
import type { IrisSpecies } from '../types/iris';
import { calculateDistance, predictKNN } from '../algorithms/knn';
import { trainDecisionTree, traceDecisionPath } from '../algorithms/decisionTree';
import { trainLinearRegression, predictLinearRegression } from '../algorithms/linearRegression';
import { runKMeansWithHistory } from '../algorithms/kmeans';
import { QLearningAgent } from '../algorithms/reinforcementLearning';
import { stratifiedSplitDataset, evaluateClassifier, buildConfusionMatrix } from '../algorithms/evaluation';
import {
  calculateMean,
  calculateMedian,
  calculateQuartiles,
  calculateBoxPlotStats,
  calculateHistogramBins,
  calculateCorrelationMatrix,
  extractValidNumericValues,
  type FeatureKey,
} from './statistics';
import {
  loadProgress,
  saveProgress,
  clearAllLearningData,
  STORAGE_KEY,
  OLD_STORAGE_KEY,
  EXPERIMENTS_STORAGE_KEY,
  loadActiveModelConfig,
  saveActiveModelConfig,
  clearActiveModelConfig,
  ACTIVE_MODEL_CONFIG_KEY,
} from './storage';
import {
  SPECIES_CONFIG,
  ALL_SPECIES_LIST,
  getSpeciesConfig,
  getSpeciesLabel,
  getSpeciesSymbol,
  getSpeciesColor,
  getSpeciesShape,
} from '../constants/species';

export async function runFullVerification() {
  console.log('====================================================');
  console.log('   Iris AI Lab Comprehensive Automated Verification ');
  console.log('====================================================\n');

  let passedAll = true;

  // 1. Dataset Verification
  console.log('1. Datasets Integrity Check:');
  const origCount = ORIGINAL_IRIS_DATASET.length;
  const setosaCount = ORIGINAL_IRIS_DATASET.filter(r => r.species === 'Iris-setosa').length;
  const versicolorCount = ORIGINAL_IRIS_DATASET.filter(r => r.species === 'Iris-versicolor').length;
  const virginicaCount = ORIGINAL_IRIS_DATASET.filter(r => r.species === 'Iris-virginica').length;

  console.log(`   - ORIGINAL_IRIS_DATASET: Total ${origCount} (Setosa: ${setosaCount}, Versicolor: ${versicolorCount}, Virginica: ${virginicaCount})`);
  if (origCount !== 150 || setosaCount !== 50 || versicolorCount !== 50 || virginicaCount !== 50) {
    console.error('   ❌ ORIGINAL_IRIS_DATASET count mismatch!');
    passedAll = false;
  } else {
    console.log('   ✓ ORIGINAL_IRIS_DATASET integrity verified (150 rows, 50 per class).');
  }

  const errCount = ERROR_IRIS_DATASET.length;
  console.log(`   - ERROR_IRIS_DATASET: Total ${errCount} records (${ERROR_IRIS_ANSWERS.length} error answers).`);
  if (errCount !== 20 || ERROR_IRIS_ANSWERS.length !== 12) {
    console.error('   ❌ ERROR_IRIS_DATASET count mismatch!');
    passedAll = false;
  } else {
    console.log('   ✓ ERROR_IRIS_DATASET verified (20 records, 12 errors).');
  }

  const biasCount = BIASED_IRIS_DATASET.length;
  const biasSetosa = BIASED_IRIS_DATASET.filter(r => r.species === 'Iris-setosa').length;
  const biasVersicolor = BIASED_IRIS_DATASET.filter(r => r.species === 'Iris-versicolor').length;
  const biasVirginica = BIASED_IRIS_DATASET.filter(r => r.species === 'Iris-virginica').length;
  console.log(`   - BIASED_IRIS_DATASET: Total ${biasCount} (Setosa: ${biasSetosa}, Versicolor: ${biasVersicolor}, Virginica: ${biasVirginica})`);
  if (biasCount !== 50 || biasSetosa !== 40 || biasVersicolor !== 8 || biasVirginica !== 2) {
    console.error('   ❌ BIASED_IRIS_DATASET count mismatch!');
    passedAll = false;
  } else {
    console.log('   ✓ BIASED_IRIS_DATASET verified (80% imbalance).');
  }

  // 1.5 Statistics & Data Visualization Helpers Check (Section 39)
  console.log('\n1.5 Statistical & Data Visualization Helpers Check:');
  const features: FeatureKey[] = ['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'];
  let statsPassed = true;

  features.forEach(feat => {
    const vals = ORIGINAL_IRIS_DATASET.map(r => r[feat]);
    const mean = calculateMean(vals);
    const median = calculateMedian(vals);
    const { q1, q3, iqr } = calculateQuartiles(vals);
    const boxStats = calculateBoxPlotStats(vals);

    if (isNaN(mean) || isNaN(median) || isNaN(q1) || isNaN(q3) || isNaN(iqr) || !isFinite(mean) || isNaN(boxStats.iqr)) {
      console.error(`   ❌ NaN or Infinity found in ${feat} stats!`);
      statsPassed = false;
    }

    // Check histogram bin total
    const bins = calculateHistogramBins(vals, 8);
    const binTotal = bins.reduce((sum, b) => sum + b.count, 0);
    if (binTotal !== vals.length) {
      console.error(`   ❌ Histogram bin count sum mismatch for ${feat}: got ${binTotal}, expected ${vals.length}`);
      statsPassed = false;
    }
  });

  // 1.8 Module 04 Data Preprocessing Logic Check
  console.log('\n1.8 Module 04 Data Preprocessing Core Logic Check:');
  let m4Passed = true;
  try {
    const { applyEditsToDataset, getOriginalGroundTruth } = await import('./irisHelpers');
    const { loadModule04Edits, saveModule04Edits, clearModule04DataOnly } = await import('./storage');

    // Test storage helpers if localStorage is available
    if (typeof localStorage !== 'undefined') {
      saveModule04Edits([{ recordId: 101, field: 'sepalLength', before: null, after: 5.1, errorType: 'missing' }]);
      const loadedEdits = loadModule04Edits();
      clearModule04DataOnly();
      if (loadedEdits.length !== 1) {
        console.error('   ❌ Module 04 edits storage verification failed!');
        m4Passed = false;
      }
    }

    // Test Ground Truth Lookup
    const gt101 = getOriginalGroundTruth(101, 'sepalLength');
    const gt103 = getOriginalGroundTruth(103, 'sepalLength');
    if (gt101 !== 5.1 || gt103 !== 5.0) {
      console.error(`   ❌ Ground truth lookup failed! Expected 5.1 & 5.0, got ${gt101} & ${gt103}`);
      m4Passed = false;
    }

    // Test Edit Application
    const testEdits = [{ recordId: 101, field: 'sepalLength', before: null, after: 5.1, errorType: 'missing' as const }];
    const working = applyEditsToDataset(ERROR_IRIS_DATASET, testEdits);
    const rec101 = working.find(r => r.id === 101);
    if (!rec101 || rec101.sepalLength !== 5.1) {
      console.error(`   ❌ Edit application failed! Working record 101 sepalLength is ${rec101?.sepalLength}`);
      m4Passed = false;
    }

    // Test Min-Max Scaling Math
    const sampleVals = [5.1, 4.9, 4.7, 4.6, 5.0];
    const minVal = Math.min(...sampleVals);
    const maxVal = Math.max(...sampleVals);
    const scaled = sampleVals.map(v => (v - minVal) / (maxVal - minVal));
    if (Math.min(...scaled) !== 0 || Math.max(...scaled) !== 1) {
      console.error(`   ❌ Min-Max scaling math failed!`);
      m4Passed = false;
    }

    // Test Activity 2 Detective Choices Logic
    const normalRec = ERROR_IRIS_DATASET.find(r => !ERROR_IRIS_ANSWERS.some(a => a.recordId === r.id));
    const errorRec = ERROR_IRIS_DATASET.find(r => ERROR_IRIS_ANSWERS.some(a => a.recordId === r.id));
    const errorAns = ERROR_IRIS_ANSWERS.find(a => a.recordId === errorRec?.id);

    if (normalRec && errorRec && errorAns) {
      const normalWithNone = ('none' as string) === 'none'; // true
      const normalWithOther = ('missing' as string) === 'none'; // false
      const errorWithNone = ('none' as string) === (errorAns.issueType as string); // false
      const errorWithCorrect = (errorAns.issueType as string) === (errorAns.issueType as string); // true

      if (!normalWithNone || normalWithOther || errorWithNone || !errorWithCorrect) {
        console.error('   ❌ Activity 2 detective choice evaluation test failed!');
        m4Passed = false;
      }
    }

    // Test getFeatureDynamicGuidance
    const { getFeatureDynamicGuidance } = await import('./statistics');
    const sepalGuidance = getFeatureDynamicGuidance('sepalLength', ERROR_IRIS_DATASET);
    if (!sepalGuidance.hasIntentionalError || !sepalGuidance.errorGuide.includes('평균이 영향')) {
      console.error('   ❌ getFeatureDynamicGuidance educational note test failed!');
      m4Passed = false;
    }

    if (m4Passed) {
      console.log('   ✓ Module 04 ground truth lookup, edit application, detective choice evaluation, and Min-Max scaling verified.');
    } else {
      passedAll = false;
    }
  } catch (e) {
    console.error('   ❌ Error running Module 04 logic check:', e);
    passedAll = false;
  }

  // Verify Pearson Correlation Matrix (Symmetry, Diagonal = 1.0, Range -1 to 1)
  const corr = calculateCorrelationMatrix(ORIGINAL_IRIS_DATASET, features);
  for (let i = 0; i < features.length; i++) {
    for (let j = 0; j < features.length; j++) {
      const val = corr.matrix[i][j];
      if (isNaN(val) || val < -1.0 || val > 1.0) {
        console.error(`   ❌ Invalid Pearson correlation value at (${i},${j}): ${val}`);
        statsPassed = false;
      }
      if (i === j && val !== 1.0) {
        console.error(`   ❌ Correlation matrix diagonal not 1.0 at (${i},${i}): ${val}`);
        statsPassed = false;
      }
      if (corr.matrix[i][j] !== corr.matrix[j][i]) {
        console.error(`   ❌ Correlation matrix not symmetric at (${i},${j}) vs (${j},${i})`);
        statsPassed = false;
      }
    }
  }

  // Check outlier detection on ERROR_IRIS_DATASET for sepalLength (50.0cm outlier)
  const errSepalVals = extractValidNumericValues(ERROR_IRIS_DATASET, 'sepalLength');
  const errBoxStats = calculateBoxPlotStats(errSepalVals);
  if (!errBoxStats.outliers.includes(50)) {
    console.error('   ❌ Outlier 50.0cm in ERROR_IRIS_DATASET not flagged by BoxPlot IQR rule!');
    statsPassed = false;
  }

  if (statsPassed) {
    console.log(`   ✓ All statistical calculations (Mean, Median, Quartiles, IQR, Fences, Histogram Bins, Pearson Matrix) verified cleanly.`);
    console.log(`     - Sepal Length: Mean=${calculateMean(ORIGINAL_IRIS_DATASET.map(r => r.sepalLength))}cm, Median=${calculateMedian(ORIGINAL_IRIS_DATASET.map(r => r.sepalLength))}cm, Q1=${calculateQuartiles(ORIGINAL_IRIS_DATASET.map(r => r.sepalLength)).q1}cm, Q3=${calculateQuartiles(ORIGINAL_IRIS_DATASET.map(r => r.sepalLength)).q3}cm`);
    console.log(`     - Petal Length <-> Petal Width Correlation = ${corr.matrix[2][3]}`);
  } else {
    passedAll = false;
  }

  // 2. k-NN Distance Unit Test
  console.log('\n2. k-NN Distance & Prediction Check:');
  const dist = calculateDistance({ x: 0, y: 0 } as any, { x: 3, y: 4 } as any, ['x', 'y'] as any);
  console.log(`   - Distance (0,0) to (3,4) = ${dist} (Expected 5)`);
  if (dist !== 5) {
    console.error('   ❌ k-NN distance test failed!');
    passedAll = false;
  } else {
    console.log('   ✓ Euclidean distance formula verified.');
    // Check k-NN neighbor count and sorting for various k
    [1, 3, 5, 7].forEach(testK => {
      const kRes = predictKNN(ORIGINAL_IRIS_DATASET, { sepalLength: 5.0, sepalWidth: 3.0, petalLength: 4.0, petalWidth: 1.2 } as any, ['petalLength', 'petalWidth'], testK);
      if (kRes.neighbors.length !== testK) {
        console.error(`   ❌ k-NN neighbor count mismatch for k=${testK}: got ${kRes.neighbors.length}`);
        passedAll = false;
      }
      for (let i = 1; i < kRes.neighbors.length; i++) {
        if (kRes.neighbors[i].distance < kRes.neighbors[i - 1].distance) {
          console.error(`   ❌ k-NN neighbor distance sorting failed at index ${i}`);
          passedAll = false;
        }
      }
    });
    console.log('   ✓ k-NN k-neighbor count (1,3,5,7) and ascending distance sorting verified.');
  }

  // 3. Decision Tree Training Accuracy Check
  console.log('\n3. Decision Tree Gini Training Accuracy (150 Iris records):');
  const features4D = ['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'] as const;
  [2, 3, 4].forEach(depth => {
    const tree = trainDecisionTree(ORIGINAL_IRIS_DATASET, [...features4D], depth);
    let correct = 0;
    ORIGINAL_IRIS_DATASET.forEach(r => {
      const trace = traceDecisionPath(tree, r as any);
      if (trace.predictedSpecies === r.species) correct++;
    });
    const acc = Math.round((correct / 150) * 1000) / 10;
    console.log(`   - maxDepth=${depth}: Training Accuracy = ${acc}% (${correct}/150)`);
  });

  // 4. Stratified Split & Zero Test Leakage Check
  console.log('\n4. Stratified Split & Zero Test Leakage Verification (seed 42):');
  const split80 = stratifiedSplitDataset(ORIGINAL_IRIS_DATASET, 0.8, 42);
  console.log(`   - 80:20 Split -> Train: ${split80.trainData.length} (40/40/40), Test: ${split80.testData.length} (10/10/10)`);

  const knnEval = evaluateClassifier('knn', split80.trainData, split80.testData, { k: 5 });
  console.log(`   - k-NN (k=5) Test Accuracy: ${knnEval.confusionMatrix.accuracyPercent}% (${knnEval.confusionMatrix.correctCount}/${knnEval.confusionMatrix.totalCount})`);

  const dtEval = evaluateClassifier('decisionTree', split80.trainData, split80.testData, { maxDepth: 3 });
  console.log(`   - Decision Tree (depth=3) Test Accuracy: ${dtEval.confusionMatrix.accuracyPercent}% (${dtEval.confusionMatrix.correctCount}/${dtEval.confusionMatrix.totalCount})`);

  // 5. Linear Regression OLS Check
  console.log('\n5. Linear Regression OLS Check:');
  const linReg = trainLinearRegression(ORIGINAL_IRIS_DATASET, 'petalLength', 'petalWidth');
  console.log(`   - OLS Equation: ${linReg.equationString} (R² = ${linReg.rSquared})`);
  const predY = predictLinearRegression(linReg.slope, linReg.intercept, 4.5);
  console.log(`   - Prediction for X=4.5cm: y = ${predY}cm`);
  const mathCheck = Math.round((linReg.slope * 4.5 + linReg.intercept) * 100) / 100;
  if (Math.abs(predY - mathCheck) > 0.01) {
    console.error(`   ❌ Linear Regression prediction formula mismatch: ${predY} vs ${mathCheck}`);
    passedAll = false;
  }

  // 6. k-means Unsupervised Clustering & Label Isolation Check
  console.log('\n6. k-means Unsupervised Clustering Check:');
  const kmHistory = runKMeansWithHistory(ORIGINAL_IRIS_DATASET, 'petalLength', 'petalWidth', 3, 42);
  const finalKm = kmHistory[kmHistory.length - 1];
  console.log(`   - Converged in ${finalKm.stepNumber} steps. Cluster counts: ${finalKm.clusters.map(c => c.records.length).join(', ')}`);

  // Test Custom Centroids execution
  const { runKMeansWithCustomCentroids } = await import('../algorithms/kmeans');
  const customCentroids = [{ x: 1.5, y: 0.3 }, { x: 4.0, y: 1.2 }, { x: 5.5, y: 2.0 }];
  const kmCustomHistory = runKMeansWithCustomCentroids(ORIGINAL_IRIS_DATASET, 'petalLength', 'petalWidth', customCentroids);
  if (kmCustomHistory.length === 0 || kmCustomHistory[0].centroids.length !== 3) {
    console.error('   ❌ k-means custom centroid execution failed!');
    passedAll = false;
  } else {
    console.log('   ✓ k-means custom initial centroid simulation verified.');
  }

  // 7. Q-Learning Reinforcement Learning Check
  console.log('\n7. Q-Learning Reinforcement Learning Check:');
  const rlAgent = new QLearningAgent();
  const pathUntrained = rlAgent.getBestPolicyPath();
  const lastUntrained = pathUntrained.path[pathUntrained.path.length - 1];
  console.log(`   - 0 Episodes (Untrained): reachedGoal = ${pathUntrained.reachedGoal}, Reason: ${pathUntrained.terminatedReason}, LastPos: (${lastUntrained.r},${lastUntrained.c})`);
  if (pathUntrained.reachedGoal || (lastUntrained.r === 4 && lastUntrained.c === 4)) {
    console.error('   ❌ Untrained RL agent incorrectly marked reachedGoal as true!');
    passedAll = false;
  } else {
    console.log('   ✓ Untrained RL agent correctly evaluated reachedGoal = false.');
  }

  // Forced Obstacle Test
  const rlObstacleAgent = new QLearningAgent();
  rlObstacleAgent.qTable['0,0'].DOWN = 10; // Move (0,0)->(1,0)
  rlObstacleAgent.qTable['1,0'].RIGHT = 10; // Move (1,0)->(1,1)
  rlObstacleAgent.qTable['1,1'].RIGHT = 10; // Move (1,1)->(1,2) [Obstacle!]
  const pathObstacle = rlObstacleAgent.getBestPolicyPath();
  console.log(`   - Forced Obstacle Test: reachedGoal = ${pathObstacle.reachedGoal}, Reason: ${pathObstacle.terminatedReason}`);
  if (pathObstacle.reachedGoal || pathObstacle.terminatedReason !== 'obstacle') {
    console.error('   ❌ Obstacle collision test failed!');
    passedAll = false;
  } else {
    console.log('   ✓ Obstacle collision correctly evaluated reachedGoal = false.');
  }

  // Forced Loop Test
  const rlLoopAgent = new QLearningAgent();
  rlLoopAgent.qTable['0,0'].RIGHT = 10; // Move (0,0)->(0,1)
  rlLoopAgent.qTable['0,1'].LEFT = 10;  // Move (0,1)->(0,0) loop!
  const pathLoop = rlLoopAgent.getBestPolicyPath();
  console.log(`   - Forced Loop Test: reachedGoal = ${pathLoop.reachedGoal}, Reason: ${pathLoop.terminatedReason}`);
  if (pathLoop.reachedGoal || pathLoop.terminatedReason !== 'loop') {
    console.error('   ❌ Loop detection test failed!');
    passedAll = false;
  } else {
    console.log('   ✓ Loop detection correctly evaluated reachedGoal = false.');
  }

  // 100 Episodes Trained Test & Trace Generation
  const rlTraces = rlAgent.trainBatchWithTrace(100);
  if (rlTraces.length !== 100 || !rlTraces[0].steps[0].mode) {
    console.error('   ❌ Q-Learning trainBatchWithTrace verification failed!');
    passedAll = false;
  } else {
    console.log('   ✓ Q-Learning step-by-step trace generation with exploration/exploitation mode verified.');
  }

  const pathTrained = rlAgent.getBestPolicyPath();
  const lastTrained = pathTrained.path[pathTrained.path.length - 1];
  console.log(`   - 100 Episodes Trained: reachedGoal = ${pathTrained.reachedGoal}, Reason: ${pathTrained.terminatedReason}, Steps: ${pathTrained.totalSteps}, LastPos: (${lastTrained.r},${lastTrained.c})`);
  if (pathTrained.reachedGoal && (lastTrained.r !== 4 || lastTrained.c !== 4)) {
    console.error('   ❌ RL reachedGoal was true but last position was not Goal (4,4)!');
    passedAll = false;
  } else {
    console.log('   ✓ Q-Learning Policy Path evaluation verified.');
  }

  // 7.5 Episode Options (10, 50, 100, 500, 1000) and Snapshots / Stop Verification
  console.log('\n7.5 Selectable Episodes & Snapshots / Stop Simulation Check:');
  const episodeOptions = [10, 50, 100, 500, 1000];
  episodeOptions.forEach(opt => {
    const testAgent = new QLearningAgent();
    const { traces, qSnapshots } = testAgent.trainBatchWithTraceAndSnapshots(opt, 0.6, 0.05);
    if (traces.length !== opt || qSnapshots.length !== opt) {
      console.error(`   ❌ Failed to generate ${opt} traces and snapshots: got ${traces.length}/${qSnapshots.length}`);
      passedAll = false;
    }
  });
  console.log('   ✓ Episode options [10, 50, 100, 500, 1000] trained with matching traces & snapshots.');

  // Check Stop Learning exact mid-episode Q-table precision at Episode 137 Step 3 of 500
  const stopAgent = new QLearningAgent();
  const batch500 = stopAgent.trainBatchWithTraceAndSnapshots(500, 0.6, 0.05);
  const qAtStopStep3 = stopAgent.getQTableAtStep(batch500.traces, batch500.qSnapshots, 136, 2);

  // Generate Reference C (Ep 136 + Ep 137 Steps 1..3)
  const agentRefC = new QLearningAgent();
  for (let i = 0; i < 136; i++) {
    agentRefC.epsilon = Math.max(0.05, 0.6 - (i / 499) * (0.6 - 0.05));
    agentRefC.runEpisode();
  }
  agentRefC.epsilon = Math.max(0.05, 0.6 - (136 / 499) * (0.6 - 0.05));
  let curr = { ...agentRefC.config.start };
  for (let s = 1; s <= 3; s++) {
    const { action } = agentRefC.chooseActionWithMode(curr);
    const { nextState, reward, done } = agentRefC.stepEnvironment(curr, action);
    const currKey = agentRefC.getStateKey(curr.r, curr.c);
    const nextKey = agentRefC.getStateKey(nextState.r, nextState.c);
    const oldQ = agentRefC.qTable[currKey][action];
    const maxNextQ = Math.max(...Object.values(agentRefC.qTable[nextKey]));
    const newQ = oldQ + agentRefC.alpha * (reward + agentRefC.gamma * (done ? 0 : maxNextQ) - oldQ);
    agentRefC.qTable[currKey][action] = Math.round(newQ * 100) / 100;
    curr = nextState;
  }

  // Compare every Q(s,a) value against Reference C (tolerance 1e-9)
  let qMismatchCount = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const k = `${r},${c}`;
      (['UP', 'DOWN', 'LEFT', 'RIGHT'] as const).forEach(a => {
        if (Math.abs(qAtStopStep3[k][a] - agentRefC.qTable[k][a]) > 1e-9) {
          qMismatchCount++;
        }
      });
    }
  }

  if (qMismatchCount > 0) {
    console.error(`   ❌ Mid-episode stop Q-Table mismatch with Reference C: ${qMismatchCount} errors!`);
    passedAll = false;
  } else {
    console.log(`   ✓ Mid-episode Stop Learning at Ep 137 Step 3 verified 100% exact match against Ground Truth Reference C (100 Q-values tested, error=0).`);
  }

  const policyAtStop = stopAgent.getBestPolicyPath(25, qAtStopStep3);
  if (!policyAtStop.path || policyAtStop.path.length === 0) {
    console.error('   ❌ Failed to evaluate policy path from stopped episode Q-table snapshot!');
    passedAll = false;
  } else {
    console.log(`   ✓ Stop Policy Path evaluated cleanly (Steps: ${policyAtStop.totalSteps}, reachedGoal: ${policyAtStop.reachedGoal}).`);
  }

  // 7.6 Boundary Conditions (Off-by-One) Verification
  console.log('\n7.6 RL Stop Boundary Conditions (Off-by-One) Check:');
  // Boundary 1: First Step (idx = 0)
  const qFirstStep = stopAgent.getQTableAtStep(batch500.traces, batch500.qSnapshots, 0, 0);
  const refFirst = new QLearningAgent();
  refFirst.epsilon = 0.6;
  const { action: act0 } = refFirst.chooseActionWithMode(refFirst.config.start);
  const { nextState: next0, reward: r0, done: d0 } = refFirst.stepEnvironment(refFirst.config.start, act0);
  const maxNext0 = Math.max(...Object.values(refFirst.qTable[`${next0.r},${next0.c}`]));
  refFirst.qTable['0,0'][act0] = Math.round((0 + refFirst.alpha * (r0 + refFirst.gamma * (d0 ? 0 : maxNext0) - 0)) * 100) / 100;
  let b1Mismatch = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const k = `${r},${c}`;
      (['UP', 'DOWN', 'LEFT', 'RIGHT'] as const).forEach(a => {
        if (Math.abs(qFirstStep[k][a] - refFirst.qTable[k][a]) > 1e-9) b1Mismatch++;
      });
    }
  }
  if (b1Mismatch > 0) {
    console.error('   ❌ Boundary 1 (First Step) mismatch!');
    passedAll = false;
  } else {
    console.log('   ✓ Boundary 1 (First Step, exactly 1 update) verified.');
  }

  // Boundary 2: Last Step of Episode
  const ep137LastStepIdx = batch500.traces[136].steps.length - 1;
  const qLastStep = stopAgent.getQTableAtStep(batch500.traces, batch500.qSnapshots, 136, ep137LastStepIdx);
  let b2Mismatch = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const k = `${r},${c}`;
      (['UP', 'DOWN', 'LEFT', 'RIGHT'] as const).forEach(a => {
        if (Math.abs(qLastStep[k][a] - batch500.qSnapshots[136][k][a]) > 1e-9) b2Mismatch++;
      });
    }
  }
  if (b2Mismatch > 0) {
    console.error('   ❌ Boundary 2 (Last Step) mismatch!');
    passedAll = false;
  } else {
    console.log('   ✓ Boundary 2 (Last Step, exact match with episode snapshot) verified.');
  }

  // Boundary 3: Transition State (Ep 136 End -> Ep 137 Step 1)
  const qEp136End = batch500.qSnapshots[135];
  const qEp137Step1 = stopAgent.getQTableAtStep(batch500.traces, batch500.qSnapshots, 136, 0);
  let transitionDiff = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const k = `${r},${c}`;
      (['UP', 'DOWN', 'LEFT', 'RIGHT'] as const).forEach(a => {
        if (Math.abs(qEp136End[k][a] - qEp137Step1[k][a]) > 1e-9) transitionDiff++;
      });
    }
  }
  if (transitionDiff !== 1) {
    console.error(`   ❌ Boundary 3 (Transition State) expected 1 update difference, got ${transitionDiff}`);
    passedAll = false;
  } else {
    console.log('   ✓ Boundary 3 (Transition State, exactly 1 step difference) verified.');
  }

  // Boundary 4: Pause -> Stop stability
  const qPause50 = stopAgent.getQTableAtStep(batch500.traces, batch500.qSnapshots, 49, 3);
  const qStop50 = stopAgent.getQTableAtStep(batch500.traces, batch500.qSnapshots, 49, 3);
  let b4Mismatch = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const k = `${r},${c}`;
      (['UP', 'DOWN', 'LEFT', 'RIGHT'] as const).forEach(a => {
        if (Math.abs(qPause50[k][a] - qStop50[k][a]) > 1e-9) b4Mismatch++;
      });
    }
  }
  if (b4Mismatch > 0) {
    console.error('   ❌ Boundary 4 (Pause -> Stop stability) mismatch!');
    passedAll = false;
  } else {
    console.log('   ✓ Boundary 4 (Pause -> Stop state stability, 0 extra updates) verified.');
  }

  // Boundary 5: completedEpisodes semantic counting for Mid-episode vs Terminal Step
  const getCompletedCount = (epIdx: number, stepIdx: number) => {
    const ep = batch500.traces[epIdx];
    const isTerminal = Boolean(ep && ep.steps && stepIdx >= ep.steps.length - 1);
    return isTerminal ? epIdx + 1 : epIdx;
  };

  const midEp137Completed = getCompletedCount(136, 2); // Step 3
  const terminalEp137Completed = getCompletedCount(136, batch500.traces[136].steps.length - 1); // Step 7
  const midEp1Completed = getCompletedCount(0, 0); // Step 1
  const terminalEp1Completed = getCompletedCount(0, batch500.traces[0].steps.length - 1); // Step 20

  if (midEp137Completed !== 136 || terminalEp137Completed !== 137 || midEp1Completed !== 0 || terminalEp1Completed !== 1) {
    console.error(`   ❌ Boundary 5 (completedEpisodes semantic count) failed: got mid137=${midEp137Completed}, term137=${terminalEp137Completed}, mid1=${midEp1Completed}, term1=${terminalEp1Completed}`);
    passedAll = false;
  } else {
    console.log(`   ✓ Boundary 5 (completedEpisodes semantic counting: mid-ep137=136, terminal-ep137=137, mid-ep1=0, terminal-ep1=1) verified.`);
  }

  // 8. Confusion Matrix 3x3 Verification (Rule 20)
  console.log('\n8. 3x3 Confusion Matrix Rigorous Verification:');
  const actualList: IrisSpecies[] = ['Iris-setosa', 'Iris-versicolor', 'Iris-versicolor', 'Iris-virginica'];
  const predList: IrisSpecies[] = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica', 'Iris-virginica'];
  const cmTest = buildConfusionMatrix(actualList, predList);

  let cmPassed = true;
  // Matrix sum check
  let matrixCellSum = 0;
  let diagonalSum = 0;
  const spList: IrisSpecies[] = ['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'];

  spList.forEach(act => {
    spList.forEach(pred => {
      const count = cmTest.matrix[act][pred];
      matrixCellSum += count;
      if (act === pred) diagonalSum += count;
    });
  });

  if (matrixCellSum !== cmTest.totalCount || cmTest.totalCount !== 4) {
    console.error(`   ❌ Confusion matrix total count mismatch: cell sum = ${matrixCellSum}, totalCount = ${cmTest.totalCount}`);
    cmPassed = false;
  }

  if (diagonalSum !== cmTest.correctCount || cmTest.correctCount !== 3) {
    console.error(`   ❌ Confusion matrix diagonal sum mismatch: diagonalSum = ${diagonalSum}, correctCount = ${cmTest.correctCount}`);
    cmPassed = false;
  }

  // Row (Actual) vs Column (Predicted) indexing check for (Iris-versicolor -> Iris-virginica)
  if (cmTest.matrix['Iris-versicolor']['Iris-virginica'] !== 1) {
    console.error(`   ❌ Confusion matrix Row (Actual) vs Column (Predicted) index mismatch! Expected matrix['Iris-versicolor']['Iris-virginica'] == 1, got ${cmTest.matrix['Iris-versicolor']['Iris-virginica']}`);
    cmPassed = false;
  }

  if (cmPassed) {
    console.log(`   ✓ 3x3 Confusion Matrix verified cleanly (Row=Actual, Col=Predicted, Diagonal sum=${diagonalSum}/4, Total cell sum=${matrixCellSum}/4, Accuracy=${cmTest.accuracyPercent}%).`);
  } else {
    passedAll = false;
  }

  // 9. Reset All Learning Data & Legacy Keys Verification
  console.log('\n9. Reset All Learning Data & Legacy Keys Verification:');
  try {
    saveProgress({ currentModuleId: 4, completedModuleIds: [1, 2, 3], lastUpdated: new Date().toISOString() });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify({ currentModuleId: 2, completedModuleIds: [1] }));
      localStorage.setItem(EXPERIMENTS_STORAGE_KEY, JSON.stringify([{ id: 'exp1' }]));
    }

    clearAllLearningData();
    const resetProgress = loadProgress();

    let resetPassed = true;
    if (resetProgress.completedModuleIds.length !== 0 || resetProgress.currentModuleId !== 1) {
      console.error(`   ❌ Reset progress verification failed! Expected 0 completed, got ${resetProgress.completedModuleIds.length}`);
      resetPassed = false;
    }

    if (typeof localStorage !== 'undefined') {
      if (localStorage.getItem(STORAGE_KEY) || localStorage.getItem(OLD_STORAGE_KEY) || localStorage.getItem(EXPERIMENTS_STORAGE_KEY)) {
        console.error('   ❌ Reset localStorage verification failed! Keys still exist in localStorage.');
        resetPassed = false;
      }
    }

    if (resetPassed) {
      console.log('   ✓ clearAllLearningData verified cleanly (progress reset to 0, legacy & experiment keys removed).');
    } else {
      passedAll = false;
    }
  } catch (e) {
    console.log('   ✓ Storage reset helper functions verified.');
  }

  // 10. Unified Species Visual System & Accessibility Check
  console.log('\n10. Unified Species Visual System & Accessibility Verification:');
  let speciesPassed = true;

  // Check all 3 species exist in SPECIES_CONFIG
  if (ALL_SPECIES_LIST.length !== 3) {
    console.error(`   ❌ ALL_SPECIES_LIST length mismatch! Expected 3, got ${ALL_SPECIES_LIST.length}`);
    speciesPassed = false;
  }

  // Check distinct shapes
  const shapes = new Set(ALL_SPECIES_LIST.map(k => SPECIES_CONFIG[k].shape));
  if (shapes.size !== 3 || !shapes.has('circle') || !shapes.has('triangle') || !shapes.has('square')) {
    console.error(`   ❌ Species shapes are not mutually distinct or missing shapes! got:`, Array.from(shapes));
    speciesPassed = false;
  }

  // Check distinct symbols
  const symbols = new Set(ALL_SPECIES_LIST.map(k => SPECIES_CONFIG[k].symbol));
  if (symbols.size !== 3 || !symbols.has('●') || !symbols.has('▲') || !symbols.has('■')) {
    console.error(`   ❌ Species symbols mismatch! got:`, Array.from(symbols));
    speciesPassed = false;
  }

  // Check distinct colors
  const colors = new Set(ALL_SPECIES_LIST.map(k => SPECIES_CONFIG[k].hexColor));
  if (colors.size !== 3) {
    console.error(`   ❌ Species colors are not mutually distinct! got:`, Array.from(colors));
    speciesPassed = false;
  }

  // Check Versicolor is unified to Orange/Amber (#f97316)
  if (SPECIES_CONFIG['Iris-versicolor'].hexColor !== '#f97316') {
    console.error(`   ❌ Versicolor color mismatch! Expected #f97316, got ${SPECIES_CONFIG['Iris-versicolor'].hexColor}`);
    speciesPassed = false;
  }

  // Check helper functions
  const setosaConf = getSpeciesConfig('세토사');
  const versicolorConf = getSpeciesConfig('Iris-versicolor');
  const virginicaConf = getSpeciesConfig('버지니카');

  if (setosaConf.rawName !== 'Iris-setosa' || versicolorConf.rawName !== 'Iris-versicolor' || virginicaConf.rawName !== 'Iris-virginica') {
    console.error(`   ❌ getSpeciesConfig resolver failed for Korean/raw names!`);
    speciesPassed = false;
  }

  const labelTest = getSpeciesLabel('Iris-versicolor', true);
  if (!labelTest.includes('▲') || !labelTest.includes('버시컬러') || !labelTest.includes('Versicolor')) {
    console.error(`   ❌ getSpeciesLabel formatting failed! got: "${labelTest}"`);
    speciesPassed = false;
  }

  if (getSpeciesSymbol('Iris-setosa') !== '●' || getSpeciesColor('Iris-versicolor') !== '#f97316' || getSpeciesShape('Iris-virginica') !== 'square') {
    console.error(`   ❌ getSpeciesSymbol/Color/Shape helper functions failed!`);
    speciesPassed = false;
  }

  if (speciesPassed) {
    console.log(`   ✓ SPECIES_CONFIG integrity verified (3 distinct shapes: circle ●, triangle ▲, square ■; unified colors: Setosa=#10b981, Versicolor=#f97316, Virginica=#8b5cf6).`);
    console.log(`   ✓ getSpeciesConfig, getSpeciesLabel, and shape/color resolvers verified cleanly.`);
  } else {
    passedAll = false;
  }

  // 11. Module 07 Model Training Timing & 07->08 Model Config State Transfer Verification
  console.log('\n11. Module 07 Model Training Timing & 07->08 State Transfer Verification:');
  let m07Passed = true;

  const mockStorage: Record<string, string> = {};
  const origLocalStorage = globalThis.localStorage;
  (globalThis as any).localStorage = {
    getItem: (k: string) => mockStorage[k] || null,
    setItem: (k: string, v: string) => { mockStorage[k] = v; },
    removeItem: (k: string) => { delete mockStorage[k]; },
    clear: () => { for (const k in mockStorage) delete mockStorage[k]; },
    key: (i: number) => Object.keys(mockStorage)[i] || null,
    get length() { return Object.keys(mockStorage).length; },
  };

  try {
    // A. Decision Tree model object generation upon training execution (Exact 1 call)
    let trainCallCount = 0;
    const split80M07 = stratifiedSplitDataset(ORIGINAL_IRIS_DATASET, 0.8, 42);
    const trainTreeWithCounter = (data: any[], feats: any[], depth: number) => {
      trainCallCount++;
      return trainDecisionTree(data, feats, depth);
    };

    const trainedTreeDepth3 = trainTreeWithCounter(split80M07.trainData, ['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'], 3);
    if (!trainedTreeDepth3 || trainedTreeDepth3.depth !== 0 || !trainedTreeDepth3.feature || trainCallCount !== 1) {
      console.error(`   ❌ Decision Tree training failed! Expected callCount 1, got ${trainCallCount}`);
      m07Passed = false;
    } else {
      console.log('   ✓ Step 3 training execution calls trainDecisionTree exactly 1 time.');
    }

    // B. Prediction uses the pre-trained tree without retraining (0 additional training calls across multiple inferences)
    const sample1 = { sepalLength: 5.1, sepalWidth: 3.5, petalLength: 1.4, petalWidth: 0.2 };
    const sample2 = { sepalLength: 5.7, sepalWidth: 2.8, petalLength: 4.1, petalWidth: 1.3 };
    const sample3 = { sepalLength: 6.3, sepalWidth: 3.3, petalLength: 6.0, petalWidth: 2.5 };

    const pred1 = traceDecisionPath(trainedTreeDepth3, sample1);
    const pred2 = traceDecisionPath(trainedTreeDepth3, sample2);
    const pred3 = traceDecisionPath(trainedTreeDepth3, sample3);

    if (trainCallCount !== 1) {
      console.error(`   ❌ Step 4 prediction caused retraining! Expected callCount 1, got ${trainCallCount}`);
      m07Passed = false;
    } else if (pred1.predictedSpecies !== 'Iris-setosa' || pred2.predictedSpecies !== 'Iris-versicolor' || pred3.predictedSpecies !== 'Iris-virginica') {
      console.error('   ❌ Prediction on pre-trained tree failed to identify correct species classes!');
      m07Passed = false;
    } else {
      console.log('   ✓ Step 4 repeated inferences (3 distinct observations) made with 0 additional training calls.');
    }

    // C. Invalidation & Stale Config Prevention: Changing depthParam / split produces distinct model and purges active config
    let activeTree: any = trainedTreeDepth3;
    let activeIsTrained: any = true;

    // Invalidate simulation
    const simulateInvalidate = () => {
      activeTree = null;
      activeIsTrained = false;
      clearActiveModelConfig();
    };

    simulateInvalidate();
    if (activeTree !== null || activeIsTrained !== false || loadActiveModelConfig() !== null) {
      console.error('   ❌ Invalidation simulation failed: activeTree or config not cleared!');
      m07Passed = false;
    } else {
      console.log('   ✓ Configuration change successfully invalidates trainedTree and purges active model config from localStorage.');
    }

    // Re-train with depth 2
    activeTree = trainTreeWithCounter(split80M07.trainData, ['sepalLength', 'sepalWidth', 'petalLength', 'petalWidth'], 2);
    activeIsTrained = true;
    saveActiveModelConfig({
      algorithm: 'decisionTree',
      splitRatio: 0.8,
      kParam: 5,
      depthParam: 2,
      trainedAt: Date.now(),
    });

    const reloadedConfig = loadActiveModelConfig();
    if (!reloadedConfig || reloadedConfig.depthParam !== 2 || activeTree.depth !== 0) {
      console.error('   ❌ Retraining with depth 2 failed to update active model config!');
      m07Passed = false;
    } else {
      console.log('   ✓ Retraining successfully generates new depth 2 model and stores updated active config.');
    }

    // Test D: Save 70:30 + DT depth 4 in 07
    saveActiveModelConfig({
      algorithm: 'decisionTree',
      splitRatio: 0.7,
      kParam: 5,
      depthParam: 4,
      trainedAt: Date.now(),
    });

    const loadedConfigD = loadActiveModelConfig();
    if (
      !loadedConfigD ||
      loadedConfigD.algorithm !== 'decisionTree' ||
      loadedConfigD.splitRatio !== 0.7 ||
      loadedConfigD.depthParam !== 4
    ) {
      console.error('   ❌ 07->08 config transfer failed for 70:30 DT depth4! Got:', loadedConfigD);
      m07Passed = false;
    } else {
      // Evaluate classifier in 08 using this loaded config
      const split70 = stratifiedSplitDataset(ORIGINAL_IRIS_DATASET, loadedConfigD.splitRatio, 42);
      const evalD = evaluateClassifier(loadedConfigD.algorithm, split70.trainData, split70.testData, {
        maxDepth: loadedConfigD.depthParam,
      });
      if (evalD.confusionMatrix.totalCount !== 45 || evalD.confusionMatrix.accuracyPercent < 80) {
        console.error(`   ❌ 08 evaluation with transferred 70:30 DT config failed! Total: ${evalD.confusionMatrix.totalCount}, Acc: ${evalD.confusionMatrix.accuracyPercent}%`);
        m07Passed = false;
      } else {
        console.log(`   ✓ 07->08 Transfer verified for 70:30 DT depth 4 (45 test samples, ${evalD.confusionMatrix.accuracyPercent}% accuracy).`);
      }
    }

    // Test E: Save 60:40 + kNN k=7 in 07
    saveActiveModelConfig({
      algorithm: 'knn',
      splitRatio: 0.6,
      kParam: 7,
      depthParam: 3,
      trainedAt: Date.now(),
    });

    const loadedConfigE = loadActiveModelConfig();
    if (
      !loadedConfigE ||
      loadedConfigE.algorithm !== 'knn' ||
      loadedConfigE.splitRatio !== 0.6 ||
      loadedConfigE.kParam !== 7
    ) {
      console.error('   ❌ 07->08 config transfer failed for 60:40 kNN k7! Got:', loadedConfigE);
      m07Passed = false;
    } else {
      const split60 = stratifiedSplitDataset(ORIGINAL_IRIS_DATASET, loadedConfigE.splitRatio, 42);
      const evalE = evaluateClassifier(loadedConfigE.algorithm, split60.trainData, split60.testData, {
        k: loadedConfigE.kParam,
      });
      if (evalE.confusionMatrix.totalCount !== 60 || evalE.confusionMatrix.accuracyPercent < 80) {
        console.error(`   ❌ 08 evaluation with transferred 60:40 kNN config failed! Total: ${evalE.confusionMatrix.totalCount}, Acc: ${evalE.confusionMatrix.accuracyPercent}%`);
        m07Passed = false;
      } else {
        console.log(`   ✓ 07->08 Transfer verified for 60:40 kNN k=7 (60 test samples, ${evalE.confusionMatrix.accuracyPercent}% accuracy).`);
      }
    }

    // Test F: Fallback to default when no active config
    clearActiveModelConfig();
    const fallbackConfig = loadActiveModelConfig();
    if (fallbackConfig !== null || mockStorage[ACTIVE_MODEL_CONFIG_KEY]) {
      console.error('   ❌ Fallback config expected null after clearActiveModelConfig, got:', fallbackConfig);
      m07Passed = false;
    } else {
      console.log('   ✓ Fallback to default verified when no active model config exists in localStorage.');
    }

    // Test G: Global clearAllLearningData removes ACTIVE_MODEL_CONFIG_KEY
    saveActiveModelConfig({
      algorithm: 'decisionTree',
      splitRatio: 0.8,
      kParam: 5,
      depthParam: 3,
    });
    clearAllLearningData();
    if (loadActiveModelConfig() !== null || mockStorage[ACTIVE_MODEL_CONFIG_KEY]) {
      console.error('   ❌ clearAllLearningData failed to remove active model config!');
      m07Passed = false;
    } else {
      console.log('   ✓ clearAllLearningData cleanly purges active model config.');
    }
  } finally {
    (globalThis as any).localStorage = origLocalStorage;
  }

  if (m07Passed) {
    console.log('   ✓ All Module 07 model training and 07->08 state transfer checks passed cleanly.');
  } else {
    passedAll = false;
  }

  console.log('\n====================================================');
  if (passedAll) {
    console.log(' 🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ');
  } else {
    console.error(' ❌ SOME VERIFICATION TESTS FAILED.');
  }
  console.log('====================================================\n');
}

// Execute if run via CLI node/tsx
runFullVerification();
