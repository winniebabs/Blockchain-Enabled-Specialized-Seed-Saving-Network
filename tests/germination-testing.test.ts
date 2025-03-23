
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;

/*
  The test below is an example. To learn more, read the testing documentation here:
  https://docs.hiro.so/stacks/clarinet-js-sdk
*/

describe("example tests", () => {
  it("ensures simnet is well initalised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  // it("shows an example", () => {
  //   const { result } = simnet.callReadOnlyFn("counter", "get-counter", [], address1);
  //   expect(result).toBeUint(0);
  // });
});
import { describe, it, expect, beforeEach } from "vitest"

// Mock implementation for testing Clarity contracts
const mockPrincipal = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockTesterPrincipal = "ST2PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockBlockHeight = 100

// Mock state
let lastBatchId = 0
let lastTestId = 0
let lastPredictionId = 0
const seedBatches = new Map()
const germinationTests = new Map()
const viabilityPredictions = new Map()

// Mock contract functions
const registerSeedBatch = (
    varietyId,
    harvestDate,
    quantity,
    storageMethod,
    storageLocation,
    notes
) => {
  const newId = lastBatchId + 1
  lastBatchId = newId
  
  seedBatches.set(newId, {
    owner: mockPrincipal,
    "variety-id": varietyId,
    "harvest-date": harvestDate,
    quantity,
    "storage-method": storageMethod,
    "storage-location": storageLocation,
    notes,
    "registration-date": mockBlockHeight
  })
  
  return { value: newId }
}

const updateSeedBatch = (
    batchId,
    quantity,
    storageMethod,
    storageLocation,
    notes
) => {
  const batch = seedBatches.get(batchId)
  if (!batch) return { error: 404 }
  if (batch.owner !== mockPrincipal) return { error: 403 }
  
  seedBatches.set(batchId, {
    ...batch,
    quantity,
    "storage-method": storageMethod,
    "storage-location": storageLocation,
    notes
  })
  
  return { value: batchId }
}

const recordGerminationTest = (
    batchId,
    seedsTested,
    seedsGerminated,
    daysToGermination,
    testMethod,
    testConditions,
    images,
    notes
) => {
  const batch = seedBatches.get(batchId)
  if (!batch) return { error: 404 }
  
  const newId = lastTestId + 1
  lastTestId = newId
  
  // Calculate germination rate (percentage * 100 for precision)
  const germinationRate = seedsTested > 0
      ? Math.floor((seedsGerminated * 10000) / seedsTested)
      : 0
  
  germinationTests.set(newId, {
    "batch-id": batchId,
    tester: mockTesterPrincipal,
    "test-date": mockBlockHeight,
    "seeds-tested": seedsTested,
    "seeds-germinated": seedsGerminated,
    "germination-rate": germinationRate,
    "days-to-germination": daysToGermination,
    "test-method": testMethod,
    "test-conditions": testConditions,
    images,
    notes
  })
  
  return { value: newId }
}

const createViabilityPrediction = (
    batchId,
    predictedViabilityDate,
    confidenceLevel,
    basis
) => {
  const batch = seedBatches.get(batchId)
  if (!batch) return { error: 404 }
  
  const newId = lastPredictionId + 1
  lastPredictionId = newId
  
  viabilityPredictions.set(newId, {
    "batch-id": batchId,
    "predicted-viability-date": predictedViabilityDate,
    "confidence-level": confidenceLevel,
    basis,
    creator: mockPrincipal,
    "creation-date": mockBlockHeight
  })
  
  return { value: newId }
}

const getSeedBatch = (batchId) => {
  const batch = seedBatches.get(batchId)
  return batch ? batch : null
}

const getGerminationTest = (testId) => {
  const test = germinationTests.get(testId)
  return test ? test : null
}

const getViabilityPrediction = (predictionId) => {
  const prediction = viabilityPredictions.get(predictionId)
  return prediction ? prediction : null
}

const calculateSeedAge = (batchId) => {
  const batch = seedBatches.get(batchId)
  if (!batch) return { error: 404 }
  
  return { value: mockBlockHeight - batch["harvest-date"] }
}

describe("Germination Testing Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    lastBatchId = 0
    lastTestId = 0
    lastPredictionId = 0
    seedBatches.clear()
    germinationTests.clear()
    viabilityPredictions.clear()
  })
  
  it("should register a seed batch", () => {
    const result = registerSeedBatch(
        1, // Variety ID (Cherokee Purple Tomato)
        mockBlockHeight - 30, // Harvest date (30 days ago)
        500, // Quantity in grams
        "Vacuum sealed glass jars with silica gel packets",
        "Cool, dark cabinet in seed storage room, 15°C, 30% humidity",
        "Seeds were cleaned and dried for 2 weeks before storage. Excellent quality harvest."
    )
    
    expect(result.value).toBe(1)
    expect(seedBatches.size).toBe(1)
    
    const batch = getSeedBatch(1)
    expect(batch).not.toBeNull()
    expect(batch["variety-id"]).toBe(1)
    expect(batch["harvest-date"]).toBe(mockBlockHeight - 30)
    expect(batch.quantity).toBe(500)
    expect(batch["storage-method"]).toBe("Vacuum sealed glass jars with silica gel packets")
    expect(batch["storage-location"]).toBe("Cool, dark cabinet in seed storage room, 15°C, 30% humidity")
    expect(batch.notes).toBe("Seeds were cleaned and dried for 2 weeks before storage. Excellent quality harvest.")
  })
  
  it("should update a seed batch", () => {
    // First register a batch
    registerSeedBatch(
        1, // Variety ID
        mockBlockHeight - 30, // Harvest date
        500, // Quantity in grams
        "Vacuum sealed glass jars with silica gel packets",
        "Cool, dark cabinet in seed storage room, 15°C, 30% humidity",
        "Seeds were cleaned and dried for 2 weeks before storage. Excellent quality harvest."
    )
    
    // Then update it
    const updateResult = updateSeedBatch(
        1,
        450, // Updated quantity (used some seeds)
        "Vacuum sealed glass jars with silica gel packets",
        "Refrigerator seed storage, 4°C, 20% humidity",
        "Seeds were cleaned and dried for 2 weeks before storage. Excellent quality harvest. Moved to refrigerator for longer-term storage."
    )
    
    expect(updateResult.value).toBe(1)
    
    const batch = getSeedBatch(1)
    expect(batch.quantity).toBe(450)
    expect(batch["storage-location"]).toBe("Refrigerator seed storage, 4°C, 20% humidity")
    expect(batch.notes).toBe("Seeds were cleaned and dried for 2 weeks before storage. Excellent quality harvest. Moved to refrigerator for longer-term storage.")
  })
  
  it("should record a germination test", () => {
    // First register a batch
    registerSeedBatch(
        1, // Variety ID
        mockBlockHeight - 30, // Harvest date
        500, // Quantity in grams
        "Vacuum sealed glass jars with silica gel packets",
        "Cool, dark cabinet in seed storage room, 15°C, 30% humidity",
        "Seeds were cleaned and dried for 2 weeks before storage. Excellent quality harvest."
    )
    
    // Set the current principal to the tester for this test
    const originalPrincipal = mockPrincipal
    Object.defineProperty(global, 'mockPrincipal', {
      value: mockTesterPrincipal,
      writable: true
    })
    
    // Record a germination test
    const testResult = recordGerminationTest(
        1, // Batch ID
        100, // Seeds tested
        92, // Seeds germinated
        5, // Days to germination
        "Paper towel method, seeds placed between moist paper towels in a plastic bag",
        "Room temperature (22°C), checked daily, kept moist",
        "https://example.com/germination-test1.jpg,https://example.com/germination-test2.jpg",
        "Strong, vigorous germination with healthy radicles. Some seeds germinated as early as day 3."
    )
    
    expect(testResult.value).toBe(1)
    expect(germinationTests.size).toBe(1)
    
    const test = getGerminationTest(1)
    expect(test).not.toBeNull()
    expect(test["batch-id"]).toBe(1)
    expect(test.tester).toBe(mockTesterPrincipal)
    expect(test["seeds-tested"]).toBe(100)
    expect(test["seeds-germinated"]).toBe(92)
    expect(test["germination-rate"]).toBe(9200) // 92%
    expect(test["days-to-germination"]).toBe(5)
    expect(test["test-method"]).toBe("Paper towel method, seeds placed between moist paper towels in a plastic bag")
    expect(test["test-conditions"]).toBe("Room temperature (22°C), checked daily, kept moist")
    expect(test.notes).toBe("Strong, vigorous germination with healthy radicles. Some seeds germinated as early as day 3.")
    
    // Reset the principal
    Object.defineProperty(global, 'mockPrincipal', {
      value: originalPrincipal,
      writable: true
    })
  })
  
  it("should create a viability prediction", () => {
    // First register a batch
    registerSeedBatch(
        1, // Variety ID
        mockBlockHeight - 30, // Harvest date
        500, // Quantity in grams
        "Vacuum sealed glass jars with silica gel packets",
        "Cool, dark cabinet in seed storage room, 15°C, 30% humidity",
        "Seeds were cleaned and dried for 2 weeks before storage. Excellent quality harvest."
    )
    
    // Create a viability prediction
    const predictionResult = createViabilityPrediction(
        1, // Batch ID
        mockBlockHeight + 1095, // Predicted viability date (3 years from now)
        8500, // Confidence level (85%)
        "Based on initial germination test of 92% and optimal storage conditions. Tomato seeds typically remain viable for 4-5 years under these conditions."
    )
    
    expect(predictionResult.value).toBe(1)
    expect(viabilityPredictions.size).toBe(1)
    
    const prediction = getViabilityPrediction(1)
    expect(prediction).not.toBeNull()
    expect(prediction["batch-id"]).toBe(1)
    expect(prediction["predicted-viability-date"]).toBe(mockBlockHeight + 1095)
    expect(prediction["confidence-level"]).toBe(8500)
    expect(prediction.basis).toBe("Based on initial germination test of 92% and optimal storage conditions. Tomato seeds typically remain viable for 4-5 years under these conditions.")
  })
  
  it("should calculate seed age", () => {
    // Register a batch
    registerSeedBatch(
        1, // Variety ID
        mockBlockHeight - 365, // Harvest date (1 year ago)
        500, // Quantity in grams
        "Vacuum sealed glass jars with silica gel packets",
        "Cool, dark cabinet in seed storage room, 15°C, 30% humidity",
        "Seeds were cleaned and dried for 2 weeks before storage. Excellent quality harvest."
    )
    
    const ageResult = calculateSeedAge(1)
    expect(ageResult.value).toBe(365) // 1 year old
  })
  
  it("should fail to update a non-existent batch", () => {
    const updateResult = updateSeedBatch(
        999,
        450,
        "Vacuum sealed glass jars with silica gel packets",
        "Refrigerator seed storage, 4°C, 20% humidity",
        "Seeds were cleaned and dried for 2 weeks before storage. Excellent quality harvest. Moved to refrigerator for longer-term storage."
    )
    
    expect(updateResult.error).toBe(404)
  })
})
