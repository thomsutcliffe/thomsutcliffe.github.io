const recipecreator = {
    props: ['subrecipes'],
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
        "selectedIngredient": undefined,
        "selectedStep": -1,
        "recipeDetailsVisible": true,
        "quickadd": ""
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
                <input placeholder="id" v-model="id" autocapitalize="none" autocomplete="new-recipe-id">
                <input placeholder="Name" v-model="recipe.name" autocapitalize="words" autocomplete="new-recipe-name">
                <span v-if="!recipe.name" class="validationerror">Name is required</span>
                <input placeholder="Fork name" v-model="recipe.forkName" autocapitalize="words" autocomplete="new-recipe-fork-name">
                <input placeholder="Fork URL" v-model="recipe.forkUrl" autocapitalize="none" autocomplete="new-recipe-fork-url">
                <input type="number" pattern="^\\d*\\.?\\d*$" step="any" 
                placeholder="Yield" v-model="recipe.yield" autocomplete="new-recipe-yield">
                <input placeholder="Yield Unit" v-model="recipe.yieldUnit" list="units" autocapitalize="none" autocomplete="new-recipe-yield-unit">
            </div>
            <div v-else class="bordersmall" @click="() => recipeDetailsVisible=true">
                <span v-if="recipe.name">{{ recipe.name }}</span>
                <span v-else style="font-style: italic">Recipe details</span>
            </div>
            <h6>Ingredients</h6>
            <transition-group name="list" >
                <div v-for="ingredient in recipe.ingredients" 
                v-bind:key="ingredient"
                v-bind:ref="'ingredient'+recipe.ingredients.indexOf(ingredient)">
                    <div v-bind:key="ingredient+'parent'"
                        v-bind:class="(ingredient===selectedIngredient ? 'border':'bordersmall')+(validateIngredient(ingredient).valid?'' : ' bordererror')"
                        style="overflow: auto" 
                        @click="setSelectedIngredient(ingredient, true)">
                            <span class="close" @click.stop="selectedIngredient=undefined" v-if="ingredient===selectedIngredient">-</span>
                            <span style="float:left; padding: 0.5rem" v-if="ingredient!==selectedIngredient">{{stepCheckboxLabelForIngredient(ingredient)}}</span>
                            <transition name="slide" mode="out-in">
                                <div v-if="ingredient===selectedIngredient">
                                    <input class="big" v-on:keyup.enter="addIngredient(true)" placeholder="name" v-model="ingredient.name" v-bind:ref="'ingredient'+recipe.ingredients.indexOf(ingredient)+'name'" autocomplete="new-recipe-ingredient-name">
                                    <input class="big" v-on:keyup.enter="addIngredient(true)" type="number" pattern="^\\d*\\.?\\d*$" step="any" placeholder="quantity" v-model="ingredient.quantity" autocomplete="new-recipe-ingredient-quantity">
                                    <input class="big" v-on:keyup.enter="addIngredient(true)" placeholder="unit" v-model="ingredient.unit" list="units" autocapitalize="none" autocomplete="new-recipe-ingredient-unit">
                                    <input class="big" v-on:keyup.enter="addIngredient(true)" placeholder="notes" v-model="ingredient.notes" autocapitalize="none" autocomplete="new-recipe-ingredient-notes">
                                    <input class="big select" type="checkbox" v-model="ingredient.optional" v-bind:id="'optionalfor'+recipe.ingredients.indexOf(ingredient)">
                                    <label class="big select" v-bind:for="'optionalfor'+recipe.ingredients.indexOf(ingredient)">Optional</label>
                                    <input class="big" v-on:keyup.enter="addIngredient(true)" placeholder="subrecipe" v-model="ingredient.subrecipe" @input="loadSubrecipe(ingredient.subrecipe)" autocapitalize="none" autocomplete="new-recipe-ingredient-subrecipe">
                                    <div class="big" style="float: left">
                                        <div v-if="ingredient.subrecipe" class="validationerror">{{ validateSubrecipe(ingredient) }}</div>
                                        <div v-if="!isIngredientInAnyStep(recipe.ingredients.indexOf(ingredient))" class="validationerror">Ingredient is not listed in any step</div>
                                    </div>
                                    <div class="big controls">
                                        <button type="reset" @click="() => removeIngredient(recipe.ingredients.indexOf(ingredient))" style="font-size: 16pt"><i class="fa fa-minus-circle"></i></button>
                                        <button @click="() => moveIngredientUp(recipe.ingredients.indexOf(ingredient))" v-bind:disabled="recipe.ingredients.indexOf(ingredient) === 0" type="button" style="font-size: 16pt"><i class="fa fa-arrow-circle-up"></i></button>
                                        <button @click="() => moveIngredientDown(recipe.ingredients.indexOf(ingredient))" v-bind:disabled="recipe.ingredients.indexOf(ingredient) === maxIngredientId()" type="button" style="font-size: 16pt"><i class="fa fa-arrow-circle-down"></button>
                                    </div>
                                </div>
                            </transition>
                    </div>
                </div>
            </transition-group>

            <div style="overflow: auto; display: table; width: 100%;" ref="addingredient">
                <button @click="addIngredient(false)" style="float: left; display: table-cell"><i class="fa fa-plus-circle"></i></button>
                <span style="width: 100%; display: table-cell; padding-left: 0.5rem">
                    <input placeholder="Quick add..." v-model="quickadd" ref="quickaddinput" v-on:keyup.enter="addIngredient(false)" class="quickadd">
                </span>
            </div>
            <hr/>
            <h6>Steps</h6>
            <transition-group name="list">
                <div v-for="step in recipe.steps"
                v-bind:key="step" >
                    <div v-bind:key="'s'+step+'parent'"> 
                        <div v-bind:class="step===selectedStep ? 'border' : 'bordersmall'" @click="setSelectedStep(step, true)">
                            <span class="close" @click.stop="closeStep" v-if="step===selectedStep">-</span>
                            <span style="float: left; padding: 0.5rem" v-if="step!==selectedStep">{{ step.name ? step.name : 'Unnamed step' }}</span>
                            <transition name="slide">
                                <div v-if="step===selectedStep">
                                    <input v-on:keyup.enter="addStep()" placeholder="name" v-model="step.name" v-bind:ref="'step'+recipe.steps.indexOf(step)+'name'" autocomplete="new-recipe-step-name">
                                    <input v-on:keyup.enter="addStep()" placeholder="description" v-model="step.description" autocomplete="new-recipe-step-description">
                                    <div class="multiselect" v-if="recipe.ingredients.length">
                                        <span>Ingredients</span>
                                            <div v-for="ingredient in recipe.ingredients" v-bind:key="'s'+recipe.steps.indexOf(step)+'i'+ingredient">
                                                <input 
                                                class="select"
                                                type="checkbox" 
                                                v-bind:id="'i'+recipe.ingredients.indexOf(ingredient)+'s'+recipe.steps.indexOf(step)" 
                                                v-bind:key="'s'+step.id+'i'+ingredient+'input'"
                                                v-bind:disabled="!isIngredientEligibleForStep(recipe.steps.indexOf(step), recipe.ingredients.indexOf(ingredient))"
                                                v-bind:checked="step.ingredients.includes(recipe.ingredients.indexOf(ingredient))"
                                                @change="() => changeIngredientInStep(step, recipe.ingredients.indexOf(ingredient))">
                                                <label v-bind:key="'s'+recipe.steps.indexOf(step)+'i'+ingredient+'label'" class="select" v-bind:for="'i'+recipe.ingredients.indexOf(ingredient)+'s'+recipe.steps.indexOf(step)" style="float: left">{{stepCheckboxLabelForIngredient(ingredient)}}</label>
                                            </div>
                                    </div>
                                    <div class="controls">
                                        <button type="reset" @click="removeStep(recipe.steps.indexOf(step))" style="font-size: 16pt; margin: 0.125rem"><i class="fa fa-minus-circle"></i></button>
                                        <button @click="() => moveStepUp(recipe.steps.indexOf(step))" v-bind:disabled="recipe.steps.indexOf(step) === 0" type="button" style="font-size: 16pt; margin: 0.125rem"><i class="fa fa-arrow-circle-up"></button>
                                        <button @click="() => moveStepDown(recipe.steps.indexOf(step))" v-bind:disabled="recipe.steps.indexOf(step) === maxStepId()" type="button" style="font-size: 16pt; margin: 0.125rem"><i class="fa fa-arrow-circle-down"></button>
                                    </div>
                                </div>
                            </transition>
                        </div>
                    </div>
                </div>
            </transition-group>
            <button @click="addStep"><i class="fa fa-plus-circle"></i></button>
            <hr/>
            <div v-if="validateRecipe().valid">
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
            <div v-if="validateRecipe().valid">
                <div id="copyJson">{{ recipe }}</div>
                <button @click="copyJson" type="button"><i class="fa fa-copy"></i></button>
                <button @click="downloadJson" type="button"><i class="fa fa-download"></i></button>
            </div>
            <div v-else><span class="validationerror">Recipe is invalid.<ul><li v-for="e in validateRecipe().errors" v-bind:key="e">{{ e }}</li></ul></span></div>
        </div>
    `,
    methods: {
        addIngredient: function (disableQuickAdd) {
            if (!disableQuickAdd && this.quickadd && this.quickadd !== "") {
                const pattern = /([A-Za-z ]+) (\d*\.?\d+) ?([a-zA-Z]+)(?: ([a-zA-Z]*))?(?: (\[Optional\]))?(?: ([a-z]+))?/;
                const ingredientArray = this.quickadd.match(pattern);
                this.recipe.ingredients.push({
                    name: ingredientArray ? ingredientArray[1] : this.quickadd,
                    quantity: ingredientArray ? ingredientArray[2] : undefined,
                    unit: ingredientArray ? ingredientArray[3] : undefined,
                    notes: ingredientArray ? ingredientArray[4] : undefined,
                    optional: ingredientArray ? ingredientArray[5] === '[Optional]' : undefined,
                    subrecipe: ingredientArray ? ingredientArray[6] : undefined
                });
                this.quickadd = "";
                if (ingredientArray) {
                    Vue.nextTick(() => {
                        this.$refs["quickaddinput"].focus();
                        this.loadSubrecipeDebounced(ingredientArray[6]);
                    });
                } else {
                    this.setSelectedIngredient(this.recipe.ingredients[this.recipe.ingredients.length-1], false);
                }
            } else {
                this.recipe.ingredients.push({
                    name: "",
                    quantity: undefined,
                    unit: undefined,
                    notes: undefined,
                    optional: undefined,
                    subrecipe: undefined
                });
                this.setSelectedIngredient(this.recipe.ingredients[this.recipe.ingredients.length-1], false);
            }
        },
        removeIngredient: function (id) {
            this.recipe.ingredients.splice(id, 1);
            const selectedStepIndex = this.recipe.steps.indexOf(this.selectedStep);
            this.recipe.steps = this.recipe.steps.map(step => {
                return {
                    ...step,
                    ingredients: step.ingredients.filter(i => i !== id).map(i => i > id ? i-1:i)
                }
            });
            this.selectedStep = this.recipe.steps[selectedStepIndex];

        },
        moveIngredientUp: function(id) {
            if(id > 0) {
                const selectedStepIndex = this.recipe.steps.indexOf(this.selectedStep);
                this.recipe.ingredients.splice(id-1, 2, this.recipe.ingredients[id], this.recipe.ingredients[id-1]);
                this.recipe.steps = this.recipe.steps.map(step => {
                    return {
                        ...step,
                        ingredients: step.ingredients.map(i => i === id ? i-1 : i === id-1 ? id : i)
                    }
                });
                this.selectedStep = this.recipe.steps[selectedStepIndex];
            }
        },
        moveIngredientDown: function(id) {
            if(id < this.maxIngredientId()) {
                const selectedStepIndex = this.recipe.steps.indexOf(this.selectedStep);
                this.recipe.ingredients.splice(id, 2, this.recipe.ingredients[id+1], this.recipe.ingredients[id]);
                this.recipe.steps = this.recipe.steps.map(step => {
                    return {
                        ...step,
                        ingredients: step.ingredients.map(i => i === id ? i+1 : i === id+1 ? id : i)
                    }
                });
                this.selectedStep = this.recipe.steps[selectedStepIndex];
            }
        },
        setSelectedIngredient: function(ingredient, delay) {
            if(this.selectedIngredient !== ingredient) {
                this.selectedIngredient = undefined;
                setTimeout(() => {
                    this.selectedIngredient=ingredient;
                    const ref = 'ingredient'+(this.recipe.ingredients.indexOf(ingredient))+'name';
                    const sectionRef = 'ingredient'+(this.recipe.ingredients.indexOf(ingredient));
                    Vue.nextTick(() => {
                        this.$refs[ref][0].focus();
                    });
                }, delay ? 500 : 0);
            }
        },
        rejigIngredientIds: function(newIds) {
            this.recipe.ingredients = this.recipe.ingredients.filter(i => i.id in newIds).map(i => {
                return {
                    ...i,
                    id: newIds[i.id]
                }
            }).sort((a, b) => a.id-b.id);
            this.recipe.steps = this.recipe.steps.map(s => {
                return {
                    ...s,
                    ingredients: s.ingredients.filter(i => i in newIds).map(i => newIds[i]).sort((a, b) => a-b)
                }
            });
            this.selectedIngredient = this.recipes.ingredients[newIds[this.selectedIngredient]];
        },
        maxIngredientId: function() {
            return this.recipe.ingredients.length-1;
        },
        closeIngredient: function () {
            this.selectedIngredient=undefined;
        },
        loadSubrecipe: function(subrecipe) {
            if (this.timeout)
                clearTimeout(this.timeout);

            this.timeout = setTimeout(() => {
                this.loadSubrecipeDebounced(subrecipe)
            }, 500);
        },
        loadSubrecipeDebounced: function (subrecipe) {
          if(!this.subrecipes[subrecipe] || this.subrecipes[subrecipe] === {}) {
              this.$root.loadSubrecipe(subrecipe);
          }
        },
        addStep: function () {
            this.recipe.steps.push({
                name: "",
                description: "",
                ingredients: []
            });
            this.setSelectedStep(this.recipe.steps[this.recipe.steps.length-1], false);
        },
        removeStep: function (id) {
            this.recipe.steps.splice(id, 1);
        },
        moveStepUp: function(id) {
            if(id > 0) {
                this.recipe.steps.splice(id-1, 2, this.recipe.steps[id], this.recipe.steps[id-1]);
            }
        },
        moveStepDown: function(id) {
            if(id < this.maxStepId()) {
                this.recipe.steps.splice(id, 2, this.recipe.steps[id+1], this.recipe.steps[id]);
            }
        },
        setSelectedStep: function(step, delay) {
            if(this.selectedStep !== step) {
                this.selectedStep = undefined;
                setTimeout(() => {
                    this.selectedStep=step;
                    Vue.nextTick(() => this.$refs['step'+this.recipe.steps.indexOf(step)+'name'][0].focus());
                }, delay ? 500 : 0);
            }
        },
        maxStepId: function() {
            return this.recipe.steps.length-1;
        },
        closeStep: function() {
            this.selectedStep = -1;
        },
        openStep: function(id) {
            this.selectedStep = id;
        },
        changeIngredientInStep: function (step, ingredientId) {
            const index = step.ingredients.findIndex(i => i === ingredientId);
            if (index > -1) {
                step.ingredients.splice(index, 1);
            } else {
                step.ingredients.push(ingredientId);
                step.ingredients.sort((a, b) => a - b);
            }
        },
        isIngredientEligibleForStep: function (stepId, ingredientId) {
            const steps = this.recipe.steps.filter(step => this.recipe.steps.indexOf(step) !== stepId && step.ingredients.includes(ingredientId));
            return steps.length === 0;
        },
        isIngredientInAnyStep: function(ingredientId) {
          return (this.recipe.steps||[]).flatMap(s => s.ingredients).includes(ingredientId);
        },
        stepCheckboxLabelForIngredient: function (ingredient) {
            let string = '';
            string = string + ingredient.name || "Unnamed ingredient";
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
        validateRecipe: function() {
            const errors = [];
            const warnings = [];
            if(!this.recipe.name) {
                errors.push("Recipe name is not defined");
            }
            (this.recipe.ingredients||[]).map(this.validateIngredient).forEach(ingredientValidation => {
                ingredientValidation.errors.forEach(e => errors.push(e));
                ingredientValidation.warnings.forEach(w => warnings.push(w));
            })
            return {
                valid: errors.length===0,
                errors,
                warnings
            };
        },
        validateIngredient: function(ingredient) {
            const errors = [];
            const warnings = [];
            if(!this.isIngredientInAnyStep(this.recipe.ingredients.indexOf(ingredient))) {
                errors.push("Ingredient "+this.stepCheckboxLabelForIngredient(ingredient)+" is not listed in any step");
            }
            let validationError = this.validateSubrecipe(ingredient);
            if(validationError) {
                errors.push("Subrecipe error for ingredient "+this.stepCheckboxLabelForIngredient(ingredient)+". "+validationError);
            }
            return {
                valid: errors.length===0,
                errors,
                warnings
            };
        },
        validateSubrecipe: function(ingredient) {
            if(ingredient.subrecipe) {
                if(this.subrecipes[ingredient.subrecipe]) {
                    if(jQuery.isEmptyObject(this.subrecipes[ingredient.subrecipe])) {
                        return "Subrecipe "+ingredient.subrecipe+" not found";
                    }
                    const unit = ingredient.unit || "";
                    const subrecipeUnit = this.subrecipes[ingredient.subrecipe].yieldUnit || "";
                    if(unit === subrecipeUnit || (convert().possibilities().includes(unit) &&
                        convert().list(convert().describe(unit).measure).map(u => u.abbr).includes(subrecipeUnit))) {
                    } else {
                        return "Subrecipe yield unit ("+subrecipeUnit+") cannot be converted to ingredient unit ("+unit+")"
                    }
                }
            }
        },
        copyJson: function() {
            const range = document.createRange();
            range.selectNode(document.getElementById("copyJson"));
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand("copy");
            window.getSelection().removeAllRanges();
        },
        downloadJson: function() {
            const a = document.body.appendChild(
                document.createElement("a")
            );
            a.download = (this.id||"recipe")+".json";
            a.href = "data:text/json," + document.getElementById("copyJson").innerHTML;
            a.click();
        },
        formatRecipe(recipe) {
            return {
                ...recipe,
                condensedSteps: getCondensedRecipe(recipe)
            }
        }
    }

};