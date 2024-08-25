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
    let result = await pyodide.runPythonAsync(`
from scipy.optimize import minimize
import numpy as np
import json
import sys
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

def tree_growth(age, max_size, growth_rate, soil_quality='medium', climate_zone='temperate', elevation=0, species_optimal_elevation=0):
    soil_factor = {'poor': 0.7, 'medium': 1.0, 'good': 1.3}[soil_quality]
    c_factor = climate_factor(climate_zone)
    e_factor = elevation_factor(elevation, species_optimal_elevation)
    return max_size * (1 - np.exp(-growth_rate * age * soil_factor * c_factor * e_factor))

def carbon_sequestration(size, climate_zone='temperate', elevation=0, species_optimal_elevation=0):
    c_factor = climate_factor(climate_zone)
    e_factor = elevation_factor(elevation, species_optimal_elevation)
    return 0.5 * size * c_factor * e_factor

def optimize_reforestation(total_budget, land_area, years, species_data, soil_quality='medium', climate_zone='temperate', elevation=0, discount_rate=0.05, max_iterations=2000, function_tolerance=1e-8, min_budget_utilization=0.6, species_diversity_factor=2):
    n_species = len(species_data)
    
    def objective(x):
        x = x.reshape((years, n_species))
        total_value = 0
        for year in range(years):
            for s, species in enumerate(species_data):
                trees_planted = x[year, s]
                for age in range(years - year):
                    size = tree_growth(age, species_data[species]['max_size'], 
                                       species_data[species]['growth_rate'], 
                                       soil_quality, climate_zone, elevation,
                                       species_data[species]['optimal_elevation'])
                    carbon = carbon_sequestration(size, climate_zone, elevation,
                                                  species_data[species]['optimal_elevation']) * trees_planted
                    biodiversity = species_data[species]['biodiversity'] * trees_planted
                    discount_factor = 1 / ((1 + discount_rate) ** (year + age))
                    # Give more weight to later years
                    year_weight = 1 + (year / years)
                    total_value += (carbon + biodiversity) * discount_factor * year_weight
        return -total_value  # Negative because we're minimizing

    def constraint_budget(x):
        x = x.reshape((years, n_species))
        return total_budget - np.sum(x * [species_data[s]['cost'] for s in species_data])
    
    def constraint_land(x):
        x = x.reshape((years, n_species))
        total_area = np.sum(x * [species_data[s]['area'] for s in species_data])
        return land_area - total_area
    
    def constraint_min_planting(x):
        x = x.reshape((years, n_species))
        min_trees_per_year = total_budget / (years * max(species_data[s]['cost'] for s in species_data)) / 10
        return np.sum(x, axis=1) - min_trees_per_year  # Ensure a minimum number of trees planted each year
    
    def constraint_min_budget(x):
        x = x.reshape((years, n_species))
        return np.sum(x * [species_data[s]['cost'] for s in species_data]) - min_budget_utilization * total_budget

    def constraint_species_diversity(x):
        x = x.reshape((years, n_species))
        return np.sum(x, axis=0) - np.sum(x) / (species_diversity_factor * n_species)
    
    def constraint_smoothing(x):
        x = x.reshape((years, n_species))
        return -np.sum(np.abs(x[1:] - x[:-1]))  # Minimize year-to-year differences

    constraints = [
        {'type': 'ineq', 'fun': constraint_budget},
        {'type': 'eq', 'fun': constraint_land},
        {'type': 'ineq', 'fun': constraint_min_planting},
        {'type': 'ineq', 'fun': constraint_min_budget},
        {'type': 'ineq', 'fun': constraint_species_diversity},
        {'type': 'ineq', 'fun': constraint_smoothing}
    ]
    
    bounds = [(0, None) for _ in range(years * n_species)]
    
    # Adjust initial guess to respect land area constraint and encourage even distribution
    total_trees = land_area / np.mean([species_data[s]['area'] for s in species_data])
    initial_guess = np.ones(years * n_species) * total_trees / (years * n_species)
    
    result = minimize(objective, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints, 
                      options={'maxiter': int(max_iterations), 'ftol': function_tolerance})
    
    if not result.success:
        print(f"Warning: Optimization may not have converged. Message: {result.message}")
    
    tree_counts = {}
    x = result.x.reshape((years, n_species))
    for year in range(years):
        tree_counts[year] = {s: int(round(x[year, i])) for i, s in enumerate(species_data)}
    
    return tree_counts, -result.fun, result.success, result.message

def calculate_impact(tree_counts, species_data, years, soil_quality='medium', climate_zone='temperate', elevation=0, discount_rate=0.05):
    impact = {year: {} for year in range(years)}
    cumulative_impact = {'carbon': 0, 'biodiversity': 0, 'cost': 0, 'area': 0}
    
    for plant_year in range(years):
        for s, count in tree_counts[plant_year].items():
            species = species_data[s]
            for year in range(plant_year, years):
                age = year - plant_year
                size = tree_growth(age, species['max_size'], species['growth_rate'], 
                                   soil_quality, climate_zone, elevation, 
                                   species['optimal_elevation'])
                carbon = carbon_sequestration(size, climate_zone, elevation, 
                                              species['optimal_elevation']) * count
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

def multi_start_optimization(total_budget, land_area, years, species_data, n_starts=5, **kwargs):
    best_result = None
    best_objective = float('inf')
    best_success = False
    best_message = ""
    all_warnings = []
    
    for i in range(n_starts):
        tree_counts, objective_value, success, message = optimize_reforestation(total_budget, land_area, years, species_data, **kwargs)
        if message:
            all_warnings.append(message)
        if objective_value < best_objective:
            best_result = tree_counts
            best_objective = objective_value
            best_success = success
            best_message = message
    
    # Count occurrences of each warning
    warning_counts = Counter(all_warnings)
    
    # Format warnings as a list of dictionaries
    formatted_warnings = [{"message": warning, "count": count} for warning, count in warning_counts.items()]
    
    return best_result, best_objective, best_success, best_message, n_starts, formatted_warnings

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

def run_optimization(budget, land_area, years, species_data, soil_quality, climate_zone, elevation, max_iterations, function_tolerance, min_budget_utilization, species_diversity_factor):
    tree_counts, objective_value, success, message, n_starts, formatted_warnings = multi_start_optimization(
        budget, land_area, years, species_data, 
        soil_quality=soil_quality,
        climate_zone=climate_zone,
        elevation=elevation,
        max_iterations=max_iterations, 
        function_tolerance=function_tolerance, 
        min_budget_utilization=min_budget_utilization, 
        species_diversity_factor=species_diversity_factor
    )
    impact, cumulative_impact = calculate_impact(tree_counts, species_data, years, 
                                                 soil_quality=soil_quality, 
                                                 climate_zone=climate_zone, 
                                                 elevation=elevation)
    
    # Debug log
    logger.debug(f"Formatted warnings: {formatted_warnings}")
    
    # Prepare feedback for the user
    if success:
        quality_message = "The optimization process converged successfully."
    else:
        quality_message = f"Warning: The optimization may not have found the best solution. Reason: {message}"
    
    quality_message += f"\\nThe result was obtained after {{n_starts}} optimization attempts."
    
    return json.dumps({
        "success": success,
        "tree_counts": {str(k): v for k, v in tree_counts.items()},
        "objective_value": objective_value,
        "impact": {str(k): v for k, v in impact.items()},
        "cumulative_impact": cumulative_impact,
        "quality_message": quality_message,
        "warnings": formatted_warnings
    }, cls=NumpyEncoder)

# Run the optimization
result = run_optimization(
    ${formData.budget}, 
    ${formData.landArea}, 
    ${formData.years}, 
    ${JSON.stringify(formData.species)},
    '${formData.soilQuality}',
    '${formData.climateZone}',
    ${formData.elevation},
    ${formData.maxIterations},
    ${formData.functionTolerance},
    ${formData.minBudgetUtilization},
    ${formData.speciesDiversityFactor}
)

# Restore stdout and get the captured output
sys.stdout = old_stdout
warnings = mystdout.getvalue()

json.dumps({"result": result, "warnings": warnings}, cls=NumpyEncoder)
`);
    
    console.log("Raw result from Python:", result);

    let parsedResult;
    if (typeof result === 'string') {
        parsedResult = JSON.parse(result);
    } else {
        parsedResult = result;
    }
    console.log("Parsed result:", parsedResult);

    let optimizationResult;
    if (typeof parsedResult.result === 'string') {
        optimizationResult = JSON.parse(parsedResult.result);
    } else {
        optimizationResult = parsedResult.result;
    }
    console.log("Optimization result:", optimizationResult);

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
    { name: "Oak", cost: 15, area: 25, carbon: 7, biodiversity: 8, growthRate: 0.10, maxSize: 100, optimalElevation: 300 },
    { name: "Pine", cost: 10, area: 20, carbon: 6, biodiversity: 6, growthRate: 0.15, maxSize: 80, optimalElevation: 1000 },
    { name: "Maple", cost: 18, area: 30, carbon: 8, biodiversity: 7, growthRate: 0.12, maxSize: 90, optimalElevation: 500 },
    { name: "Birch", cost: 12, area: 22, carbon: 5, biodiversity: 7, growthRate: 0.14, maxSize: 70, optimalElevation: 700 }
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
    });

    // Set a default elevation in the advanced options
    document.getElementById('elevation').value = 500;
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
            optimal_elevation: parseFloat(entry.querySelector('.species-optimal-elevation').value)
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
        soilQuality: document.getElementById('soil-quality').value,
        climateZone: document.getElementById('climate-zone').value,
        elevation: parseFloat(document.getElementById('elevation').value),
        // Add more environmental factors here as they are implemented
    };

    try {
        const result = await runOptimization(formData);
        console.log("Full optimization result:", result);
        console.log("Warnings type:", typeof result.warnings);
        console.log("Warnings content:", JSON.stringify(result.warnings));

        let feedbackHtml = generateFeedback(result, formData);
        resultsDiv.innerHTML = feedbackHtml;
        
        if (!result.success) {
            displayWarning(result.quality_message);
        }
        
        displayResults(result.tree_counts, result.objective_value, result.impact, result.cumulative_impact, formData.years);
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
        <p>Objective value: ${objectiveValue.toFixed(2)}</p>
        <h3>Tree Counts by Year:</h3>
    `;

    for (let year = 0; year < years; year++) {
        resultHTML += `<h4>Year ${year + 1}:</h4><ul>`;
        for (let [species, count] of Object.entries(treeCounts[year])) {
            resultHTML += `<li>${species}: ${count}</li>`;
        }
        resultHTML += `</ul>`;
    }

    resultHTML += `
        <h3>Yearly Impact:</h3>
    `;

    for (let year = 0; year < years; year++) {
        resultHTML += `
            <h4>Year ${year + 1}:</h4>
            <ul>
                <li>Carbon Sequestration: ${impact[year].carbon.toFixed(2)}</li>
                <li>Biodiversity Score: ${impact[year].biodiversity.toFixed(2)}</li>
                <li>Cost: ${impact[year].cost.toFixed(2)}</li>
                <li>Area Used: ${impact[year].area.toFixed(2)}</li>
            </ul>
        `;
    }

    resultHTML += `
        <h3>Cumulative Impact:</h3>
        <ul>
            <li>Total Carbon Sequestration: ${cumulativeImpact.carbon.toFixed(2)}</li>
            <li>Total Biodiversity Score: ${cumulativeImpact.biodiversity.toFixed(2)}</li>
            <li>Total Cost: ${cumulativeImpact.cost.toFixed(2)}</li>
            <li>Total Area Used: ${cumulativeImpact.area.toFixed(2)}</li>
        </ul>
    `;

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

    const budgetUtilization = result.cumulative_impact.cost / formData.budget * 100;
    if (budgetUtilization < 80) {
        feedback += `<p>Budget utilization is low (${budgetUtilization.toFixed(2)}%). You might want to:</p>
                     <ul>
                         <li>Increase the minimum budget utilization in advanced options</li>
                         <li>Increase the land area to allow for more planting</li>
                     </ul>`;
    }

    const landUtilization = result.cumulative_impact.area / formData.landArea * 100;
    feedback += `<p>Land area utilization: ${landUtilization.toFixed(2)}%</p>`;

    return feedback;
}
