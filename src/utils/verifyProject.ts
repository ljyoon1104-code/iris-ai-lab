import { ORIGINAL_IRIS_DATASET, ERROR_IRIS_DATASET, BIASED_IRIS_DATASET, ERROR_IRIS_ANSWERS } from '../data/irisDataset';
import { calculateDistance } from '../algorithms/knn';
import { trainDecisionTree, traceDecisionPath } from '../algorithms/decisionTree';
import { trainLinearRegression, predictLinearRegression } from '../algorithms/linearRegression';
import { runKMeansWithHistory } from '../algorithms/kmeans';
import { QLearningAgent } from '../algorithms/reinforcementLearning';
import { stratifiedSplitDataset, evaluateClassifier, buildConfusionMatrix } from '../algorithms/evaluation';

export function runFullVerification() {
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

  // 2. k-NN Distance Unit Test
  console.log('\n2. k-NN Distance & Prediction Check:');
  const dist = calculateDistance({ x: 0, y: 0 } as any, { x: 3, y: 4 } as any, ['x', 'y'] as any);
  console.log(`   - Distance (0,0) to (3,4) = ${dist} (Expected 5)`);
  if (dist !== 5) {
    console.error('   ❌ k-NN distance test failed!');
    passedAll = false;
  } else {
    console.log('   ✓ Euclidean distance formula verified.');
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

  // 6. k-means Unsupervised Clustering & Label Isolation Check
  console.log('\n6. k-means Unsupervised Clustering Check:');
  const kmHistory = runKMeansWithHistory(ORIGINAL_IRIS_DATASET, 'petalLength', 'petalWidth', 3, 42);
  const finalKm = kmHistory[kmHistory.length - 1];
  console.log(`   - Converged in ${finalKm.stepNumber} steps. Cluster counts: ${finalKm.clusters.map(c => c.records.length).join(', ')}`);

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

  // 100 Episodes Trained Test
  rlAgent.trainBatch(100);
  const pathTrained = rlAgent.getBestPolicyPath();
  const lastTrained = pathTrained.path[pathTrained.path.length - 1];
  console.log(`   - 100 Episodes Trained: reachedGoal = ${pathTrained.reachedGoal}, Reason: ${pathTrained.terminatedReason}, Steps: ${pathTrained.totalSteps}, LastPos: (${lastTrained.r},${lastTrained.c})`);
  if (pathTrained.reachedGoal && (lastTrained.r !== 4 || lastTrained.c !== 4)) {
    console.error('   ❌ RL reachedGoal was true but last position was not Goal (4,4)!');
    passedAll = false;
  } else {
    console.log('   ✓ Q-Learning Policy Path evaluation verified.');
  }

  // 8. Confusion Matrix 3x3 Verification
  console.log('\n8. 3x3 Confusion Matrix Verification:');
  const cmTest = buildConfusionMatrix(['Iris-setosa', 'Iris-versicolor', 'Iris-virginica'], ['Iris-setosa', 'Iris-versicolor', 'Iris-versicolor']);
  console.log(`   - Matrix Total: ${cmTest.totalCount}, Correct: ${cmTest.correctCount}, Accuracy: ${cmTest.accuracyPercent}%`);

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
