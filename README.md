# Recipes

Hi, I'm a professional software engineer and enthusiastic amateur cook/baker. 

I think of this website as my over-engineered hi tech equivalent of a ring binder full of photocopied/handwritten recipes. 


## Make your own

One of my aims for this project was to make something that it would be possible for other people to copy. Some technical knowledge is required but I've tried to make it as simple as possible.
I'd recommend forking [this repository](https://github.com/thomsutcliffe/thomsutcliffe.github.io) hosting on [Github Pages](https://pages.github.com/), or you could serve the whole project directory using your own HTTP server.

It would also work to download the contents of my repository as a `.zip` if you intend to host it somewhere of your own.

Wherever it is hosted, you'll need to make a couple of changes
 
 - Delete the `CNAME` file
 - Delete or replace all of the favicon stuff (unless you really like my face)
 - Replace the contents of the `recipes` directory with your own recipes
 - Update `recipes/discoverablerecipes.json` with whatever categories and recipes you would like in the nav bar
 - Tweak the README to suit yourself.


## About the project

I started this project with the following aims:

- To store recipes I use repeatedly in a robust place
- To be able to share recipes with friends/family
- To show recipes in varying levels of detail from one data source
- To allow other people to reuse my solution
- To have some fun and over-engineer my solution


Obviously, being a software engineer, storing my recipes in git was something of a must.
I wondered about writing recipes in markdown without any supporting code. This would have been a simple solution but wouldn't satisfy the dynamic detail requirement.
Given this, it seemed appropriate to treat the recipes themselves as raw data. They are unlikely to change particularly frequently, so I opted for JSON files in my repository rather than thinking about databases at the MVP stage.

## Showing off

I've had a lot of fun handling edge cases in this app. I think it's really cool for a number of reasons that I want to show off about here.

#### Recipe Scaling

Recipes can optionally define their yield. Users can scale this yield up or down to suit their needs.

#### Subrecipes

Recipes can define ingredients which are themselves recipes available in this site. These ingredients can be expanded to show the full subrecipe. Subrecipes are in a technical sense exactly the same as recipes - they can be viewed in their own right with the correct query param (whether they are in the nav bar or not) and can themselves contain subrecipes.

This can continue to an arbitrary depth and could include cycles, all of which will be elegantly handled. Each recipe's JSON is fetched at most once per page load.

Subrecipes automatically scale to yield the required amount (unless the subrecipe yield unit cannot be converted to the recipe ingredient unit).


#### Units

The app tries to convert between units (as appropriate) as much as possible. `g`, `kg`, `ml`, `l`, `tsp` & `tbsp` are all first class units in this app. These should all be nicely rounded and converted as a recipe is scaled up or down. 
Other units are supported but might be converted to the first class units and might not be appropriately rounded. The app also supports arbitrary (or absent) units. These are not converted at all and are rounded to precision 2.


## JSON recipe format

I intend to implement a UI based recipe builder that will remove the need for most JSON interactions so I won't describe the format in detail. There are, however, a few things to be aware of:
- Each ingredient needs to have a unique ID (within a recipe). It is easiest to start at `0` and count up. The same is true of steps
  - Ingredients in different recipes can have the same ID
  - An ingredient and a step within one recipe can have the same ID 
- Each ingredient ID needs to be used in exactly one of the steps

## Why is there a Ruth section?

You might be confused that there is a section called `Ruth` hiding amongst the more traditional food categories. Ruth is my late mum. I inherited two things of relevance from her - a love for all things culinary and a large box of mismatched recipes ranging from magazine clippings to website printouts to six words scrawled on a scrap of paper. 
The latter made me realise that I want my own children to be able to inherit something more unified from me, and my greatest hope as a Software Engineer Home Cook Dad is that they will one day for this repository for themselves.
