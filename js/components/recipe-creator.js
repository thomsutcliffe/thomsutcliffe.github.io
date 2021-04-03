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
                    <input placeholder="name" v-model="ingredient.name" v-bind:ref="'ingredient'+ingredient.id+'name'">
                    <input type="number" pattern="^\\d*\\.?\\d*$" step="any" placeholder="quantity" v-model="ingredient.quantity">
                    <input placeholder="unit" v-model="ingredient.unit" list="units">
                    <input placeholder="notes" v-model="ingredient.notes">
                    <input class="select" type="checkbox" v-model="ingredient.optional" v-bind:id="'optionalfor'+ingredient.id">
                    <label class="select" v-bind:for="'optionalfor'+ingredient.id">Optional</label>
                    <input placeholder="subrecipe" v-model="ingredient.subrecipe" @input="loadSubrecipe(ingredient.subrecipe)">
                    <div style="float: left">
                        <div v-if="ingredient.subrecipe" class="validationerror">{{ validateSubrecipe(ingredient) }}</div>
                        <div v-if="!isIngredientInAnyStep(ingredient.id)" class="validationerror">Ingredient is not listed in any step</div>
                    </div>
                    <div class="controls">
                        <button type="reset" @click="() => removeIngredient(ingredient.id)" style="font-size: 16pt"><i class="fa fa-minus-circle"></i></button>
                        <button @click="() => moveIngredientUp(ingredient.id)" v-bind:disabled="ingredient.id === 0" type="button"><i class="fa fa-arrow-circle-up"></i></button>
                        <button @click="() => moveIngredientDown(ingredient.id)" v-bind:disabled="ingredient.id === maxIngredientId()" type="button"><i class="fa fa-arrow-circle-down"></button>
                    </div>
                </div>
                <div 
                class="bordersmall" 
                @click="() => openIngredient(ingredient.id)" 
                v-bind:style="ingredient.id===selectedIngredient?'display: none' : validateIngredient(ingredient).valid ? '' : 'border-color: red'">
                    <span>{{stepCheckboxLabelForIngredient(ingredient)}}</span>
                    <span v-if="!validateIngredient(ingredient).valid" style="float: right"><i class="fa fa-exclamation-circle"></i></span>
                </div>
            </div>
            <button @click="addIngredient"><i class="fa fa-plus-circle"></i></button>
            <hr/>
            <h6>Steps</h6>
            <div v-for="step in recipe.steps"
            v-bind:key="'s'+step.id" >
                <div class="border" v-bind:style="step.id===selectedStep?'':'display: none'">
                    <span class="close" @click.stop="closeStep">-</span>
                    <input disabled v-model="step.id">
                    <input placeholder="name" v-model="step.name" v-bind:ref="'step'+step.id+'name'">
                    <input placeholder="description" v-model="step.description">
                    <div class="multiselect" v-if="recipe.ingredients.length">
                        <span>Ingredients</span>
                        <div v-for="ingredient in recipe.ingredients" v-bind:key="'s'+step.id+'i'+ingredient.id">
                            <input 
                            class="select"
                            type="checkbox" 
                            v-bind:id="'i'+ingredient.id+'s'+step.id" 
                            v-bind:disabled="!isIngredientEligibleForStep(step.id, ingredient.id)"
                            v-bind:checked="step.ingredients.includes(ingredient.id)"
                            @change="() => changeIngredientInStep(step.id, ingredient.id)">
                            <label class="select" v-bind:for="'i'+ingredient.id+'s'+step.id" style="float: left">{{stepCheckboxLabelForIngredient(ingredient)}}</label>
                        </div>
                    </div>
                    <div class="controls">
                        <button type="reset" @click="removeStep(step.id)" style="font-size: 16pt"><i class="fa fa-minus-circle"></i></button>
                        <button @click="() => moveStepUp(step.id)" v-bind:disabled="step.id === 0" type="button" style="font-size: 16pt; float: right"><i class="fa fa-arrow-circle-up"></button>
                        <button @click="() => moveStepDown(step.id)" v-bind:disabled="step.id === maxStepId()" type="button" style="font-size: 16pt; float: right"><i class="fa fa-arrow-circle-down"></button>
                    </div>
                </div>
                <div class="bordersmall" @click="openStep(step.id)" v-bind:style="step.id===selectedStep?'display: none':''">
                    <span>{{ step.name ? step.name : step.id }}</span>
                </div>
            </div>
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
            const ref = 'ingredient'+newId+'name';
            Vue.nextTick(() => this.$refs[ref][0].focus());
        },
        removeIngredient: function (id) {
            const newIds = {};
            this.recipe.ingredients.filter(i => i.id !== id).forEach(i => newIds[i.id] = i.id > id ? i.id-1 : i.id);
            this.rejigIngredientIds(newIds);
        },
        moveIngredientUp: function(id) {
            if(id > 0) {
                const newIds = {};
                this.recipe.ingredients.forEach(i => newIds[i.id] = i.id === id ? i.id-1 : i.id===id-1 ? id : i.id);
                this.rejigIngredientIds(newIds);
            }
        },
        moveIngredientDown: function(id) {
            if(id < this.maxIngredientId()) {
                const newIds = {};
                this.recipe.ingredients.forEach(i => newIds[i.id] = i.id === id ? i.id+1 : i.id===id+1 ? id : i.id);
                this.rejigIngredientIds(newIds);
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
            const ref = 'step'+newId+'name';
            Vue.nextTick(() => this.$refs[ref][0].focus());
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
            if(!this.isIngredientInAnyStep(ingredient.id)) {
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