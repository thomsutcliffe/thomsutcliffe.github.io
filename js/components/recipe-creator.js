const recipecreator = {
    data: () => ({
        "id": "",
        "recipe": {
            "name": "",
            "forkName": undefined,
            "forkUrl": undefined,
            "yield": undefined,
            "yieldUnit": undefined,
            "ingredients": [],
            "steps": []
        },
        "mode": "verbose"
    }),
    template: `
        <div>
            <h3>Recipe Creator</h3>
            <datalist id="units">
                <option>tsp</option>
                <option>tbsp</option>
                <option>ml</option>
                <option>l</option>
                <option>g</option>
                <option>kg</option>
            </datalist>
            <input placeholder="id" v-model="id">
            <input placeholder="Name" v-model="recipe.name">
            <span v-if="!recipe.name" class="validationerror">Name is required</span>
            <input placeholder="Fork name" v-model="recipe.forkName">
            <input placeholder="Fork URL" v-model="recipe.forkUrl">
            <input type="number" pattern="^\\d*\\.?\\d*$" step="any" 
            placeholder="Yield" v-model="recipe.yield">
            <input placeholder="Yield Unit" v-model="recipe.yieldUnit" list="units">
            <h6>Ingredients</h6>
            <div v-for="ingredient in recipe.ingredients" class="border"
            v-bind:key="ingredient.id">
                <input disabled v-model="ingredient.id">
                <input placeholder="name" v-model="ingredient.name">
                <input type="number" pattern="^\\d*\\.?\\d*$" step="any" placeholder="quantity" v-model="ingredient.quantity">
                <input placeholder="unit" v-model="ingredient.unit" list="units">
                <input placeholder="notes" v-model="ingredient.notes">
                <input class="select" type="checkbox" v-model="ingredient.optional" v-bind:id="'optionalfor'+ingredient.id">
                <label class="select" v-bind:for="'optionalfor'+ingredient.id">Optional</label>
                <input placeholder="subrecipe" v-model="ingredient.subrecipe">
                <button type="reset" @click="() => removeIngredient(ingredient.id)" style="font-size: 16pt"><i class="fa fa-minus-circle"></i></button>
            </div>
            <button @click="addIngredient"><i class="fa fa-plus-circle"></i></button>
            <hr/>
            <h6>Steps</h6>
            <div v-for="step in recipe.steps" class="border"
            v-bind:key="step.id">
                <input disabled v-model="step.id">
                <input placeholder="name" v-model="step.name">
                <input placeholder="description" v-model="step.description">
                <div class="multiselect" v-if="recipe.ingredients.length">
                    <span>Ingredients</span>
                    <div v-for="ingredient in recipe.ingredients" v-bind:key="ingredient.id">
                        <input 
                        class="select"
                        type="checkbox" 
                        v-bind:id="'i'+ingredient.id+'s'+step.id" 
                        v-bind:disabled="!isIngredientEligibleForStep(step.id, ingredient.id)"
                        @change="() => changeIngredientInStep(step.id, ingredient.id)">
                        <label class="select" v-bind:for="'i'+ingredient.id+'s'+step.id">{{stepCheckboxLabelForIngredient(ingredient)}}</label>
                    </div>
                </div>
                <button type="reset" @click="() => removeStep(step.id)" style="font-size: 16pt"><i class="fa fa-minus-circle"></i></button>
            </div>
            <button @click="addStep"><i class="fa fa-plus-circle"></i></button>
            <hr/>
            <div v-if="validate()">
                <h3>Preview</h3>
                <input type="checkbox" class="select" id="verboseview" v-bind:checked="mode === 'verbose'" @change="setVerboseMode">
                <label for="verboseview" class="select">Verbose view</label>
                <input type="checkbox" class="select" id="condensedview" v-bind:checked="mode === 'condensed'" @change="setCondensedMode">
                <label for="condensedview" class="select">Condensed view</label>
                <recipe
                        v-bind:recipe="formatRecipe(recipe)"
                        v-bind:recipeId="id"
                        v-bind:subrecipes="{}"
                        v-bind:mode="mode"
                        v-bind:path="'0'"
                        v-bind:visiblesubrecipepaths="[]"
                        v-bind:quantity="recipe.yield"
                        v-bind:unit="recipe.yieldUnit"></recipe>
                <hr/>
            </div>
            <div id="copyJson">{{ recipe }}</div>
        </div>
    `,
    methods: {
        addIngredient: function () {
            let newId = 0;
            if (this.recipe.ingredients.length > 0) {
                newId = this.recipe.ingredients.map(i => i.id).sort((a, b) => b - a)[0] + 1;
            }
            this.recipe.ingredients.push({
                id: newId,
                name: "",
                quantity: undefined,
                unit: undefined,
                notes: undefined,
                optional: undefined,
                subrecipe: undefined
            });
        },
        removeIngredient: function (id) {
            this.recipe.ingredients.splice(id, 1);
            this.recipe.ingredients = this.recipe.ingredients.map(i => i.id > id ? {...i, id: i.id - 1} : i);
        },
        addStep: function () {
            let newId = 0;
            if (this.recipe.steps.length > 0) {
                newId = this.recipe.steps.map(i => i.id).sort((a, b) => b - a)[0] + 1;
            }
            this.recipe.steps.push({
                id: newId,
                name: "",
                description: "",
                ingredients: []
            })
        },
        removeStep: function (id) {
            this.recipe.steps.splice(id, 1);
            this.recipe.steps = this.recipe.steps.map(s => s.id > id ? {...s, id: s.id - 1} : s);
        },
        changeIngredientInStep: function (stepId, ingredientId) {
            const step = this.recipe.steps.filter(s => s.id === stepId)[0];
            const index = step.ingredients.findIndex(i => i === ingredientId);
            if (index > -1) {
                step.ingredients.splice(index, 1);
            } else {
                step.ingredients.push(ingredientId);
                step.ingredients.sort((a, b) => a - b);
            }
        },
        isIngredientEligibleForStep: function (stepId, ingredientId) {
            const steps = this.recipe.steps.filter(step => step.id !== stepId && step.ingredients.includes(ingredientId));
            return steps.length === 0;
        },
        stepCheckboxLabelForIngredient: function (ingredient) {
            let string = '';
            string = string + ingredient.name || ingredient.id;
            string += ' ';
            string += ingredient.quantity ? ingredient.quantity + ' ' : '';
            string += ingredient.unit ? ingredient.unit + ' ' : '';
            string += ingredient.notes ? ingredient.notes + ' ' : '';
            string += ingredient.optional ? '[Optional] ' : '';
            string += ingredient.subrecipe || '';
            return string;
        },
        setCondensedMode: function () {
            this.mode = "condensed";
        },
        setVerboseMode: function () {
            this.mode = "verbose";
        },
        validate: function() {
            return this.recipe.name;
        },
        formatRecipe(recipe) {
            return {
                ...recipe,
                condensedSteps: getCondensedRecipe(recipe)
            }
        }
    }

};