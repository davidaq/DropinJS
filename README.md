DropinJS
========

Babel? WebPack? No, no more compiling, just drop the damn files into browser make it run.

Motive
------

The web front end is now conquered by future hi-techs. Developers will be considered *not modern* if not
using babel to do transpiling. Awesome stuff such as React would be hard to use without transpiling.

Transpiling is slow and I'm wasting lots of time each time I need to start or restart webpack. I'm also
totally tired with the configuring every time I decieded that I want to use React.

But look, JavaScript ES6 is now supported natively in Chrome which is the only browser I'd care when doing
some personal stuff. We've got the cool kids in town, living with generators, arrow functions and template
strings are amazing already.

So now, I'm creating this library/toolset to make it even better to work directly in browser.

What you can do with this library
---------------------------------

Define module as a generator function in which you may write asynchronous logic as synchronous code by
yielding Promises (Just as how you would do in `co`).

Get a `require` function to refer to other modules. This require returns a promise so you may use `yield`
to achieve synchronous-like require.

Install npm module or url as a DropinJS module, so you may refer to them in your project.

Just put your files together and open your html file with a modern es6 capable browser directly, no compiling,
no packaging, everything just works.

How to work with React
----------------------

React and other popular modules may be installed to your project using `dropin install react` or so.

In order to be easily blessed by the JSX syntax, I prepared a modified version of t7.js. Install it with
`dropin install t7-react`.

A full working example can be found in the examples directory within this repo.

