import { describe, it, expect, beforeEach } from "vitest"

// Mock implementation for testing Clarity contracts
const mockPrincipal = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
const mockBlockHeight = 100

// Mock state
let lastConditionId = 0
const growingConditions = new Map()
const varietyToConditions = new Map()

// Mock contract functions
const registerGrowingCondition = (
    varietyId,
    climateZone,
    temperatureMin,
    temperatureMax,
    rainfallMin,
    rainfallMax,
    soilType,
    soilPhMin,
    soilPhMax,
    sunlightRequirements,
    plantingSeason,
    daysToMaturity,
    companionPlants,
    notes
) => {
  const newId = lastConditionId + 1
  lastConditionId = newId
  
  growingConditions.set(newId, {
    "variety-id": varietyId,
    creator: mockPrincipal,
    "climate-zone": climateZone,
    "temperature-min": temperatureMin,
    "temperature-max": temperatureMax,
    "rainfall-min": rainfallMin,
    "rainfall-max": rainfallMax,
    "soil-type": soilType,
    "soil-ph-min": soilPhMin,
    "soil-ph-max": soilPhMax,
    "sunlight-requirements": sunlightRequirements,
    "planting-season": plantingSeason,
    "days-to-maturity": daysToMaturity,
    "companion-plants": companionPlants,
    notes,
    "creation-date": mockBlockHeight
  })
  
  // Update the variety-to-conditions mapping
  if (varietyToConditions.has(varietyId)) {
    const existing = varietyToConditions.get(varietyId)
    existing.condition_ids.push(newId)
  } else {
    varietyToConditions.set(varietyId, { condition_ids: [newId] })
  }
  
  return { value: newId }
}

const updateGrowingCondition = (
    conditionId,
    climateZone,
    temperatureMin,
    temperatureMax,
    rainfallMin,
    rainfallMax,
    soilType,
    soilPhMin,
    soilPhMax,
    sunlightRequirements,
    plantingSeason,
    daysToMaturity,
    companionPlants,
    notes
) => {
  const condition = growingConditions.get(conditionId)
  if (!condition) return { error: 404 }
  if (condition.creator !== mockPrincipal) return { error: 403 }
  
  growingConditions.set(conditionId, {
    ...condition,
    "climate-zone": climateZone,
    "temperature-min": temperatureMin,
    "temperature-max": temperatureMax,
    "rainfall-min": rainfallMin,
    "rainfall-max": rainfallMax,
    "soil-type": soilType,
    "soil-ph-min": soilPhMin,
    "soil-ph-max": soilPhMax,
    "sunlight-requirements": sunlightRequirements,
    "planting-season": plantingSeason,
    "days-to-maturity": daysToMaturity,
    "companion-plants": companionPlants,
    notes
  })
  
  return { value: conditionId }
}

const getGrowingCondition = (conditionId) => {
  const condition = growingConditions.get(conditionId)
  return condition ? condition : null
}

const getConditionsForVariety = (varietyId) => {
  const mapping = varietyToConditions.get(varietyId)
  if (!mapping) return { error: 404 }
  return { value: mapping.condition_ids }
}

const isSuitableClimate = (conditionId, temperature, rainfall, soilPh) => {
  const condition = growingConditions.get(conditionId)
  if (!condition) return { error: 404 }
  
  const isSuitable =
      temperature >= condition["temperature-min"] &&
      temperature <= condition["temperature-max"] &&
      rainfall >= condition["rainfall-min"] &&
      rainfall <= condition["rainfall-max"] &&
      soilPh >= condition["soil-ph-min"] &&
      soilPh <= condition["soil-ph-max"]
  
  return { value: isSuitable }
}

describe("Growing Condition Contract", () => {
  beforeEach(() => {
    // Reset state before each test
    lastConditionId = 0
    growingConditions.clear()
    varietyToConditions.clear()
  })
  
  it("should register a growing condition", () => {
    const result = registerGrowingCondition(
        1, // Variety ID (Cherokee Purple Tomato)
        "USDA Zone 5-9",
        18, // Min temperature in Celsius
        32, // Max temperature in Celsius
        500, // Min rainfall in mm per growing season
        1000, // Max rainfall in mm per growing season
        "Well-drained loam, sandy loam",
        60, // Min soil pH (6.0) * 10 for precision
        70, // Max soil pH (7.0) * 10 for precision
        "Full sun, minimum 6 hours daily",
        "Late spring to early summer after last frost",
        80, // Days to maturity
        "Basil, marigold, nasturtium, borage",
        "Prefers consistent moisture and benefits from afternoon shade in hot climates"
    )
    
    expect(result.value).toBe(1)
    expect(growingConditions.size).toBe(1)
    
    const condition = getGrowingCondition(1)
    expect(condition).not.toBeNull()
    expect(condition["variety-id"]).toBe(1)
    expect(condition["climate-zone"]).toBe("USDA Zone 5-9")
    expect(condition["temperature-min"]).toBe(18)
    expect(condition["temperature-max"]).toBe(32)
    expect(condition["rainfall-min"]).toBe(500)
    expect(condition["rainfall-max"]).toBe(1000)
    expect(condition["soil-type"]).toBe("Well-drained loam, sandy loam")
    expect(condition["soil-ph-min"]).toBe(60)
    expect(condition["soil-ph-max"]).toBe(70)
    expect(condition["sunlight-requirements"]).toBe("Full sun, minimum 6 hours daily")
    expect(condition["planting-season"]).toBe("Late spring to early summer after last frost")
    expect(condition["days-to-maturity"]).toBe(80)
    expect(condition["companion-plants"]).toBe("Basil, marigold, nasturtium, borage")
    expect(condition.notes).toBe("Prefers consistent moisture and benefits from afternoon shade in hot climates")
  })
  
  it("should update a growing condition", () => {
    // First register a condition
    registerGrowingCondition(
        1, // Variety ID (Cherokee Purple Tomato)
        "USDA Zone 5-9",
        18, // Min temperature in Celsius
        32, // Max temperature in Celsius
        500, // Min rainfall in mm per growing season
        1000, // Max rainfall in mm per growing season
        "Well-drained loam, sandy loam",
        60, // Min soil pH (6.0) * 10 for precision
        70, // Max soil pH (7.0) * 10 for precision
        "Full sun, minimum 6 hours daily",
        "Late spring to early summer after last frost",
        80, // Days to maturity
        "Basil, marigold, nasturtium, borage",
        "Prefers consistent moisture and benefits from afternoon shade in hot climates"
    )
    
    // Then update it
    const updateResult = updateGrowingCondition(
        1,
        "USDA Zone 5-10",
        16, // Min temperature in Celsius
        35, // Max temperature in Celsius
        450, // Min rainfall in mm per growing season
        1200, // Max rainfall in mm per growing season
        "Well-drained loam, sandy loam, clay loam with organic matter",
        58, // Min soil pH (5.8) * 10 for precision
        72, // Max soil pH (7.2) * 10 for precision
        "Full sun, minimum 6-8 hours daily",
        "Late spring to early summer after last frost, or start indoors 6-8 weeks before",
        75, // Days to maturity
        "Basil, marigold, nasturtium, borage, garlic",
        "Prefers consistent moisture and benefits from afternoon shade in hot climates. Mulch to retain moisture."
    )
    
    expect(updateResult.value).toBe(1)
    
    const condition = getGrowingCondition(1)
    expect(condition["climate-zone"]).toBe("USDA Zone 5-10")
    expect(condition["temperature-min"]).toBe(16)
    expect(condition["temperature-max"]).toBe(35)
    expect(condition["rainfall-min"]).toBe(450)
    expect(condition["rainfall-max"]).toBe(1200)
    expect(condition["soil-type"]).toBe("Well-drained loam, sandy loam, clay loam with organic matter")
    expect(condition["soil-ph-min"]).toBe(58)
    expect(condition["soil-ph-max"]).toBe(72)
    expect(condition["days-to-maturity"]).toBe(75)
    expect(condition["companion-plants"]).toBe("Basil, marigold, nasturtium, borage, garlic")
  })
  
  it("should get conditions for a variety", () => {
    // Register multiple conditions for the same variety
    registerGrowingCondition(
        1, // Variety ID (Cherokee Purple Tomato)
        "USDA Zone 5-9",
        18, // Min temperature in Celsius
        32, // Max temperature in Celsius
        500, // Min rainfall in mm per growing season
        1000, // Max rainfall in mm per growing season
        "Well-drained loam, sandy loam",
        60, // Min soil pH (6.0) * 10 for precision
        70, // Max soil pH (7.0) * 10 for precision
        "Full sun, minimum 6 hours daily",
        "Late spring to early summer after last frost",
        80, // Days to maturity
        "Basil, marigold, nasturtium, borage",
        "Prefers consistent moisture and benefits from afternoon shade in hot climates"
    )
    
    registerGrowingCondition(
        1, // Same Variety ID
        "Mediterranean climate",
        20, // Min temperature in Celsius
        35, // Max temperature in Celsius
        300, // Min rainfall in mm per growing season
        800, // Max rainfall in mm per growing season
        "Sandy loam with good drainage",
        62, // Min soil pH (6.2) * 10 for precision
        68, // Max soil pH (6.8) * 10 for precision
        "Full sun, 8+ hours daily",
        "Early spring with protection or early summer",
        75, // Days to maturity
        "Basil, oregano, thyme",
        "Drought tolerant once established, benefits from deep watering"
    )
    
    const conditionsResult = getConditionsForVariety(1)
    expect(conditionsResult.value).toEqual([1, 2])
  })
  
  it("should check if climate is suitable", () => {
    // Register a condition
    registerGrowingCondition(
        1, // Variety ID
        "USDA Zone 5-9",
        18, // Min temperature in Celsius
        32, // Max temperature in Celsius
        500, // Min rainfall in mm per growing season
        1000, // Max rainfall in mm per growing season
        "Well-drained loam, sandy loam",
        60, // Min soil pH (6.0) * 10 for precision
        70, // Max soil pH (7.0) * 10 for precision
        "Full sun, minimum 6 hours daily",
        "Late spring to early summer after last frost",
        80, // Days to maturity
        "Basil, marigold, nasturtium, borage",
        "Prefers consistent moisture and benefits from afternoon shade in hot climates"
    )
    
    // Test suitable conditions
    const suitableResult = isSuitableClimate(1, 25, 750, 65)
    expect(suitableResult.value).toBe(true)
    
    // Test unsuitable temperature (too cold)
    const coldResult = isSuitableClimate(1, 15, 750, 65)
    expect(coldResult.value).toBe(false)
    
    // Test unsuitable rainfall (too much)
    const wetResult = isSuitableClimate(1, 25, 1200, 65)
    expect(wetResult.value).toBe(false)
    
    // Test unsuitable soil pH (too alkaline)
    const alkalineResult = isSuitableClimate(1, 25, 750, 75)
    expect(alkalineResult.value).toBe(false)
  })
  
  it("should fail to update a non-existent condition", () => {
    const updateResult = updateGrowingCondition(
        999,
        "USDA Zone 5-10",
        16, // Min temperature in Celsius
        35, // Max temperature in Celsius
        450, // Min rainfall in mm per growing season
        1200, // Max rainfall in mm per growing season
        "Well-drained loam, sandy loam, clay loam with organic matter",
        58, // Min soil pH (5.8) * 10 for precision
        72, // Max soil pH (7.2) * 10 for precision
        "Full sun, minimum 6-8 hours daily",
        "Late spring to early summer after last frost, or start indoors 6-8 weeks before",
        75, // Days to maturity
        "Basil, marigold, nasturtium, borage, garlic",
        "Prefers consistent moisture and benefits from afternoon shade in hot climates. Mulch to retain moisture."
    )
    
    expect(updateResult.error).toBe(404)
  })
})
