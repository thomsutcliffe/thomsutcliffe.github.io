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

const unitTranslations = {
    "tbsp": "Tbs",
    "Tbs": "tbsp"
}
const spacedUnits = ["tsp", "tbsp"]
function getAmountString(quantity, unit) {
    const translatedUnit = unitTranslations[unit] ? unitTranslations[unit] : unit;
    if (!unit) {
        return quantity;
    } else if (!convert().possibilities().includes(translatedUnit)) {
        return quantity+' '+unit;
    } else {
        const best = convert(quantity).from(translatedUnit).toBest({
            exclude: ["dl", "msk", "cl", "tsk", "cm3",
                "mcg", "mg", "mt", "oz", "lb", "t",
                "mm3", "cm3", "cl", "dl", "kl", "m3", "km3", "krm", "tsk", "msk", "kkp", "glas", "kanna", "in3", "fl-oz", "cup", "pnt", "qt", "gal", "ft3", "yd3"]
        });
        const translatedBestUnit = unitTranslations[best.unit] ? unitTranslations[best.unit] : best.unit;
        return best.val + (spacedUnits.includes(translatedBestUnit) ? ' ' : '') + translatedBestUnit;
    }
}