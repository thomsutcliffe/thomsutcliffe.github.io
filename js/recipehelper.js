function getParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function getCondensedRecipe(recipe) {
    const condensedSteps = [];
    recipe.steps.forEach(step => {
        const stepGroup = [];
        (step.ingredients || []).map(id => recipe.ingredients.filter(i => i.id === id)[0]).forEach(ingredient => stepGroup.push({ingredient: ingredient}));
        if (stepGroup.length > 0) {
            stepGroup[stepGroup.length - 1] = {
                ...stepGroup[stepGroup.length - 1],
                step: step.description
            };
        } else {
            stepGroup.push({
                step: step.description,
                id: step.id + 100
            })
        }
        stepGroup.forEach(step => condensedSteps.push(step));
    });
    return condensedSteps;
}

function getRecipeData(recipeId, callback) {
    jQuery.getJSON("recipes/"+recipeId+".json", data => callback({
        ...data,
        condensedSteps: getCondensedRecipe(data)
    }));
}

function getAmountString(quantity, unit) {
    if (!unit) {
        return getHumanReadableNumber(quantity, unit);
    } else if (!convert().possibilities().includes(unit)) {
        return getHumanReadableNumber(quantity, unit);
    } else {
        const best = convert(quantity).from(unit).toBest({
            exclude: ["dl", "msk", "cl", "tsk", "cm3",
                "mcg", "mg", "mt", "oz", "lb", "t",
                "mm3", "cm3", "cl", "dl", "kl", "m3", "km3", "krm", "tsk", "msk", "kkp", "glas", "kanna", "in3", "fl-oz", "cup", "pnt", "qt", "gal", "ft3", "yd3"]
        });
        return getHumanReadableNumber(best.val, best.unit);
    }
}

const spacedUnits = ["tsp", "tbsp"]

const unitRounders = {
    "g": number => Math.round(number/5)*5,
    "kg": number => Math.round(number*200)/200
}
function getHumanReadableNumber(number, unit) {
    const spacer = spacedUnits.includes(unit) ? ' ' : '';
    if(unitRounders[unit]) {
        return unitRounders[unit](number) + spacer + unit;
    } else if (unit === "tsp") {
        //todo try to figure out fractions for tsp and tbsp and find the nicest
        return parseFloat(number.toPrecision(2)) + spacer + unit;
    } else if (unit === "tbsp") {
        return parseFloat(number.toPrecision(2)) + spacer + unit
    } else {
        return parseFloat(number.toPrecision(2)) + spacer + unit;
    }
}