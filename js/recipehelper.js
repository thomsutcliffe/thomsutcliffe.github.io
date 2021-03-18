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
        (step.ingredients || []).map(id => recipe.ingredients.filter(i => i.id === id)[0]).forEach(ingredient => stepGroup.push(ingredient));
        if (stepGroup.length > 0) {
            stepGroup[stepGroup.length - 1] = {
                ...stepGroup[stepGroup.length - 1],
                step: step.description
            };
        } else {
            stepGroup.push({
                name: '',
                step: step.description,
                id: step.id + 100
            })
        }
        stepGroup.forEach(step => condensedSteps.push(step));
    });
    return condensedSteps;
}

function getRecipeData(recipe) {
    return {
        ...recipe,
        mode: getParameterByName("view") || 'verbose',
        condensedSteps: getCondensedRecipe(recipe)
    };
}