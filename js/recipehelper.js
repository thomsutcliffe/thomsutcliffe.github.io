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

function getHumanReadableNumber(number, unit) {
    const unitRounders = {
        "g": number => Math.round(number/5)*5,
        "kg": number => Math.round(number*200)/200,
        "ml": number => Math.round(number/5)*5,
        "l": number => Math.round(number*200)/200
    }
    if (unit === "tsp" || unit === "tbsp") {
        const options = [
            {fraction: new Fraction(0, 8),unit: "tsp"},
            {fraction: new Fraction(1, 8),unit: "tsp"},
            {fraction: new Fraction(2, 8),unit: "tsp"},
            {fraction: new Fraction(3, 8),unit: "tsp"},
            {fraction: new Fraction(4, 8),unit: "tsp"},
            {fraction: new Fraction(5, 8),unit: "tsp"},
            {fraction: new Fraction(6, 8),unit: "tsp"},
            {fraction: new Fraction(7, 8),unit: "tsp"},
            {fraction: new Fraction(8, 8),unit: "tsp"},
            {fraction: new Fraction(0, 2),unit: "tbsp"},
            {fraction: new Fraction(1, 2),unit: "tbsp"},
            {fraction: new Fraction(2, 2),unit: "tbsp"}
        ];
        const tsp = convert(number).from(unit).to('tsp');
        const tbsp = convert(number).from(unit).to('tbsp');
        const converted = {tsp: tsp, tbsp: tbsp}
        const decimals = {tsp: converted.tsp%1, tbsp: converted.tbsp%1}

        const best = options.map(option => {
            return {
                ...option,
                difference: Math.abs(option.fraction - decimals[option.unit])
            }
        }).sort((a, b) => {
            const diff = a.difference - b.difference;
            if (diff === 0) {
                if(a.unit === b.unit) {
                    return 0;
                }
                else if(a.unit === 'tbsp') {
                    return -1;
                } else {
                    return 1;
                }
            } else {
                return diff;
            }
        })[0];
        let fractionChars = {};
        fractionChars[new Fraction(1, 8)] = String.fromCharCode(8539);
        fractionChars[new Fraction(1, 4)] = String.fromCharCode(188);
        fractionChars[new Fraction(3, 8)] = String.fromCharCode(8540);
        fractionChars[new Fraction(1, 2)] = String.fromCharCode(189);
        fractionChars[new Fraction(5, 8)] = String.fromCharCode(8541);
        fractionChars[new Fraction(3, 4)] = String.fromCharCode(190);
        fractionChars[new Fraction(7, 8)] = String.fromCharCode(8542);

        const integerPart = Math.floor(converted[best.unit]);
        if(fractionChars[best.fraction]) {
            return (integerPart === 0 ? '' : integerPart+' ') + fractionChars[best.fraction] + ' ' + best.unit;
        } else {
            return (Math.floor(converted[best.unit]) + best.fraction) + ' ' + best.unit;
        }
    } else {
        return (unitRounders[unit] ? unitRounders[unit](number) : parseFloat(number.toPrecision(2))) + unit;
    }
}