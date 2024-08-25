/**
 * MOWED - Reforestation Optimization Tool
 * Copyright (c) 2024 Björn Kenneth Holmström
 * Licensed under a custom license - see LICENSE file for details.
 */

// app.js

// Load Pyodide and initialize it
async function initializePyodide() {
    let pyodide = await loadPyodide();
    await pyodide.loadPackage("scipy");
    return pyodide;
}

let pyodideReadyPromise = initializePyodide();

async function runOptimization(formData) {
    let pyodide = await pyodideReadyPromise;
  
    // Update the Python function with a more sophisticated model
    let pythonResult = await pyodide.runPythonAsync(`
from scipy.optimize import minimize
import numpy as np
import json
import sys
import time
import io
from io import StringIO
from json import JSONEncoder
from collections import Counter
import logging

class NumpyEncoder(JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, np.bool_):
            return bool(obj)
        return JSONEncoder.default(self, obj)

# Capture print output
old_stdout = sys.stdout
sys.stdout = mystdout = StringIO()

def climate_factor(climate_zone):
    factors = {
        'tropical': 1.2,
        'dry': 0.8,
        'temperate': 1.0,
        'continental': 0.9,
        'polar': 0.7
    }
    return factors.get(climate_zone, 1.0)  # Default to 1.0 if climate zone is not recognized

def elevation_factor(elevation, species_optimal_elevation):
    # Adjust this function based on your specific requirements
    elevation_difference = abs(elevation - species_optimal_elevation)
    if elevation_difference <= 300:
        return 1.0
    elif elevation_difference <= 600:
        return 0.8
    else:
        return 0.6

def rainfall_factor(annual_rainfall, species_optimal_rainfall):
    # Adjust this function based on your specific requirements
    rainfall_ratio = annual_rainfall / species_optimal_rainfall
    if 0.8 <= rainfall_ratio <= 1.2:
        return 1.0
    elif 0.6 <= rainfall_ratio < 0.8 or 1.2 < rainfall_ratio <= 1.4:
        return 0.9
    elif 0.4 <= rainfall_ratio < 0.6 or 1.4 < rainfall_ratio <= 1.6:
        return 0.8
    else:
        return 0.7

def tree_growth(age, max_size, growth_rate, use_soil_quality=False, soil_quality='medium', use_climate_zone=False, climate_zone='temperate', use_elevation=False, elevation=0, species_optimal_elevation=0, use_annual_rainfall=False, annual_rainfall=1000, species_optimal_rainfall=1000):
    growth = max_size * (1 - np.exp(-growth_rate * age))
    
    if use_soil_quality:
        soil_factor = {'poor': 0.7, 'medium': 1.0, 'good': 1.3}[soil_quality]
        growth *= soil_factor
    
    if use_climate_zone:
        c_factor = climate_factor(climate_zone)
        growth *= c_factor
    
    if use_elevation:
        e_factor = elevation_factor(elevation, species_optimal_elevation)
        growth *= e_factor
    
    if use_annual_rainfall:
        r_factor = rainfall_factor(annual_rainfall, species_optimal_rainfall)
        growth *= r_factor
    
    return growth

def carbon_sequestration(size, use_climate_zone=False, climate_zone='temperate', use_elevation=False, elevation=0, species_optimal_elevation=0, use_annual_rainfall=False, annual_rainfall=1000, species_optimal_rainfall=1000):
    carbon = 0.5 * size
    
    if use_climate_zone:
        c_factor = climate_factor(climate_zone)
        carbon *= c_factor
    
    if use_elevation:
        e_factor = elevation_factor(elevation, species_optimal_elevation)
        carbon *= e_factor
    
    if use_annual_rainfall:
        r_factor = rainfall_factor(annual_rainfall, species_optimal_rainfall)
        carbon *= r_factor
    
    return carbon

def optimize_reforestation(total_budget, land_area, years, species_data, 
                           use_soil_quality=False, soil_quality='medium', 
                           use_climate_zone=False, climate_zone='temperate', 
                           use_elevation=False, elevation=0, 
                           use_annual_rainfall=False, annual_rainfall=1000, 
                           discount_rate=0.05, max_iterations=2000, 
                           function_tolerance=1e-8, min_budget_utilization=0.6, 
                           species_diversity_factor=2, n_starts=5, debug=False, solver='SLSQP'):
    debug_output = io.StringIO() if debug else None
    
    def debug_print(*args, **kwargs):
        if debug:
            print(*args, **kwargs, file=debug_output)

    n_species = len(species_data)
    
    # Pre-calculate some constants to avoid repeated computations
    species_costs = np.array([species_data[s]['cost'] for s in species_data])
    species_areas = np.array([species_data[s]['area'] for s in species_data])
    species_biodiversity = np.array([species_data[s]['biodiversity'] for s in species_data])
    
    debug_print(f"Species costs: {species_costs}")
    debug_print(f"Species areas: {species_areas}")
    debug_print(f"Species biodiversity: {species_biodiversity}")

    def objective(x):
        try:
            x = x.reshape((years, n_species))
            total_value = 0
            for year in range(years):
                for s, species in enumerate(species_data):
                    trees_planted = x[year, s]
                    species_info = species_data[species]
                    for age in range(years - year):
                        size = tree_growth(age, species_info['max_size'], 
                                           species_info['growth_rate'], 
                                           use_soil_quality, soil_quality,
                                           use_climate_zone, climate_zone,
                                           use_elevation, elevation, species_info['optimal_elevation'],
                                           use_annual_rainfall, annual_rainfall, species_info['optimal_rainfall'])
                        carbon = carbon_sequestration(size, 
                                                      use_climate_zone, climate_zone,
                                                      use_elevation, elevation, species_info['optimal_elevation'],
                                                      use_annual_rainfall, annual_rainfall, species_info['optimal_rainfall']) * trees_planted
                        biodiversity = species_biodiversity[s] * trees_planted
                        discount_factor = 1 / ((1 + discount_rate) ** (year + age))
                        year_weight = 1 + (year / years)
                        total_value += (carbon + biodiversity) * discount_factor * year_weight
            
            return -total_value  # Negative because we're minimizing
        except Exception as e:
            debug_print(f"Error in objective function: {e}")
            return np.inf

    def constraint_budget(x):
        x = x.reshape((years, n_species))
        return total_budget - np.sum(x * species_costs)
    
    def constraint_land(x):
        x = x.reshape((years, n_species))
        total_area = np.sum(x * species_areas)
        return land_area - total_area
    
    def constraint_min_planting(x):
        x = x.reshape((years, n_species))
        min_trees_per_year = total_budget / (years * np.max(species_costs)) / 10
        return np.sum(x, axis=1) - min_trees_per_year
    
    def constraint_min_budget(x):
        x = x.reshape((years, n_species))
        return np.sum(x * species_costs) - min_budget_utilization * total_budget

    def constraint_species_diversity(x):
        x = x.reshape((years, n_species))
        return np.sum(x, axis=0) - np.sum(x) / (species_diversity_factor * n_species)
    
    def constraint_smoothing(x):
        x = x.reshape((years, n_species))
        return -np.sum(np.abs(x[1:] - x[:-1]))  # Minimize year-to-year differences

    if solver == 'SLSQP':
        constraints = [
            {'type': 'ineq', 'fun': constraint_budget},
            {'type': 'eq', 'fun': constraint_land},
            {'type': 'ineq', 'fun': constraint_min_planting},
            {'type': 'ineq', 'fun': constraint_min_budget},
            {'type': 'ineq', 'fun': constraint_species_diversity},
            {'type': 'ineq', 'fun': constraint_smoothing}
        ]
    elif solver == 'COBYLA':
        def combined_constraint(x):
            return np.concatenate([
                [constraint_budget(x)],
                [constraint_land(x)],
                constraint_min_planting(x),
                [constraint_min_budget(x)],
                constraint_species_diversity(x),
                [constraint_smoothing(x)]
            ])
        constraints = {'type': 'ineq', 'fun': combined_constraint}
    else:
        raise ValueError(f"Unsupported solver: {solver}")

    bounds = [(0, None) for _ in range(years * n_species)]
    
    # Adjust initial guess to respect land area constraint and encourage even distribution
    total_trees = land_area / np.mean([species_data[s]['area'] for s in species_data])
    initial_guess = np.ones(years * n_species) * total_trees / (years * n_species)
    
    # Adjust for land area constraint
    #land_usage = np.sum(initial_guess.reshape(years, n_species) * species_areas)
    #if land_usage > land_area:
    #    initial_guess *= land_area / land_usage
    
    debug_print("Checking initial guess:")
    if isinstance(constraints, list):
        for i, constraint in enumerate(constraints):
            constraint_value = constraint['fun'](initial_guess)
            debug_print(f"Constraint {i}: {constraint_value}")
            if constraint['type'] == 'ineq' and np.any(constraint_value < 0):
                debug_print(f"Initial guess violates constraint {i}")
    else:
        constraint_values = constraints['fun'](initial_guess)
        for i, value in enumerate(constraint_values):
            debug_print(f"Constraint {i}: {value}")
            if np.any(value < 0):
                debug_print(f"Initial guess violates constraint {i}")
    
    def callback(xk):
        debug_print(f"Iteration {callback.count}:")
        if isinstance(constraints, list):
            for i, constraint in enumerate(constraints):
                constraint_value = constraint['fun'](xk)
                debug_print(f"Constraint {i}: {constraint_value}")
        else:
            constraint_values = constraints['fun'](xk)
            for i, value in enumerate(constraint_values):
                debug_print(f"Constraint {i}: {value}")
        callback.count += 1
    callback.count = 0

    if solver == 'SLSQP':
        result = minimize(objective, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints, 
                          options={'maxiter': int(max_iterations), 'ftol': function_tolerance})
    elif solver == 'COBYLA':
        result = minimize(objective, initial_guess, method='COBYLA', constraints=constraints, 
                          options={'maxiter': int(max_iterations), 'tol': function_tolerance})
    else:
        raise ValueError(f"Unsupported solver: {solver}")
    
    debug_print(f"Optimization result: {result.success}, message: {result.message}")
    debug_print(f"Objective value: {result.fun}")

    if result is None or result.success:
        debug_print(f"Warning: Optimization failed. No valid solution found.")
        return None, None, False, "Optimization failed", debug_output.getvalue() if debug else ""

    tree_counts = {}
    x = result.x.reshape((years, n_species))
    for year in range(years):
        tree_counts[year] = {s: int(round(x[year, i])) for i, s in enumerate(species_data)}
    
    debug_print("Final tree counts:")
    debug_print(tree_counts)
    
    return tree_counts, -result.fun, result.success, result.message, debug_output.getvalue() if debug else ""

def calculate_impact(tree_counts, species_data, years, use_soil_quality=False, soil_quality='medium', use_climate_zone=False, climate_zone='temperate', use_elevation=False, elevation=0, use_annual_rainfall=False, annual_rainfall=1000, discount_rate=0.05):
    impact = {year: {} for year in range(years)}
    cumulative_impact = {'carbon': 0, 'biodiversity': 0, 'cost': 0, 'area': 0}
    
    for plant_year in range(years):
        for s, count in tree_counts[plant_year].items():
            species = species_data[s]
            for year in range(plant_year, years):
                age = year - plant_year
                size = tree_growth(age, species['max_size'], species['growth_rate'], 
                                   use_soil_quality, soil_quality,
                                   use_climate_zone, climate_zone,
                                   use_elevation, elevation, species['optimal_elevation'],
                                   use_annual_rainfall, annual_rainfall, species['optimal_rainfall'])
                carbon = carbon_sequestration(size, 
                                              use_climate_zone, climate_zone,
                                              use_elevation, elevation, species['optimal_elevation'],
                                              use_annual_rainfall, annual_rainfall, species['optimal_rainfall']) * count
                biodiversity = species['biodiversity'] * count
                discount_factor = 1 / ((1 + discount_rate) ** year)
                
                impact[year]['carbon'] = impact[year].get('carbon', 0) + carbon * discount_factor
                impact[year]['biodiversity'] = impact[year].get('biodiversity', 0) + biodiversity * discount_factor
                
            impact[plant_year]['cost'] = impact[plant_year].get('cost', 0) + count * species['cost']
            impact[plant_year]['area'] = impact[plant_year].get('area', 0) + count * species['area']
    
    for year in range(years):
        for key in ['carbon', 'biodiversity', 'cost', 'area']:
            impact[year][key] = float(impact[year].get(key, 0))
            if key != 'area':
                cumulative_impact[key] += impact[year][key]
            else:
                cumulative_impact[key] = max(cumulative_impact[key], impact[year][key])
    
    return impact, {k: float(v) for k, v in cumulative_impact.items()}

def run_optimization(budget, land_area, years, species_data, use_soil_quality, soil_quality, use_climate_zone, climate_zone, use_elevation, elevation, use_annual_rainfall, annual_rainfall, max_iterations, function_tolerance, min_budget_utilization, species_diversity_factor, debug=False, n_starts=5, solver='SLSQP'):
    # Convert inputs to appropriate types
    budget = float(budget)
    land_area = float(land_area)
    years = int(years)
    use_soil_quality = bool(use_soil_quality)
    use_climate_zone = bool(use_climate_zone)
    use_elevation = bool(use_elevation)
    elevation = float(elevation)
    use_annual_rainfall = bool(use_annual_rainfall)
    annual_rainfall = float(annual_rainfall)
    max_iterations = int(max_iterations)
    function_tolerance = float(function_tolerance)
    min_budget_utilization = float(min_budget_utilization)
    species_diversity_factor = float(species_diversity_factor)
    debug = bool(debug)
    n_starts = int(n_starts)

    start_time = time.time()
    
    debug_output = f"Starting optimization with parameters:\\n"
    debug_output += f"Budget: {budget}, Land Area: {land_area}, Years: {years}\\n"
    debug_output += f"Soil Quality: {soil_quality}, Climate Zone: {climate_zone}\\n"
    debug_output += f"Elevation: {elevation}, Annual Rainfall: {annual_rainfall}\\n"
    debug_output += f"Max Iterations: {max_iterations}, Function Tolerance: {function_tolerance}\\n"
    debug_output += f"Min Budget Utilization: {min_budget_utilization}, Species Diversity Factor: {species_diversity_factor}\\n"
    debug_output += f"Number of Starts: {n_starts}\\n"
    debug_output += f"Solver: {solver}\\n"
    
    tree_counts, objective_value, success, message, opt_debug_output = optimize_reforestation(
        budget, land_area, years, species_data, 
        use_soil_quality=use_soil_quality,
        soil_quality=soil_quality,
        use_climate_zone=use_climate_zone,
        climate_zone=climate_zone,
        use_elevation=use_elevation,
        elevation=elevation,
        use_annual_rainfall=use_annual_rainfall,
        annual_rainfall=annual_rainfall,
        max_iterations=max_iterations, 
        function_tolerance=function_tolerance, 
        min_budget_utilization=min_budget_utilization, 
        species_diversity_factor=species_diversity_factor,
        debug=debug,
        n_starts=n_starts,
        solver=solver
    )
    
    debug_output += opt_debug_output
    
    end_time = time.time()
    computation_time = end_time - start_time
    
    if tree_counts is None:
        debug_output += "Optimization failed: No valid solution found\\n"
        return json.dumps({
            "success": False,
            "message": "Optimization failed: No valid solution found",
            "computation_time": computation_time,
            "debug_output": debug_output
        }, cls=NumpyEncoder)
    
    impact, cumulative_impact = calculate_impact(tree_counts, species_data, years, 
                                                 soil_quality=soil_quality, 
                                                 climate_zone=climate_zone, 
                                                 elevation=elevation,
                                                 annual_rainfall=annual_rainfall)
    
    # Prepare feedback for the user
    if success:
        quality_message = "The optimization process converged successfully."
    else:
        quality_message = f"Warning: The optimization may not have found the best solution. Reason: {message}"
    
    quality_message += f"\\nComputation time: {computation_time:.2f} seconds"
    
    debug_output += f"Optimization completed. Result: {quality_message}\\n"
    
    return json.dumps({
        "success": success,
        "tree_counts": {str(k): v for k, v in tree_counts.items()},
        "objective_value": objective_value,
        "impact": {str(k): v for k, v in impact.items()},
        "cumulative_impact": cumulative_impact,
        "quality_message": quality_message,
        "computation_time": computation_time,
        "debug_output": debug_output
    }, cls=NumpyEncoder)

# Run the optimization
optimization_result = run_optimization(
    ${formData.budget}, 
    ${formData.landArea}, 
    ${formData.years}, 
    ${JSON.stringify(formData.species)},
    ${formData.useSoilQuality ? 'True' : 'False'},
    '${formData.soilQuality}',
    ${formData.useClimateZone ? 'True' : 'False'},
    '${formData.climateZone}',
    ${formData.useElevation ? 'True' : 'False'},
    ${formData.elevation},
    ${formData.useAnnualRainfall ? 'True' : 'False'},
    ${formData.annualRainfall},
    ${formData.maxIterations || 5000},
    ${formData.functionTolerance},
    ${formData.minBudgetUtilization || 0.6},
    ${formData.speciesDiversityFactor},
    debug=${formData.debug ? 'True' : 'False'},
    n_starts=10,
    solver='${formData.solver}'
)

# Restore stdout and get the captured output
sys.stdout = old_stdout
warnings = mystdout.getvalue()

result = json.dumps({"result": optimization_result, "warnings": warnings}, cls=NumpyEncoder)
result  # This line is important for Pyodide to return the result
`);
    
    let result = JSON.parse(pythonResult);
    console.log("Raw result from Python:", result);

    let optimizationResult = JSON.parse(result.result);
    console.log("Parsed optimization result:", optimizationResult);

    // Ensure warnings are in the correct format
    if (typeof optimizationResult.warnings === 'string') {
        try {
            optimizationResult.warnings = JSON.parse(optimizationResult.warnings);
        } catch (e) {
            console.error("Error parsing warnings:", e);
            optimizationResult.warnings = [{ message: optimizationResult.warnings, count: 1 }];
        }
    }
    
    return optimizationResult;
}

// Declare variables in a wider scope
let form, resultsDiv, loadingDiv, addSpeciesButton, speciesInputs, loadExampleButton;
let advancedFeatures;

document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded");

    // Initialize variables
    form = document.getElementById('optimization-form');
    resultsDiv = document.getElementById('results');
    loadingDiv = document.getElementById('loading');
    addSpeciesButton = document.getElementById('add-species');
    speciesInputs = document.getElementById('species-inputs');
    loadExampleButton = document.getElementById('load-example');

    // Check if elements exist before adding event listeners
    if (addSpeciesButton) {
        addSpeciesButton.addEventListener('click', addSpeciesInput);
    } else {
        console.error("Add species button not found");
    }

    if (speciesInputs) {
        speciesInputs.addEventListener('click', removeSpeciesInput);
    } else {
        console.error("Species inputs container not found");
    }

    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    } else {
        console.error("Form not found");
    }

    if (loadExampleButton) {
        loadExampleButton.addEventListener('click', loadExampleTemplate);
    } else {
        console.error("Load example button not found");
    }

    // Add initial species input
    addSpeciesInput();

    const showHelpButton = document.getElementById('show-help');
    const helpModal = document.getElementById('help-modal');
    
    if (showHelpButton && helpModal) {
        const closeModal = helpModal.querySelector('.close');

        showHelpButton.addEventListener('click', function() {
            helpModal.style.display = 'block';
        });

        if (closeModal) {
            closeModal.addEventListener('click', function() {
                helpModal.style.display = 'none';
            });
        } else {
            console.error("Close modal button not found");
        }

        window.addEventListener('click', function(event) {
            if (event.target == helpModal) {
                helpModal.style.display = 'none';
            }
        });
    } else {
        console.error("Help button or help modal not found");
    }

    // Add the event listener for toggle-advanced here
/*    const toggleAdvancedButton = document.getElementById('toggle-advanced');
    if (toggleAdvancedButton) {
        console.log("Toggle advanced button found");
        toggleAdvancedButton.addEventListener('click', toggleAdvancedOptions);
    } else {
        console.error("Toggle advanced button not found");
    }*/

  const advancedOptionsToggle = document.getElementById('toggle-advanced');
  const advancedOptions = document.getElementById('advanced-options');
  const categoryToggles = document.querySelectorAll('.category-toggle');

  advancedOptionsToggle.addEventListener('click', function() {
    advancedOptions.style.display = advancedOptions.style.display === 'none' ? 'block' : 'none';
    advancedOptionsToggle.textContent = advancedOptions.style.display === 'none' ? 'Show Advanced Options' : 'Hide Advanced Options';
  });

  categoryToggles.forEach(toggle => {
    toggle.addEventListener('click', function() {
      const content = this.nextElementSibling;
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
      this.classList.toggle('active');
    });
  });

  // Add event listeners to enable/disable inputs based on checkbox state
  document.getElementById('use-soil-quality').addEventListener('change', function() {
      document.getElementById('soil-quality').disabled = !this.checked;
  });
  document.getElementById('use-climate-zone').addEventListener('change', function() {
      document.getElementById('climate-zone').disabled = !this.checked;
  });
  document.getElementById('use-elevation').addEventListener('change', function() {
      document.getElementById('elevation').disabled = !this.checked;
  });
  document.getElementById('use-annual-rainfall').addEventListener('change', function() {
      document.getElementById('annual-rainfall').disabled = !this.checked;
  });

});


function toggleAdvancedOptions() {
    console.log("Toggle advanced button clicked");
    const advancedOptions = document.getElementById('advanced-options');
    const toggleButton = document.getElementById('toggle-advanced');
    
    if (advancedOptions && toggleButton) {
        console.log("Advanced options element found");
        console.log("Current display style:", advancedOptions.style.display);
        
        if (advancedOptions.style.display === 'none' || advancedOptions.style.display === '') {
            advancedOptions.style.display = 'block';
            toggleButton.textContent = 'Show Advanced Options';
        } else {
            advancedOptions.style.display = 'none';
            toggleButton.textContent = 'Hide Advanced Options';
        }
        
        console.log("New display style:", advancedOptions.style.display);
    } else {
        console.error("Advanced options element or toggle button not found");
        console.log("All elements with ID:", document.querySelectorAll('[id]'));
    }
}

// Function to add event listener after a short delay
function addDelayedEventListener(elementId, eventType, handler) {
    setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element) {
            element.addEventListener(eventType, handler);
            console.log(`Event listener added to ${elementId}`);
        } else {
            console.error(`Element with id ${elementId} not found after delay`);
        }
    }, 1000); // 1 second delay
}

// Add delayed event listener for toggle-advanced button
addDelayedEventListener('toggle-advanced', 'click', function() {
    console.log("Toggle advanced button clicked (delayed)");
    const advancedOptions = document.getElementById('advanced-options');
    if (advancedOptions) {
        advancedOptions.style.display = advancedOptions.style.display === 'none' ? 'block' : 'none';
        console.log("Advanced options visibility toggled (delayed)");
    } else {
        console.error("Advanced options element not found (delayed)");
    }
});

document.getElementById('toggle-advanced').addEventListener('click', function() {
    const advancedOptions = document.getElementById('advanced-options');
    advancedOptions.style.display = advancedOptions.style.display === 'none' ? 'block' : 'none';
});

function addSpeciesInput() {
    const newSpeciesEntry = document.createElement('div');
    newSpeciesEntry.className = 'species-entry';
    newSpeciesEntry.innerHTML = `
        <input type="text" placeholder="Species Name" class="species-name" required>
        <input type="number" step="0.01" placeholder="Cost per Tree" class="species-cost" required>
        <input type="number" step="0.01" placeholder="Area per Tree" class="species-area" required>
        <input type="number" step="0.01" placeholder="Carbon Sequestration" class="species-carbon" required>
        <input type="number" step="0.01" placeholder="Biodiversity Score" class="species-biodiversity" required>
        <input type="number" step="0.01" placeholder="Growth Rate" class="species-growth-rate" required>
        <input type="number" step="0.01" placeholder="Max Size" class="species-max-size" required>
        <input type="number" step="1" placeholder="Optimal Elevation" class="species-optimal-elevation" required>
        <input type="number" step="1" placeholder="Optimal Rainfall" class="species-optimal-rainfall" required>
        <button type="button" class="remove-species">Remove</button>
    `;
    document.getElementById('species-inputs').appendChild(newSpeciesEntry);
}

function removeSpeciesInput(e) {
    if (e.target.classList.contains('remove-species')) {
        e.target.closest('.species-entry').remove();
    }
}

function removeSpeciesInput(e) {
    if (e.target.classList.contains('remove-species')) {
        e.target.closest('.species-entry').remove();
    }
}

function loadExampleTemplate() {
    // Clear existing inputs
    document.getElementById('species-inputs').innerHTML = '';

    // Set budget, land area, and years
    document.getElementById('budget').value = 50000;
    document.getElementById('land-area').value = 10000;
    document.getElementById('years').value = 5;

    // Example species data
    const exampleSpecies = [
        { name: "Oak", cost: 15, area: 25, carbon: 7, biodiversity: 8, growthRate: 0.10, maxSize: 100, optimalElevation: 300, optimalRainfall: 800 },
        { name: "Pine", cost: 10, area: 20, carbon: 6, biodiversity: 6, growthRate: 0.15, maxSize: 80, optimalElevation: 1000, optimalRainfall: 600 },
        { name: "Maple", cost: 18, area: 30, carbon: 8, biodiversity: 7, growthRate: 0.12, maxSize: 90, optimalElevation: 500, optimalRainfall: 1000 },
        { name: "Birch", cost: 12, area: 22, carbon: 5, biodiversity: 7, growthRate: 0.14, maxSize: 70, optimalElevation: 700, optimalRainfall: 700 }
    ];

    // Add species inputs and populate with data
    exampleSpecies.forEach(species => {
        addSpeciesInput();
        const lastEntry = document.querySelector('.species-entry:last-child');
        lastEntry.querySelector('.species-name').value = species.name;
        lastEntry.querySelector('.species-cost').value = species.cost.toFixed(2);
        lastEntry.querySelector('.species-area').value = species.area.toFixed(2);
        lastEntry.querySelector('.species-carbon').value = species.carbon.toFixed(2);
        lastEntry.querySelector('.species-biodiversity').value = species.biodiversity.toFixed(2);
        lastEntry.querySelector('.species-growth-rate').value = species.growthRate.toFixed(2);
        lastEntry.querySelector('.species-max-size').value = species.maxSize.toFixed(2);
        lastEntry.querySelector('.species-optimal-elevation').value = species.optimalElevation;
        lastEntry.querySelector('.species-optimal-rainfall').value = species.optimalRainfall;
    });

    // Set a default elevation in the advanced options
    document.getElementById('elevation').value = 500;
    // Set a default annual rainfall in the advanced options
    document.getElementById('annual-rainfall').value = 800;
}

async function handleFormSubmit(e) {
    e.preventDefault();

    loadingDiv.style.display = 'block';
    resultsDiv.innerHTML = '';

    const speciesEntries = document.querySelectorAll('.species-entry');
    const species = {};

    speciesEntries.forEach((entry, index) => {
        const name = entry.querySelector('.species-name').value || `Species ${index + 1}`;
        species[name] = {
            cost: parseFloat(entry.querySelector('.species-cost').value),
            area: parseFloat(entry.querySelector('.species-area').value),
            carbon: parseFloat(entry.querySelector('.species-carbon').value),
            biodiversity: parseFloat(entry.querySelector('.species-biodiversity').value),
            growth_rate: parseFloat(entry.querySelector('.species-growth-rate').value),
            max_size: parseFloat(entry.querySelector('.species-max-size').value),
            optimal_elevation: parseFloat(entry.querySelector('.species-optimal-elevation').value),
            optimal_rainfall: parseFloat(entry.querySelector('.species-optimal-rainfall').value)
        };
    });

    const formData = {
        budget: parseFloat(document.getElementById('budget').value),
        landArea: parseFloat(document.getElementById('land-area').value),
        years: parseInt(document.getElementById('years').value),
        species: species,
        elevation: parseFloat(document.getElementById('elevation').value),
        maxIterations: parseInt(document.getElementById('max-iterations').value),
        functionTolerance: parseFloat(document.getElementById('function-tolerance').value),
        minBudgetUtilization: parseFloat(document.getElementById('min-budget-utilization').value) / 100,
        speciesDiversityFactor: parseFloat(document.getElementById('species-diversity-factor').value),
        useSoilQuality: document.getElementById('use-soil-quality').checked,
        soilQuality: document.getElementById('soil-quality').value,
        useClimateZone: document.getElementById('use-climate-zone').checked,
        climateZone: document.getElementById('climate-zone').value,
        useElevation: document.getElementById('use-elevation').checked,
        elevation: parseFloat(document.getElementById('elevation').value),
        useAnnualRainfall: document.getElementById('use-annual-rainfall').checked,
        annualRainfall: parseFloat(document.getElementById('annual-rainfall').value),
        debug: document.getElementById('debug-mode').checked,
        solver: document.getElementById('solver').value
    };

    try {
        const result = await runOptimization(formData);
        console.log("Full optimization result:", result);
        console.log("Debug output:", result.debug_output);

        let feedbackHtml = generateFeedback(result, formData);
        resultsDiv.innerHTML = feedbackHtml;

        if (!result.success) {
            displayWarning(result.quality_message || "Optimization failed");
        }

        resultsDiv.innerHTML += `<p>Computation time: ${result.computation_time.toFixed(2)} seconds</p>`;
        
        displayResults(result.tree_counts, result.objective_value, result.impact, result.cumulative_impact, formData.years);

        // Display debug output if debug mode is enabled
        if (formData.debug) {
            const debugOutputDiv = document.createElement('div');
            debugOutputDiv.className = 'debug-output';
            debugOutputDiv.innerHTML = `<h3>Debug Output:</h3><pre>${result.debug_output}</pre>`;
            resultsDiv.appendChild(debugOutputDiv);
        }
    } catch (error) {
        console.error("Optimization error:", error);
        resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
    } finally {
        loadingDiv.style.display = 'none';
    }
}

function displayResults(treeCounts, objectiveValue, impact, cumulativeImpact, years) {
    let resultHTML = `
        <h2>Optimization Results:</h2>
    `;

    if (objectiveValue !== undefined) {
        resultHTML += `<p>Objective value: ${objectiveValue.toFixed(2)}</p>`;
    }

    if (treeCounts) {
        resultHTML += `<h3>Tree Counts by Year:</h3>`;
        for (let year = 0; year < years; year++) {
            if (treeCounts[year]) {
                resultHTML += `<h4>Year ${year + 1}:</h4><ul>`;
                for (let [species, count] of Object.entries(treeCounts[year])) {
                    resultHTML += `<li>${species}: ${count}</li>`;
                }
                resultHTML += `</ul>`;
            }
        }
    }

    if (impact) {
        resultHTML += `<h3>Yearly Impact:</h3>`;
        for (let year = 0; year < years; year++) {
            if (impact[year]) {
                resultHTML += `
                    <h4>Year ${year + 1}:</h4>
                    <ul>
                        <li>Carbon Sequestration: ${impact[year].carbon?.toFixed(2) ?? 'N/A'}</li>
                        <li>Biodiversity Score: ${impact[year].biodiversity?.toFixed(2) ?? 'N/A'}</li>
                        <li>Cost: ${impact[year].cost?.toFixed(2) ?? 'N/A'}</li>
                        <li>Area Used: ${impact[year].area?.toFixed(2) ?? 'N/A'}</li>
                    </ul>
                `;
            }
        }
    }

    if (cumulativeImpact) {
        resultHTML += `
            <h3>Cumulative Impact:</h3>
            <ul>
                <li>Total Carbon Sequestration: ${cumulativeImpact.carbon?.toFixed(2) ?? 'N/A'}</li>
                <li>Total Biodiversity Score: ${cumulativeImpact.biodiversity?.toFixed(2) ?? 'N/A'}</li>
                <li>Total Cost: ${cumulativeImpact.cost?.toFixed(2) ?? 'N/A'}</li>
                <li>Total Area Used: ${cumulativeImpact.area?.toFixed(2) ?? 'N/A'}</li>
            </ul>
        `;
    }

    resultsDiv.innerHTML += resultHTML;

    setTimeout(() => {
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function displayWarning(message) {
    resultsDiv.innerHTML += `
        <div class="warning">
            <h3>Optimization Warning:</h3>
            <p>${message}</p>
        </div>
    `;
}

function generateFeedback(result, formData) {
    let feedback = `<h3>Optimization Feedback:</h3>`;
    
    if (result.warnings && result.warnings.length > 0) {
        const totalWarnings = result.warnings.reduce((sum, warning) => sum + warning.count, 0);
        feedback += `<p class="warning">Warnings (${totalWarnings}):</p><ul>`;
        
        result.warnings.forEach(warning => {
            feedback += `<li>${warning.message} (${warning.count} ${warning.count === 1 ? 'time' : 'times'})</li>`;
        });
        
        feedback += `</ul>`;
        feedback += `<p>Consider adjusting the advanced options:</p>
                     <ul>
                         <li>Increase the maximum iterations (currently ${formData.maxIterations})</li>
                         <li>Decrease the function tolerance (currently ${formData.functionTolerance})</li>
                     </ul>`;
    }

    if (result.cumulative_impact && result.cumulative_impact.cost) {
        const budgetUtilization = result.cumulative_impact.cost / formData.budget * 100;
        if (budgetUtilization < 80) {
            feedback += `<p>Budget utilization is low (${budgetUtilization.toFixed(2)}%). You might want to:</p>
                         <ul>
                             <li>Increase the minimum budget utilization in advanced options</li>
                             <li>Increase the land area to allow for more planting</li>
                         </ul>`;
        }

        if (result.cumulative_impact.area) {
            const landUtilization = result.cumulative_impact.area / formData.landArea * 100;
            feedback += `<p>Land area utilization: ${landUtilization.toFixed(2)}%</p>`;
        }
    } else {
        feedback += `<p>No valid solution found. Try adjusting your input parameters.</p>`;
    }

    return feedback;
}
