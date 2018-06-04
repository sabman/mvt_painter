# MVT Painter

This is a tool to paint MVT data from URLS in order to show how are the MVT data drawed.

The main idea to create this tool was to use it as a debugger for MVT. You could say "why
don't you use something like Carto-VL?", well sometimes you need to check for a tile or decompose
it in their geometries and that's where this tool brights :)

### Why is this needed?

I can think a couple of reasons:

* You need to see how the geometries are being painted
* You need to see in what direction are being painted. This is key for some libraries
* You want to debug some MVT server code you're wrinting and want to watch your geometries

If you know more, let me know :)

### Build

Is very easy. Go to the project root directory, execute `yarn install`, then `yarn build` and
the JS is in the `dist` folder.

If you want to play after build the library, you can use the `example/index.html` ready to play
app. You can see it in action below

![in action](img/mvt_painter_in_action.gif)
