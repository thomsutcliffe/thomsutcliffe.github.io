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
        "mode": "verbose",
        "selectedIngredient": -1,
        "selectedStep": -1,
        "recipeDetailsVisible": true
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
            <div v-if="recipeDetailsVisible">
                <span class="close" @click="() => recipeDetailsVisible=false">-</span>
                <h6>Recipe info</h6>
                <input placeholder="id" v-model="id">
                <input placeholder="Name" v-model="recipe.name">
                <span v-if="!recipe.name" class="validationerror">Name is required</span>
                <input placeholder="Fork name" v-model="recipe.forkName">
                <input placeholder="Fork URL" v-model="recipe.forkUrl">
                <input type="number" pattern="^\\d*\\.?\\d*$" step="any" 
                placeholder="Yield" v-model="recipe.yield">
                <input placeholder="Yield Unit" v-model="recipe.yieldUnit" list="units">
            </div>
            <div v-else class="bordersmall" @click="() => recipeDetailsVisible=true">
                <span v-if="recipe.name">{{ recipe.name }}</span>
                <span v-else style="font-style: italic">Recipe details</span>
            </div>
            <h6>Ingredients</h6>
            <div v-for="ingredient in recipe.ingredients" 
            v-bind:key="ingredient.id" >
                <div class="border" v-bind:style="ingredient.id===selectedIngredient?'':'display: none'">
                    <span class="close" @click.stop="closeIngredient">-</span>
                    <input disabled v-model="ingredient.id">
                    <input placeholder="name" v-model="ingredient.name">
                    <input type="number" pattern="^\\d*\\.?\\d*$" step="any" placeholder="quantity" v-model="ingredient.quantity">
                    <input placeholder="unit" v-model="ingredient.unit" list="units">
                    <input placeholder="notes" v-model="ingredient.notes">
                    <input class="select" type="checkbox" v-model="ingredient.optional" v-bind:id="'optionalfor'+ingredient.id">
                    <label class="select" v-bind:for="'optionalfor'+ingredient.id">Optional</label>
                    <input placeholder="subrecipe" v-model="ingredient.subrecipe">
                    <button type="reset" @click="() => removeIngredient(ingredient.id)" style="font-size: 16pt"><i class="fa fa-minus-circle"></i></button>
                    <button @click="() => moveIngredientUp(ingredient.id)" v-bind:disabled="ingredient.id === 0" type="button"><i class="fa fa-arrow-circle-up"></i></button>
                    <button @click="() => moveIngredientDown(ingredient.id)" v-bind:disabled="maxIngredientId()" type="button"><i class="fa fa-arrow-circle-down"></button>
                    <span v-if="!isIngredientInAnyStep(ingredient.id)" class="validationerror">Ingredient is not listed in any step</span>
                </div>
                <div class="bordersmall" @click="() => openIngredient(ingredient.id)" v-bind:style="ingredient.id===selectedIngredient?'display: none':''">
                    <span>{{stepCheckboxLabelForIngredient(ingredient)}}</span>
                </div>
            </div>
            <button @click="addIngredient"><i class="fa fa-plus-circle"></i></button>
            <hr/>
            <h6>Steps</h6>
            <div v-for="step in recipe.steps"
            v-bind:key="step.id" >
                <div class="border" v-bind:style="step.id===selectedStep?'':'display: none'">
                    <span class="close" @click.stop="closeStep">-</span>
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
                    <button type="reset" @click="removeStep(step.id)" style="font-size: 16pt"><i class="fa fa-minus-circle"></i></button>
                    <button @click="() => moveStepUp(step.id)" v-bind:disabled="step.id === 0" type="button"><i class="fa fa-arrow-circle-up"></button>
                    <button @click="() => moveStepDown(step.id)" v-bind:disabled="step.id === maxStepId()" type="button"><i class="fa fa-arrow-circle-down"></button>
                </div>
                <div class="bordersmall" @click="openStep(step.id)" v-bind:style="step.id===selectedStep?'display: none':''">
                    <span>{{ step.name ? step.name : step.id }}</span>
                </div>
            </div>
            <button @click="addStep"><i class="fa fa-plus-circle"></i></button>
            <hr/>
            <div v-if="validationErrors().length === 0">
                <h3>Preview</h3>
                <input type="checkbox" class="select" id="verboseview" v-bind:checked="mode === 'verbose'" @change="setVerboseMode">
                <label for="verboseview" class="select">Verbose view</label>
                <input type="checkbox" class="select" id="condensedview" v-bind:checked="mode === 'condensed'" @change="setCondensedMode">
                <label for="condensedview" class="select">Condensed view</label>
                <recipe
                        v-bind:recipe="formatRecipe(recipe)"
                        v-bind:subrecipes="{}"
                        v-bind:mode="mode"
                        v-bind:path="'0'"
                        v-bind:visiblesubrecipepaths="[]"
                        v-bind:quantity="recipe.yield"
                        v-bind:unit="recipe.yieldUnit"></recipe>
                <hr/>
            </div>
            <div v-if="validationErrors().length === 0"><div id="copyJson">{{ recipe }}</div><button @click="copyJson" type="button"><i class="fa fa-copy"></i></button></div>
            <div v-else><span class="validationerror">Recipe is invalid.<ul><li v-for="e in validationErrors()" v-bind:key="e">{{ e }}</li></ul></span></div>
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
            this.selectedIngredient = newId;
        },
        removeIngredient: function (id) {
            this.recipe.ingredients.splice(id, 1);
            this.recipe.ingredients = this.recipe.ingredients.map(i => i.id > id ? {...i, id: i.id - 1} : i);
        },
        moveIngredientUp: function(id) {
            if(id > 0) {
                this.recipe.ingredients = this.recipe.ingredients.map(i => i.id===id? {...i, id: id-1} : i.id===id-1?{...i, id: id}:i).sort((a, b) => a.id-b.id);
                if(this.selectedIngredient===id) {
                    this.selectedIngredient = id-1;
                }
            }
        },
        moveIngredientDown: function(id) {
            if(id < this.maxIngredientId()) {
                this.recipe.ingredients = this.recipe.ingredients.map(i => i.id===id? {...i, id: id+1} : i.id===id+1?{...i, id: id}:i).sort((a, b) => a.id-b.id);
                if(this.selectedIngredient===id) {
                    this.selectedIngredient = id+1;
                }
            }
        },
        maxIngredientId: function() {
            return this.recipe.ingredients.map(i=>i.id).sort((a, b) => b-a)[0];
        },
        closeIngredient: function () {
            this.selectedIngredient=-1;
        },
        openIngredient: function(id) {
            this.selectedIngredient=id;
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
            });
            this.selectedStep = newId;
        },
        removeStep: function (id) {
            this.recipe.steps.splice(id, 1);
            this.recipe.steps = this.recipe.steps.map(s => s.id > id ? {...s, id: s.id - 1} : s);
            if(this.selectedStep === id) {
                this.selectedStep = -1;
            }
        },
        moveStepUp: function(id) {
            if(id > 0) {
                this.recipe.steps = this.recipe.steps.map(s => s.id===id? {...s, id: id-1} : s.id===id-1?{...s, id: id}:s).sort((a, b) => a.id-b.id);
                if(this.selectedStep===id) {
                    this.selectedStep = id-1;
                }
            }
        },
        moveStepDown: function(id) {
            if(id < this.recipe.steps.map(s=>s.id).sort((a, b) => b-a)[0]) {
                this.recipe.steps = this.recipe.steps.map(s => s.id===id? {...s, id: id+1} : s.id===id+1?{...s, id: id}:s).sort((a, b) => a.id-b.id);
                if(this.selectedStep===id) {
                    this.selectedStep = id+1;
                }
            }
        },
        maxStepId: function() {
            return this.recipe.steps.map(s=>s.id).sort((a, b) => b-a)[0];
        },
        closeStep: function() {
            this.selectedStep = -1;
        },
        openStep: function(id) {
            this.selectedStep = id;
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
        isIngredientInAnyStep: function(ingredientId) {
          return (this.recipe.steps||[]).flatMap(s => s.ingredients).includes(ingredientId);
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
        validationErrors: function() {
            const errors = [];
            if(!this.recipe.name) {
                errors.push("Recipe name is not defined");
            }
            (this.recipe.ingredients||[]).filter(i => !this.isIngredientInAnyStep(i.id)).forEach(i => errors.push("Ingredient "+this.stepCheckboxLabelForIngredient(i)+" is not listed in any step"))
            return errors;
        },
        copyJson: function() {
            const range = document.createRange();
            range.selectNode(document.getElementById("copyJson"));
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand("copy");
            window.getSelection().removeAllRanges();
        },
        formatRecipe(recipe) {
            return {
                ...recipe,
                condensedSteps: getCondensedRecipe(recipe)
            }
        }
    }

};