import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ORIGINAL_IRIS_DATASET as data } from '../../src/data/irisDataset';
import { findBoundaryCase, predictKNN } from '../../src/algorithms/knn';
import { calculateRSquared } from '../../src/algorithms/linearRegression';
import { stratifiedSplitDataset } from '../../src/algorithms/evaluation';
import { clearAllLearningData, clearModule04DataOnly, saveModule04Edits, ACTIVE_MODEL_CONFIG_KEY, EXPERIMENTS_STORAGE_KEY } from '../../src/utils/storage';

test('boundary examples use the selected axes and really change the prediction', () => {
  const features = ['sepalLength','sepalWidth','petalLength','petalWidth'] as const;
  for(let x=0;x<features.length;x++) for(let y=x+1;y<features.length;y++) {
    const axes=[features[x],features[y]];
    const found=findBoundaryCase(data,axes);
    assert.ok(found, axes.join('/'));
    assert.deepEqual(Object.keys(found.point),axes);
    assert.notEqual(found.k1Result,found.k5Result);
    assert.equal(predictKNN(data,found.point,axes,1).predictedSpecies,found.k1Result);
    assert.equal(predictKNN(data,found.point,axes,5).predictedSpecies,found.k5Result);
  }
  assert.equal(findBoundaryCase(data.filter(r=>r.species==='Iris-setosa'),['sepalLength','sepalWidth']),null);
  assert.equal(findBoundaryCase([],['petalLength','petalWidth']),null);
});

test('manual regression is scored from the displayed line, including a poor negative score',()=>{
  const points=[0,1,2].map(x=>({...data[0],petalLength:x,petalWidth:2*x+1}));
  assert.equal(calculateRSquared(points,'petalLength','petalWidth',2,1),1);
  assert.equal(calculateRSquared(points,'petalLength','petalWidth',0,3),0);
  assert.ok(calculateRSquared(points,'petalLength','petalWidth',-2,10)<0);
});

test('seeded split is reproducible, disjoint, complete and stratified',()=>{
  const before=JSON.stringify(data);
  for(const ratio of [.8,.7,.6]){
    const split=stratifiedSplitDataset(data,ratio,42);
    assert.deepEqual(split,stratifiedSplitDataset(data,ratio,42));
    assert.equal(split.trainData.length,150*ratio);
    const trainIds=new Set(split.trainData.map(r=>r.id));
    assert.ok(split.testData.every(r=>!trainIds.has(r.id)));
    assert.equal(new Set([...split.trainData,...split.testData].map(r=>r.id)).size,150);
    assert.deepEqual(Object.values(split.trainCounts),[50*ratio,50*ratio,50*ratio]);
  }
  assert.notDeepEqual(stratifiedSplitDataset(data,.8,42),stratifiedSplitDataset(data,.8,43));
  assert.equal(JSON.stringify(data),before);
});

test('resets preserve unrelated keys and data changes invalidate saved model results',()=>{
  const descriptor=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
  const values=new Map<string,string>();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:(key:string)=>values.get(key)??null,
    setItem:(key:string,value:string)=>values.set(key,value),
    removeItem:(key:string)=>values.delete(key),
    key:(index:number)=>[...values.keys()][index]??null,
    get length(){return values.size;}
  }});
  try {
    for(const key of ['other_progress','other_model','other_experiment','other_evaluation','my_iris_ai_lab_notes'])values.set(key,'keep');
    values.set('iris_ai_lab_legacy','remove');values.set('fruit_ai_lab_legacy','remove');
    clearAllLearningData();
    assert.equal(values.size,5);
    assert.ok([...values.values()].every(v=>v==='keep'));
    values.set(ACTIVE_MODEL_CONFIG_KEY,'{}');values.set(EXPERIMENTS_STORAGE_KEY,'[]');
    clearModule04DataOnly();
    assert.equal(values.has(ACTIVE_MODEL_CONFIG_KEY),false);
    assert.equal(values.has(EXPERIMENTS_STORAGE_KEY),false);
    values.set(ACTIVE_MODEL_CONFIG_KEY,'{}');values.set(EXPERIMENTS_STORAGE_KEY,'[]');
    saveModule04Edits([{recordId:103,field:'sepalLength',before:50,after:4.7,errorType:'outlier'}]);
    assert.equal(values.has(ACTIVE_MODEL_CONFIG_KEY),false);
    assert.equal(values.has(EXPERIMENTS_STORAGE_KEY),false);
  } finally {
    if(descriptor)Object.defineProperty(globalThis,'localStorage',descriptor);
    else Reflect.deleteProperty(globalThis,'localStorage');
  }
});
